import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorView } from '@codemirror/view';
import { undo } from '@codemirror/commands';
import { vi } from 'vitest';
import { AngularPlayground } from './angular-playground';
import { FIRST_COMPONENT } from '../../getting-started/first-component.example';

describe('Angular playground host', () => {
  let fixture: ComponentFixture<AngularPlayground>;
  let page: HTMLElement;
  let frame: HTMLIFrameElement;
  let send: ReturnType<typeof vi.spyOn>;
  beforeEach(async () => {
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
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    receive('ready', {}, window); expect(send).not.toHaveBeenCalled();
    receive('ready', { channel: 'other' }); expect(send).not.toHaveBeenCalled();
    receive('ready');
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ kind: 'render', revision: 1, sources: FIRST_COMPONENT }), '*');
    receive('rendered', { revision: 0 }); expect(fixture.componentInstance.status()).toBe('building');
    receive('rendered'); expect(page.textContent).toContain('Anteprima aggiornata');
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
      expect(editor?.state.doc.toString()).toBe(FIRST_COMPONENT[file.id]);
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
});
