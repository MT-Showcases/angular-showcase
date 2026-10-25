import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { COMPARE_DIAGRAM, COUNTER_DIAGRAM, PROFILE_DIAGRAM } from './behavior-diagrams';

// FIGLIO: riceve un Observable già pronto e lo legge con AsyncPipe.
const OBSERVER_COMPONENT = `import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Observable } from 'rxjs';

// La vista non conosce la sorgente: mostra solo ciò che riceve.
@Component({
  selector: 'app-observer',
  imports: [AsyncPipe],
  template: \`
    <article class="observer" [attr.aria-label]="label()">
      <h3 class="observer__label">{{ label() }}</h3>

      <!-- L'AsyncPipe crea la sottoscrizione e la chiude quando il figlio viene distrutto. -->
      @let value = stream() | async;

      <p class="observer__value" aria-live="polite">
        @if (value === null) {
          <span class="observer__none">Nessuna emissione</span>
        } @else if (value === '') {
          <span class="observer__empty">«vuoto»</span>
        } @else {
          {{ value }}
        }
      </p>
    </article>
  \`,
  styles: [\`
    /* Superficie neutra: il contenitore del padre identifica il ruolo del pannello. */
    .observer {
      display: grid;
      gap: 0.25rem;
      min-width: 0;
      padding: 0.75rem;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }

    .observer__label,
    .observer__value {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .observer__label {
      font: var(--mat-sys-label-large);
    }

    .observer__value {
      font: var(--mat-sys-body-medium);
    }

    /* Testo attenuato: distingue l'assenza di emissioni da una stringa vuota. */
    .observer__none,
    .observer__empty {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ObserverComponent {
  readonly label = input.required<string>();
  readonly stream = input.required<Observable<string>>();
}`;

export const COMPARE_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject, Subject } from 'rxjs';
import { ObserverComponent } from './observer.component';

// Il BehaviorSubject richiede un valore iniziale: esiste prima di ogni invio.
const INITIAL_MESSAGE = 'Benvenuto!';

@Component({
  selector: 'app-subject-compare',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, ObserverComponent],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class SubjectCompareDemo {
  // Le sorgenti restano private: il template non può chiamare next per errore.
  private readonly message = new Subject<string>();
  private readonly currentMessage = new BehaviorSubject<string>(INITIAL_MESSAGE);

  // asObservable() espone una lettura stabile, senza next e senza .value.
  readonly messages$ = this.message.asObservable();
  readonly currentMessage$ = this.currentMessage.asObservable();

  readonly draft = signal('');
  readonly lateVisible = signal(false);

  send(): void {
    // Il trim evita spazi accidentali; un testo vuoto non produce emissioni.
    const text = this.draft().trim();
    if (!text) return;

    // next consegna il testo a chi è sottoscritto in questo momento.
    this.message.next(text);
    this.currentMessage.next(text);
    this.draft.set('');
  }

  sendEmpty(): void {
    // La stringa vuota è un valore reale: la vista la distingue da "nessuna emissione".
    this.message.next('');
    this.currentMessage.next('');
    this.draft.set('');
  }

  reset(): void {
    // Il BehaviorSubject torna al valore iniziale; il Subject non ha un valore da ripristinare.
    this.currentMessage.next(INITIAL_MESSAGE);
    this.draft.set('');
  }

  toggleLate(): void {
    // Smontare il figlio chiude l'AsyncPipe; rimontarlo crea una nuova sottoscrizione.
    this.lateVisible.update(visible => !visible);
  }
}`,
  files: {
    'observer.component.ts': OBSERVER_COMPONENT,
  },
  html: `<section class="compare">
  <p class="compare__hint">
    Invia un testo: <strong>Subject</strong> lo consegna solo a chi è già collegato.
    <strong>BehaviorSubject</strong> conserva il valore corrente e lo ripete a ogni nuovo collegamento.
  </p>

  <div class="compare__composer">
    <mat-form-field appearance="outline" class="compare__field">
      <mat-label>Testo da inviare</mat-label>

      <!-- (input) aggiorna solo la bozza locale: l'emissione parte con Invia. -->
      <input
        matInput
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
      />
    </mat-form-field>

    <div class="compare__actions">
      <!-- Invia è l'unico punto che chiama next su entrambe le sorgenti. -->
      <button
        matButton="filled"
        type="button"
        aria-label="Invia a Subject e BehaviorSubject"
        (click)="send()"
      >
        Invia
      </button>

      <!-- Serve a vedere una stringa vuota come valore, non come assenza di emissione. -->
      <button
        matButton="outlined"
        type="button"
        aria-label="Invia stringa vuota"
        (click)="sendEmpty()"
      >
        Invia vuoto
      </button>

      <button
        matButton="text"
        type="button"
        aria-label="Ripristina il valore iniziale"
        (click)="reset()"
      >
        Reset
      </button>

      <!-- Il toggle monta o smonta i due consumatori B tramite @if. -->
      <button
        matButton="tonal"
        type="button"
        aria-label="Mostra o nascondi il consumatore tardivo B"
        [attr.aria-pressed]="lateVisible()"
        (click)="toggleLate()"
      >
        {{ lateVisible() ? 'Nascondi vista tardiva' : 'Mostra vista tardiva' }}
      </button>
    </div>
  </div>

  <div class="compare__panels">
    <section class="compare__panel compare__panel--subject" aria-label="Sorgente Subject">
      <header class="compare__header">
        <h2 class="compare__title">Subject</h2>

        <!-- Nessun valore iniziale: la prima emissione arriva solo con Invia. -->
        <p class="compare__note">Nessun valore iniziale: chi si collega dopo non riceve nulla.</p>
      </header>

      <div class="compare__observers">
        <app-observer
          label="A · sempre attivo"
          [stream]="messages$"
        />

        @if (lateVisible()) {
          <app-observer
            label="B · tardivo"
            [stream]="messages$"
          />
        }
      </div>
    </section>

    <section class="compare__panel compare__panel--behavior" aria-label="Sorgente BehaviorSubject">
      <header class="compare__header">
        <h2 class="compare__title">BehaviorSubject</h2>

        <p class="compare__note">Valore iniziale «Benvenuto!»: il nuovo collegamento lo riceve subito.</p>
      </header>

      <div class="compare__observers">
        <app-observer
          label="A · sempre attivo"
          [stream]="currentMessage$"
        />

        @if (lateVisible()) {
          <app-observer
            label="B · tardivo"
            [stream]="currentMessage$"
          />
        }
      </div>
    </section>
  </div>
</section>`,
  css: `/* I token Material mantengono il contrasto nel tema chiaro e in quello scuro. */
.compare {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.compare__hint {
  margin: 0;
  overflow-wrap: anywhere;
}

.compare__composer {
  display: grid;
  gap: 0.75rem;
}

/* Il campo occupa la riga; i pulsanti vanno a capo invece di comprimersi. */
.compare__field {
  width: 100%;
}

.compare__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.compare__panels {
  display: grid;
  /* auto-fit evita lo sbordamento su schermi stretti come 360px. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 0.75rem;
}

.compare__panel {
  display: grid;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-medium);
}

/* Due coppie container/on-container distinguono Subject e BehaviorSubject. */
.compare__panel--subject {
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}

.compare__panel--behavior {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.compare__header {
  display: grid;
  gap: 0.25rem;
}

.compare__title {
  margin: 0;
  font: var(--mat-sys-title-medium);
  overflow-wrap: anywhere;
}

.compare__note {
  margin: 0;
  font: var(--mat-sys-body-small);
}

.compare__observers {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: 0.5rem;
}`,
};

export const COUNTER_SOURCES: PlaygroundSources = {
  typescript: `import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, map } from 'rxjs';

// La cronologia resta breve: conserviamo solo gli ultimi cambi.
const MAX_HISTORY = 5;

interface CounterState {
  count: number;
  history: number[];
}

// Lo stato iniziale è un oggetto nuovo, riusato solo come valore di partenza.
const INITIAL_STATE: CounterState = { count: 0, history: [] };

@Component({
  selector: 'app-counter-state',
  imports: [AsyncPipe, MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class CounterStateDemo {
  // Un solo BehaviorSubject privato conserva l'intero stato.
  private readonly state = new BehaviorSubject<CounterState>(INITIAL_STATE);

  // Le viste ricevono due letture pubbliche: stato completo e valore derivato.
  readonly state$ = this.state.asObservable();
  readonly double$ = this.state$.pipe(map(state => state.count * 2));

  increment(): void {
    this.change(1);
  }

  decrement(): void {
    this.change(-1);
  }

  reset(): void {
    // Un nuovo stato iniziale sostituisce quello precedente.
    this.state.next({ count: 0, history: [] });
  }

  private change(delta: number): void {
    // .value è un'istantanea sincrona: qui serve per costruire il prossimo oggetto.
    // La vista segue invece le emissioni di state$ attraverso AsyncPipe.
    const current = this.state.value;
    const count = current.count + delta;

    // Nuovo oggetto e nuovo array: nessuna modifica in place.
    this.state.next({
      count,
      history: [...current.history, count].slice(-MAX_HISTORY),
    });
  }
}`,
  html: `<section class="counter">
  <p class="counter__hint">
    Un solo <code>BehaviorSubject</code> conserva <code>count</code> e gli ultimi cambi.
    <code>double$</code> è derivato con <code>map</code>, non copiato in un altro campo.
  </p>

  <!-- Un solo oggetto di stato alimenta entrambe le letture della vista. -->
  @if (state$ | async; as state) {
    <div class="counter__reads">
      <div class="counter__read counter__read--count">
        <span class="counter__label">Conteggio</span>

        <!-- L'AsyncPipe si sottoscrive qui: non esiste un campo specchio del conteggio. -->
        <strong class="counter__value" aria-label="Conteggio corrente">{{ state.count }}</strong>
      </div>

      <div class="counter__read counter__read--double">
        <span class="counter__label">Doppio derivato</span>
        <strong class="counter__value" aria-label="Valore doppio">{{ (double$ | async) ?? 0 }}</strong>
      </div>
    </div>

    <div class="counter__history" aria-label="Ultimi cambi">
      <span class="counter__label">Ultimi 5 cambi</span>

      <!-- La cronologia è limitata da slice(-MAX_HISTORY) nella classe. -->
      <p class="counter__changes">
        @for (value of state.history; track $index) {
          <span class="counter__change">{{ value }}</span>
        } @empty {
          <span class="counter__empty">Nessun cambio: il valore iniziale è 0.</span>
        }
      </p>
    </div>
  }

  <div class="counter__actions">
    <!-- Ogni pulsante chiama next con un nuovo stato immutabile. -->
    <button
      matButton="filled"
      type="button"
      aria-label="Decrementa di uno"
      (click)="decrement()"
    >
      Decrementa
    </button>

    <button
      matButton="filled"
      type="button"
      aria-label="Incrementa di uno"
      (click)="increment()"
    >
      Incrementa
    </button>

    <button
      matButton="outlined"
      type="button"
      aria-label="Azzera contatore"
      (click)="reset()"
    >
      Reset
    </button>
  </div>
</section>`,
  css: `/* Le coppie container/on-container mantengono il contrasto su ogni tema. */
.counter {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.counter__hint {
  margin: 0;
  overflow-wrap: anywhere;
}

.counter__reads {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
  gap: 0.75rem;
}

.counter__read {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
}

/* Il conteggio e il suo doppio derivato usano ruoli cromatici distinti. */
.counter__read--count {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.counter__read--double {
  background: var(--mat-sys-tertiary-container);
  color: var(--mat-sys-on-tertiary-container);
}

.counter__label {
  font: var(--mat-sys-label-large);
}

.counter__value {
  font: var(--mat-sys-headline-medium);
  overflow-wrap: anywhere;
}

.counter__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.counter__history {
  display: grid;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}

.counter__changes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  min-height: 2rem;
  margin: 0;
}

.counter__change {
  padding: 0.125rem 0.5rem;
  border-radius: var(--mat-sys-corner-full);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-label-large);
}

.counter__empty {
  font: var(--mat-sys-body-small);
}`,
};

// Servizio e pannello restano file separati: sono parti modificabili della lezione.
const USER_STATE_SERVICE = `import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Stato dimostrativo, non autenticazione: nessun token e nessun controllo di sicurezza.
export interface DemoUser {
  name: string;
  online: boolean;
}

// Oggetto separato per l'ospite: il reset non riusa lo stato corrente.
const GUEST: DemoUser = { name: 'Ospite', online: false };

// providedIn root: tutti i componenti della demo ricevono la stessa istanza.
@Injectable({ providedIn: 'root' })
export class UserStateService {
  // Sorgente privata: nessun componente può chiamare next direttamente.
  private readonly user = new BehaviorSubject<DemoUser>(GUEST);

  // Lettura pubblica e stabile per i consumatori.
  readonly user$ = this.user.asObservable();

  update(name: string): void {
    // Guardia sul vuoto: spazi o testo vuoto non cambiano il nome.
    const trimmed = name.trim();
    if (!trimmed) return;

    // Oggetto nuovo: i consumatori ricevono una referenza diversa, non una mutazione.
    this.user.next({ name: trimmed, online: true });
  }

  reset(): void {
    // Anche il reset sostituisce l'oggetto invece di modificare quello corrente.
    this.user.next({ ...GUEST });
  }
}`;

const USER_PANEL_COMPONENT = `import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UserStateService } from './user-state.service';

// FIGLIO: inietta lo stesso servizio del padre e dell'altro consumatore.
@Component({
  selector: 'app-user-panel',
  imports: [AsyncPipe],
  template: \`
    <article class="panel" [attr.aria-label]="label()">
      <h3 class="panel__label">{{ label() }}</h3>

      <!-- AsyncPipe si sottoscrive a user$ e annulla quando il pannello viene distrutto. -->
      @if (users.user$ | async; as user) {
        <p class="panel__name" aria-live="polite">{{ user.name }}</p>
        <p class="panel__status">{{ user.online ? 'Online' : 'Offline' }}</p>
      }
    </article>
  \`,
  styles: [\`
    /* Il pannello resta neutro: il contenitore del padre definisce il ruolo. */
    .panel {
      display: grid;
      gap: 0.25rem;
      min-width: 0;
      padding: 0.75rem;
      border-radius: var(--mat-sys-corner-small);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
    }

    .panel__label,
    .panel__name,
    .panel__status {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .panel__label {
      font: var(--mat-sys-label-large);
    }

    .panel__name {
      font: var(--mat-sys-title-medium);
    }

    .panel__status {
      font: var(--mat-sys-body-small);
    }
  \`],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class UserPanelComponent {
  readonly label = input.required<string>();
  readonly users = inject(UserStateService);
}`;

export const PROFILE_SOURCES: PlaygroundSources = {
  typescript: `import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserPanelComponent } from './user-panel.component';
import { UserStateService } from './user-state.service';

// PADRE: inietta la stessa istanza root che ricevono i due pannelli.
@Component({
  selector: 'app-profile-state',
  imports: [MatButtonModule, MatFormFieldModule, MatInputModule, UserPanelComponent],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ProfileStateDemo {
  readonly users = inject(UserStateService);
  readonly name = signal('');

  update(): void {
    // Il servizio applica il trim e ignora un nome vuoto.
    this.users.update(this.name());
    this.name.set('');
  }

  reset(): void {
    // Il reset riporta tutti i consumatori allo stato ospite.
    this.users.reset();
    this.name.set('');
  }
}`,
  files: {
    'user-state.service.ts': USER_STATE_SERVICE,
    'user-panel.component.ts': USER_PANEL_COMPONENT,
  },
  html: `<section class="profile">
  <p class="profile__hint">
    Un servizio con <code>providedIn: 'root'</code> conserva lo stato condiviso.
    I due pannelli iniettano la stessa istanza: aggiorna o azzera e osserva entrambi.
  </p>

  <!-- È uno stato dimostrativo: non descrive un sistema di autenticazione reale. -->
  <p class="profile__note">Nome e stato online sono solo una demo condivisa: nessun token, nessuna verifica di sicurezza.</p>

  <div class="profile__editor">
    <mat-form-field appearance="outline" class="profile__field">
      <mat-label>Nome visualizzato</mat-label>

      <!-- La bozza resta locale: lo stato condiviso cambia solo con Aggiorna. -->
      <input
        matInput
        [value]="name()"
        (input)="name.set($any($event.target).value)"
      />
    </mat-form-field>

    <div class="profile__actions">
      <button
        matButton="filled"
        type="button"
        aria-label="Aggiorna lo stato condiviso"
        (click)="update()"
      >
        Aggiorna
      </button>

      <button
        matButton="outlined"
        type="button"
        aria-label="Riporta l'ospite"
        (click)="reset()"
      >
        Reset ospite
      </button>
    </div>
  </div>

  <div class="profile__panels">
    <!-- Il colore del contenitore distingue i due consumatori dello stesso stato. -->
    <div class="profile__consumer profile__consumer--primary">
      <app-user-panel
        label="Consumatore A"
      />
    </div>

    <div class="profile__consumer profile__consumer--secondary">
      <app-user-panel
        label="Consumatore B"
      />
    </div>
  </div>
</section>`,
  css: `.profile {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
}

.profile__hint,
.profile__note {
  margin: 0;
  overflow-wrap: anywhere;
}

/* Testo attenuato: chiarisce che la demo non è autenticazione. */
.profile__note {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-small);
}

.profile__editor {
  display: grid;
  gap: 0.75rem;
}

.profile__field {
  display: block;
  width: 100%;
}

.profile__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.profile__panels {
  display: grid;
  /* Le due viste si affiancano solo quando c'è spazio sufficiente. */
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 0.75rem;
}

.profile__consumer {
  min-width: 0;
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-medium);
}

.profile__consumer--primary {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.profile__consumer--secondary {
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
}`,
};

/** Three independent BehaviorSubject examples; each preview keeps its own state. */
export const BEHAVIOR_EXAMPLES: readonly LessonExample[] = [
  {
    id: 'subject-vs-behavior',
    label: '1. Subject o BehaviorSubject',
    title: 'Chi si collega dopo, cosa riceve?',
    prompt:
      'Invia **prima**: A mostra il testo, B non è ancora montato. Premi **Mostra vista tardiva**: il Subject non consegna nulla a B, il BehaviorSubject gli dà subito il valore corrente. Invia **seconda** e osserva entrambi, poi smonta e rimonta B.',
    takeaway:
      'Il `Subject` inoltra solo le emissioni future; il `BehaviorSubject` conserva il valore corrente e lo consegna subito al nuovo sottoscrittore. `AsyncPipe` chiude la sottoscrizione quando `@if` smonta il figlio.',
    sources: COMPARE_SOURCES,
    diagram: COMPARE_DIAGRAM,
  },
  {
    id: 'counter-state',
    label: '2. Contatore con stato',
    title: 'Un oggetto immutabile e un valore derivato',
    prompt:
      'Premi **Incrementa** sei volte: il conteggio sale e la cronologia conserva solo gli ultimi cinque cambi. **Decrementa** aggiorna anche il doppio derivato. **Reset** riporta conteggio e cronologia allo stato iniziale.',
    takeaway:
      'Un unico `BehaviorSubject` conserva un oggetto di stato; ogni aggiornamento passa a `next` un nuovo oggetto con un nuovo array. `map` deriva `double$` dal conteggio, quindi non serve un secondo campo da mantenere allineato.',
    sources: COUNTER_SOURCES,
    diagram: COUNTER_DIAGRAM,
  },
  {
    id: 'shared-profile',
    label: '3. Stato condiviso',
    title: 'Un servizio, due consumatori',
    prompt:
      'Scrivi un nome e premi **Aggiorna**: entrambi i pannelli cambiano insieme. Prova un nome con spazi attorno, poi **Reset ospite**. Modifica `online: true` nel servizio e riesegui: il nuovo comportamento arriva a tutte le viste.',
    takeaway:
      'Con `providedIn: \'root\'` il servizio espone `user$` e metodi controllati; i due figli iniettano la stessa istanza. Il servizio sostituisce l\'oggetto dello stato, così ogni consumatore riceve il cambiamento con `AsyncPipe`.',
    sources: PROFILE_SOURCES,
    diagram: PROFILE_DIAGRAM,
  },
];
