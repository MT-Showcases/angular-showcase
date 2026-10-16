// COMPONENT TYPE: Shared UI
// ROLE: Provide learning context and navigation while keeping demo state in feature components.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '../../page-header/page-header';
import { GLOSSARY, LessonId, TOPICS } from '../../learning/topics';

/** Wrap a lesson's projected demos. @example <app-lesson-shell topicId="binding">...</app-lesson-shell> */
@Component({
  selector: 'app-lesson-shell',
  imports: [RouterLink, PageHeader],
  templateUrl: './lesson-shell.html',
  styleUrl: './lesson-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonShell {
  readonly topicId = input.required<LessonId>();
  readonly topic = computed(() => TOPICS.find(topic => topic.id === this.topicId())!);
  readonly prerequisites = computed(() => TOPICS.filter(topic => this.topic().prerequisites.includes(topic.id)));
  readonly neighbors = computed(() => {
    const published = TOPICS.filter(topic => topic.published);
    const index = published.findIndex(topic => topic.id === this.topicId());
    return { previous: published[index - 1], next: published[index + 1] };
  });
  readonly glossary = GLOSSARY;
}
