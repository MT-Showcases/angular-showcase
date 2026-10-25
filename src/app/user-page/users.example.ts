import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { USERS_DIAGRAM } from './users-diagram';

const APP_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

// ApplicationConfig registra i provider globali della preview.
export const appConfig: ApplicationConfig = {
  providers: [
    // In Angular 22 il backend HTTP predefinito usa fetch.
    provideHttpClient(),
  ],
};
`;

const USERS_SERVICE = `import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// L'interfaccia descrive solo campi presenti nella risposta reale di /users.
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    city: string;
  };
}

// Un solo endpoint, riusato dalla preview e dallo schema.
export const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

// Un’istanza del servizio è condivisa nell’applicazione di questo esempio.
@Injectable({ providedIn: 'root' })
export class UsersService {
  // Il client arriva dalla dependency injection e gestisce il trasporto HTTP.
  private readonly http = inject(HttpClient);

  // get<User[]> descrive il tipo atteso: il JSON non viene validato a runtime.
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(USERS_URL);
  }
}
`;

const USER_CARD = `import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { User } from './users.service';

// La card è presentazionale: riceve l’utente e comunica solo la richiesta di rimozione.
@Component({
  selector: 'app-user-card',
  imports: [MatButtonModule],
  template: \`
    <article class="user-card">
      <header class="user-card__header">
        <h3 class="user-card__name">{{ user().name }}</h3>
        <p class="user-card__username">@{{ user().username }}</p>
      </header>

      <dl class="user-card__details">
        <div>
          <dt>Email</dt>
          <dd>{{ user().email }}</dd>
        </div>
        <div>
          <dt>Città</dt>
          <dd>{{ user().address.city }}</dd>
        </div>
      </dl>

      <!-- L’output invia al padre solo l’id: la card non conosce il servizio HTTP. -->
      <button
        matButton="outlined"
        type="button"
        (click)="requestRemoval()"
        [disabled]="busy()"
        [attr.aria-label]="'Rimuovi ' + user().name + ' dalla vista locale'"
      >Rimuovi dalla vista</button>
    </article>
  \`,
  styles: \`
    /* La card usa le superfici Material e cresce con il contenuto. */
    :host {
      display: block;
      min-width: 0;
      height: 100%;
    }

    .user-card {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      height: 100%;
      padding: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: var(--mat-sys-corner-medium);
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font-size: max(1rem, 16px);
    }

    .user-card__name,
    .user-card__username {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .user-card__name {
      font: var(--mat-sys-title-small);
    }

    .user-card__username {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }

    .user-card__details {
      display: grid;
      gap: 0.5rem;
      margin: 0;
    }

    .user-card__details div {
      display: grid;
      gap: 0.125rem;
    }

    .user-card__details dt {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-medium);
    }

    .user-card__details dd {
      margin: 0;
      font: var(--mat-sys-body-medium);
      overflow-wrap: anywhere;
    }

    .user-card button {
      align-self: flex-start;
      margin-top: auto;
    }
  \`,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class UserCard {
  // input.required impedisce di creare la card senza un utente.
  readonly user = input.required<User>();

  // busy disabilita la rimozione mentre una nuova GET è in corso.
  readonly busy = input(false);

  // output comunica al padre l’id da nascondere localmente.
  readonly remove = output<number>();

  requestRemoval(): void {
    // L’evento contiene solo l’id: la card non conosce il servizio.
    this.remove.emit(this.user().id);
  }
}
`;

const USERS_SOURCES: PlaygroundSources = {
  typescript: `import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription, finalize } from 'rxjs';
import { User, UsersService } from './users.service';
import { UserCard } from './user-card';

// La vista conserva i dati del server e le rimozioni solo in memoria.
@Component({
  selector: 'app-users-demo',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    UserCard,
  ],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class UsersDemo {
  private readonly usersService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);

  // Una sola sottoscrizione attiva: annullarla libera anche il backend fetch.
  private request?: Subscription;

  // serverUsers è l’ultima risposta riuscita del server.
  readonly serverUsers = signal<User[]>([]);

  // removedIds contiene gli id nascosti localmente, mai inviati al server.
  readonly removedIds = signal<ReadonlySet<number>>(new Set<number>());

  readonly search = signal('');
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal('Nessuna richiesta inviata: premi Carica utenti.');

  // Le card visibili escludono le rimozioni locali.
  readonly visibleUsers = computed(() =>
    this.serverUsers().filter(user => !this.removedIds().has(user.id)),
  );

  // Il filtro usa solo campi reali dell’API: nome ed email.
  readonly filteredUsers = computed(() => {
    const query = this.search().trim().toLowerCase();

    if (!query) return this.visibleUsers();

    return this.visibleUsers().filter(user =>
      user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    );
  });

  readonly removedCount = computed(() => this.removedIds().size);
  readonly hasSearch = computed(() => this.search().trim().length > 0);

  // Distingue attesa, lista vuota, rimozioni complete e ricerca senza risultati.
  readonly listState = computed<'loading' | 'idle' | 'ready' | 'empty' | 'all-removed' | 'no-match'>(() => {
    if (this.loading() && !this.loaded()) return 'loading';
    if (!this.loaded()) return 'idle';
    if (this.serverUsers().length === 0) return 'empty';
    if (this.visibleUsers().length === 0) return 'all-removed';
    if (this.filteredUsers().length === 0) return 'no-match';
    return 'ready';
  });

  setSearch(value: string): void {
    // Il filtro è sincrono e locale: non avvia richieste HTTP.
    this.search.set(value);
  }

  clearSearch(): void {
    this.search.set('');
  }

  load(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.status.set('GET in corso: la lista precedente, se presente, resta visibile.');

    // takeUntilDestroyed chiude la sottoscrizione quando la preview viene distrutta.
    // finalize spegne il caricamento anche dopo un errore o un annullamento.
    this.request = this.usersService.getUsers().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: users => {
        // Una nuova risposta del server ripristina anche le card rimosse localmente.
        this.serverUsers.set(users);
        this.removedIds.set(new Set<number>());
        this.loaded.set(true);
        // La ricerca non viene azzerata: il filtro resta applicato alla nuova lista.
        this.status.set('GET completata: ' + users.length + ' utenti ricevuti.');
      },
      error: (error: HttpErrorResponse) => {
        // L’errore non viene confuso con una lista vuota o senza risultati.
        this.error.set(this.describeError(error));
        this.status.set('GET terminata con errore: la lista precedente, se presente, resta visibile.');
      },
    });
  }

  cancel(): void {
    if (!this.loading()) return;

    // unsubscribe interrompe l’attesa: un risultato tardivo non aggiorna la vista.
    this.request?.unsubscribe();
    this.status.set('GET annullata dal client: nessun risultato applicato.');
  }

  reset(): void {
    // Il reset annulla l’attesa e riporta dati e filtro alla situazione iniziale.
    this.request?.unsubscribe();
    this.serverUsers.set([]);
    this.removedIds.set(new Set<number>());
    this.search.set('');
    this.loaded.set(false);
    this.error.set(null);
    this.status.set('Demo ripristinata: lista vuota, ricerca azzerata e nessuna richiesta inviata.');
  }

  removeUser(id: number): void {
    if (this.loading()) return;

    // Rimozione solo locale: nessuna DELETE parte verso JSONPlaceholder.
    this.removedIds.set(new Set([...this.removedIds(), id]));
    this.status.set('Utente rimosso solo dalla vista. Ricarica utenti per ripristinare i dati del server.');
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Nessuna risposta HTTP ricevuta (stato 0): controlla la rete o il blocco del browser.';
    }

    return 'GET /users non riuscita (stato ' + error.status + '). Puoi riprovare.';
  }
}`,
  files: {
    'app.config.ts': APP_CONFIG,
    'users.service.ts': USERS_SERVICE,
    'user-card.ts': USER_CARD,
  },
  html: `<section class="users" aria-labelledby="users-title">
  <header class="users__header">
    <h3 id="users-title" class="users__title">Utenti dal server</h3>
    <p class="users__hint">
      Carica i dati con una GET, poi cerca nella lista ricevuta.
    </p>
  </header>

  <!-- matInput dentro mat-form-field conserva label, hint e stato Material. -->
  <mat-form-field class="users__field" appearance="outline" subscriptSizing="dynamic">
    <mat-label>Cerca per nome o email</mat-label>
    <input
      matInput
      id="users-search"
      type="search"
      [ngModel]="search()"
      (ngModelChange)="setSearch($event)"
      [disabled]="loading()"
    />
    <mat-hint>Il filtro è locale: non invia richieste.</mat-hint>
  </mat-form-field>

  <div class="users__actions">
    <!-- Il testo cambia con lo stato, ma il clic chiama sempre load(). -->
    <button
      matButton="filled"
      type="button"
      (click)="load()"
      [disabled]="loading()"
    >
      {{ loading() ? 'Caricamento…' : error() ? 'Riprova GET' : loaded() ? 'Ricarica utenti' : 'Carica utenti' }}
    </button>

    @if (loading()) {
      <button
        matButton="outlined"
        type="button"
        (click)="cancel()"
      >Annulla richiesta</button>
    }

    <button
      matButton="text"
      type="button"
      (click)="reset()"
    >Ripristina demo</button>
  </div>

  <!-- role=status annuncia i cambi di fase senza interrompere la lettura. -->
  <p class="users__status" role="status">{{ status() }}</p>

  @if (error()) {
    <p class="users__error" role="alert">{{ error() }}</p>
  }

  <!-- La nota chiarisce cosa è reale e cosa resta solo nella vista. -->
  <p class="users__note">
    <strong>Dati demo da JSONPlaceholder.</strong> Rimuovi agisce solo nella vista.
  </p>

  <div class="users__list" [attr.aria-busy]="loading()">
    @if (listState() === 'loading') {
      <p class="users__empty">Caricamento degli utenti dal server…</p>
    } @else if (listState() === 'ready') {
      <!-- track user.id mantiene l’identità della card durante filtro e rimozioni. -->
      <div class="users__grid" data-testid="users-grid">
        @for (user of filteredUsers(); track user.id) {
          <app-user-card [user]="user" [busy]="loading()" (remove)="removeUser($event)" />
        }
      </div>
    } @else if (listState() === 'empty') {
      <p class="users__empty" data-testid="users-empty">
        Il server ha restituito una lista vuota. Puoi premere Ricarica utenti per leggerla di nuovo.
      </p>
    } @else if (listState() === 'all-removed') {
      <p class="users__empty" data-testid="users-all-removed">
        Hai nascosto localmente {{ removedCount() }} utenti. Premi Ricarica utenti per ripristinare i dati del server.
      </p>
    } @else if (listState() === 'no-match') {
      <div class="users__empty" data-testid="users-no-match">
        <p>Nessun utente corrisponde a «{{ search().trim() }}». La lista del server non è cambiata.</p>
        @if (hasSearch()) {
          <button
            matButton="text"
            type="button"
            (click)="clearSearch()"
          >Azzera ricerca</button>
        }
      </div>
    } @else if (!error()) {
      <p class="users__empty">Nessun utente caricato: premi Carica utenti.</p>
    }
  </div>
</section>`,
  css: `/* Il pannello segue i token Material: superfici, bordi e testo restano coerenti. */
.users {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  font-size: max(1rem, 16px);
}

/* Intestazione e azioni vanno a capo quando lo spazio non basta. */
.users__header,
.users__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
}

.users__actions {
  gap: 0.5rem;
}

.users__title,
.users__hint,
.users__status,
.users__error,
.users__empty,
.users__note {
  margin: 0;
}

.users__title {
  font: var(--mat-sys-title-medium);
}

.users__hint {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* Il campo occupa tutta la riga e non comprime la label su schermi stretti. */
.users__field {
  width: 100%;
}

.users__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-medium);
}

/* Il colore di errore arriva dal token semantico del tema. */
.users__error {
  color: var(--mat-sys-error);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* La nota di simulazione usa una superficie secondaria, non il colore di errore. */
.users__note {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.users__list {
  display: grid;
  gap: 0.75rem;
}

/* auto-fill mantiene una sola colonna quando lo spazio è ridotto. */
.users__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: 1rem;
}

.users__empty {
  padding: 1rem;
  border: 1px dashed var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.users__empty p {
  margin: 0 0 0.5rem;
}`,
};

// Un solo progetto modificabile: pagina, card, servizio e configurazione restano leggibili.
export const USERS_EXAMPLES: readonly LessonExample[] = [
  {
    id: 'users',
    label: 'Utenti',
    title: 'Lista utenti da JSONPlaceholder',
    prompt:
      'Premi **Carica utenti**, cerca per nome o email e rimuovi una card. **Ricarica utenti** rilegge il server e ripristina gli utenti nascosti localmente.',
    takeaway:
      'La vista distingue lista vuota, ricerca senza risultati ed errore. Il servizio usa una GET reale su `/users`; non ci sono DELETE, registrazione o autenticazione.',
    sources: USERS_SOURCES,
    diagram: USERS_DIAGRAM,
  },
];
