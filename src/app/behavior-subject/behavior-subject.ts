// COMPONENT TYPE: Learning container
// SECTION: RxJS state — BehaviorSubject
// ROLE: Run three editable BehaviorSubject examples; all demo state stays in the sandbox.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { BEHAVIOR_EXAMPLES } from './behavior.example';

@Component({
  selector: 'app-behavior-subject',
  imports: [LessonDisclosure, LessonExamples, LessonShell],
  templateUrl: './behavior-subject.html',
  styleUrl: './behavior-subject.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BehaviorSubjectComponent {
  readonly examples: readonly LessonExample[] = BEHAVIOR_EXAMPLES;
}
