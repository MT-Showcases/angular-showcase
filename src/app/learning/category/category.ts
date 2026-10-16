// COMPONENT TYPE: Container
// ROLE: Present the published learning path without linking unfinished lessons.
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeader } from '../../page-header/page-header';
import { TOPICS } from '../topics';
@Component({
  selector: 'app-learning-category',
  imports: [PageHeader, RouterLink],
  template: `<app-page-header [title]="category === 'basics' ? 'Le basi di Angular' : 'Approfondisci Angular'" subtitle="Un percorso guidato, con la libertà di scegliere da dove iniziare." />
    <section class="lesson-panel">
      <h2 class="lesson-title">{{ category === 'basics' ? 'Costruisci le fondamenta' : 'Dallo stato ai dati remoti' }}</h2>
      <p class="lesson-text">Se inizi ora, segui l’ordine proposto. Se hai già esperienza, entra in una lezione e apri direttamente codice e approfondimenti. Bastano HTML, CSS e un po’ di JavaScript: i termini Angular sono spiegati nel glossario di ogni pagina.</p>
      <ol class="lesson-list">
        @for (topic of topics; track topic.id) {
          <li class="category__item"><a [routerLink]="topic.route" class="category__link">{{ topic.title }}</a><p class="lesson-text">{{ topic.outcome }}</p></li>
        }
      </ol>
      <a [routerLink]="category === 'basics' ? '/advanced' : '/basics'" class="category__link">{{ category === 'basics' ? 'Esplora anche Avanzato →' : '← Rivedi le Basi' }}</a>
    </section>`,
  styles: `@use 'globals' as *; .category__item { margin-bottom: space(6); } .category__link { color: var(--mat-sys-primary); font: var(--mat-sys-title-medium); }`,
})
export class LearningCategory {
  readonly category = inject(ActivatedRoute).snapshot.data['category'] as 'basics' | 'advanced';
  readonly topics = TOPICS.filter(topic => topic.category === this.category && topic.published);
}
