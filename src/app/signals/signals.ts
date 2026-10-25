// COMPONENT TYPE: Learning container
// SECTION: Angular Signals
// ROLE: Run four independent editable Signals examples; all state stays in the sandbox.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { SIGNALS_EXAMPLES } from './signals.example';

@Component({
  selector: 'app-signals',
  imports: [LessonDisclosure, LessonExamples, LessonShell],
  templateUrl: './signals.html',
  styleUrl: './signals.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Signals {
  readonly examples: readonly LessonExample[] = SIGNALS_EXAMPLES;
}
