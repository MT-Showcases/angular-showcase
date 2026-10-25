// COMPONENT TYPE: Test Suite
// ROLE: Verify the three BehaviorSubject seeds, their real files, schema targets and draft retention.
// PATTERNS USED: Real lesson DOM, AngularPlayground selection and CodeMirror source inspection.
// NOTES FOR CONTRIBUTORS: Runtime behavior belongs in scripts/test-behavior.mjs.
import { EditorView } from '@codemirror/view';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { BehaviorSubjectComponent } from './behavior-subject';
import { BEHAVIOR_EXAMPLES } from './behavior.example';

const ROOT_FILES = ['component.ts', 'component.html', 'component.css'];

async function lessonFixture(): Promise<{ fixture: ComponentFixture<BehaviorSubjectComponent>; page: HTMLElement }> {
  TestBed.configureTestingModule({ imports: [BehaviorSubjectComponent], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(BehaviorSubjectComponent);
  await fixture.whenStable();
  return { fixture, page: fixture.nativeElement };
}

function activePlayground(fixture: ComponentFixture<BehaviorSubjectComponent>): AngularPlayground {
  return fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
}

function diagramTargets(example: (typeof BEHAVIOR_EXAMPLES)[number]): string[] {
  return example.diagram?.groups.flatMap(group =>
    group.steps.flatMap(step => step.nodes.map(node => node.file)),
  ) ?? [];
}

function editableFiles(sources: (typeof BEHAVIOR_EXAMPLES)[number]['sources']): string[] {
  return [...ROOT_FILES, ...Object.keys(sources.files ?? {})];
}

describe('BehaviorSubject playground lesson', () => {
  it('exports three independent seeds and shows the first one before its schema', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      expect(BEHAVIOR_EXAMPLES.map(example => example.id)).toEqual([
        'subject-vs-behavior',
        'counter-state',
        'shared-profile',
      ]);
      expect(new Set(BEHAVIOR_EXAMPLES.map(example => example.sources)).size).toBe(3);

      const playground = activePlayground(fixture);
      expect(playground.initial()).toBe(BEHAVIOR_EXAMPLES[0].sources);
      expect(page.querySelectorAll('.cm-editor')).toHaveLength(editableFiles(playground.initial()).length);
      expect(editableFiles(playground.initial())).toEqual([
        'component.ts',
        'component.html',
        'component.css',
        'observer.component.ts',
      ]);
      expect(page.querySelector('.lesson-shell__intro')).toBeNull();
      expect(page.querySelector('#demo')?.textContent).toContain('BehaviorSubject');
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

  it('points every schema node at a file that really exists in its example', () => {
    for (const example of BEHAVIOR_EXAMPLES) {
      const editable = new Set(editableFiles(example.sources));
      const targets = diagramTargets(example);

      expect(targets.length).toBeGreaterThan(0);
      expect(targets.every(target => editable.has(target))).toBe(true);
      expect(new Set(targets).size).toBeGreaterThan(1);
    }

    expect(Object.keys(BEHAVIOR_EXAMPLES[0].sources.files ?? {})).toEqual(['observer.component.ts']);
    expect(Object.keys(BEHAVIOR_EXAMPLES[1].sources.files ?? {})).toEqual([]);
    expect(Object.keys(BEHAVIOR_EXAMPLES[2].sources.files ?? {})).toEqual([
      'user-state.service.ts',
      'user-panel.component.ts',
    ]);
  });

  it('switches all three seeds, keeps a child draft and resets to the seed', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      const choices = page.querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="Scegli un esempio"] button',
      );
      const editorCounts = [4, 3, 5];

      expect(choices).toHaveLength(BEHAVIOR_EXAMPLES.length);

      for (const [index, seed] of BEHAVIOR_EXAMPLES.entries()) {
        choices[index].click();
        await fixture.whenStable();

        const playground = activePlayground(fixture);
        const editor = EditorView.findFromDOM(
          page.querySelector<HTMLElement>('[id$="editor-typescript"] .cm-editor')!,
        )!;

        expect(playground.initial()).toBe(seed.sources);
        expect(choices[index].getAttribute('aria-pressed')).toBe('true');
        expect(page.querySelectorAll('.cm-editor')).toHaveLength(editorCounts[index]);
        expect(editor.state.doc.toString()).toBe(seed.sources.typescript);
        expect(page.querySelector('app-lesson-diagram')?.textContent).toContain(seed.diagram!.title);
      }

      choices[0].click();
      await fixture.whenStable();
      const observerEditor = () => EditorView.findFromDOM(
        page.querySelector<HTMLElement>('[id$="editor-observer.component.ts"] .cm-editor')!,
      )!;
      const original = BEHAVIOR_EXAMPLES[0].sources.files!['observer.component.ts'];
      const modified = '// bozza locale\n' + original;

      observerEditor().dispatch({
        changes: { from: 0, to: observerEditor().state.doc.length, insert: modified },
      });
      choices[2].click();
      await fixture.whenStable();
      choices[0].click();
      await fixture.whenStable();
      expect(observerEditor().state.doc.toString()).toBe(modified);
      expect(BEHAVIOR_EXAMPLES[0].sources.files!['observer.component.ts']).toBe(original);

      [...page.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.textContent?.trim() === 'Ripristina codice')!
        .click();
      fixture.detectChanges();
      expect(observerEditor().state.doc.toString()).toBe(original);
      expect(page.querySelector('app-lesson-diagram')).not.toBeNull();
    } finally {
      fixture.destroy();
    }
  });
});
