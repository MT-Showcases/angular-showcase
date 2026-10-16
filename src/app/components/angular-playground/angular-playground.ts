// COMPONENT TYPE: Shared UI
// ROLE: Keep editable source in the host and execute it only in an isolated Angular preview.
import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, input, signal, viewChild, viewChildren } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { PlaygroundFile, PlaygroundSources } from './playground.types';

/** Real Angular component playground with three editable virtual files. */
@Component({
  selector: 'app-angular-playground', imports: [MatButtonModule],
  templateUrl: './angular-playground.html', styleUrl: './angular-playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularPlayground implements AfterViewInit {
  readonly id = 'playground-' + crypto.randomUUID();
  readonly initial = input.required<PlaygroundSources>();
  readonly activeFile = signal<PlaygroundFile>('typescript');
  readonly automatic = signal(true);
  readonly status = signal<'loading' | 'changed' | 'building' | 'ready' | 'error'>('loading');
  readonly error = signal('');
  readonly channel = signal(crypto.randomUUID());
  private readonly sanitizer = inject(DomSanitizer);
  readonly previewUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(
    '/playground/generated/preview.html#' + encodeURIComponent(this.channel()),
  ));
  readonly statusText = computed(() => ({ loading: 'Avvio di Angular…', changed: 'Modifiche da eseguire', building: 'Aggiornamento anteprima…', ready: 'Anteprima aggiornata', error: 'Anteprima non aggiornata' })[this.status()]);
  readonly files = [
    { id: 'typescript' as const, name: 'welcome-card.ts', label: 'TypeScript' },
    { id: 'html' as const, name: 'welcome-card.html', label: 'HTML' },
    { id: 'css' as const, name: 'welcome-card.css', label: 'CSS' },
  ];
  private readonly editorHosts = viewChildren<ElementRef<HTMLElement>>('editorHost');
  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('previewFrame');
  private readonly editors = new Map<PlaygroundFile, EditorView>();
  private sources!: PlaygroundSources;
  private timer?: ReturnType<typeof setTimeout>;
  private startupTimer?: ReturnType<typeof setTimeout>;
  private ready = false;
  private revision = 0;
  private replacing = false;

  constructor() {
    const receive = (event: MessageEvent) => this.receive(event);
    window.addEventListener('message', receive);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('message', receive);
      clearTimeout(this.timer); clearTimeout(this.startupTimer);
      this.editors.forEach(editor => editor.destroy());
    });
  }

  ngAfterViewInit(): void {
    this.sources = { ...this.initial() };
    const languages = { typescript: javascript({ typescript: true }), html: html(), css: css() };
    this.files.forEach((file, index) => {
      const editor = new EditorView({
        parent: this.editorHosts()[index].nativeElement,
        state: EditorState.create({ doc: this.sources[file.id], extensions: [
          basicSetup, languages[file.id], syntaxHighlighting(HighlightStyle.define([
            { tag: tags.keyword, color: '#c4b5fd' }, { tag: tags.string, color: '#a5f3fc' },
            { tag: tags.comment, color: '#94a3b8' }, { tag: tags.number, color: '#fdba74' },
            { tag: tags.tagName, color: '#f9a8d4' }, { tag: tags.attributeName, color: '#c4b5fd' },
            { tag: tags.typeName, color: '#93c5fd' }, { tag: tags.variableName, color: '#e2e8f0' },
          ])), keymap.of([indentWithTab]), EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': `Codice ${file.label}`, 'aria-describedby': this.id + '-keyboard-help' }),
          EditorView.theme({
            '&': { backgroundColor: '#101a2e', color: '#e2e8f0', fontSize: '0.875em' },
            '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', caretColor: '#fff', padding: '16px 0' },
            '.cm-gutters': { backgroundColor: '#101a2e', color: '#94a3b8', border: 'none' },
            '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#1e293b' },
            '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: '#334a71 !important' },
            '.cm-cursor': { borderLeftColor: '#fff' },
            '.cm-scroller': { overflow: 'auto', maxHeight: '36em' },
          }, { dark: true }),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !this.replacing) this.edit(file.id, update.state.doc.toString());
          }),
        ] }),
      });
      this.editors.set(file.id, editor);
    });
    this.watchStartup();
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
      this.status.set('error'); return;
    }
    this.error.set(''); this.status.set('building');
    this.frame()?.nativeElement.contentWindow?.postMessage({ channel: this.channel(), kind: 'render', revision: ++this.revision, sources: this.sources }, '*');
  }

  reset(): void {
    clearTimeout(this.timer);
    this.sources = { ...this.initial() };
    this.replacing = true;
    this.editors.forEach((editor, file) => editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: this.sources[file] } }));
    this.replacing = false;
    if (this.ready) this.run();
  }

  restart(): void {
    clearTimeout(this.timer); this.ready = false; this.revision = 0;
    this.status.set('loading'); this.error.set(''); this.channel.set(crypto.randomUUID());
    this.watchStartup();
  }

  private watchStartup(): void {
    clearTimeout(this.startupTimer);
    this.startupTimer = setTimeout(() => {
      if (this.ready) return;
      this.status.set('error');
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
    if (data.kind === 'rendered') { this.status.set('ready'); this.error.set(''); }
    if (data.kind === 'error' && typeof data.message === 'string') {
      this.error.set(data.message.slice(0, 5000)); this.status.set('error');
    }
  }
}
