// COMPONENT TYPE: Container
// ROLE: Present the five-step course catalog assignment as a printable handout.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonInline } from '../components/lesson-inline/lesson-inline';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { COURSE_SAMPLES } from './course-exercise.data';
import {
  COURSE_ASSIGNMENT_STEPS,
  COURSE_DATA_SNIPPET,
  COURSE_MODEL_SNIPPET,
  PROJECT_TREE,
  SETUP_COMMANDS,
} from './course-exercise.steps';

@Component({
  selector: 'app-course-exercise',
  imports: [RouterLink, CodeBlock, LessonInline, LessonShell, MatButtonModule, MatIconModule],
  templateUrl: './course-exercise.html',
  styleUrl: './course-exercise.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseExercise {
  readonly topicId = 'course-exercise' as const;
  readonly steps = COURSE_ASSIGNMENT_STEPS;
  readonly setupCommands = SETUP_COMMANDS;
  readonly projectTree = PROJECT_TREE;
  readonly modelSnippet = COURSE_MODEL_SNIPPET;
  readonly dataSnippet = COURSE_DATA_SNIPPET;
  readonly sampleCount = COURSE_SAMPLES.length;

  /** Uses the browser dialog so the learner can print or save the handout as PDF. */
  printPage(): void {
    window.print();
  }
}
