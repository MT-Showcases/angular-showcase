// COMPONENT TYPE: Test Suite
// ROLE: Verify the three routing seeds, their diagrams and draft retention in the host lesson.
// PATTERNS USED: Real lesson DOM, AngularPlayground selection and CodeMirror source inspection.
// NOTES FOR CONTRIBUTORS: Router behavior belongs in scripts/test-routing.mjs.
import { EditorView } from '@codemirror/view';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { RoutingLesson } from './routing-lesson';
import { ROUTING_EXAMPLES } from './routing.example';

const ROOT_FILES = ['component.ts', 'component.html', 'component.css'];

async function lessonFixture(): Promise<{ fixture: ComponentFixture<RoutingLesson>; page: HTMLElement }> {
  TestBed.configureTestingModule({ imports: [RoutingLesson], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(RoutingLesson);
  await fixture.whenStable();
  return { fixture, page: fixture.nativeElement };
}

function activePlayground(fixture: ComponentFixture<RoutingLesson>): AngularPlayground {
  return fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
}

describe('Routing playground lesson', () => {
  it('exports three valid independent seeds with real config, routes and diagram file targets', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      expect(ROUTING_EXAMPLES.map(example => example.id)).toEqual([
        'navigation',
        'parameters',
        'fallback',
      ]);
      expect(ROUTING_EXAMPLES.map(example => example.sources)).toHaveLength(3);
      expect(new Set(ROUTING_EXAMPLES.map(example => example.sources)).size).toBe(3);

      for (const seed of ROUTING_EXAMPLES) {
        const files = seed.sources.files ?? {};
        expect(files['app.config.ts']).toContain('provideRouter');
        expect(files['app.routes.ts']).toContain('Routes');
        expect(seed.sources.typescript).not.toMatch(/href=["']#/);

        const editable = new Set([...ROOT_FILES, ...Object.keys(files)]);
        expect(seed.diagram?.groups.length).toBeGreaterThan(0);

        for (const group of seed.diagram?.groups ?? []) {
          for (const step of group.steps) {
            for (const node of step.nodes) {
              expect(editable.has(node.file)).toBe(true);
            }
          }
        }
      }

      expect(Object.keys(ROUTING_EXAMPLES[0].sources.files ?? {})).toEqual([
        'app.config.ts',
        'app.routes.ts',
        'overview-view.component.ts',
        'about-view.component.ts',
      ]);
      expect(Object.keys(ROUTING_EXAMPLES[1].sources.files ?? {})).toEqual([
        'app.config.ts',
        'app.routes.ts',
        'detail-view.component.ts',
      ]);
      expect(Object.keys(ROUTING_EXAMPLES[2].sources.files ?? {})).toEqual([
        'app.config.ts',
        'app.routes.ts',
        'home-view.component.ts',
        'not-found-view.component.ts',
      ]);

      const playground = activePlayground(fixture);
      expect(playground.initial()).toBe(ROUTING_EXAMPLES[0].sources);
      expect(page.querySelectorAll('.cm-editor')).toHaveLength(
        3 + Object.keys(playground.initial().files ?? {}).length,
      );
      expect(page.querySelector('.lesson-shell__intro')).toBeNull();
      expect(page.querySelector('#demo')?.textContent).toContain('router');
      expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
      expect(
        page.querySelector('app-angular-playground')!.compareDocumentPosition(
          page.querySelector('app-lesson-diagram')!,
        ) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    } finally {
      fixture.destroy();
    }
  });

  it('switches all three seeds and keeps each source draft until reset', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      const choices = page.querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="Scegli un esempio"] button',
      );
      expect(choices).toHaveLength(ROUTING_EXAMPLES.length);

      for (const [index, seed] of ROUTING_EXAMPLES.entries()) {
        choices[index].click();
        await fixture.whenStable();

        const playground = activePlayground(fixture);
        const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>('.cm-editor')!)!;

        expect(playground.initial()).toBe(seed.sources);
        expect(choices[index].getAttribute('aria-pressed')).toBe('true');
        expect(page.querySelectorAll('.cm-editor')).toHaveLength(
          3 + Object.keys(seed.sources.files ?? {}).length,
        );
        expect(editor.state.doc.toString()).toBe(seed.sources.typescript);
        expect(page.querySelector('app-lesson-diagram')?.textContent).toContain(
          seed.diagram!.title,
        );
      }

      choices[0].click();
      await fixture.whenStable();
      const rootEditor = () => EditorView.findFromDOM(
        page.querySelector<HTMLElement>('[id$="editor-typescript"] .cm-editor')!,
      )!;
      const original = ROUTING_EXAMPLES[0].sources.typescript;
      const modified = '// bozza locale\n' + original;

      rootEditor().dispatch({
        changes: { from: 0, to: rootEditor().state.doc.length, insert: modified },
      });
      choices[1].click();
      await fixture.whenStable();
      choices[0].click();
      await fixture.whenStable();
      expect(rootEditor().state.doc.toString()).toBe(modified);

      [...page.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.textContent?.trim() === 'Ripristina codice')!
        .click();
      fixture.detectChanges();
      expect(rootEditor().state.doc.toString()).toBe(original);
      expect(ROUTING_EXAMPLES[0].sources.typescript).toBe(original);
      expect(page.querySelector('app-lesson-diagram')).not.toBeNull();
    } finally {
      fixture.destroy();
    }
  });
});
