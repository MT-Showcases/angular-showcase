import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EditorView } from '@codemirror/view';
import { ComponentCommunication } from './component-communication';
import { INPUT_EXAMPLE } from './communication.example';
import { COMBINED_DIAGRAM, INPUT_DIAGRAM, OUTPUT_DIAGRAM } from './communication-diagrams';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { By } from '@angular/platform-browser';

describe('ComponentCommunication playground lesson', () => {
  it('connects the actual lesson seed to a visible editor before optional theory', async () => {
    TestBed.configureTestingModule({ imports: [ComponentCommunication], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ComponentCommunication);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
    expect(playground.initial()).toBe(INPUT_EXAMPLE);
    expect(page.querySelector('.lesson-shell__intro')).toBeNull();
    expect(page.querySelectorAll('.cm-editor')).toHaveLength(3 + Object.keys(playground.initial().files ?? {}).length);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
    const source = page.querySelector('#code')!;
    const diagram = page.querySelector('app-lesson-diagram')!;
    expect(source.compareDocumentPosition(diagram) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(diagram.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(diagram.textContent).toContain(INPUT_DIAGRAM.title);
    fixture.destroy();
  });

  it('selects a distinct schema per example and points every node at a real source file', async () => {
    TestBed.configureTestingModule({ imports: [ComponentCommunication], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ComponentCommunication);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const schemas = [INPUT_DIAGRAM, OUTPUT_DIAGRAM, COMBINED_DIAGRAM];

    expect(choices).toHaveLength(schemas.length);
    for (const [index, schema] of schemas.entries()) {
      choices[index].click();
      await fixture.whenStable();

      const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
      const diagram = page.querySelector('app-lesson-diagram')!;
      expect(diagram.textContent).toContain(schema.title);
      expect(diagram.querySelectorAll('.diagram__group')).toHaveLength(schema.groups.length);

      const files = new Set(playground.files.map(file => file.name));
      for (const node of diagram.querySelectorAll('.diagram__node')) {
        const target = node.querySelector('.diagram__node-file')?.textContent?.trim();
        expect(files.has(target!)).toBe(true);
      }
    }

    fixture.destroy();
  });

  it('activates the actual source tab when a diagram node is chosen', async () => {
    TestBed.configureTestingModule({ imports: [ComponentCommunication], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ComponentCommunication);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button')[2].click();
    await fixture.whenStable();

    const node = [...page.querySelectorAll<HTMLButtonElement>('.diagram__node')]
      .find(button => button.getAttribute('aria-label') === 'Apri Figlio: clic, file counter-button.component.ts')!;
    node.click();
    await fixture.whenStable();

    const selected = page.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')!;
    expect(selected.textContent?.trim()).toBe('counter-button.component.ts');
    expect(page.ownerDocument.getElementById(selected.getAttribute('aria-controls')!)?.hidden).toBe(false);
    fixture.destroy();
  });

  it('keeps a draft and one preview while switching examples', async () => {
    TestBed.configureTestingModule({ imports: [ComponentCommunication], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ComponentCommunication);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const editor = () => EditorView.findFromDOM(page.querySelector<HTMLElement>('.cm-editor')!)!;
    const modified = INPUT_EXAMPLE.typescript + '\n// bozza locale';
    editor().dispatch({ changes: { from: 0, to: editor().state.doc.length, insert: modified } });
    const firstFrame = page.querySelector('iframe');

    choices[2].click();
    await fixture.whenStable();
    expect(page.querySelectorAll('iframe')).toHaveLength(1);
    expect(page.querySelector('iframe')).not.toBe(firstFrame);

    choices[0].click();
    await fixture.whenStable();
    expect(editor().state.doc.toString()).toBe(modified);
    expect(page.querySelector('app-lesson-diagram')?.textContent).toContain(INPUT_DIAGRAM.title);
    fixture.destroy();
  });
});
