import type { PlaygroundSources } from '../components/angular-playground/playground.types';

// Reuse the service and consumer source; only provider placement changes.
const COUNTER_SERVICE = `import { Injectable, signal } from '@angular/core';

// Il servizio conserva stato e regole; il provider decide chi condivide l'istanza.
@Injectable()
export class CounterService {
  private readonly currentCount = signal(0);

  // Le viste ricevono una lettura pubblica, non il signal modificabile.
  readonly count = this.currentCount.asReadonly();

  increment(): void {
    this.currentCount.update(value => value + 1);
  }

  reset(): void {
    this.currentCount.set(0);
  }
}`;

const COUNTER_VIEW = `import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CounterService } from './counter.service';

// FIGLIO: inject chiede il servizio al provider più vicino nel suo albero.
@Component({
  selector: 'app-counter-view',
  imports: [MatButtonModule],
  template: \`
    <section class="counter" [attr.aria-label]="label()">
      <h3 class="counter__label">{{ label() }}</h3>
      <p>Conteggio: <strong class="counter__value">{{ counter.count() }}</strong></p>

      <div class="counter__actions">
        <button
          matButton="filled"
          type="button"
          [attr.aria-label]="'Aumenta ' + label()"
          (click)="counter.increment()"
        >
          Aumenta
        </button>

        <button
          matButton="outlined"
          type="button"
          [attr.aria-label]="'Azzera ' + label()"
          (click)="counter.reset()"
        >
          Azzera
        </button>
      </div>
    </section>
  \`,
  styles: [\`
    .counter {
      display: grid;
      gap: 0.75rem;
      min-width: 0;
      padding: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface-container-low);
      color: var(--mat-sys-on-surface);
    }

    .counter h3,
    .counter p {
      margin: 0;
    }

    .counter__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class CounterView {
  readonly label = input.required<string>();
  readonly counter = inject(CounterService);
}`;

export const SHARED_SERVICE_EXAMPLE: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CounterView } from './counter-view.component';
import { CounterService } from './counter.service';

// PADRE: un solo provider per sé e per le due viste discendenti.
// Non è un servizio root: il provider vive con questo componente del playground.
@Component({
  selector: 'app-shared-service-demo',
  imports: [CounterView],
  providers: [CounterService],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class SharedServiceDemo {}`,
  files: {
    'counter.service.ts': COUNTER_SERVICE,
    'counter-view.component.ts': COUNTER_VIEW,
  },
  html: `<section class="shared">
  <p class="note">
    Il provider è sul padre: entrambe le viste ricevono lo stesso oggetto.
  </p>

  <div class="counters">
    <app-counter-view label="Condivisa A" />
    <app-counter-view label="Condivisa B" />
  </div>
</section>`,
  css: `.shared {
  display: grid;
  gap: 1rem;
}

.counters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1rem;
}

.note {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
}`,
};

export const SCOPED_SERVICE_EXAMPLE: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CounterView } from './counter-view.component';
import { CounterService } from './counter.service';
import { IsolatedCounter } from './isolated-counter.component';

// PADRE: le viste condivise ereditano questo provider.
@Component({
  selector: 'app-scoped-service-demo',
  imports: [CounterView, IsolatedCounter, MatButtonModule],
  providers: [CounterService],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ScopedServiceDemo {
  // Il signal decide se il sottoalbero isolato esiste.
  readonly isolatedVisible = signal(true);
}`,
  files: {
    'counter.service.ts': COUNTER_SERVICE,
    'counter-view.component.ts': COUNTER_VIEW,
    'isolated-counter.component.ts': `import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CounterService } from './counter.service';
import { CounterView } from './counter-view.component';

// Questo provider è più vicino di quello del padre: apre un nuovo scope.
@Component({
  selector: 'app-isolated-counter',
  imports: [CounterView],
  providers: [CounterService],
  template: \`
    <app-counter-view [label]="label()" />
  \`,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class IsolatedCounter {
  readonly label = input.required<string>();
}`,
  },
  html: `<section class="scoped">
  <p class="note">
    Le viste condivise ereditano il provider del padre.
    Ogni riquadro isolato dichiara un provider più vicino.
  </p>

  <div class="counters">
    <app-counter-view label="Condivisa A" />
    <app-counter-view label="Condivisa B" />
  </div>

  <div class="toolbar">
    <button
      matButton="tonal"
      type="button"
      aria-controls="isolated-counters"
      [attr.aria-expanded]="isolatedVisible()"
      (click)="isolatedVisible.set(!isolatedVisible())"
    >
      {{ isolatedVisible() ? 'Rimuovi gli isolati' : 'Ricrea gli isolati' }}
    </button>
  </div>

  @if (isolatedVisible()) {
    <div id="isolated-counters" class="counters">
      <app-isolated-counter label="Isolata A" />
      <app-isolated-counter label="Isolata B" />
    </div>
  } @else {
    <p id="isolated-counters" class="note" role="status">
      Coppia isolata rimossa: alla ricreazione riparte da zero.
    </p>
  }
</section>`,
  css: `.scoped {
  display: grid;
  gap: 1rem;
}

.counters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.note {
  margin: 0;
  color: var(--mat-sys-on-surface-variant);
}`,
};
