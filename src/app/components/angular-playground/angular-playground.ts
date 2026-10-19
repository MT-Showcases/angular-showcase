// COMPONENT TYPE: Shared UI
// ROLE: Keep editable source in the host and execute it only in an isolated Angular preview.
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, output, signal, viewChild, viewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { lintGutter, lintKeymap, setDiagnostics } from '@codemirror/lint';
import { TypeClient, TypeDiagnostic } from './type-client';
import { EditorState } from '@codemirror/state';
import { EditorView, highlightSpecialChars, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, bracketMatching, foldGutter, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { PlaygroundFile, PlaygroundSources } from './playground.types';

/** Real Angular component playground with three editable virtual files. */
@Component({
  selector: 'app-angular-playground', imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './angular-playground.html', styleUrl: './angular-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularPlayground implements AfterViewInit {
  readonly id = 'playground-' + crypto.randomUUID();
  readonly initial = input.required<PlaygroundSources>();
  readonly draft = input<PlaygroundSources>();
  readonly title = input('Il tuo componente, dal vivo');
  readonly sourceChange = output<PlaygroundSources>();
  readonly activeFile = signal<PlaygroundFile>('typescript');
  readonly automatic = signal(true);
  readonly status = signal<'loading' | 'changed' | 'building' | 'ready' | 'error'>('loading');
  readonly error = signal('');
  readonly previewBusy = signal(true);
  readonly diagnostics = signal<TypeDiagnostic[]>([]);
  readonly typeStatus = signal<'checking' | 'ready' | 'unavailable'>('checking');
  readonly showProblems = signal(false);
  readonly typeStatusText = computed(() => this.typeStatus() === 'checking' ? 'Analisi TypeScript…' : this.typeStatus() === 'unavailable' ? 'Analisi TypeScript non disponibile' : this.diagnostics().length ? `${this.diagnostics().length} ${this.diagnostics().length === 1 ? 'problema' : 'problemi'} TypeScript` : 'TypeScript: nessun problema');
  readonly previewHeight = signal(290);
  readonly channel = signal(crypto.randomUUID());
  private readonly sanitizer = inject(DomSanitizer);
  readonly previewUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(
    '/playground/generated/preview.html#' + encodeURIComponent(this.channel()),
  ));
  readonly statusText = computed(() => ({ loading: 'Avvio di Angular…', changed: 'Modifiche da eseguire', building: 'Aggiornamento anteprima…', ready: 'Anteprima aggiornata', error: 'Anteprima non aggiornata' })[this.status()]);
  readonly files = [
    { id: 'typescript' as const, name: 'component.ts', label: 'TypeScript' },
    { id: 'html' as const, name: 'component.html', label: 'HTML' },
    { id: 'css' as const, name: 'component.css', label: 'CSS' },
  ];
  private readonly editorHosts = viewChildren<ElementRef<HTMLElement>>('editorHost');
  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('previewFrame');
  private readonly editors = new Map<PlaygroundFile, EditorView>();
  private sources!: PlaygroundSources;
  private timer?: ReturnType<typeof setTimeout>;
  private startupTimer?: ReturnType<typeof setTimeout>;
  private renderTimer?: ReturnType<typeof setTimeout>;
  private ready = false;
  private revision = 0;
  private replacing = false;
  private readonly typeClient = new TypeClient();
  private typeTimer?: ReturnType<typeof setTimeout>;
  private typeRevision = 0;
  private disposed = false;

  constructor() {
    const receive = (event: MessageEvent) => this.receive(event);
    window.addEventListener('message', receive);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('message', receive);
      clearTimeout(this.timer); clearTimeout(this.startupTimer); clearTimeout(this.renderTimer);
      this.disposed = true; clearTimeout(this.typeTimer); this.typeClient.destroy();
      this.editors.forEach(editor => editor.destroy());
    });
  }

  ngAfterViewInit(): void {
    this.sources = { ...(this.draft() ?? this.initial()) };
    const languages = { typescript: javascript({ typescript: true }), html: html(), css: css() };
    this.files.forEach((file, index) => {
      const editor = new EditorView({
        parent: this.editorHosts()[index].nativeElement,
        state: EditorState.create({ doc: this.sources[file.id], extensions: [
          // Keep selection native and singular: occurrence marks and a second drawn
          // selection layer make dragging/replacing repeated words hard to interpret.
          lineNumbers(), highlightSpecialChars(), history(), bracketMatching(), indentOnInput(), closeBrackets(), foldGutter(),
          ...(file.id === 'typescript' ? [lintGutter(), autocompletion({ icons: false, override: [async context => {
            const word = context.matchBefore(/[\w$]*/);
            if (!context.explicit && (!word || word.from === word.to) && context.state.sliceDoc(context.pos - 1, context.pos) !== '.') return null;
            const source = context.state.doc.toString();
            try {
              const result = await this.typeClient.complete(source, context.pos);
              if (context.aborted || source !== this.editors.get('typescript')?.state.doc.toString()) return null;
              return { ...result, validFor: /^[\w$]*$/ };
            } catch { return null; }
          }] })] : [autocompletion({ icons: false })]),
          EditorState.allowMultipleSelections.of(false),
          languages[file.id], syntaxHighlighting(HighlightStyle.define([
            { tag: tags.keyword, color: '#c4b5fd' }, { tag: tags.string, color: '#a5f3fc' },
            { tag: tags.comment, color: '#94a3b8' }, { tag: tags.number, color: '#fdba74' },
            { tag: tags.tagName, color: '#f9a8d4' }, { tag: tags.attributeName, color: '#c4b5fd' },
            { tag: tags.typeName, color: '#93c5fd' }, { tag: tags.variableName, color: '#e2e8f0' },
          ])), keymap.of([...closeBracketsKeymap, ...completionKeymap, ...lintKeymap, indentWithTab, ...defaultKeymap, ...historyKeymap]), EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': `Codice ${file.label}`, 'aria-describedby': this.id + '-keyboard-help' }),
          EditorView.theme({
            '&': { backgroundColor: '#101a2e', color: '#e2e8f0', fontSize: 'max(1rem, 16px)' },
            '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', lineHeight: '1.6', overflow: 'auto', maxHeight: '36em' },
            '.cm-content': { caretColor: '#fff', padding: '16px 0' },
            '.cm-gutters': { backgroundColor: '#101a2e', color: '#94a3b8', border: 'none' },
            '.cm-content ::selection': { backgroundColor: '#496491', color: '#fff' },
          }, { dark: true }),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !this.replacing) this.edit(file.id, update.state.doc.toString());
          }),
        ] }),
      });
      this.editors.set(file.id, editor);
    });
    this.watchStartup();
    this.checkTypes();
  }

  selectFile(file: PlaygroundFile): void {
    this.activeFile.set(file);
    requestAnimationFrame(() => this.editors.get(file)?.requestMeasure());
  }

  fileKey(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + step + 3) % 3;
    this.selectFile(this.files[target].id);
    (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[target].focus();
  }

  edit(file: PlaygroundFile, content: string): void {
    this.sources = { ...this.sources, [file]: content };
    if (file === 'typescript') {
      ++this.typeRevision; clearTimeout(this.typeTimer);
      this.diagnostics.set([]); this.typeStatus.set('checking');
      const editor = this.editors.get('typescript');
      queueMicrotask(() => { if (!this.disposed && editor) editor.dispatch(setDiagnostics(editor.state, [])); });
      this.typeTimer = setTimeout(() => this.checkTypes(), 400);
    }
    this.sourceChange.emit({ ...this.sources });
    this.status.set('changed');
    clearTimeout(this.timer);
    if (this.ready && this.automatic()) this.timer = setTimeout(() => this.run(), 500);
  }

  toggleAutomatic(): void {
    this.automatic.update(value => !value);
    clearTimeout(this.timer);
    if (this.automatic() && this.ready && this.status() === 'changed') this.run();
  }

  run(): void {
    clearTimeout(this.timer);
    if (!this.ready) return;
    if (Object.values(this.sources).some(value => value.length > 50000)) {
      this.error.set('Ogni file può contenere fino a 50.000 caratteri. Riduci il codice per eseguire l’esempio.');
      this.status.set('error'); this.previewBusy.set(false); return;
    }
    this.error.set(''); this.status.set('building'); this.previewBusy.set(true);
    clearTimeout(this.renderTimer);
    this.renderTimer = setTimeout(() => {
      this.status.set('error'); this.previewBusy.set(false);
      this.error.set('L’anteprima non ha risposto. Premi Riavvia anteprima per riprovare.');
    }, 20000);
    this.frame()?.nativeElement.contentWindow?.postMessage({ channel: this.channel(), kind: 'render', revision: ++this.revision, sources: this.sources }, '*');
  }

  reset(): void {
    clearTimeout(this.timer);
    this.sources = { ...this.initial() };
    this.replacing = true;
    this.editors.forEach((editor, file) => editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: this.sources[file] } }));
    this.replacing = false;
    this.sourceChange.emit({ ...this.sources });
    this.checkTypes();
    if (this.ready) this.run();
  }

  restart(): void {
    clearTimeout(this.timer); clearTimeout(this.renderTimer); this.ready = false; this.revision = 0;
    this.status.set('loading'); this.previewBusy.set(true); this.error.set(''); this.channel.set(crypto.randomUUID());
    this.watchStartup();
  }

  private async checkTypes(): Promise<void> {
    clearTimeout(this.typeTimer);
    const revision = ++this.typeRevision;
    const source = this.sources.typescript;
    this.diagnostics.set([]);
    const currentEditor = this.editors.get('typescript');
    if (currentEditor) currentEditor.dispatch(setDiagnostics(currentEditor.state, []));
    this.typeStatus.set('checking');
    try {
      const diagnostics = await this.typeClient.check(source);
      if (this.disposed || revision !== this.typeRevision) return;
      this.diagnostics.set(diagnostics); this.typeStatus.set('ready');
      const editor = this.editors.get('typescript');
      if (editor) editor.dispatch(setDiagnostics(editor.state, diagnostics));
    } catch {
      if (!this.disposed && revision === this.typeRevision) this.typeStatus.set('unavailable');
    }
  }

  problemLocation(diagnostic: TypeDiagnostic): string {
    const editor = this.editors.get('typescript');
    if (!editor) return '';
    const line = editor.state.doc.lineAt(Math.min(diagnostic.from, editor.state.doc.length));
    return `component.ts:${line.number}:${diagnostic.from - line.from + 1}`;
  }

  goToProblem(diagnostic: TypeDiagnostic): void {
    this.selectFile('typescript');
    const editor = this.editors.get('typescript');
    if (!editor) return;
    editor.dispatch({ selection: { anchor: diagnostic.from, head: diagnostic.to }, scrollIntoView: true });
    editor.focus();
  }

  private watchStartup(): void {
    clearTimeout(this.startupTimer);
    this.startupTimer = setTimeout(() => {
      if (this.ready) return;
      this.status.set('error'); this.previewBusy.set(false);
      this.error.set('La preview non è partita. Premi Riavvia anteprima per riprovare.');
    }, 20000);
  }

  private receive(event: MessageEvent): void {
    const data = event.data;
    // Opaque-origin frames report origin "null". Authenticate the actual Window and channel instead.
    if (event.source !== this.frame()?.nativeElement.contentWindow || data?.channel !== this.channel()) return;
    if (data.kind === 'ready') {
      this.ready = true; clearTimeout(this.startupTimer); this.run(); return;
    }
    if (data.revision !== this.revision) return;
    if (data.kind === 'resize' && typeof data.height === 'number' && Number.isFinite(data.height)) {
      this.previewHeight.set(Math.min(680, Math.max(240, Math.ceil(data.height))));
    }
    if (data.kind === 'rendered') { clearTimeout(this.renderTimer); this.status.set('ready'); this.previewBusy.set(false); this.error.set(''); }
    if (data.kind === 'error' && typeof data.message === 'string') {
      clearTimeout(this.renderTimer); this.error.set(data.message.slice(0, 5000)); this.status.set('error'); this.previewBusy.set(false);
    }
  }
}
