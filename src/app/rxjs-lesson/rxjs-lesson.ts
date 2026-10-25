// COMPONENT TYPE: Learning container
// SECTION: RxJS
// ROLE: Run three independent editable RxJS examples; all state stays in the sandbox.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { RXJS_EXAMPLES } from './rxjs.example';

@Component({
  selector: 'app-rxjs-lesson',
  imports: [LessonDisclosure, LessonExamples, LessonShell, RouterLink],
  templateUrl: './rxjs-lesson.html',
  styleUrl: './rxjs-lesson.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RxjsLesson {
  readonly examples: readonly LessonExample[] = RXJS_EXAMPLES;
}
