import { TestBed } from '@angular/core/testing';
import { EditorView } from '@codemirror/view';
import { LessonExamples } from './lesson-examples';
import { INPUT_EXAMPLE } from '../../component-communication/communication.example';
import { IF_EXAMPLE, FOR_EXAMPLE } from '../../directives/control-flow.example';

describe('Independent lesson examples', () => {
  it('shows selection only with multiple examples while keeping single content editable', async () => {
    TestBed.configureTestingModule({ imports: [LessonExamples] });
    const fixture = TestBed.createComponent(LessonExamples);
    const first = { id: 'if', label: '@if', title: 'Condizione', prompt: 'Cambia il ramo.', takeaway: 'Un booleano.', sources: IF_EXAMPLE };
    const second = { id: 'for', label: '@for', title: 'Lista', prompt: '', takeaway: '', sources: FOR_EXAMPLE };
    fixture.componentRef.setInput('examples', [first]);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const frame = page.querySelector('iframe');
    expect(page.querySelector('nav[aria-label="Scegli un esempio"]')).toBeNull();
    expect(frame).not.toBeNull();
    expect(page.querySelector('.cm-editor')).not.toBeNull();
    expect(page.querySelector('.examples__hint')?.textContent).not.toContain('Cambiando esempio');

    fixture.componentRef.setInput('examples', [first, second]);
    await fixture.whenStable();
    expect(page.querySelectorAll('nav[aria-label="Scegli un esempio"] button')).toHaveLength(2);
    expect(page.querySelector('.examples__hint')?.textContent).toContain('Cambiando esempio');
    expect(page.querySelector('iframe')).toBe(frame);

    fixture.componentRef.setInput('examples', [first]);
    await fixture.whenStable();
    expect(page.querySelector('nav[aria-label="Scegli un esempio"]')).toBeNull();
    expect(page.querySelector('iframe')).toBe(frame);
    fixture.destroy();
  });

  it('keeps edited drafts across choices, mounts only one preview and resets to the original seed', async () => {
    TestBed.configureTestingModule({ imports: [LessonExamples] });
    const fixture = TestBed.createComponent(LessonExamples);
    fixture.componentRef.setInput('examples', [
      { id: 'if', label: '@if', title: 'Condizione', prompt: 'Cambia il ramo.', takeaway: 'Un booleano.', sources: IF_EXAMPLE },
      { id: 'for', label: '@for', title: 'Lista', prompt: 'Inverti.', takeaway: 'Un ID.', sources: FOR_EXAMPLE },
    ]);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const editor = () => EditorView.findFromDOM(page.querySelector<HTMLElement>('.cm-editor')!)!;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav button');
    const firstFrame = page.querySelector('iframe');
    const modified = IF_EXAMPLE.typescript.replace('visible = true', 'visible = false');
    editor().dispatch({ changes: { from: 0, to: editor().state.doc.length, insert: modified } });
    choices[1].click();
    await fixture.whenStable();
    expect(page.querySelectorAll('iframe')).toHaveLength(1);
    expect(page.querySelector('iframe')).not.toBe(firstFrame);
    expect(editor().state.doc.toString()).toBe(FOR_EXAMPLE.typescript);
    expect(choices[1].getAttribute('aria-pressed')).toBe('true');
    choices[0].click();
    await fixture.whenStable();
    expect(editor().state.doc.toString()).toBe(modified);
    [...page.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Ripristina codice')!.click();
    fixture.detectChanges();
    expect(editor().state.doc.toString()).toBe(IF_EXAMPLE.typescript);
    choices[1].click(); await fixture.whenStable();
    choices[0].click(); await fixture.whenStable();
    expect(editor().state.doc.toString()).toBe(IF_EXAMPLE.typescript);
    fixture.destroy();
  });
  it('retains child file drafts when changing example and restores their original source on reset', async () => {
    TestBed.configureTestingModule({ imports: [LessonExamples] });
    const fixture = TestBed.createComponent(LessonExamples);
    fixture.componentRef.setInput('examples', [
      { id: 'input', label: 'Input', title: 'Input', prompt: '', takeaway: '', sources: INPUT_EXAMPLE },
      { id: 'if', label: '@if', title: 'Condizione', prompt: '', takeaway: '', sources: IF_EXAMPLE },
    ]);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav button');
    const child = () => EditorView.findFromDOM(page.querySelector<HTMLElement>('[id$="editor-greeting.component.ts"] .cm-editor')!)!;
    const original = INPUT_EXAMPLE.files!['greeting.component.ts'];
    const modified = original.replace("'visitatore'", "'amica'");
    child().dispatch({ changes: { from: 0, to: child().state.doc.length, insert: modified } });
    choices[1].click(); await fixture.whenStable();
    choices[0].click(); await fixture.whenStable();
    expect(child().state.doc.toString()).toBe(modified);
    expect(INPUT_EXAMPLE.files!['greeting.component.ts']).toBe(original);
    [...page.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === 'Ripristina codice')!.click();
    fixture.detectChanges();
    choices[1].click(); await fixture.whenStable();
    choices[0].click(); await fixture.whenStable();
    expect(child().state.doc.toString()).toBe(original);
    fixture.destroy();
  });

});
