import { EditorView } from '@codemirror/view';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { CourseExercise } from './course-exercise';
import { COURSE_EXERCISE_STEPS } from './course-exercise.steps';

async function createPage(): Promise<{ fixture: ComponentFixture<CourseExercise>; page: HTMLElement }> {
  TestBed.configureTestingModule({ imports: [CourseExercise], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CourseExercise);
  await fixture.whenStable();

  return { fixture, page: fixture.nativeElement as HTMLElement };
}

function activePlayground(fixture: ComponentFixture<CourseExercise>): AngularPlayground {
  return fixture.debugElement.query(By.directive(AngularPlayground)).componentInstance as AngularPlayground;
}

function activeEditor(page: HTMLElement): EditorView {
  const host = page.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden]) .cm-editor');
  return EditorView.findFromDOM(host!)!;
}

function stepButtons(page: HTMLElement): NodeListOf<HTMLButtonElement> {
  return page.querySelectorAll<HTMLButtonElement>('nav[aria-label="Scegli un checkpoint"] button');
}

describe('CourseExercise playground lesson', () => {
  it('starts from the first of five independent starter checkpoints', async () => {
    const { fixture, page } = await createPage();
    const choices = stepButtons(page);
    const playground = activePlayground(fixture);

    expect(COURSE_EXERCISE_STEPS).toHaveLength(5);
    expect(new Set(COURSE_EXERCISE_STEPS.map(step => step.id)).size).toBe(5);
    expect(choices).toHaveLength(5);
    expect(choices[0].getAttribute('aria-pressed')).toBe('true');
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[0].starter);
    expect(page.querySelector('.exercise__mode-text')?.textContent).toContain('il tuo codice');
    expect(page.querySelector('.exercise__mode-toggle')?.textContent).toContain('Mostra soluzione');
    expect(page.querySelector('.exercise__notice')).toBeNull();
    expect(page.querySelectorAll('iframe')).toHaveLength(1);

    fixture.destroy();
  });

  it('keeps a learner draft, including a supporting file, while solution mode is shown and hidden', async () => {
    const { fixture, page } = await createPage();
    const choices = stepButtons(page);
    choices[4].click();
    await fixture.whenStable();

    let playground = activePlayground(fixture);
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[4].starter);
    playground.selectFile('tags.pipe.ts');
    await fixture.whenStable();

    const marker = '\n// bozza del learner nel file pipe';
    let editor = activeEditor(page);
    editor.dispatch({ changes: { from: editor.state.doc.length, insert: marker } });
    await fixture.whenStable();

    choices[3].click();
    await fixture.whenStable();
    choices[4].click();
    await fixture.whenStable();

    playground = activePlayground(fixture);
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[4].starter);
    playground.selectFile('tags.pipe.ts');
    await fixture.whenStable();
    expect(activeEditor(page).state.doc.toString()).toContain(marker);
    expect(page.querySelectorAll('iframe')).toHaveLength(1);

    const modeToggle = page.querySelector<HTMLButtonElement>('.exercise__mode-toggle')!;
    modeToggle.click();
    await fixture.whenStable();

    playground = activePlayground(fixture);
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[4].solution);
    expect(playground.files.map(file => file.name)).toContain('tags.pipe.ts');
    expect(page.querySelector('.exercise__notice')).not.toBeNull();
    expect(page.querySelectorAll('iframe')).toHaveLength(1);

    modeToggle.click();
    await fixture.whenStable();

    playground = activePlayground(fixture);
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[4].starter);
    playground.selectFile('tags.pipe.ts');
    await fixture.whenStable();
    expect(activeEditor(page).state.doc.toString()).toContain(marker);
    expect(page.querySelectorAll('iframe')).toHaveLength(1);

    fixture.destroy();
  });

  it('resets only the visible solution and leaves the learner source untouched', async () => {
    const { fixture, page } = await createPage();
    const modeToggle = page.querySelector<HTMLButtonElement>('.exercise__mode-toggle')!;
    const starterMarker = '\n// bozza del learner';

    let editor = activeEditor(page);
    editor.dispatch({ changes: { from: editor.state.doc.length, insert: starterMarker } });
    await fixture.whenStable();

    modeToggle.click();
    await fixture.whenStable();

    let playground = activePlayground(fixture);
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[0].solution);
    editor = activeEditor(page);
    editor.dispatch({ changes: { from: editor.state.doc.length, insert: '\n// modifica della soluzione' } });
    await fixture.whenStable();

    playground.reset();
    await fixture.whenStable();
    expect(activeEditor(page).state.doc.toString()).toBe(COURSE_EXERCISE_STEPS[0].solution.typescript);

    modeToggle.click();
    await fixture.whenStable();

    playground = activePlayground(fixture);
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[0].starter);
    expect(activeEditor(page).state.doc.toString()).toContain(starterMarker);

    modeToggle.click();
    await fixture.whenStable();
    playground = activePlayground(fixture);
    expect(playground.initial()).toBe(COURSE_EXERCISE_STEPS[0].solution);
    expect(activeEditor(page).state.doc.toString()).toBe(COURSE_EXERCISE_STEPS[0].solution.typescript);
    expect(page.querySelectorAll('iframe')).toHaveLength(1);

    fixture.destroy();
  });

  it('reveals hints progressively and keeps the checklist manual and per step', async () => {
    const { fixture, page } = await createPage();
    const choices = stepButtons(page);
    const hintToggle = page.querySelector<HTMLButtonElement>('.exercise__hint-toggle')!;

    expect(page.querySelectorAll('.exercise__hint-list li')).toHaveLength(0);
    hintToggle.click();
    await fixture.whenStable();
    expect(page.querySelectorAll('.exercise__hint-list li')).toHaveLength(1);
    hintToggle.click();
    await fixture.whenStable();
    expect(page.querySelectorAll('.exercise__hint-list li')).toHaveLength(2);

    choices[1].click();
    await fixture.whenStable();
    expect(page.querySelectorAll('.exercise__hint-list li')).toHaveLength(0);
    choices[0].click();
    await fixture.whenStable();
    expect(page.querySelectorAll('.exercise__hint-list li')).toHaveLength(2);

    let boxes = page.querySelectorAll<HTMLInputElement>('mat-checkbox input[type="checkbox"]');
    expect(boxes).toHaveLength(COURSE_EXERCISE_STEPS[0].checks.length);
    expect([...boxes].every(box => !box.checked)).toBe(true);

    page.querySelector<HTMLButtonElement>('.exercise__mode-toggle')!.click();
    await fixture.whenStable();
    boxes = page.querySelectorAll<HTMLInputElement>('mat-checkbox input[type="checkbox"]');
    expect([...boxes].every(box => !box.checked)).toBe(true);

    boxes[0].click();
    await fixture.whenStable();
    expect(boxes[0].checked).toBe(true);
    expect(page.querySelector('.exercise__check-count')?.textContent).toContain('1 di');

    choices[1].click();
    await fixture.whenStable();
    expect(page.querySelector('.exercise__check-count')?.textContent).toContain('0 di');
    choices[0].click();
    await fixture.whenStable();
    boxes = page.querySelectorAll<HTMLInputElement>('mat-checkbox input[type="checkbox"]');
    expect(boxes[0].checked).toBe(true);

    fixture.destroy();
  });
});
