// COMPONENT TYPE: Shared UI
// ROLE: Run one focused example at a time while keeping each source draft.
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AngularPlayground } from '../angular-playground/angular-playground';
import { PlaygroundSources, cloneSources } from '../angular-playground/playground.types';
import { LessonInline } from '../lesson-inline/lesson-inline';

/** One independent teaching example and its editable virtual files. */
export interface LessonExample {
  id: string;
  label: string;
  title: string;
  prompt: string;
  takeaway: string;
  sources: PlaygroundSources;
}

/** Keeps one compiler iframe mounted, instead of loading every example at once. */
@Component({
  selector: 'app-lesson-examples',
  imports: [AngularPlayground, LessonInline, MatButtonModule],
  templateUrl: './lesson-examples.html',
  styleUrl: './lesson-examples.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonExamples {
  readonly examples = input.required<readonly LessonExample[]>();
  readonly selectedId = signal('');
  readonly active = computed<LessonExample | undefined>(() => this.examples().find(example => example.id === this.selectedId()) ?? this.examples()[0]);
  readonly drafts = new Map<string, PlaygroundSources>();

  remember(id: string, sources: PlaygroundSources): void {
    this.drafts.set(id, cloneSources(sources));
  }
}
