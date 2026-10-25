// COMPONENT TYPE: Test Suite
// ROLE: Verify the two real NgRx seeds, their isolated files, schema targets and draft retention.
// PATTERNS USED: Real lesson DOM, AngularPlayground selection and CodeMirror source inspection.
// NOTES FOR CONTRIBUTORS: Runtime store behavior belongs in scripts/test-ngrx.mjs.
import { EditorView } from '@codemirror/view';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { NgrxExample } from './ngrx-example';
import { NGRX_EXAMPLES } from './ngrx.example';

const ROOT_FILES = ['component.ts', 'component.html', 'component.css'];

async function lessonFixture(): Promise<{ fixture: ComponentFixture<NgrxExample>; page: HTMLElement }> {
  TestBed.configureTestingModule({ imports: [NgrxExample], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(NgrxExample);
  await fixture.whenStable();
  return { fixture, page: fixture.nativeElement };
}

function activePlayground(fixture: ComponentFixture<NgrxExample>): AngularPlayground {
  return fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
}

function diagramTargets(example: (typeof NGRX_EXAMPLES)[number]): string[] {
  return example.diagram?.groups.flatMap(group =>
    group.steps.flatMap(step => step.nodes.map(node => node.file)),
  ) ?? [];
}

function editableFiles(sources: (typeof NGRX_EXAMPLES)[number]['sources']): string[] {
  return [...ROOT_FILES, ...Object.keys(sources.files ?? {})];
}

describe('NgRx playground lesson', () => {
  it('exports two independent Store seeds and shows the first one before its schema', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      expect(NGRX_EXAMPLES.map(example => example.id)).toEqual(['counter-store', 'todo-store']);
      expect(new Set(NGRX_EXAMPLES.map(example => example.sources)).size).toBe(2);

      const playground = activePlayground(fixture);
      expect(playground.initial()).toBe(NGRX_EXAMPLES[0].sources);
      expect(page.querySelectorAll('.cm-editor')).toHaveLength(editableFiles(playground.initial()).length);
      expect(editableFiles(playground.initial())).toHaveLength(11);
      expect(page.querySelector('.lesson-shell__intro')).toBeNull();
      expect(page.querySelector('#demo')?.textContent).toContain('NgRx Store');
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

  it('points every schema node at a real file and keeps the store setup in its own group', () => {
    for (const example of NGRX_EXAMPLES) {
      const editable = new Set(editableFiles(example.sources));
      const targets = diagramTargets(example);

      expect(targets.length).toBeGreaterThan(0);
      expect(targets.every(target => editable.has(target))).toBe(true);
      expect(new Set(targets).size).toBeGreaterThan(1);

      const groups = example.diagram!.groups;
      const flow = groups[0].steps.flatMap(step => step.nodes.map(node => node.file));
      const setup = groups[1].steps.flatMap(step => step.nodes.map(node => node.file));

      expect(flow.some(file => file.endsWith('.reducer.ts'))).toBe(true);
      expect(setup).toContain('app.config.ts');
      expect(flow).not.toContain('app.config.ts');
    }

    expect(Object.keys(NGRX_EXAMPLES[0].sources.files ?? {})).toEqual([
      'app.config.ts',
      'counter.actions.ts',
      'counter.reducer.ts',
      'counter.selectors.ts',
      'devtools.ts',
      'devtools-inspector.ts',
      'devtools-inspector.html',
      'devtools-inspector.css',
    ]);
    expect(Object.keys(NGRX_EXAMPLES[1].sources.files ?? {})).toEqual([
      'app.config.ts',
      'todo.actions.ts',
      'todo.reducer.ts',
      'todo.selectors.ts',
      'devtools.ts',
      'devtools-inspector.ts',
      'devtools-inspector.html',
      'devtools-inspector.css',
    ]);

    expect(NGRX_EXAMPLES[0].sources.files!['devtools.ts'])
      .toBe(NGRX_EXAMPLES[1].sources.files!['devtools.ts']);
    expect(NGRX_EXAMPLES[0].sources.files!['devtools-inspector.ts'])
      .toBe(NGRX_EXAMPLES[1].sources.files!['devtools-inspector.ts']);
  });

  it('switches both seeds, keeps a reducer draft and resets it to the seed', async () => {
    const { fixture, page } = await lessonFixture();
    try {
      const choices = page.querySelectorAll<HTMLButtonElement>(
        'nav[aria-label="Scegli un esempio"] button',
      );

      expect(choices).toHaveLength(NGRX_EXAMPLES.length);

      for (const [index, seed] of NGRX_EXAMPLES.entries()) {
        choices[index].click();
        await fixture.whenStable();

        const playground = activePlayground(fixture);
        const editor = EditorView.findFromDOM(
          page.querySelector<HTMLElement>('[id$="editor-typescript"] .cm-editor')!,
        )!;

        expect(playground.initial()).toBe(seed.sources);
        expect(choices[index].getAttribute('aria-pressed')).toBe('true');
        expect(page.querySelectorAll('.cm-editor')).toHaveLength(editableFiles(seed.sources).length);
        expect(editor.state.doc.toString()).toBe(seed.sources.typescript);
        expect(page.querySelector('app-lesson-diagram')?.textContent).toContain(seed.diagram!.title);
      }

      choices[0].click();
      await fixture.whenStable();
      const reducerEditor = () => EditorView.findFromDOM(
        page.querySelector<HTMLElement>('[id$="editor-counter.reducer.ts"] .cm-editor')!,
      )!;
      const original = NGRX_EXAMPLES[0].sources.files!['counter.reducer.ts'];
      const modified = '// bozza locale\n' + original;

      reducerEditor().dispatch({
        changes: { from: 0, to: reducerEditor().state.doc.length, insert: modified },
      });
      choices[1].click();
      await fixture.whenStable();
      choices[0].click();
      await fixture.whenStable();
      expect(reducerEditor().state.doc.toString()).toBe(modified);
      expect(NGRX_EXAMPLES[0].sources.files!['counter.reducer.ts']).toBe(original);

      [...page.querySelectorAll<HTMLButtonElement>('button')]
        .find(button => button.textContent?.trim() === 'Ripristina codice')!
        .click();
      fixture.detectChanges();
      expect(reducerEditor().state.doc.toString()).toBe(original);
      expect(page.querySelector('app-lesson-diagram')).not.toBeNull();
    } finally {
      fixture.destroy();
    }
  });
});
