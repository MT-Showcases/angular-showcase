// COMPONENT TYPE: Test Suite
// ROLE: Verify the four Signals seeds, their diagram targets and draft retention in the host lesson.
// PATTERNS USED: Real lesson DOM, AngularPlayground selection and CodeMirror source inspection.
// NOTES FOR CONTRIBUTORS: Signal runtime behavior belongs in scripts/test-signals.mjs.
import { EditorView } from '@codemirror/view';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { Signals } from './signals';
import { SIGNALS_EXAMPLES } from './signals.example';

const ROOT_FILES = ['component.ts', 'component.html', 'component.css'];

async function lessonFixture(): Promise<{ fixture: ComponentFixture<Signals>; page: HTMLElement }> {
  TestBed.configureTestingModule({ imports: [Signals], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(Signals);
  await fixture.whenStable();
  return { fixture, page: fixture.nativeElement };
}

function activePlayground(fixture: ComponentFixture<Signals>): AngularPlayground {
  return fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
}

function diagramTargets(example: (typeof SIGNALS_EXAMPLES)[number]): string[] {
  return example.diagram?.groups.flatMap(group =>
    group.steps.flatMap(step => step.nodes.map(node => node.file)),
  ) ?? [];
}

describe('Signals playground lesson', () => {
  it('exports four independent seeds and shows the first one in a visible editor before its schema', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      expect(SIGNALS_EXAMPLES.map(example => example.id)).toEqual([
        'counter',
        'computed',
        'effect',
        'cart',
      ]);
      expect(new Set(SIGNALS_EXAMPLES.map(example => example.sources)).size).toBe(4);

      const playground = activePlayground(fixture);
      expect(playground.initial()).toBe(SIGNALS_EXAMPLES[0].sources);
      expect(page.querySelectorAll('.cm-editor')).toHaveLength(ROOT_FILES.length);
      expect(page.querySelector('.lesson-shell__intro')).toBeNull();
      expect(page.querySelector('#demo')?.textContent).toContain('signal');
      expect(page.querySelector('#code')).not.toBeNull();
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

  it('points every diagram node at an existing editable file', () => {
    const editable = new Set(ROOT_FILES);

    for (const example of SIGNALS_EXAMPLES) {
      const targets = diagramTargets(example);
      expect(targets.length).toBeGreaterThan(0);
      expect(targets.every(target => editable.has(target))).toBe(true);
    }

    expect(diagramTargets(SIGNALS_EXAMPLES[0])).toEqual([
      'component.html',
      'component.ts',
      'component.html',
    ]);
    expect(diagramTargets(SIGNALS_EXAMPLES[1])).toEqual([
      'component.ts',
      'component.ts',
      'component.html',
    ]);
    expect(diagramTargets(SIGNALS_EXAMPLES[2])).toEqual([
      'component.ts',
      'component.ts',
      'component.ts',
      'component.ts',
      'component.ts',
    ]);
    expect(diagramTargets(SIGNALS_EXAMPLES[3])).toEqual([
      'component.html',
      'component.ts',
      'component.ts',
      'component.html',
    ]);
  });

  it('switches all four seeds, keeps their source drafts and resets to the seed', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      const choices = page.querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="Scegli un esempio"] button',
      );
      expect(choices).toHaveLength(SIGNALS_EXAMPLES.length);

      for (const [index, seed] of SIGNALS_EXAMPLES.entries()) {
        choices[index].click();
        await fixture.whenStable();

        const playground = activePlayground(fixture);
        const editor = EditorView.findFromDOM(page.querySelector<HTMLElement>('.cm-editor')!)!;

        expect(playground.initial()).toBe(seed.sources);
        expect(choices[index].getAttribute('aria-pressed')).toBe('true');
        expect(page.querySelectorAll('.cm-editor')).toHaveLength(ROOT_FILES.length);
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
      const original = SIGNALS_EXAMPLES[0].sources.typescript;
      const modified = '// bozza locale\n' + original;

      rootEditor().dispatch({
        changes: { from: 0, to: rootEditor().state.doc.length, insert: modified },
      });
      choices[1].click();
      await fixture.whenStable();
      choices[0].click();
      await fixture.whenStable();
      expect(rootEditor().state.doc.toString()).toBe(modified);
      expect(SIGNALS_EXAMPLES[0].sources.typescript).toBe(original);

      [...page.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.textContent?.trim() === 'Ripristina codice')!
        .click();
      fixture.detectChanges();
      expect(rootEditor().state.doc.toString()).toBe(original);
      expect(page.querySelector('app-lesson-diagram')).not.toBeNull();
    } finally {
      fixture.destroy();
    }
  });
});
