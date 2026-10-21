// COMPONENT TYPE: Container
// ROLE: Run the five-step course catalog exercise with independent per-step drafts.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AngularPlayground } from '../components/angular-playground/angular-playground';
import { PlaygroundSources, cloneSources } from '../components/angular-playground/playground.types';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonInline } from '../components/lesson-inline/lesson-inline';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { COURSE_EXERCISE_STEPS, CourseExerciseStep } from './course-exercise.steps';

type ExerciseMode = 'starter' | 'solution';

interface ActiveView {
  readonly key: string;
  readonly title: string;
  readonly sources: PlaygroundSources;
}

@Component({
  selector: 'app-course-exercise',
  imports: [AngularPlayground, LessonDisclosure, LessonInline, LessonShell, MatButtonModule, MatCheckboxModule],
  templateUrl: './course-exercise.html',
  styleUrl: './course-exercise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseExercise {
  readonly topicId = 'course-exercise' as const;
  readonly steps: readonly CourseExerciseStep[] = COURSE_EXERCISE_STEPS;
  readonly selectedStepId = signal(this.steps[0].id);
  readonly mode = signal<ExerciseMode>('starter');
  readonly step = computed<CourseExerciseStep>(
    () => this.steps.find(step => step.id === this.selectedStepId()) ?? this.steps[0],
  );
  readonly stepIndex = computed(() => this.steps.indexOf(this.step()) + 1);
  readonly solutionMode = computed(() => this.mode() === 'solution');

  /** One key per step and mode keeps the editor draft and its initial source paired. */
  readonly activeView = computed<ActiveView>(() => {
    const step = this.step();
    const solution = this.solutionMode();

    return {
      key: `${step.id}:${this.mode()}`,
      title: `${step.title} — ${solution ? 'soluzione' : 'il tuo codice'}`,
      sources: solution ? step.solution : step.starter,
    };
  });

  readonly revealedHints = signal<Readonly<Record<string, number>>>({});
  readonly hintCount = computed(() => this.revealedHints()[this.step().id] ?? 0);
  readonly visibleHints = computed(() => this.step().hints.slice(0, this.hintCount()));

  readonly checklist = signal<Readonly<Record<string, boolean>>>({});
  readonly checkedCount = computed(() => {
    const step = this.step();
    const state = this.checklist();

    return step.checks.reduce(
      (total, _check, index) => total + (state[`${step.id}:${index}`] ? 1 : 0),
      0,
    );
  });

  private readonly drafts = new Map<string, PlaygroundSources>();

  selectStep(id: string): void {
    if (id === this.step().id) return;
    this.selectedStepId.set(id);
    this.mode.set('starter');
  }

  toggleSolution(): void {
    // Only the mode key changes: the learner draft is never overwritten.
    this.mode.update(mode => (mode === 'starter' ? 'solution' : 'starter'));
  }

  rememberDraft(key: string, sources: PlaygroundSources): void {
    this.drafts.set(key, cloneSources(sources));
  }

  draftFor(key: string): PlaygroundSources | undefined {
    return this.drafts.get(key);
  }

  revealNextHint(): void {
    const step = this.step();
    const visible = this.hintCount();
    if (visible >= step.hints.length) return;

    this.revealedHints.update(state => ({ ...state, [step.id]: visible + 1 }));
  }

  isChecked(stepId: string, index: number): boolean {
    return this.checklist()[`${stepId}:${index}`] ?? false;
  }

  setChecked(stepId: string, index: number, checked: boolean): void {
    this.checklist.update(state => ({ ...state, [`${stepId}:${index}`]: checked }));
  }
}
