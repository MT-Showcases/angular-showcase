import { TestBed } from '@angular/core/testing';
import { EditorView } from '@codemirror/view';
import { LessonExamples } from './lesson-examples';
import { IF_EXAMPLE, FOR_EXAMPLE } from '../../directives/control-flow.example';

describe('Independent lesson examples', () => {
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
});
