import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { COLD_DIAGRAM, INTERVAL_DIAGRAM, PIPELINE_DIAGRAM } from './rxjs-diagrams';

const COLD_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Observable } from 'rxjs';

// La sequenza è breve e sincrona: non ci sono timer né animazioni.
const NUMBERS = [1, 2, 3];

@Component({
  selector: 'app-cold-observable',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ColdObservableDemo {
  // Stato solo per la vista: conta le esecuzioni reali del produttore.
  readonly runs = signal(0);
  readonly valuesA = signal<number[]>([]);
  readonly valuesB = signal<number[]>([]);
  readonly statusA = signal('Nessuna sottoscrizione');
  readonly statusB = signal('Nessuna sottoscrizione');

  // Observable "freddo": il corpo qui sotto parte a ogni subscribe.
  private readonly numbers$ = new Observable<number>(subscriber => {
    // Questa scrittura dimostra che il produttore è stato eseguito davvero.
    this.runs.update(count => count + 1);

    for (const number of NUMBERS) {
      // next consegna un valore all'osservatore di questa sottoscrizione.
      subscriber.next(number);
    }

    // complete chiude il flusso: non è un valore e non entra nella lista.
    subscriber.complete();
  });

  subscribeA(): void {
    // Ogni click crea una nuova sottoscrizione, quindi una nuova esecuzione.
    this.valuesA.set([]);
    this.statusA.set('In esecuzione');

    this.numbers$.subscribe({
      next: value => this.valuesA.update(values => [...values, value]),
      complete: () => this.statusA.set('Completato: ' + this.valuesA().length + ' valori ricevuti'),
    });
  }

  subscribeB(): void {
    // L'osservatore B ha una sottoscrizione separata e una propria esecuzione.
    this.valuesB.set([]);
    this.statusB.set('In esecuzione');

    this.numbers$.subscribe({
      next: value => this.valuesB.update(values => [...values, value]),
      complete: () => this.statusB.set('Completato: ' + this.valuesB().length + ' valori ricevuti'),
    });
  }
}`,
  html: `<section class="cold">
  <!-- Il testo chiarisce che la sequenza è sincrona: non aspettare un'animazione. -->
  <p class="cold__hint">
    La sorgente emette <code>1, 2, 3</code> subito, in modo sincrono, poi chiama <code>complete</code>.
  </p>

  <!-- Il conteggio viene scritto dal produttore, non dal template. -->
  <p class="cold__runs" aria-live="polite">
    Esecuzioni reali del produttore: <strong>{{ runs() }}</strong>
  </p>

  <div class="cold__grid">
    <!-- Ogni osservatore mostra solo i valori della propria sottoscrizione. -->
    <article class="cold__observer cold__observer--a" aria-label="Osservatore A">
      <h2 class="cold__title">Osservatore A</h2>

      <p class="cold__values" aria-live="polite">
        @for (value of valuesA(); track $index) {
          <span class="cold__value">{{ value }}</span>
        } @empty {
          <span class="cold__empty">Nessun valore</span>
        }
      </p>

      <p class="cold__status" role="status">{{ statusA() }}</p>

      <!-- Il click chiama subscribeA: è l'unico punto che avvia questa esecuzione. -->
      <button
        matButton="filled"
        type="button"
        class="cold__button"
        aria-label="Iscriviti osservatore A"
        (click)="subscribeA()"
      >Iscriviti A</button>
    </article>

    <article class="cold__observer cold__observer--b" aria-label="Osservatore B">
      <h2 class="cold__title">Osservatore B</h2>

      <p class="cold__values" aria-live="polite">
        @for (value of valuesB(); track $index) {
          <span class="cold__value">{{ value }}</span>
        } @empty {
          <span class="cold__empty">Nessun valore</span>
        }
      </p>

      <p class="cold__status" role="status">{{ statusB() }}</p>

      <!-- Una seconda sottoscrizione non riusa i valori dell'osservatore A. -->
      <button
        matButton="outlined"
        type="button"
        class="cold__button"
        aria-label="Iscriviti osservatore B"
        (click)="subscribeB()"
      >Iscriviti B</button>
    </article>
  </div>
</section>`,
  css: `/* I token --mat-sys-* seguono il tema Material: niente colori fissi. */
.cold {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.cold__hint,
.cold__runs {
  margin: 0;
  overflow-wrap: anywhere;
}

.cold__runs {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-tertiary-container);
  color: var(--mat-sys-on-tertiary-container);
  font: var(--mat-sys-title-small);
}

.cold__grid {
  display: grid;
  /* auto-fit crea quante colonne entrano nello spazio; min(100%, 14rem) evita lo sbordamento. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 0.75rem;
}

.cold__observer {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
}

/* I due osservatori usano coppie di token diverse per distinguere le sottoscrizioni. */
.cold__observer--a {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.cold__observer--b {
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}

.cold__title {
  margin: 0;
  font: var(--mat-sys-title-medium);
  overflow-wrap: anywhere;
}

.cold__values {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  min-height: 2rem;
  margin: 0;
}

.cold__value {
  padding: 0.125rem 0.5rem;
  border-radius: var(--mat-sys-corner-full);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-label-large);
}

.cold__empty {
  font: var(--mat-sys-body-small);
}

.cold__status {
  margin: 0;
  font: var(--mat-sys-body-small);
  overflow-wrap: anywhere;
}

.cold__button {
  justify-self: start;
}`,
};

const PIPELINE_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { filter, map, of } from 'rxjs';

// Valori di ingresso della pipeline: sono gli stessi mostrati nella preview.
const INPUTS = [1, 2, 3, 4, 5, 6];

@Component({
  selector: 'app-operator-pipeline',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class OperatorPipeline {
  readonly inputs = INPUTS.join(', ');
  readonly outputs = signal<number[]>([]);
  readonly status = signal('Nessuna esecuzione');

  // La pipeline è una sola: filter e map lavorano sui valori reali di of.
  private readonly pipeline$ = of(...INPUTS).pipe(
    // filter lascia passare solo i numeri pari.
    filter(value => value % 2 === 0),
    // map trasforma ogni valore che ha superato il filtro.
    map(value => value * 10),
  );

  run(): void {
    this.outputs.set([]);
    this.status.set('In esecuzione');

    // subscribe avvia of e raccoglie solo i valori usciti dagli operatori.
    this.pipeline$.subscribe({
      next: value => this.outputs.update(values => [...values, value]),
      complete: () => this.status.set('Completato: ' + this.outputs().length + ' valori trasformati'),
    });
  }

  reset(): void {
    // Azzera solo il risultato mostrato: la stessa pipeline verrà sottoscritta di nuovo.
    this.outputs.set([]);
    this.status.set('Nessuna esecuzione');
  }
}`,
  html: `<section class="operators">
  <p class="operators__hint">
    <code>of(...)</code> fornisce tutti i valori; <code>filter</code> scarta, <code>map</code> trasforma.
    La lista qui sotto contiene solo ciò che esce davvero dalla pipeline.
  </p>

  <div class="operators__config">
    <!-- Gli ingressi sono la configurazione reale della pipeline, non un risultato filtrato. -->
    <p class="operators__card operators__card--inputs">
      <span class="operators__label">Ingressi</span>
      <code class="operators__text">{{ inputs }}</code>
    </p>

    <p class="operators__card operators__card--steps">
      <span class="operators__label">Operatori</span>
      <code class="operators__text">filter(pari) → map(×10)</code>
    </p>
  </div>

  <div class="operators__output" aria-label="Valori emessi">
    <span class="operators__label">Valori emessi</span>

    <!-- I chip mostrano l'ultima esecuzione, non i valori di ingresso. -->
    <p class="operators__values" aria-live="polite">
      @for (value of outputs(); track $index) {
        <span class="operators__value">{{ value }}</span>
      } @empty {
        <span class="operators__empty">Nessun valore: esegui la pipeline</span>
      }
    </p>
  </div>

  <p class="operators__status" role="status">{{ status() }}</p>

  <div class="operators__actions">
    <!-- Esegui chiama subscribe: la pipeline non parte da sola. -->
    <button
      matButton="filled"
      type="button"
      (click)="run()"
    >Esegui pipeline</button>

    <!-- Azzera rimuove il risultato mostrato, senza modificare la pipeline. -->
    <button
      matButton="text"
      type="button"
      (click)="reset()"
    >Azzera</button>
  </div>
</section>`,
  css: `/* Superfici e colori arrivano dai token del tema Material attivo. */
.operators {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.operators__hint,
.operators__status {
  margin: 0;
  overflow-wrap: anywhere;
}

.operators__config {
  display: grid;
  /* Le due schede si affiancano solo quando c'è spazio sufficiente. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 0.75rem;
}

.operators__card {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
  margin: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
}

.operators__card--inputs {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.operators__card--steps {
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}

.operators__label {
  font: var(--mat-sys-label-large);
}

.operators__text {
  font: var(--mat-sys-body-medium);
  overflow-wrap: anywhere;
}

.operators__output {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-tertiary-container);
  color: var(--mat-sys-on-tertiary-container);
}

.operators__values {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  min-height: 2rem;
  margin: 0;
}

.operators__value {
  padding: 0.125rem 0.5rem;
  border-radius: var(--mat-sys-corner-full);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-label-large);
}

.operators__empty {
  font: var(--mat-sys-body-small);
}

.operators__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-medium);
}

.operators__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
};

const INTERVAL_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, finalize, interval, map, take } from 'rxjs';

const INTERVAL_MS = 1000;
const MAX_TICKS = 4;
const MAX_HISTORY = 3;

@Component({
  selector: 'app-interval-lifecycle',
  imports: [MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class IntervalLifecycle {
  // DestroyRef collega la sottoscrizione alla vita della preview.
  private readonly destroyRef = inject(DestroyRef);
  private subscription?: Subscription;

  // La cronologia è limitata: conserva solo gli ultimi MAX_HISTORY valori.
  readonly ticks = signal<number[]>([]);
  readonly status = signal('Pronto: nessun timer attivo');
  readonly active = signal(false);
  readonly completes = signal(0);
  readonly cleanups = signal(0);

  // I valori sono letti dal template, così le etichette seguono il codice.
  readonly intervalMs = INTERVAL_MS;
  readonly maxTicks = MAX_TICKS;
  readonly maxHistory = MAX_HISTORY;

  start(): void {
    // Una sola sottoscrizione attiva: nessun timer parte al caricamento.
    if (this.subscription) return;

    this.ticks.set([]);
    this.completes.set(0);
    this.cleanups.set(0);
    this.active.set(true);
    this.status.set('Sottoscrizione attiva: un valore ogni ' + (INTERVAL_MS / 1000) + ' s');

    this.subscription = interval(INTERVAL_MS).pipe(
      // map trasforma il contatore dell'intervallo in un numero leggibile.
      map(index => index + 1),
      // take chiude il flusso dopo un numero finito di valori.
      take(MAX_TICKS),
      // Alla distruzione della preview la sottoscrizione si chiude da sola.
      takeUntilDestroyed(this.destroyRef),
      // finalize gira sia dopo complete sia dopo unsubscribe.
      finalize(() => {
        this.cleanups.update(count => count + 1);
        this.active.set(false);
        this.subscription = undefined;
      }),
    ).subscribe({
      next: value => this.ticks.update(values => [...values, value].slice(-MAX_HISTORY)),
      complete: () => {
        this.completes.update(count => count + 1);
        this.status.set('Completato: take(' + MAX_TICKS + ') ha chiuso il flusso');
      },
    });
  }

  stop(): void {
    if (!this.subscription) return;

    // unsubscribe annulla il timer senza chiamare complete.
    this.subscription.unsubscribe();
    this.status.set('Fermato: nessun complete, timer annullato');
  }

  reset(): void {
    // La pulizia avviene prima di azzerare la vista: nessun valore resta in coda.
    this.subscription?.unsubscribe();
    this.ticks.set([]);
    this.completes.set(0);
    this.cleanups.set(0);
    this.status.set('Pronto: nessun timer attivo');
  }
}`,
  html: `<section class="interval">
  <p class="interval__hint">
    Il flusso parte solo con <strong>Avvia</strong>: <code>interval({{ intervalMs }})</code> emette ogni
    {{ intervalMs / 1000 }} s. <code>take({{ maxTicks }})</code> chiude il flusso dopo {{ maxTicks }} valori.
  </p>

  <!-- La cronologia è limitata: l'etichetta dice quanti valori restano. -->
  <div class="interval__history" aria-label="Cronologia recente">
    <span class="interval__label">Ultimi {{ maxHistory }} valori</span>

    <p class="interval__values">
      @for (value of ticks(); track $index) {
        <span class="interval__value">{{ value }}</span>
      } @empty {
        <span class="interval__empty">Nessun valore</span>
      }
    </p>
  </div>

  <p class="interval__status" role="status">{{ status() }}</p>

  <!-- complete e finalize sono contatori reali delle notifiche ricevute. -->
  <p class="interval__counters">
    <span class="interval__counter" aria-label="Complete ricevuti">complete {{ completes() }}</span>
    <span class="interval__counter" aria-label="Pulizie finalize">finalize {{ cleanups() }}</span>
  </p>

  <div class="interval__actions">
    <!-- Avvia è l'unico punto che crea la sottoscrizione al timer. -->
    <button
      matButton="filled"
      type="button"
      [disabled]="active()"
      (click)="start()"
    >Avvia intervallo</button>

    <!-- Ferma annulla la sottoscrizione senza produrre un complete. -->
    <button
      matButton="outlined"
      type="button"
      [disabled]="!active()"
      (click)="stop()"
    >Ferma intervallo</button>

    <!-- Azzera ferma un eventuale timer e riporta la vista allo stato iniziale. -->
    <button
      matButton="text"
      type="button"
      (click)="reset()"
    >Azzera</button>
  </div>
</section>`,
  css: `/* Le coppie surface/on-surface e container/on-container mantengono il contrasto. */
.interval {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.interval__hint,
.interval__status {
  margin: 0;
  overflow-wrap: anywhere;
}

.interval__history {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}

.interval__label {
  font: var(--mat-sys-label-large);
}

.interval__values {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  min-height: 2rem;
  margin: 0;
}

.interval__value {
  padding: 0.125rem 0.5rem;
  border-radius: var(--mat-sys-corner-full);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-label-large);
}

.interval__empty {
  font: var(--mat-sys-body-small);
}

.interval__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
  font: var(--mat-sys-body-medium);
}

.interval__counters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
}

.interval__counter {
  padding: 0.25rem 0.5rem;
  border-radius: var(--mat-sys-corner-full);
  background: var(--mat-sys-surface-container-high);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-label-medium);
}

.interval__actions {
  /* I tre pulsanti vanno a capo invece di comprimersi su schermi stretti. */
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}`,
};

/** Three independent runnable examples; each keeps its own preview state. */
export const RXJS_EXAMPLES: readonly LessonExample[] = [
  {
    id: 'cold-observable',
    label: '1. Observable freddo',
    title: 'Due osservatori, due esecuzioni',
    prompt:
      'Premi **Iscriviti A** e poi **Iscriviti B**: ogni click avvia una nuova esecuzione del produttore e riempie solo la lista dell’osservatore scelto. Prima della sottoscrizione non arriva nulla.',
    takeaway:
      'Un Observable freddo esegue il suo corpo a ogni `subscribe`. Ogni osservatore riceve la sequenza della propria sottoscrizione e il conteggio mostra quante esecuzioni reali sono partite.',
    sources: COLD_SOURCES,
    diagram: COLD_DIAGRAM,
  },
  {
    id: 'operators',
    label: '2. Operatori',
    title: 'filter, map e valori reali',
    prompt:
      'Premi **Esegui pipeline**: `filter` lascia passare i pari e `map` li moltiplica per 10. Poi cambia il predicato nel codice e riesegui: la preview mostra solo le uscite della pipeline modificata.',
    takeaway:
      '`of(...valori)` crea il flusso; `filter` e `map` restituiscono un nuovo Observable. Niente viene trasformato finché `subscribe` non avvia la pipeline, e l’output contiene solo i valori realmente emessi.',
    sources: PIPELINE_SOURCES,
    diagram: PIPELINE_DIAGRAM,
  },
  {
    id: 'interval',
    label: '3. Intervallo e pulizia',
    title: 'Avvio esplicito, limite e sottoscrizione',
    prompt:
      'Premi **Avvia intervallo** e osserva la cronologia crescere. Dopo `take(4)` il flusso si completa da solo. Avvia di nuovo e premi **Ferma intervallo**: il timer si annulla senza `complete`. **Azzera** riporta tutto allo stato iniziale.',
    takeaway:
      '`interval` parte solo con la sottoscrizione. `unsubscribe` annulla il timer senza `complete`; `take(n)` produce un `complete` reale. `takeUntilDestroyed` e `finalize` chiudono e puliscono quando la preview viene distrutta.',
    sources: INTERVAL_SOURCES,
    diagram: INTERVAL_DIAGRAM,
  },
];
