// COMPONENT TYPE: Test Suite
// ROLE: Verify that the compact lesson wires every seed to one visible, switchable editor.
// PATTERNS USED: Real lesson DOM, the active playground and the CodeMirror source.
// NOTES FOR CONTRIBUTORS: Runtime behavior belongs in scripts/test-playground.mjs.
import { EditorView } from '@codemirror/view';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { PipesLesson } from './pipes';
import { CURRENCY_EXAMPLE, DATE_EXAMPLE, TAG_LIST_EXAMPLE, UPPERCASE_EXAMPLE } from './pipes.example';
import { CURRENCY_DIAGRAM, DATE_DIAGRAM, TAG_LIST_DIAGRAM, UPPERCASE_DIAGRAM } from './pipes-diagrams';
import { TagListPipe } from './tag-list-pipe';

describe('Pipes playground lesson', () => {
  it('connects the actual date seed to a visible editor before optional theory', async () => {
    TestBed.configureTestingModule({ imports: [PipesLesson], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PipesLesson);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;

    expect(playground.initial()).toBe(DATE_EXAMPLE);
    expect(page.querySelector('.lesson-shell__intro')).toBeNull();
    expect(page.querySelectorAll('.cm-editor')).toHaveLength(3 + Object.keys(playground.initial().files ?? {}).length);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
    expect(page.querySelector('app-angular-playground')!.compareDocumentPosition(page.querySelector('app-lesson-disclosure')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fixture.destroy();
  });

  it('switches every seed and keeps its editable source in the active editor', async () => {
    TestBed.configureTestingModule({ imports: [PipesLesson], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PipesLesson);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const seeds = [DATE_EXAMPLE, CURRENCY_EXAMPLE, UPPERCASE_EXAMPLE, TAG_LIST_EXAMPLE];

    expect(choices).toHaveLength(seeds.length);

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

  it('selects the matching schema for every example and links only real files', async () => {
    TestBed.configureTestingModule({ imports: [PipesLesson], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(PipesLesson);
    await fixture.whenStable();
    const page: HTMLElement = fixture.nativeElement;
    const choices = page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un esempio"] button');
    const cases = [
      { seed: DATE_EXAMPLE, schema: DATE_DIAGRAM },
      { seed: CURRENCY_EXAMPLE, schema: CURRENCY_DIAGRAM },
      { seed: UPPERCASE_EXAMPLE, schema: UPPERCASE_DIAGRAM },
      { seed: TAG_LIST_EXAMPLE, schema: TAG_LIST_DIAGRAM },
    ];

    expect(choices).toHaveLength(cases.length);

    for (const [index, testCase] of cases.entries()) {
      choices[index].click();
      await fixture.whenStable();

      const playground = fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
      const diagram = page.querySelector('app-lesson-diagram')!;
      expect(playground.initial()).toBe(testCase.seed);
      expect(diagram.textContent).toContain(testCase.schema.title);
      expect(diagram.querySelectorAll('.diagram__group')).toHaveLength(testCase.schema.groups.length);

      const files = new Set(playground.files.map(file => file.name));
      for (const node of diagram.querySelectorAll('.diagram__node')) {
        const target = node.querySelector('.diagram__node-file')?.textContent?.trim();
        expect(files.has(target!)).toBe(true);
      }
    }

    fixture.destroy();
  });
});

describe('TagListPipe', () => {
  it('formats frozen input without mutation and supports an empty list and separator', () => {
    const pipe = new TagListPipe();
    const source = Object.freeze(['uno', 'due']);

    expect(pipe.transform(source)).toBe('uno · due');
    expect(pipe.transform(source, ' / ')).toBe('uno / due');
    expect(pipe.transform(source, '')).toBe('unodue');
    expect(pipe.transform([])).toBe('');
    expect(source).toEqual(['uno', 'due']);
  });
});
