// COMPONENT TYPE: Learning container
// SECTION: Angular Advanced — HTTP and services
// ROLE:
// - Run four independent editable HTTP examples, each with its own service and configuration.
// - Keep request state, cancellation and simulated writes visible in the lesson sandbox.
//
// PATTERNS USED:
// - Compact LessonShell with shared LessonExamples and source drafts.
// - Real HttpClient calls through an editable injectable service.
// - Observable subscriptions closed by takeUntilDestroyed, cancel and reset.
//
// NOTES FOR CONTRIBUTORS:
// - Every example must start from an explicit user action; do not add an automatic request.
// - Keep the JSONPlaceholder writes labelled as simulated and non-persistent.
// - Runtime behavior belongs in scripts/test-http.mjs; this host only wires the examples.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import { LessonExample, LessonExamples } from '../components/lesson-examples/lesson-examples';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { HTTP_EXAMPLES } from './http.example';

@Component({
  selector: 'app-http-example',
  imports: [LessonDisclosure, LessonExamples, LessonShell],
  templateUrl: './http-example.html',
  styleUrl: './http-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpExample {
  readonly examples: readonly LessonExample[] = HTTP_EXAMPLES;
}
