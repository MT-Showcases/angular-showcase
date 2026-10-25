// COMPONENT TYPE: Learning container
// SECTION: State management — NgRx Store
// ROLE: Run two independent editable NgRx projects; all store state stays in the sandbox.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { NGRX_EXAMPLES } from './ngrx.example';
import { NgrxFlow } from './ngrx-flow';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ngrx-example',
  imports: [LessonDisclosure, LessonExamples, LessonShell, NgrxFlow, RouterLink],
  templateUrl: './ngrx-example.html',
  styleUrl: './ngrx-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgrxExample {
  readonly examples: readonly LessonExample[] = NGRX_EXAMPLES;
}
