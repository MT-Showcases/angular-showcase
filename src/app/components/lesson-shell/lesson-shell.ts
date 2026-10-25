// COMPONENT TYPE: Shared UI
// ROLE: Provide learning context and navigation while keeping demo state in feature components.
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, UrlTree } from '@angular/router';
import { filter, map } from 'rxjs';
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
  private readonly router = inject(Router);
  private readonly url = toSignal(this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(() => this.router.url),
  ), { initialValue: this.router.url });
  readonly sectionLinks = computed(() => {
    const url = this.url();
    const link = (fragment: string): UrlTree => {
      const tree = this.router.parseUrl(url);
      tree.fragment = fragment;
      return tree;
    };
    return { demo: link('demo'), code: link('code'), deepen: link('deepen') };
  });
  readonly compact = input(false);
  readonly topicId = input.required<LessonId>();
  readonly topic = computed(() => TOPICS.find(topic => topic.id === this.topicId())!);
  readonly prerequisites = computed(() => TOPICS.filter(topic => this.topic().prerequisites.includes(topic.id)));
  readonly neighbors = computed(() => {
    const published = TOPICS.filter(topic => topic.published);
    const index = published.findIndex(topic => topic.id === this.topicId());
    return { previous: published[index - 1], next: published[index + 1] };
  });
  readonly categoryLabels = { basics: 'Basi', advanced: 'Avanzato', state: 'Stato' };
  readonly glossary = GLOSSARY;
}
