import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
import { vi } from 'vitest';
import { AngularPlayground } from './angular-playground';
import { INPUT_EXAMPLE } from '../../component-communication/communication.example';
import { sourceText } from './playground.types';
import { TypeClient } from './type-client';
import { FIRST_COMPONENT } from '../../getting-started/first-component.example';
import { SHARED_SERVICE_EXAMPLE } from '../../services-lesson/services.example';
import { SHARED_SERVICE_DIAGRAM } from '../../services-lesson/services-diagrams';

describe('Angular playground host', () => {
  let fixture: ComponentFixture<AngularPlayground>;
  let page: HTMLElement;
  let frame: HTMLIFrameElement;
  let send: ReturnType<typeof vi.spyOn>;
  beforeEach(async () => {
    // jsdom has no range geometry; CodeMirror measures focused selections on animation frames.
    if (!Range.prototype.getClientRects) Object.defineProperty(Range.prototype, 'getClientRects', { configurable: true, value: () => [] });
    if (!Range.prototype.getBoundingClientRect) Object.defineProperty(Range.prototype, 'getBoundingClientRect', { configurable: true, value: () => new DOMRect() });
    vi.spyOn(TypeClient.prototype, 'check').mockResolvedValue([]);
    vi.spyOn(TypeClient.prototype, 'complete').mockResolvedValue({ from: 0, options: [] });
    TestBed.configureTestingModule({ imports: [AngularPlayground] });
    fixture = TestBed.createComponent(AngularPlayground);
    fixture.componentRef.setInput('initial', FIRST_COMPONENT);
    await fixture.whenStable();
    page = fixture.nativeElement; frame = page.querySelector('iframe')!;
    send = vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => undefined);
  });
  afterEach(() => { fixture.destroy(); vi.restoreAllMocks(); });
  function receive(kind: string, extra: object = {}, source: Window | null = frame.contentWindow): void {
    window.dispatchEvent(new MessageEvent('message', { source, data: { channel: fixture.componentInstance.channel(), kind, revision: 1, ...extra } }));
    fixture.detectChanges();
  }
  function edit(file: string, text: string): void {
    const tab = page.querySelector<HTMLButtonElement>(`[role="tab"][id$="file-${file}"]`)!;
    tab.click(); fixture.detectChanges();
    const view = EditorView.findFromDOM(page.querySelector<HTMLElement>(`[id$="editor-${file}"] .cm-editor`)!);
    view!.dispatch({ changes: { from: 0, to: view!.state.doc.length, insert: text } });
    fixture.detectChanges();
  }
  function click(label: string): void {
    [...page.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === label)!.click();
    fixture.detectChanges();
  }

  it('requires both iframe source and channel, and sends current source only after ready', () => {
    expect(page.querySelector('app-lesson-diagram')).toBeNull();
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    receive('ready', {}, window); expect(send).not.toHaveBeenCalled();
    receive('ready', { channel: 'other' }); expect(send).not.toHaveBeenCalled();
    receive('ready');
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'render', revision: 1, sources: FIRST_COMPONENT }), '*');
    receive('rendered', { revision: 0 }); expect(fixture.componentInstance.status()).toBe('building');
    receive('rendered'); expect(page.textContent).toContain('Anteprima aggiornata');
  });

  it('resizes only from the authenticated current preview and bounds excessive height', () => {
    receive('ready');
    receive('resize', { height: 520 }, window);
    expect(frame.style.height).toBe('290px');
    receive('resize', { height: 520, revision: 0 });
    expect(frame.style.height).toBe('290px');
    receive('resize', { height: 520 });
    expect(frame.style.height).toBe('520px');
    receive('resize', { height: 9000 });
    expect(frame.style.height).toBe('680px');
    receive('resize', { height: 120 });
    expect(frame.style.height).toBe('240px');
    receive('resize', { height: NaN });
    expect(frame.style.height).toBe('240px');
  });

  it('debounces real editor updates and preserves the preview and file contents across tab changes', async () => {
    receive('ready'); send.mockClear();
    edit('html', '<h2>Prima modifica</h2>');
    edit('html', '<h2>Ultima modifica</h2>');
    edit('css', 'h2 { color: purple; }');
    await new Promise(resolve => setTimeout(resolve, 600));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ sources: { ...FIRST_COMPONENT, html: '<h2>Ultima modifica</h2>', css: 'h2 { color: purple; }' } }), '*');
    expect(page.querySelector('iframe')).toBe(frame);
    const htmlEditor = EditorView.findFromDOM(page.querySelector<HTMLElement>('[id$="editor-html"] .cm-editor')!);
    expect(htmlEditor?.state.doc.toString()).toBe('<h2>Ultima modifica</h2>');
  });

  it('pauses automatic compilation, runs explicitly, reports errors as text and resets every file', async () => {
    receive('ready'); send.mockClear(); click('Live attivo');
    edit('typescript', 'export default class Broken {');
    await new Promise(resolve => setTimeout(resolve, 550));
    expect(send).not.toHaveBeenCalled();
    click('Esegui'); expect(send).toHaveBeenCalledTimes(1);
    receive('error', { revision: 2, message: '<img src=x onerror=alert(1)>' });
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('<img');
    expect(page.querySelector('[role="alert"] img')).toBeNull();
    click('Ripristina codice');
    expect(send).toHaveBeenLastCalledWith(expect.objectContaining({ sources: FIRST_COMPONENT, revision: 3 }), '*');
    for (const file of fixture.componentInstance.files) {
      const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>(`[id$="editor-${file.id}"] .cm-editor`)!);
      expect(editor?.state.doc.toString()).toBe(sourceText(FIRST_COMPONENT, file.id));
    }
  });

  it('gives each instance unique accessible IDs and supports keyboard tab navigation', () => {
    const tabs = page.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); fixture.detectChanges();
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(page.querySelector('[id$="editor-html"]')?.hasAttribute('hidden')).toBe(false);
    expect(page.querySelector('[id$="editor-typescript"]')?.hasAttribute('hidden')).toBe(true);
    const second = TestBed.createComponent(AngularPlayground);
    second.componentRef.setInput('initial', FIRST_COMPONENT); second.detectChanges();
    expect(second.nativeElement.querySelector('[role="tab"]').id).not.toBe(tabs[0].id);
    second.destroy();
  });

  it('replaces only the selected occurrence and preserves selection through preview updates and undo', () => {
    receive('ready');
    page.querySelector<HTMLButtonElement>('[role="tab"][id$="file-html"]')!.click();
    fixture.detectChanges();
    const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>('[id$="editor-html"] .cm-editor')!)!;
    const original = editor.state.doc.toString();
    const first = original.indexOf('count');
    const second = original.indexOf('count', first + 5);
    expect(second).toBeGreaterThan(first);

    editor.focus();
    editor.dispatch({ selection: { anchor: second, head: second + 5 } });
    send.mockClear();
    receive('rendered');
    expect(editor.state.selection.main.from).toBe(second);
    expect(editor.state.selection.main.to).toBe(second + 5);
    expect(document.activeElement).toBe(editor.contentDOM);
    expect(send).not.toHaveBeenCalled();

    editor.dispatch(editor.state.replaceSelection('clicks'));
    expect(editor.state.doc.toString()).toBe(original.slice(0, second) + 'clicks' + original.slice(second + 5));
    click('Esegui');
    receive('rendered', { revision: 2 });
    expect(EditorView.findFromDOM(editor.dom)).toBe(editor);
    expect(editor.state.selection.main.head).toBe(second + 6);

    expect(undo(editor)).toBe(true);
    expect(editor.state.doc.toString()).toBe(original);
    expect(editor.state.selection.main.from).toBe(second);
    expect(editor.state.selection.main.to).toBe(second + 5);
  });
  it('covers the blank frame until the authenticated render completes and recovers after error/restart', () => {
    expect(page.querySelector('.playground__loader')).not.toBeNull();
    expect(frame.hasAttribute('inert')).toBe(true);
    receive('ready');
    expect(page.querySelector('.playground__loader')).not.toBeNull();
    receive('rendered', { revision: 0 });
    expect(page.querySelector('.playground__loader')).not.toBeNull();
    receive('rendered');
    expect(page.querySelector('.playground__loader')).toBeNull();
    expect(frame.hasAttribute('inert')).toBe(false);
    click('Esegui');
    expect(page.querySelector('.playground__loader')).not.toBeNull();
    receive('error', { revision: 2, message: 'Template non valido' });
    expect(page.querySelector('.playground__loader')).toBeNull();
    expect(page.querySelector('[role="alert"]')?.textContent).toContain('Template non valido');
    click('Riavvia anteprima');
    expect(page.querySelector('.playground__loader')).not.toBeNull();
    expect(page.querySelector('iframe')).not.toBe(frame);
  });

  it('shows semantic problems while live preview is paused and navigates to the affected range', async () => {
    vi.mocked(TypeClient.prototype.check).mockResolvedValueOnce([
      { from: 6, to: 11, severity: 'error', code: 2322, message: 'Type string is not assignable to number.' },
    ]);
    receive('ready'); click('Live attivo'); send.mockClear();
    edit('typescript', 'const count: number = "x";');
    await new Promise(resolve => setTimeout(resolve, 450));
    await fixture.whenStable();
    expect(send).not.toHaveBeenCalled();
    expect(page.textContent).toContain('1 problema TypeScript');
    click('Problemi (1)');
    const problem = page.querySelector<HTMLButtonElement>('.playground__problems button')!;
    expect(problem.textContent).toContain('component.ts:1:7');
    problem.click(); fixture.detectChanges();
    const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>('[id$="editor-typescript"] .cm-editor')!)!;
    expect(editor.state.selection.main.from).toBe(6);
    expect(editor.state.selection.main.to).toBe(11);
    expect(document.activeElement).toBe(editor.contentDOM);
    click('Ripristina codice');
    await vi.waitFor(() => expect(fixture.componentInstance.typeStatus()).toBe('ready'));
    await fixture.whenStable(); fixture.detectChanges();
    expect(page.querySelector('.playground__problems')).toBeNull();
    expect(page.textContent).toContain('TypeScript: nessun problema');
  });

  it('ignores stale TypeScript responses after a newer source check', async () => {
    let oldResult!: (value: { from: number; to: number; severity: 'error'; code: number; message: string }[]) => void;
    vi.mocked(TypeClient.prototype.check).mockReturnValueOnce(new Promise(resolve => { oldResult = resolve; }));
    edit('typescript', 'const pending = 1;');
    await new Promise(resolve => setTimeout(resolve, 450));
    click('Ripristina codice');
    await vi.waitFor(() => expect(fixture.componentInstance.typeStatus()).toBe('ready'));
    await fixture.whenStable(); fixture.detectChanges();
    oldResult([{ from: 0, to: 1, severity: 'error', code: 2322, message: 'Stale error' }]); await fixture.whenStable();
    expect(page.textContent).toContain('TypeScript: nessun problema');
    expect(fixture.componentInstance.diagnostics()).toEqual([]);
  });

  it('edits actual child tabs, navigates all files and resets the whole example without mutating its seed', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(AngularPlayground);
    fixture.componentRef.setInput('initial', INPUT_EXAMPLE);
    await fixture.whenStable();
    page = fixture.nativeElement;
    const sources = vi.fn(); fixture.componentInstance.sourceChange.subscribe(sources);
    const tabs = page.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect([...tabs].map(tab => tab.textContent?.trim())).toEqual([
      'component.ts', 'component.html', 'component.css', 'greeting.component.ts',
    ]);
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true })); fixture.detectChanges();
    expect(tabs[3].getAttribute('aria-selected')).toBe('true');
    tabs[3].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); fixture.detectChanges();
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    edit('greeting.component.ts', INPUT_EXAMPLE.files!['greeting.component.ts'].replace("'visitatore'", "'amica'"));
    expect(sources).toHaveBeenLastCalledWith(expect.objectContaining({ files: expect.objectContaining({
      'greeting.component.ts': expect.stringContaining("'amica'"),
    }) }));
    expect(INPUT_EXAMPLE.files!['greeting.component.ts']).toContain("'visitatore'");
    click('Ripristina codice'); await fixture.whenStable();
    const view = EditorView.findFromDOM(page.querySelector<HTMLElement>('[id$="editor-greeting.component.ts"] .cm-editor')!)!;
    expect(view.state.doc.toString()).toBe(INPUT_EXAMPLE.files!['greeting.component.ts']);
    expect(sources.mock.lastCall?.[0]).toEqual(INPUT_EXAMPLE);
  });

  it('checks the whole virtual project and navigates diagnostics in a child file', async () => {
    fixture.destroy();
    vi.mocked(TypeClient.prototype.check).mockImplementation(async (_source, fileName) => fileName === 'greeting.component.ts' ? [
      { from: 6, to: 11, severity: 'error', code: 2322, message: 'Child type error' },
    ] : []);
    fixture = TestBed.createComponent(AngularPlayground);
    fixture.componentRef.setInput('initial', INPUT_EXAMPLE);
    await fixture.whenStable(); page = fixture.nativeElement; fixture.detectChanges();
    expect(TypeClient.prototype.check).toHaveBeenCalledWith(INPUT_EXAMPLE.files!['greeting.component.ts'], 'greeting.component.ts', expect.objectContaining({
      'component.ts': INPUT_EXAMPLE.typescript,
      'greeting.component.ts': INPUT_EXAMPLE.files!['greeting.component.ts'],
    }));
    click('Problemi (1)');
    const problem = page.querySelector<HTMLButtonElement>('.playground__problems button')!;
    expect(problem.textContent).toContain('greeting.component.ts:');
    problem.click(); fixture.detectChanges();
    expect(page.querySelector('[id$="file-greeting.component.ts"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('keeps an optional diagram after preview and code and navigates files without rerunning', async () => {
    fixture.destroy();
    fixture = TestBed.createComponent(AngularPlayground);
    fixture.componentRef.setInput('initial', SHARED_SERVICE_EXAMPLE);
    fixture.componentRef.setInput('diagram', SHARED_SERVICE_DIAGRAM);
    await fixture.whenStable();
    page = fixture.nativeElement; frame = page.querySelector('iframe')!;
    send = vi.spyOn(frame.contentWindow!, 'postMessage').mockImplementation(() => undefined);
    const playground = fixture.componentInstance;
    receive('ready');
    click('Live attivo');
    send.mockClear();

    const editedService = '// servizio modificato\n' + SHARED_SERVICE_EXAMPLE.files!['counter.service.ts'];
    edit('counter.service.ts', editedService);
    const sendsAfterEdit = send.mock.calls.length;

    const preview = page.querySelector('.playground__preview')!;
    const diagram = page.querySelector('app-lesson-diagram')!;
    const source = page.querySelector('#code')!;
    expect(preview.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(source.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const buttons = [...diagram.querySelectorAll<HTMLButtonElement>('.diagram__node')];
    const target = (fileName: string) => buttons.find(button => button.getAttribute('aria-label')?.endsWith(`file ${fileName}`))!;
    const scroll = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scroll });
    try {
      for (const [fileName, editorId] of [
        ['component.ts', 'typescript'],
        ['counter.service.ts', 'counter.service.ts'],
        ['counter-view.component.ts', 'counter-view.component.ts'],
      ]) {
        target(fileName).click(); fixture.detectChanges();
        expect(playground.activeFileName()).toBe(fileName);
        expect(page.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')?.textContent?.trim()).toBe(fileName);

        const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>(`[id$="editor-${editorId}"] .cm-editor`)!)!;
        expect(editor.state.doc.toString()).toBe(fileName === 'counter.service.ts'
          ? editedService
          : sourceText(SHARED_SERVICE_EXAMPLE, fileName === 'component.ts' ? 'typescript' : fileName));
        await vi.waitFor(() => expect(document.activeElement).toBe(editor.contentDOM));
      }

      expect(scroll).toHaveBeenCalled();
      expect(scroll.mock.calls[0][0]).toEqual({ block: 'start' });
      expect(page.querySelector('iframe')).toBe(frame);
      expect(send).toHaveBeenCalledTimes(sendsAfterEdit);
      expect(SHARED_SERVICE_EXAMPLE.files!['counter.service.ts']).not.toContain('servizio modificato');

      page.querySelector<HTMLButtonElement>('[role="tab"][id$="file-counter-view.component.ts"]')!.click();
      fixture.detectChanges();
      const viewNodes = buttons.filter(button => button.getAttribute('aria-label')?.includes('counter-view.component.ts'));
      expect(viewNodes).toHaveLength(2);
      expect(viewNodes.every(button => button.getAttribute('aria-current') === 'true' && button.textContent?.includes('Aperto'))).toBe(true);

      expect(playground.openFile('missing-file.ts')).toBe(false);
      expect(playground.activeFileName()).toBe('counter-view.component.ts');
    } finally {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

});
