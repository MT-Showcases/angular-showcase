// COMPONENT TYPE: Test Suite
// ROLE: Verify that the compact lesson wires both editable service seeds to one visible editor.
// PATTERNS USED: Real lesson DOM, the active playground and the CodeMirror source.
// NOTES FOR CONTRIBUTORS: Runtime behavior belongs in scripts/test-services.mjs.
import { EditorView } from '@codemirror/view';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { ServicesLesson } from './services-lesson';
import { SCOPED_SERVICE_EXAMPLE, SHARED_SERVICE_EXAMPLE } from './services.example';

describe('Services playground lesson', () => {
  it('connects the shared seed to a visible editor before optional theory', async () => {
    TestBed.configureTestingModule({ imports: [ServicesLesson], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ServicesLesson);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;

    expect(playground.initial()).toBe(SHARED_SERVICE_EXAMPLE);
    const diagram = page.querySelector('app-lesson-diagram');
    expect(diagram?.querySelectorAll('.diagram__group')).toHaveLength(1);
    expect(diagram?.textContent).toContain('Istanza condivisa');
    expect(diagram?.textContent).toContain('fornisce');
    expect(page.querySelector('.lesson-shell__intro')).toBeNull();
    expect(page.querySelectorAll('.cm-editor')).toHaveLength(3 + Object.keys(playground.initial().files ?? {}).length);
    expect(page.querySelector('#demo')?.textContent).toContain('provider');
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
    expect(page.querySelector('app-angular-playground')!.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fixture.destroy();
  });

  it('switches both seeds and keeps their editable source in the active editor', async () => {
    TestBed.configureTestingModule({ imports: [ServicesLesson], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ServicesLesson);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const seeds = [SHARED_SERVICE_EXAMPLE, SCOPED_SERVICE_EXAMPLE];

    expect(choices).toHaveLength(seeds.length);
    expect(Object.keys(SCOPED_SERVICE_EXAMPLE.files ?? {})).toEqual([
      'counter.service.ts',
      'counter-view.component.ts',
      'isolated-counter.component.ts',
    ]);

    for (const [index, seed] of seeds.entries()) {
      choices[index].click();
      await fixture.whenStable();

      const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
      const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>('.cm-editor')!)!;

      expect(playground.initial()).toBe(seed);
      expect(choices[index].getAttribute('aria-pressed')).toBe('true');
      expect(page.querySelectorAll('.cm-editor')).toHaveLength(3 + Object.keys(playground.initial().files ?? {}).length);
      expect(editor.state.doc.toString()).toBe(seed.typescript);

      const diagram = page.querySelector('app-lesson-diagram')!;
      expect(diagram.querySelectorAll('.diagram__group')).toHaveLength(index === 0 ? 1 : 3);
      const instances = [...diagram.querySelectorAll('.diagram__node')]
        .filter(node => node.textContent?.includes('Istanza'));
      expect(instances).toHaveLength(index === 0 ? 1 : 3);
      if (index === 0) {
        expect(diagram.textContent).not.toContain('Istanza locale');
      } else {
        expect(diagram.textContent).toContain('Istanza locale A');
        expect(diagram.textContent).toContain('Istanza locale B');
      }
    }

    choices[0].click();
    await fixture.whenStable();
    const sharedDiagram = page.querySelector('app-lesson-diagram')!;
    expect(sharedDiagram.querySelectorAll('.diagram__group')).toHaveLength(1);
    expect(sharedDiagram.textContent).not.toContain('Istanza locale');

    fixture.destroy();
  });

  it('keeps a service draft and its diagram across examples, then resets to the seed', async () => {
    TestBed.configureTestingModule({ imports: [ServicesLesson], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ServicesLesson);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const serviceEditor = () => EditorView.findFromDOM(
      page.querySelector<HTMLElement>('[id$="editor-counter.service.ts"] .cm-editor')!,
    )!;
    const original = SHARED_SERVICE_EXAMPLE.files!['counter.service.ts'];
    const modified = '// bozza locale\n' + original;

    serviceEditor().dispatch({ changes: { from: 0, to: serviceEditor().state.doc.length, insert: modified } });
    choices[1].click(); await fixture.whenStable();
    choices[0].click(); await fixture.whenStable();

    expect(serviceEditor().state.doc.toString()).toBe(modified);
    expect(page.querySelector('app-lesson-diagram')?.textContent).toContain('Istanza condivisa');

    [...page.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent?.trim() === 'Ripristina codice')!.click();
    fixture.detectChanges();
    expect(serviceEditor().state.doc.toString()).toBe(original);
    expect(SHARED_SERVICE_EXAMPLE.files!['counter.service.ts']).toBe(original);
    expect(page.querySelector('app-lesson-diagram')).not.toBeNull();

    fixture.destroy();
  });
});
