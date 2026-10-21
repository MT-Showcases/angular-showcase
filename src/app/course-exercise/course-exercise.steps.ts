import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { COURSE_SAMPLES } from './course-exercise.data';

/** One independently editable checkpoint of the course catalog exercise. */
export interface CourseExerciseStep {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly objective: string;
  readonly requirements: readonly string[];
  readonly hints: readonly string[];
  readonly checks: readonly string[];
  readonly starter: PlaygroundSources;
  readonly solution: PlaygroundSources;
}

/** Minimal interface repeated in every teaching file, without engine imports. */
const COURSE_INTERFACE = `interface CourseSample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly startDate: string;
  readonly tags: readonly string[];
  readonly available: boolean;
}`;

const EXPORTED_COURSE_INTERFACE = `export interface CourseSample {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly startDate: string;
  readonly tags: readonly string[];
  readonly available: boolean;
}`;

/** Render sample data as readable TypeScript inside the editable source. */
function lessonLiteral(value: unknown, indent = ''): string {
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line, index) => (index === 0 ? line : indent + line))
    .join('\n');
}

const FIRST_COURSE = lessonLiteral(COURSE_SAMPLES[0], '  ');
const ALL_COURSES = lessonLiteral(COURSE_SAMPLES, '  ');

const CARD_STYLES = `:host {
  display: block;
  color: var(--mat-sys-on-surface);
}

.course {
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
}

.course h2,
.course p {
  margin: 0;
}

.course__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.75rem;
  margin: 0;
}

.course__facts div {
  display: grid;
  gap: 0.125rem;
}

.course__facts dt {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-label-small);
}

.course__facts dd {
  margin: 0;
}

.course__tags {
  color: var(--mat-sys-on-surface-variant);
}

.course__availability {
  font-weight: 600;
}

.course--selected {
  outline: 2px solid var(--mat-sys-primary);
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}`;

const LIST_STYLES = `${CARD_STYLES}

.catalog {
  display: grid;
  gap: 1rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.empty {
  padding: 1rem;
  border: 1px dashed var(--mat-sys-outline);
  border-radius: var(--mat-sys-corner-medium);
}

.summary {
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}`;

const PARENT_STYLES = `.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-block: 1rem;
}

:host {
  display: block;
  color: var(--mat-sys-on-surface);
}

.catalog {
  display: grid;
  gap: 1rem;
}

.summary {
  margin-block: 1rem 0;
  padding: 1rem;
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}`;

const CHILD_STYLES = `    :host {
      display: block;
    }

    .course {
      display: grid;
      gap: 0.75rem;
      padding: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
    }

    .course h2,
    .course p {
      margin: 0;
    }

    .course__facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
      gap: 0.75rem;
      margin: 0;
    }

    .course__facts div {
      display: grid;
      gap: 0.125rem;
    }

    .course__facts dt {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-small);
    }

    .course__facts dd {
      margin: 0;
    }

    .course__tags {
      color: var(--mat-sys-on-surface-variant);
    }

    .course__availability {
      font-weight: 600;
    }

    .course--selected {
      outline: 2px solid var(--mat-sys-primary);
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
`;

const STEP_ONE_TYPESCRIPT = `import { ChangeDetectionStrategy, Component } from '@angular/core';

${COURSE_INTERFACE}

// PADRE: possiede il corso; il template decide come mostrarlo.
@Component({
  selector: 'app-course-demo',
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CourseDemo {
  // Il campione è stabile: stessi id, prezzi e date in tutti i passi.
  readonly course: CourseSample = ${FIRST_COURSE};
}`;

const STEP_ONE_STARTER_HTML = `<!-- TODO: mostra ogni campo con l'interpolazione {{ }}. -->
<article class="course">
  <h2>{{ course.title }}</h2>
  <p>Descrizione da completare con l'interpolazione.</p>
  <p>Prezzo da mostrare.</p>
  <p>Data da mostrare.</p>
  <p>Etichette da unire.</p>
  <p>Disponibilità da calcolare.</p>
</article>`;

const STEP_ONE_SOLUTION_HTML = `<article class="course">
  <h2>{{ course.title }}</h2>
  <p>{{ course.description }}</p>

  <dl class="course__facts">
    <div>
      <dt>Prezzo</dt>
      <dd>{{ course.price }} USD</dd>
    </div>
    <div>
      <dt>Inizio</dt>
      <dd>{{ course.startDate }}</dd>
    </div>
  </dl>

  <p class="course__tags">{{ course.tags.join(' · ') }}</p>
  <p class="course__availability">
    {{ course.available ? 'Disponibile' : 'Non disponibile' }}
  </p>
</article>`;

const STEP_TWO_TYPESCRIPT_STARTER = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

${COURSE_INTERFACE}

// PADRE: lo stato selected decide l'aspetto della scheda.
@Component({
  selector: 'app-course-demo',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CourseDemo {
  readonly course: CourseSample = ${FIRST_COURSE};

  selected = false;

  select(): void {
    // TODO: inverti lo stato per selezionare e deselezionare.
    this.selected = true;
  }
}`;

const STEP_TWO_TYPESCRIPT_SOLUTION = STEP_TWO_TYPESCRIPT_STARTER.replace(
  '    // TODO: inverti lo stato per selezionare e deselezionare.\n    this.selected = true;',
  '    this.selected = !this.selected;',
);

const STEP_TWO_STARTER_HTML = `<!-- TODO: collega la classe della scheda e lo stato ARIA del pulsante. -->
<article class="course">
  <h2>{{ course.title }}</h2>
  <p>{{ course.description }}</p>

  <dl class="course__facts">
    <div>
      <dt>Prezzo</dt>
      <dd>{{ course.price }} USD</dd>
    </div>
    <div>
      <dt>Inizio</dt>
      <dd>{{ course.startDate }}</dd>
    </div>
  </dl>

  <p class="course__tags">{{ course.tags.join(' · ') }}</p>
  <p class="course__availability">
    {{ course.available ? 'Disponibile' : 'Non disponibile' }}
  </p>
</article>

<button
  matButton="filled"
  type="button"
  (click)="select()"
>
  {{ selected ? 'Deseleziona corso' : 'Seleziona corso' }}
</button>`;

const STEP_TWO_SOLUTION_HTML = STEP_TWO_STARTER_HTML
  .replace(
    '<!-- TODO: collega la classe della scheda e lo stato ARIA del pulsante. -->\n<article class="course">',
    '<article\n  class="course"\n  [class.course--selected]="selected"\n>',
  )
  .replace(
    '  type="button"\n  (click)="select()"',
    '  type="button"\n  [attr.aria-pressed]="selected"\n  (click)="select()"',
  );

const STEP_THREE_TYPESCRIPT = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

${COURSE_INTERFACE}

// PADRE: possiede l'elenco visibile e i due comandi di ripristino.
@Component({
  selector: 'app-course-list-demo',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CourseListDemo {
  readonly courses: readonly CourseSample[] = ${ALL_COURSES};

  // Una copia locale: svuotare il catalogo non cancella i campioni.
  visibleCourses: readonly CourseSample[] = [...this.courses];

  emptyCatalog(): void {
    this.visibleCourses = [];
  }

  restoreCatalog(): void {
    this.visibleCourses = [...this.courses];
  }
}`;

const STEP_THREE_STARTER_HTML = `<section class="catalog" aria-label="Catalogo corsi">
  @for (course of visibleCourses; track $index) {
    <article class="course">
      <h2>{{ course.title }}</h2>
      <p>{{ course.description }}</p>

      <dl class="course__facts">
        <div>
          <dt>Prezzo</dt>
          <dd>{{ course.price }} USD</dd>
        </div>
        <div>
          <dt>Inizio</dt>
          <dd>{{ course.startDate }}</dd>
        </div>
      </dl>


      <p class="course__tags">{{ course.tags.join(' · ') }}</p>

      <!-- TODO: sostituisci questo testo con @if/@else su course.available. -->
      <p class="course__availability">Disponibilità da mostrare</p>
    </article>
  }

  <!-- TODO: aggiungi un blocco @empty con un messaggio utile. -->
</section>

<div class="actions">
  <button
    matButton="outlined"
    type="button"
    [disabled]="visibleCourses.length === 0"
    (click)="emptyCatalog()"
  >
    Svuota catalogo
  </button>
  <button
    matButton="filled"
    type="button"
    (click)="restoreCatalog()"
  >
    Ripristina catalogo
  </button>
</div>`;

const STEP_THREE_SOLUTION_HTML = `<section class="catalog" aria-label="Catalogo corsi">
  @for (course of visibleCourses; track course.id) {
    <article class="course">
      <h2>{{ course.title }}</h2>
      <p>{{ course.description }}</p>

      <dl class="course__facts">
        <div>
          <dt>Prezzo</dt>
          <dd>{{ course.price }} USD</dd>
        </div>
        <div>
          <dt>Inizio</dt>
          <dd>{{ course.startDate }}</dd>
        </div>
      </dl>


      <p class="course__tags">{{ course.tags.join(' · ') }}</p>

      @if (course.available) {
        <p class="course__availability">Disponibile</p>
      } @else {
        <p class="course__availability">Non disponibile</p>
      }
    </article>
  } @empty {
    <p class="empty" role="status">
      Nessun corso in elenco. Usa «Ripristina catalogo» per ricominciare.
    </p>
  }
</section>

<div class="actions">
  <button
    matButton="outlined"
    type="button"
    [disabled]="visibleCourses.length === 0"
    (click)="emptyCatalog()"
  >
    Svuota catalogo
  </button>
  <button
    matButton="filled"
    type="button"
    (click)="restoreCatalog()"
  >
    Ripristina catalogo
  </button>
</div>`;

const STEP_FOUR_PARENT_TYPESCRIPT = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CourseCard } from './course-card.component';
import type { CourseSample } from './course-card.component';

// PADRE: conserva l'elenco e l'id selezionato; il figlio mostra la scheda.
@Component({
  selector: 'app-course-catalog',
  imports: [CourseCard, MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CourseCatalog {
  readonly courses: readonly CourseSample[] = ${ALL_COURSES};

  // La selezione vive qui: il figlio non la modifica da solo.
  selectedId = '';

  visibleCourses: readonly CourseSample[] = [...this.courses];

  emptyCatalog(): void {
    this.visibleCourses = [];
  }

  restoreCatalog(): void {
    this.visibleCourses = [...this.courses];
  }

  onSelectCourse(id: string): void {
    this.selectedId = id;
  }
}`;

const STEP_FOUR_STARTER_HTML = `<section class="catalog" aria-label="Catalogo corsi">
  @for (course of visibleCourses; track course.id) {
    <!-- TODO: passa selected e ascolta l'output selectCourse. -->
    <app-course-card [course]="course" />
  } @empty {
    <p class="empty" role="status">Nessun corso in elenco. Ripristina il catalogo.</p>
  }
</section>

<div class="actions">
  <button
    matButton="outlined"
    type="button"
    [disabled]="visibleCourses.length === 0"
    (click)="emptyCatalog()"
  >
    Svuota catalogo
  </button>
  <button
    matButton="filled"
    type="button"
    (click)="restoreCatalog()"
  >
    Ripristina catalogo
  </button>
</div>

<p class="summary" role="status">
  Corso scelto: {{ selectedId || 'nessuno' }}
</p>`;

const STEP_FOUR_SOLUTION_HTML = `<section class="catalog" aria-label="Catalogo corsi">
  @for (course of visibleCourses; track course.id) {
    <app-course-card
      [course]="course"
      [selected]="course.id === selectedId"
      (selectCourse)="onSelectCourse($event)"
    />
  } @empty {
    <p class="empty" role="status">Nessun corso in elenco. Ripristina il catalogo.</p>
  }
</section>

<div class="actions">
  <button
    matButton="outlined"
    type="button"
    [disabled]="visibleCourses.length === 0"
    (click)="emptyCatalog()"
  >
    Svuota catalogo
  </button>
  <button
    matButton="filled"
    type="button"
    (click)="restoreCatalog()"
  >
    Ripristina catalogo
  </button>
</div>

<p class="summary" role="status">
  Corso scelto: {{ selectedId || 'nessuno' }}
</p>`;

const STEP_FOUR_CHILD_STARTER = `import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

${EXPORTED_COURSE_INTERFACE}

// FIGLIO: mostra un corso e chiede al padre di selezionarlo.
@Component({
  selector: 'app-course-card',
  imports: [MatButtonModule],
  template: \`
    <article class="course">
      <h2>{{ course().title }}</h2>
      <p>{{ course().description }}</p>

      <dl class="course__facts">
        <div>
          <dt>Prezzo</dt>
          <dd>{{ course().price }} USD</dd>
        </div>
        <div>
          <dt>Inizio</dt>
          <dd>{{ course().startDate }}</dd>
        </div>
      </dl>

      <p class="course__tags">{{ course().tags.join(' · ') }}</p>

      @if (course().available) {
        <p class="course__availability">Disponibile</p>
      } @else {
        <p class="course__availability">Non disponibile</p>
      }

      <button
        matButton="outlined"
        type="button"
      >
        Seleziona corso
      </button>
    </article>
  \`,
  styles: [\`
${CHILD_STYLES}  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CourseCard {
  // TODO: aggiungi un input per sapere se il padre ha scelto questo corso.
  readonly course = input.required<CourseSample>();

  // TODO: dichiara un output<string> ed emettilo dal pulsante.
}`;

const STEP_FOUR_CHILD_SOLUTION = `import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

${EXPORTED_COURSE_INTERFACE}

// FIGLIO: riceve corso e stato; l'evento esce verso il padre.
@Component({
  selector: 'app-course-card',
  imports: [MatButtonModule],
  template: \`
    <article
      class="course"
      [class.course--selected]="selected()"
    >
      <h2>{{ course().title }}</h2>
      <p>{{ course().description }}</p>

      <dl class="course__facts">
        <div>
          <dt>Prezzo</dt>
          <dd>{{ course().price }} USD</dd>
        </div>
        <div>
          <dt>Inizio</dt>
          <dd>{{ course().startDate }}</dd>
        </div>
      </dl>

      <p class="course__tags">{{ course().tags.join(' · ') }}</p>

      @if (course().available) {
        <p class="course__availability">Disponibile</p>
      } @else {
        <p class="course__availability">Non disponibile</p>
      }

      <button
        matButton="outlined"
        type="button"
        [attr.aria-pressed]="selected()"
        (click)="selectCourse.emit(course().id)"
      >
        {{ selected() ? 'Corso selezionato' : 'Seleziona corso' }}
      </button>
    </article>
  \`,
  styles: [\`
${CHILD_STYLES}  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CourseCard {
  readonly course = input.required<CourseSample>();

  // Il padre decide se questo corso è quello scelto.
  readonly selected = input(false);

  // output() non è un signal: emit() invia un valore al padre.
  readonly selectCourse = output<string>();
}`;

const STEP_FIVE_STARTER_CHILD = `import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

${EXPORTED_COURSE_INTERFACE}

// FIGLIO: mostra i valori grezzi; le pipe cambiano solo la presentazione.
@Component({
  selector: 'app-course-card',
  imports: [MatButtonModule],
  template: \`
    <article
      class="course"
      [class.course--selected]="selected()"
    >
      <!-- TODO: applica uppercase al titolo. -->
      <h2>{{ course().title }}</h2>
      <p>{{ course().description }}</p>

      <!-- TODO: applica currency al prezzo e date alla data. -->
      <dl class="course__facts">
        <div>
          <dt>Prezzo</dt>
          <dd>{{ course().price }} USD</dd>
        </div>
        <div>
          <dt>Inizio</dt>
          <dd>{{ course().startDate }}</dd>
        </div>
      </dl>

      <!-- TODO: importa TagsPipe e usa la pipe tags con un separatore. -->
      <p class="course__tags">{{ course().tags.join(' · ') }}</p>

      @if (course().available) {
        <p class="course__availability">Disponibile</p>
      } @else {
        <p class="course__availability">Non disponibile</p>
      }

      <button
        matButton="outlined"
        type="button"
        [attr.aria-pressed]="selected()"
        (click)="selectCourse.emit(course().id)"
      >
        {{ selected() ? 'Corso selezionato' : 'Seleziona corso' }}
      </button>
    </article>
  \`,
  styles: [\`
${CHILD_STYLES}  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CourseCard {
  readonly course = input.required<CourseSample>();
  readonly selected = input(false);
  readonly selectCourse = output<string>();
}`;

const STEP_FIVE_SOLUTION_CHILD = `import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TagsPipe } from './tags.pipe';

${EXPORTED_COURSE_INTERFACE}

// FIGLIO: le pipe formattano la vista; corso e selezione restano invariati.
@Component({
  selector: 'app-course-card',
  imports: [MatButtonModule, CurrencyPipe, DatePipe, UpperCasePipe, TagsPipe],
  template: \`
    <article
      class="course"
      [class.course--selected]="selected()"
    >
      <h2>{{ course().title | uppercase }}</h2>
      <p>{{ course().description }}</p>

      <dl class="course__facts">
        <div>
          <dt>Prezzo</dt>
          <!-- La valuta è un'etichetta: il numero non viene convertito. -->
          <dd>{{ course().price | currency:'USD':'symbol':'1.0-2':'en-US' }}</dd>
        </div>
        <div>
          <dt>Inizio</dt>
          <!-- UTC rende il risultato indipendente dal fuso del computer. -->
          <dd>{{ course().startDate | date:'dd/MM/yyyy':'UTC':'en-US' }}</dd>
        </div>
      </dl>

      <p class="course__tags">{{ course().tags | tags:' / ' }}</p>

      @if (course().available) {
        <p class="course__availability">Disponibile</p>
      } @else {
        <p class="course__availability">Non disponibile</p>
      }

      <button
        matButton="outlined"
        type="button"
        [attr.aria-pressed]="selected()"
        (click)="selectCourse.emit(course().id)"
      >
        {{ selected() ? 'Corso selezionato' : 'Seleziona corso' }}
      </button>
    </article>
  \`,
  styles: [\`
${CHILD_STYLES}  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CourseCard {
  readonly course = input.required<CourseSample>();
  readonly selected = input(false);
  readonly selectCourse = output<string>();
}`;

const STEP_FIVE_STARTER_TAGS_PIPE = `import { Pipe, PipeTransform } from '@angular/core';

// Una pipe pura trasforma solo la vista, senza modificare l'array.
@Pipe({ name: 'tags', pure: true })
export class TagsPipe implements PipeTransform {
  transform(tags: readonly string[]): string {
    // TODO: aggiungi un parametro per il separatore e usalo nel template.
    return tags.join(' · ');
  }
}`;

const STEP_FIVE_SOLUTION_TAGS_PIPE = `import { Pipe, PipeTransform } from '@angular/core';

// Una pipe pura trasforma solo la vista, senza modificare l'array.
@Pipe({ name: 'tags', pure: true })
export class TagsPipe implements PipeTransform {
  transform(tags: readonly string[], separator = ' · '): string {
    // Il separatore arriva dal template: {{ tags | tags:' / ' }}.
    return tags.join(separator);
  }
}`;

export const COURSE_EXERCISE_STEPS: readonly CourseExerciseStep[] = [
  {
    id: 'card',
    label: '1. Scheda',
    title: 'Una scheda corso con interpolazione',
    objective:
      'Mostra i dati di un corso con `{{ }}`: titolo, descrizione, prezzo, data, etichette e disponibilità.',
    requirements: [
      'Usa la proprietà `course` con `id`, `title`, `description`, `price`, `startDate`, `tags` e `available`.',
      'Mostra ogni valore nel template con l’interpolazione.',
      'Unisci le etichette con `course.tags.join(\' · \')` e traduci `available` in testo leggibile.',
    ],
    hints: [
      'Sostituisci un testo fisso alla volta con `{{ course.nomeCampo }}` e osserva la preview.',
      'Per le etichette, `course.tags` è un array: `join` produce una sola stringa.',
      'Per la disponibilità usa `course.available ? \'Disponibile\' : \'Non disponibile\'`.',
    ],
    checks: [
      'La scheda mostra titolo, descrizione, prezzo, data, etichette e disponibilità.',
      'I valori arrivano dalla proprietà `course`, non da testi copiati.',
      'La preview si aggiorna e il TypeScript non mostra problemi.',
    ],
    starter: {
      typescript: STEP_ONE_TYPESCRIPT,
      html: STEP_ONE_STARTER_HTML,
      css: CARD_STYLES,
    },
    solution: {
      typescript: STEP_ONE_TYPESCRIPT,
      html: STEP_ONE_SOLUTION_HTML,
      css: CARD_STYLES,
    },
  },
  {
    id: 'interaction',
    label: '2. Interazione',
    title: 'Seleziona la scheda con binding ed evento',
    objective:
      'Collega lo stato `selected` alla classe della scheda, a un attributo ARIA e a un clic che lo inverte.',
    requirements: [
      'Un clic sul pulsante deve selezionare e deselezionare la scheda.',
      'Applica `[class.course--selected]="selected"` all’articolo.',
      'Applica `[attr.aria-pressed]="selected"` al pulsante e aggiorna il testo.',
    ],
    hints: [
      'Il metodo `select()` deve assegnare `!this.selected`, non sempre `true`.',
      'Il class binding cambia l’aspetto; l’attribute binding ARIA comunica lo stato a chi usa un lettore di schermo.',
      'Controlla il testo del pulsante: deve descrivere l’azione successiva.',
    ],
    checks: [
      'Il primo clic evidenzia la scheda; il secondo la riporta allo stato iniziale.',
      'Il pulsante espone `aria-pressed` coerente con lo stato visibile.',
      'Il testo del pulsante cambia tra seleziona e deseleziona.',
    ],
    starter: {
      typescript: STEP_TWO_TYPESCRIPT_STARTER,
      html: STEP_TWO_STARTER_HTML,
      css: CARD_STYLES,
    },
    solution: {
      typescript: STEP_TWO_TYPESCRIPT_SOLUTION,
      html: STEP_TWO_SOLUTION_HTML,
      css: CARD_STYLES,
    },
  },
  {
    id: 'list',
    label: '3. Elenco',
    title: 'Elenca i corsi con @for, @if e @empty',
    objective:
      'Ripeti le schede con `@for`, traccia gli id stabili, distingui la disponibilità con `@if` e gestisci l’elenco vuoto con `@empty`.',
    requirements: [
      'Ripeti i corsi con `@for (course of visibleCourses; track course.id)`.',
      'Mostra disponibilità o assenza con `@if` e `@else` dentro ogni scheda.',
      'Aggiungi un blocco `@empty` con un messaggio e un invito a ripristinare.',
      'Mantieni i pulsanti Material «Svuota catalogo» e «Ripristina catalogo».',
    ],
    hints: [
      '`track course.id` è più stabile di `$index`: l’identità del corso non cambia quando l’elenco cambia.',
      '`@empty` va dopo la chiusura del blocco `@for`, non dentro.',
      'Svuota l’elenco e controlla che il messaggio compaia prima di ripristinare.',
    ],
    checks: [
      'Tutti i campioni compaiono nell’elenco e la disponibilità è distinta.',
      'Svuotando il catalogo compare il messaggio `@empty`.',
      '«Svuota catalogo» è disabilitato con l’elenco vuoto; «Ripristina catalogo» riporta tutti i corsi.',
    ],
    starter: {
      typescript: STEP_THREE_TYPESCRIPT,
      html: STEP_THREE_STARTER_HTML,
      css: LIST_STYLES,
    },
    solution: {
      typescript: STEP_THREE_TYPESCRIPT,
      html: STEP_THREE_SOLUTION_HTML,
      css: LIST_STYLES,
    },
  },
  {
    id: 'child',
    label: '4. Componente figlio',
    title: 'Estrai CourseCard con input() e output()',
    objective:
      'Sposta la scheda in `course-card.component.ts`. Il figlio riceve corso e stato con `input()`, emette l’id con `output()`; il padre conserva la selezione.',
    requirements: [
      '`CourseCard` contiene il template breve e gli stili della scheda.',
      'Il figlio dichiara `course` e `selected` con `input()` e `selectCourse` con `output<string>()`.',
      'Il pulsante del figlio emette `course().id`; non modifica `selectedId`.',
      'Il padre ascolta `(selectCourse)` e aggiorna il proprio `selectedId`.',
    ],
    hints: [
      '`input.required<CourseSample>()` legge il corso con `course()`.',
      '`output<string>()` si ascolta nel padre con `(selectCourse)="onSelectCourse($event)"`.',
      'Lo stato selezionato resta nel padre: il figlio riceve solo il booleano `selected`.',
    ],
    checks: [
      'La scheda è nel file `course-card.component.ts` e il padre la importa.',
      'Il figlio non assegna `selectedId` e non conosce l’elenco completo.',
      'Cliccando una scheda, il riepilogo del padre mostra l’id scelto.',
    ],
    starter: {
      typescript: STEP_FOUR_PARENT_TYPESCRIPT,
      html: STEP_FOUR_STARTER_HTML,
      css: PARENT_STYLES,
      files: {
        'course-card.component.ts': STEP_FOUR_CHILD_STARTER,
      },
    },
    solution: {
      typescript: STEP_FOUR_PARENT_TYPESCRIPT,
      html: STEP_FOUR_SOLUTION_HTML,
      css: PARENT_STYLES,
      files: {
        'course-card.component.ts': STEP_FOUR_CHILD_SOLUTION,
      },
    },
  },
  {
    id: 'pipes',
    label: '5. Pipes',
    title: 'Formatta prezzo, data e titolo; aggiungi TagsPipe',
    objective:
      'Applica `currency`, `date` e `uppercase` nella scheda e usa una pipe personalizzata nel proprio file per unire le etichette.',
    requirements: [
      'Applica `currency` al prezzo con valuta `USD`: è solo formattazione, non conversione.',
      'Applica `date` alla data ISO con fuso `UTC`, formato leggibile e locale `en-US`.',
      'Applica `uppercase` al titolo.',
      'Usa la pipe personalizzata `tags` dal file `tags.pipe.ts` con un separatore.',
    ],
    hints: [
      '`currency:\'USD\'` mostra il simbolo del dollaro: non cambia il numero salvato.',
      '`date:\'dd/MM/yyyy\':\'UTC\':\'en-US\'` mantiene il risultato stabile rispetto al fuso locale.',
      'La pipe `tags` va importata in `imports` del componente che la usa.',
    ],
    checks: [
      'Prezzo e data sono formattati, mentre i valori di origine restano gli stessi.',
      'Il titolo è in maiuscolo solo nella vista.',
      'La pipe `tags` vive in `tags.pipe.ts` e accetta il separatore dal template.',
    ],
    starter: {
      typescript: STEP_FOUR_PARENT_TYPESCRIPT,
      html: STEP_FOUR_SOLUTION_HTML,
      css: PARENT_STYLES,
      files: {
        'course-card.component.ts': STEP_FIVE_STARTER_CHILD,
        'tags.pipe.ts': STEP_FIVE_STARTER_TAGS_PIPE,
      },
    },
    solution: {
      typescript: STEP_FOUR_PARENT_TYPESCRIPT,
      html: STEP_FOUR_SOLUTION_HTML,
      css: PARENT_STYLES,
      files: {
        'course-card.component.ts': STEP_FIVE_SOLUTION_CHILD,
        'tags.pipe.ts': STEP_FIVE_SOLUTION_TAGS_PIPE,
      },
    },
  },
];
