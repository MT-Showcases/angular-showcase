// Feature page hosting one isolated, editable users project.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';
import {
  LessonExample,
  LessonExamples,
} from '../components/lesson-examples/lesson-examples';
import { PageHeader } from '../page-header/page-header';
import { USERS_EXAMPLES } from './users.example';

@Component({
  selector: 'app-user-page',
  imports: [LessonDisclosure, LessonExamples, PageHeader],
  templateUrl: './user-page.html',
  styleUrl: './user-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPage {
  // The source files belong to the preview, not to the host application.
  readonly examples: readonly LessonExample[] = USERS_EXAMPLES;
}
