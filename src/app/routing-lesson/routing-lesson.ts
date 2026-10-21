// COMPONENT TYPE: Learning container
// SECTION: Angular Basics — Routing
// ROLE: Run three independent editable routing projects; the lesson itself leaves routing to the sandbox.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { ROUTING_EXAMPLES } from './routing.example';

@Component({
  selector: 'app-routing-lesson',
  imports: [LessonDisclosure, LessonExamples, LessonShell],
  templateUrl: './routing-lesson.html',
  styleUrl: './routing-lesson.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutingLesson {
  readonly examples: readonly LessonExample[] = ROUTING_EXAMPLES;
}
