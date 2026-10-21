import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { Router, provideRouter } from '@angular/router';
import { CourseExercise } from './course-exercise';
import { COURSE_ASSIGNMENT_STEPS } from './course-exercise.steps';

async function createPage(): Promise<{ fixture: ComponentFixture<CourseExercise>; page: HTMLElement }> {
  TestBed.configureTestingModule({ imports: [CourseExercise], providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(CourseExercise);
  await fixture.whenStable();

  return { fixture, page: fixture.nativeElement };
}

describe('CourseExercise local assignment handout', () => {
  it('shows every step without a playground, editor, checklist or solution control', async () => {
    const { fixture, page } = await createPage();
    const sections = page.querySelectorAll<HTMLElement>('[data-step]');
    const titles = [...sections].map(section => section.querySelector('h4')?.textContent?.trim());

    expect(sections).toHaveLength(5);
    expect(titles).toEqual(COURSE_ASSIGNMENT_STEPS.map(step => step.title));
    expect(page.querySelector('app-angular-playground, iframe, .cm-editor, textarea, [contenteditable="true"]')).toBeNull();
    expect(page.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
    expect(page.querySelector('mat-checkbox, .exercise__check')).toBeNull();
    expect(page.textContent).not.toContain('Mostra soluzione');
    expect(page.querySelector('.exercise__mode-toggle')).toBeNull();

    fixture.destroy();
  });

  it('lists the setup and generation commands with the real project file targets', async () => {
    const { fixture, page } = await createPage();
    const setup = page.querySelector<HTMLElement>('#setup')!;
    const setupText = setup.textContent ?? '';
    const pageText = page.textContent ?? '';

    expect(setupText).toContain('npx @angular/cli@22 new catalogo-corsi --standalone --routing=false --style=scss --defaults');
    expect(setupText).toContain('npx ng add @angular/material@22');
    expect(setupText).toContain('npm start -- --port 4201');
    expect(setupText).toContain('src/app/models/course.ts');
    expect(setupText).toContain('src/app/components/course-card/course-card.ts');
    expect(setupText).toContain('src/app/pipes/tags-pipe.ts');
    expect(pageText).toContain('npx ng generate component components/course-card --inline-template --skip-tests');
    expect(pageText).toContain('npx ng generate pipe pipes/tags --skip-tests');

    fixture.destroy();
  });

  it('keeps section navigation on the exercise route instead of the base URL', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'basics/course-exercise', component: CourseExercise }])],
    });
    const harness = await RouterTestingHarness.create('/basics/course-exercise');
    const page = harness.routeNativeElement!;
    const link = page.querySelector<HTMLAnchorElement>('.assignment__index a[href$="#step-1"]')!;
    expect(link.getAttribute('href')).toBe('/basics/course-exercise#step-1');
    link.click();
    await harness.fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/basics/course-exercise#step-1');
    expect(page.querySelectorAll('[data-step]')).toHaveLength(5);
    harness.fixture.destroy();
  });

  it('prints the handout from the labelled Stampa / Salva PDF button', async () => {
    const { fixture, page } = await createPage();
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const button = page.querySelector<HTMLButtonElement>('.assignment__print');

    expect(button?.textContent).toContain('Stampa / Salva PDF');
    button!.click();

    expect(print).toHaveBeenCalledTimes(1);
    print.mockRestore();

    fixture.destroy();
  });
});
