// COMPONENT TYPE: Container
// ROLE: Present one of the four learning hubs without linking unpublished lessons.
//
// NOTES FOR CONTRIBUTORS:
// - Category metadata lives in sections.ts; lessons still come from TOPICS.
// - Read route.data as an observable so a reused component never keeps stale metadata.
// - The phase filter only exists for basics and resets when the section changes.
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs';
import { LessonInline } from '../../components/lesson-inline/lesson-inline';
import { PageHeader } from '../../page-header/page-header';
import {
  BasicsPhase,
  CATEGORY_SECTIONS,
  CategoryId,
  CategoryResource,
  PhaseFilter,
  isCategoryId,
} from '../sections';

@Component({
  selector: 'app-learning-category',
  imports: [LessonInline, PageHeader, RouterLink, MatButtonModule, MatChipsModule, MatIconModule],
  templateUrl: './category.html',
  styleUrl: './category.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningCategory {
  private readonly route = inject(ActivatedRoute);

  // Route data, not the snapshot: direct basics-to-advanced navigation must
  // refresh the hero, cards and CTA even if the component instance is reused.
  private readonly routeCategory = toSignal(
    this.route.data.pipe(
      map((data) => (isCategoryId(data['category']) ? data['category'] : 'basics')),
    ),
    { initialValue: this.initialCategory() },
  );

  readonly section = computed(() => CATEGORY_SECTIONS[this.routeCategory()]);

  // linkedSignal resets the filter whenever the active section changes.
  readonly selectedPhase = linkedSignal<CategoryId, PhaseFilter>({
    source: () => this.section().id,
    computation: () => 'all',
  });

  readonly visibleResources = computed(() => {
    const phase = this.selectedPhase();
    return phase === 'all'
      ? this.section().resources
      : this.section().resources.filter((resource) => resource.phase === phase);
  });

  readonly summary = computed(() => {
    const section = this.section();
    const noun =
      section.resources.length === 1
        ? section.resourceNoun.singular
        : section.resourceNoun.plural;
    return section.phases.length
      ? `${section.resources.length} ${noun} in ${section.phases.length} fasi progressive`
      : `${section.resources.length} ${noun}`;
  });

  readonly visibleLabel = computed(() => {
    const section = this.section();
    const count = this.visibleResources().length;
    const noun = count === 1 ? section.resourceNoun.singular : section.resourceNoun.plural;
    return `${count} ${noun} ${count === 1 ? 'visibile' : 'visibili'}`;
  });

  readonly filterStatus = computed(() => {
    const section = this.section();
    const phase = this.selectedPhase();
    if (!section.phases.length) {
      return this.visibleLabel();
    }
    if (phase === 'all') {
      return `${this.visibleLabel()}: tutte le fasi del percorso.`;
    }
    const selected = section.phases.find((item) => item.id === phase);
    return selected ? `${this.visibleLabel()}: ${selected.description}` : this.visibleLabel();
  });

  selectPhase(event: MatChipListboxChange): void {
    const value: unknown = event.value;
    if (value !== undefined && value !== null) {
      const valid = this.section().phases.some((phase) => phase.id === value);
      this.selectedPhase.set(value === 'all' || valid ? (value as PhaseFilter) : 'all');
    }
    // A single-choice filter always has an active phase, including All.
    event.source.value = this.selectedPhase();
  }

  phaseFor(resource: CategoryResource): string {
    if (!resource.phase) {
      return '';
    }
    return this.section().phases.find((phase) => phase.id === resource.phase)?.label ?? '';
  }

  phaseCount(phase: BasicsPhase): number {
    return this.section().resources.filter((resource) => resource.phase === phase).length;
  }

  private initialCategory(): CategoryId {
    const category: unknown = this.route.snapshot.data['category'];
    return isCategoryId(category) ? category : 'basics';
  }
}
