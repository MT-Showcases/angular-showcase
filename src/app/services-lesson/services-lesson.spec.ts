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
    }

    fixture.destroy();
  });
});
