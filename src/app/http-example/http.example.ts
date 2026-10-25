import type { LessonExample } from '../components/lesson-examples/lesson-examples';
import type { PlaygroundSources } from '../components/angular-playground/playground.types';
import { DETAIL_DIAGRAM, LIST_DIAGRAM, POST_DIAGRAM, WRITES_DIAGRAM } from './http-example-diagrams';

const APP_CONFIG = `import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

// ApplicationConfig registra i provider globali della preview.
export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 22 usa il backend fetch per impostazione predefinita.
    // Qui rendiamo esplicita la configurazione HTTP dell’esempio.
    provideHttpClient(),
  ],
};
`;

const LIST_SERVICE = `import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// L'interfaccia descrive il contratto atteso dalla nostra applicazione.
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

// Un solo endpoint, riusato dal componente e dal pannello della richiesta.
export const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

// Un’istanza del servizio è condivisa nell’applicazione di questo esempio.
@Injectable({ providedIn: 'root' })
export class PostsService {
  // Il client arriva dalla dependency injection e gestisce il trasporto HTTP.
  private readonly http = inject(HttpClient);

  // get<Post[]> è un tipo compile-time: non valida il JSON ricevuto a runtime.
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(POSTS_URL);
  }
}`;

const DETAIL_SERVICE = `import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Il contatto con l'API resta nel servizio, lontano dai signal della vista.
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

// Un’istanza del servizio è condivisa nell’applicazione di questo esempio.
@Injectable({ providedIn: 'root' })
export class PostsService {
  // Il client arriva dalla dependency injection e gestisce il trasporto HTTP.
  private readonly http = inject(HttpClient);

  // get<Post> descrive solo il tipo atteso: il JSON non viene validato a runtime.
  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(POSTS_URL + '/' + id);
  }
}`;

const POST_SERVICE = `import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// Post descrive la risposta simulata; il nuovo contenuto non ha ancora un id.
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

// Un’istanza del servizio è condivisa nell’applicazione di questo esempio.
@Injectable({ providedIn: 'root' })
export class PostsService {
  // Il client arriva dalla dependency injection e gestisce il trasporto HTTP.
  private readonly http = inject(HttpClient);

  // post<Post> è solo il tipo atteso: la risposta reale arriva a runtime.
  createPost(payload: Omit<Post, 'id'>): Observable<Post> {
    return this.http.post<Post>(POSTS_URL, payload);
  }
}`;

const WRITES_SERVICE = `import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

// La risorsa completa include id, userId, title e body: PUT sostituisce tutto.
export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';

// Un’istanza del servizio è condivisa nell’applicazione di questo esempio.
@Injectable({ providedIn: 'root' })
export class PostsService {
  // Il client arriva dalla dependency injection e gestisce il trasporto HTTP.
  private readonly http = inject(HttpClient);

  // GET rilegge la risorsa dal server.
  getPost(id: number): Observable<Post> {
    return this.http.get<Post>(POSTS_URL + '/' + id);
  }

  // PUT invia la rappresentazione completa, non una modifica parziale.
  updatePost(id: number, post: Post): Observable<Post> {
    return this.http.put<Post>(POSTS_URL + '/' + id, post);
  }

  // DELETE può rispondere senza corpo: il tipo unknown resta onesto.
  deletePost(id: number): Observable<unknown> {
    return this.http.delete<unknown>(POSTS_URL + '/' + id);
  }
}`;

const LIST_SOURCES: PlaygroundSources = {
  typescript: `import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, finalize } from 'rxjs';
import { POSTS_URL, Post, PostsService } from './posts.service';

// L'anteprima della richiesta non contiene mai un oggetto Observable.
interface RequestPreview {
  method: string;
  url: string;
  body?: unknown;
}

// La vista conserva la lista e i messaggi; la rete resta nel servizio.
@Component({
  selector: 'app-http-list',
  imports: [JsonPipe, MatButtonModule],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class HttpList {
  private readonly postsService = inject(PostsService);
  private readonly destroyRef = inject(DestroyRef);

  // Una sola sottoscrizione attiva: annullarla libera anche il backend fetch.
  private request?: Subscription;

  readonly posts = signal<Post[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal('Nessuna richiesta inviata: premi Carica lista GET.');
  readonly requestPreview = signal<RequestPreview | null>(null);
  readonly response = signal<unknown>(null);

  load(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.status.set('GET in corso: il client attende la risposta.');
    this.requestPreview.set({ method: 'GET', url: POSTS_URL });

    // takeUntilDestroyed chiude la sottoscrizione quando la preview viene distrutta.
    // finalize riporta loading a false anche dopo un errore o un annullamento.
    this.request = this.postsService.getPosts().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: posts => {
        // Limitiamo solo la lista visibile: il pannello JSON conserva tutta la risposta.
        this.posts.set(posts.slice(0, 5));
        this.response.set(posts);
        this.loaded.set(true);
        this.status.set('GET completata: ' + posts.length + ' post ricevuti, anteprima dei primi 5.');
      },
      error: (error: HttpErrorResponse) => {
        // I dati di un caricamento precedente restano visibili finché non arriva una nuova risposta.
        this.error.set(this.describeError(error));
        this.status.set('GET terminata con errore: la lista precedente, se presente, è conservata.');
      },
    });
  }

  cancel(): void {
    if (!this.loading()) return;

    // unsubscribe interrompe l'attesa nel client e non applica alcun risultato tardivo.
    // Una scrittura già accettata dal server non verrebbe annullata; questa è una GET.
    this.request?.unsubscribe();
    this.status.set('GET annullata dal client: nessun risultato applicato.');
  }

  reset(): void {
    this.request?.unsubscribe();
    this.posts.set([]);
    this.loaded.set(false);
    this.error.set(null);
    this.requestPreview.set(null);
    this.response.set(null);
    this.status.set('Demo ripristinata: nessuna richiesta inviata.');
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Nessuna risposta HTTP ricevuta (stato 0): controlla la rete o il blocco del browser.';
    }

    return 'GET non riuscita (stato ' + error.status + '). Puoi riprovare.';
  }
}`,
  files: {
    'app.config.ts': APP_CONFIG,
    'posts.service.ts': LIST_SERVICE,
  },
  html: `<section class="http" aria-labelledby="list-title">
  <header class="http__header">
    <h3 id="list-title" class="http__title">Lista di post dal server</h3>
    <p class="http__hint">
      Nessuna richiesta parte da sola: premi il pulsante. La prima GET popola i signal della vista.
    </p>
  </header>

  <div class="http__actions">
    <!-- Il testo cambia in base allo stato, ma il clic chiama sempre load(). -->
    <button
      matButton="filled"
      type="button"
      (click)="load()"
      [disabled]="loading()"
    >
      {{ error() ? 'Riprova GET' : loaded() ? 'Ricarica lista GET' : 'Carica lista GET' }}
    </button>

    <!-- Annulla e ripristina restano disponibili mentre la GET è in attesa. -->
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
  <p class="http__status" role="status">{{ status() }}</p>

  @if (error()) {
    <p class="http__error" role="alert">{{ error() }}</p>
  }

  <div class="http__list" [attr.aria-busy]="loading()">
    @for (post of posts(); track post.id) {
      <article class="post-card" [attr.data-post-id]="post.id">
        <h4 class="post-card__title">{{ post.id }}. {{ post.title }}</h4>
        <p class="post-card__body">{{ post.body }}</p>
      </article>
    } @empty {
      <!-- Lo stato vuoto distingue "mai caricata" da "risposta vuota". -->
      <p class="http__empty">
        {{ loaded() ? 'La lista ricevuta è vuota: ricarica per riprovare.' : 'Nessuna lista caricata: premi Carica lista GET.' }}
      </p>
    }
  </div>

  <section class="http__exchange" aria-labelledby="list-exchange">
    <h4 id="list-exchange" class="http__subtitle">Osserva l’ultimo scambio</h4>
    <p class="http__hint">
      La richiesta compare quando parte. La risposta resta l’ultima ricevuta mentre una nuova attesa è in corso.
    </p>

    <p class="http__label">Richiesta</p>
    @if (requestPreview(); as request) {
      <pre
        class="http__output"
        tabindex="0"
        role="region"
        aria-label="Ultima richiesta HTTP"
      >{{ request | json }}</pre>
    } @else {
      <p class="http__empty">Nessuna richiesta ancora inviata.</p>
    }

    <p class="http__label">Risposta</p>
    @if (loading()) {
      <p class="http__waiting" role="status">In attesa della risposta HTTP…</p>
    }
    @if (response() !== null) {
      <pre
        class="http__output"
        tabindex="0"
        role="region"
        aria-label="Ultima risposta HTTP"
      >{{ response() | json }}</pre>
    } @else if (!loading()) {
      <p class="http__empty">Nessuna risposta ricevuta.</p>
    }
    @if (error()) {
      <p class="http__error">La richiesta è terminata con errore: {{ error() }}</p>
    }
  </section>
</section>`,
  css: `/* Il pannello segue i token Material: superfici, bordi e testo restano coerenti con il tema. */
.http {
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
.http__header,
.http__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
}

.http__actions {
  gap: 0.5rem;
}

.http__title,
.http__subtitle,
.http__hint,
.http__status,
.http__error,
.http__empty,
.http__waiting,
.http__label {
  margin: 0;
}

.http__title {
  font: var(--mat-sys-title-medium);
}

.http__subtitle {
  font: var(--mat-sys-title-small);
}

.http__hint {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.http__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-medium);
}

/* Il colore di errore arriva dal token semantico del tema. */
.http__error {
  color: var(--mat-sys-error);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.http__list {
  display: grid;
  gap: 0.5rem;
}

.post-card {
  padding: 0.75rem;
  border-inline-start: 0.25rem solid var(--mat-sys-primary);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.post-card__title,
.post-card__body {
  margin: 0;
  overflow-wrap: anywhere;
}

.post-card__title {
  font: var(--mat-sys-title-small);
}

.post-card__body {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* Il riquadro dello scambio separa richiesta, attesa e risposta. */
.http__exchange {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.http__label {
  color: var(--mat-sys-primary);
  font: var(--mat-sys-label-large);
}

.http__waiting {
  padding: 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font: var(--mat-sys-body-medium);
}

/* Il JSON può essere lungo: lo scorrimento resta dentro il pannello. */
.http__output {
  max-height: 16rem;
  margin: 0;
  padding: 0.75rem;
  overflow: auto;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: max(1rem, 16px);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}`,
};

const DETAIL_SOURCES: PlaygroundSources = {
  typescript: `import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { POSTS_URL, Post, PostsService } from './posts.service';

interface RequestPreview {
  method: string;
  url: string;
}

// La vista mantiene un solo dettaglio: un nuovo ID sostituisce il precedente.
@Component({
  selector: 'app-http-detail',
  imports: [
    JsonPipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class HttpDetail {
  private readonly postsService = inject(PostsService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  readonly detailId = signal<number | null>(1);
  // Number.isInteger accetta solo interi; il confronto esclude zero e negativi.
  readonly validId = computed(() => Number.isInteger(this.detailId()) && (this.detailId() ?? 0) > 0);
  readonly selectedPost = signal<Post | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal('Inserisci un ID e premi Leggi dettaglio.');
  readonly requestPreview = signal<RequestPreview | null>(null);
  readonly response = signal<unknown>(null);

  setDetailId(value: number | null): void {
    // Il campo numerico può restituire null quando è vuoto.
    this.detailId.set(value);
  }

  load(): void {
    const id = this.detailId();
    if (!this.validId() || id === null || this.loading()) return;

    // Un dettaglio vecchio non deve restare visibile mentre si chiede un altro ID.
    this.selectedPost.set(null);
    this.response.set(null);
    this.loading.set(true);
    this.error.set(null);
    this.status.set('GET del dettaglio ' + id + ' in corso.');
    this.requestPreview.set({ method: 'GET', url: POSTS_URL + '/' + id });

    this.request = this.postsService.getPost(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: post => {
        this.selectedPost.set(post);
        this.response.set(post);
        this.status.set('Dettaglio ' + post.id + ' ricevuto e mostrato.');
      },
      error: (error: HttpErrorResponse) => {
        // Il dettaglio era già stato svuotato: l'errore non lascia dati obsoleti.
        this.error.set(this.describeError(error, id));
        this.status.set('GET del dettaglio terminata con errore: nessun dettaglio obsoleto resta visibile.');
      },
    });
  }

  cancel(): void {
    if (!this.loading()) return;

    // La sottoscrizione viene chiusa: un risultato tardivo non aggiorna la vista.
    this.request?.unsubscribe();
    this.status.set('GET del dettaglio annullata: nessun risultato applicato.');
  }

  reset(): void {
    this.request?.unsubscribe();
    this.detailId.set(1);
    this.selectedPost.set(null);
    this.error.set(null);
    this.requestPreview.set(null);
    this.response.set(null);
    this.status.set('Demo ripristinata: ID 1, nessuna richiesta inviata.');
  }

  private describeError(error: HttpErrorResponse, id: number): string {
    if (error.status === 404) {
      return 'Il post ' + id + ' non esiste (404). Scegli un altro ID e riprova.';
    }

    if (error.status === 0) {
      return 'Nessuna risposta HTTP ricevuta (stato 0): controlla la rete o il blocco del browser.';
    }

    return 'GET del dettaglio non riuscita (stato ' + error.status + '). Puoi riprovare.';
  }
}`,
  files: {
    'app.config.ts': APP_CONFIG,
    'posts.service.ts': DETAIL_SERVICE,
  },
  html: `<section class="http" aria-labelledby="detail-title">
  <header class="http__header">
    <h3 id="detail-title" class="http__title">Un solo post, scelto dall’ID</h3>
    <p class="http__hint">
      Il campo è numerico e obbligatorio. Un nuovo tentativo nasconde subito il dettaglio precedente.
    </p>
  </header>

  <!-- ngModel legge il signal; ngModelChange passa il nuovo valore al metodo del componente. -->
  <!-- matInput dentro mat-form-field conserva label, hint e stato Material. -->
  <mat-form-field class="http__field" appearance="outline" subscriptSizing="dynamic">
    <mat-label>ID del post da leggere</mat-label>
    <input
      matInput
      id="detail-id"
      type="number"
      min="1"
      step="1"
      [ngModel]="detailId()"
      (ngModelChange)="setDetailId($event)"
      [disabled]="loading()"
    />
    <mat-hint>Intero positivo. Prova 1, poi un ID inesistente come 999.</mat-hint>
  </mat-form-field>

  <div class="http__actions">
    <button
      matButton="filled"
      type="button"
      (click)="load()"
      [disabled]="loading() || !validId()"
    >Leggi dettaglio</button>

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

  <p class="http__status" role="status">{{ status() }}</p>

  @if (error()) {
    <p class="http__error" role="alert">{{ error() }}</p>
  }

  <!-- Il dettaglio esiste solo dopo una risposta riuscita. -->
  @if (selectedPost(); as post) {
    <article class="detail" data-testid="post-detail">
      <p class="detail__eyebrow">Risorsa ricevuta dalla GET</p>
      <h4 class="detail__title">{{ post.id }}. {{ post.title }}</h4>
      <p class="detail__body">{{ post.body }}</p>
    </article>
  } @else {
    <p class="http__empty">Nessun dettaglio visibile: carica un ID valido.</p>
  }

  <section class="http__exchange" aria-labelledby="detail-exchange">
    <h4 id="detail-exchange" class="http__subtitle">Osserva l’ultimo scambio</h4>

    <p class="http__label">Richiesta</p>
    @if (requestPreview(); as request) {
      <pre
        class="http__output"
        tabindex="0"
        role="region"
        aria-label="Ultima richiesta HTTP"
      >{{ request | json }}</pre>
    } @else {
      <p class="http__empty">Nessuna richiesta ancora inviata.</p>
    }

    <p class="http__label">Risposta</p>
    @if (loading()) {
      <p class="http__waiting" role="status">In attesa della risposta HTTP…</p>
    }
    @if (response() !== null) {
      <pre
        class="http__output"
        tabindex="0"
        role="region"
        aria-label="Ultima risposta HTTP"
      >{{ response() | json }}</pre>
    } @else if (!loading()) {
      <p class="http__empty">Nessuna risposta ricevuta.</p>
    }
    @if (error()) {
      <p class="http__error">La richiesta è terminata con errore: {{ error() }}</p>
    }
  </section>
</section>`,
  css: `/* Pannello del dettaglio con gli stessi token del tema Material. */
.http {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  font-size: max(1rem, 16px);
}

.http__header,
.http__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
}

.http__actions {
  gap: 0.5rem;
}

.http__title,
.http__subtitle,
.http__hint,
.http__status,
.http__error,
.http__empty,
.http__waiting,
.http__label {
  margin: 0;
}

.http__title {
  font: var(--mat-sys-title-medium);
}

.http__subtitle {
  font: var(--mat-sys-title-small);
}

.http__hint {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* Il campo occupa tutta la riga e non comprime la label su schermi stretti. */
.http__field {
  width: 100%;
}

.http__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-medium);
}

.http__error {
  color: var(--mat-sys-error);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* La risorsa ricevuta ha un bordo primario per distinguerla dai messaggi. */
.detail {
  padding: 0.75rem;
  border-inline-start: 0.25rem solid var(--mat-sys-primary);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.detail__eyebrow {
  margin: 0;
  color: var(--mat-sys-primary);
  font: var(--mat-sys-label-large);
}

.detail__title,
.detail__body {
  margin: 0;
  overflow-wrap: anywhere;
}

.detail__title {
  font: var(--mat-sys-title-small);
}

.detail__body {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.http__exchange {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.http__label {
  color: var(--mat-sys-primary);
  font: var(--mat-sys-label-large);
}

.http__waiting {
  padding: 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font: var(--mat-sys-body-medium);
}

/* Il JSON resta leggibile e scorre dentro il riquadro. */
.http__output {
  max-height: 16rem;
  margin: 0;
  padding: 0.75rem;
  overflow: auto;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: max(1rem, 16px);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}`,
};

const POST_SOURCES: PlaygroundSources = {
  typescript: `import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription, finalize } from 'rxjs';
import { POSTS_URL, Post, PostsService } from './posts.service';

interface RequestPreview {
  method: string;
  url: string;
  body: unknown;
}

interface CreatedPost {
  operationId: number;
  post: Post;
}

// La bozza vive nella vista; il servizio riceve solo il payload già normalizzato.
@Component({
  selector: 'app-http-create',
  imports: [
    JsonPipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class HttpCreate {
  private readonly postsService = inject(PostsService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;
  private operationId = 0;

  readonly title = signal('');
  readonly body = signal('');
  // trim() evita di inviare un payload fatto solo di spazi.
  readonly canSubmit = computed(() => this.title().trim().length > 0 && this.body().trim().length > 0);
  readonly created = signal<CreatedPost | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal('Compila titolo e testo: il POST resta disabilitato finché sono vuoti.');
  readonly requestPreview = signal<RequestPreview | null>(null);
  readonly response = signal<unknown>(null);

  setTitle(value: string): void {
    this.title.set(value);
  }

  setBody(value: string): void {
    this.body.set(value);
  }

  submit(): void {
    if (this.loading() || !this.canSubmit()) return;

    const payload = {
      userId: 1,
      title: this.title().trim(),
      body: this.body().trim(),
    };

    this.loading.set(true);
    this.error.set(null);
    this.response.set(null);
    this.status.set('POST in corso: la bozza resta visibile finché non arriva la risposta.');
    this.requestPreview.set({ method: 'POST', url: POSTS_URL, body: payload });

    this.request = this.postsService.createPost(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: post => {
        // L'ID locale distingue due operazioni anche se l'API ripete lo stesso ID.
        this.operationId += 1;
        this.created.set({ operationId: this.operationId, post });
        this.response.set(post);
        // Solo il successo svuota la bozza: un errore la lascia modificabile.
        this.title.set('');
        this.body.set('');
        this.status.set('POST completato: risposta ricevuta e bozza svuotata.');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.describeError(error));
        this.status.set('POST terminato con errore: la bozza è conservata per riprovare.');
      },
    });
  }

  cancel(): void {
    if (!this.loading()) return;

    // L'annullamento ferma l'attesa nel client. Una scrittura già accettata
    // dal server non viene annullata da unsubscribe.
    this.request?.unsubscribe();
    this.status.set('POST annullato dal client: la bozza resta invariata.');
  }

  reset(): void {
    this.request?.unsubscribe();
    this.operationId = 0;
    this.title.set('');
    this.body.set('');
    this.created.set(null);
    this.error.set(null);
    this.requestPreview.set(null);
    this.response.set(null);
    this.status.set('Demo ripristinata: campi vuoti e nessuna risposta POST.');
  }

  private describeError(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Nessuna risposta HTTP ricevuta (stato 0): controlla la rete o il blocco del browser.';
    }

    return 'POST non riuscito (stato ' + error.status + '). La bozza è conservata.';
  }
}`,
  files: {
    'app.config.ts': APP_CONFIG,
    'posts.service.ts': POST_SERVICE,
  },
  html: `<section class="http" aria-labelledby="post-title-heading">
  <header class="http__header">
    <h3 id="post-title-heading" class="http__title">Un nuovo post, senza persistenza</h3>
    <p class="http__hint">
      Titolo e testo vengono tagliati agli estremi prima dell’invio. La risposta non crea una risorsa persistita.
    </p>
  </header>

  <div class="http__fields">
    <!-- ngModel legge la bozza; ngModelChange la aggiorna tramite i metodi del componente. -->
    <!-- I campi restano modificabili finché una richiesta non è in corso. -->
    <mat-form-field class="http__field" appearance="outline" subscriptSizing="dynamic">
      <mat-label>Titolo del nuovo post</mat-label>
      <input
        matInput
        id="post-title"
        type="text"
        required
        [ngModel]="title()"
        (ngModelChange)="setTitle($event)"
        [disabled]="loading()"
      />
    </mat-form-field>

    <mat-form-field class="http__field" appearance="outline" subscriptSizing="dynamic">
      <mat-label>Testo del nuovo post</mat-label>
      <textarea
        matInput
        id="post-body"
        rows="3"
        required
        [ngModel]="body()"
        (ngModelChange)="setBody($event)"
        [disabled]="loading()"
      ></textarea>
    </mat-form-field>
  </div>

  <p class="http__status" role="status">
    {{ canSubmit() ? 'Contenuto pronto: il payload verrà normalizzato con trim().' : 'POST disabilitato: completa titolo e testo con almeno un carattere.' }}
  </p>

  <div class="http__actions">
    <button
      matButton="filled"
      type="button"
      (click)="submit()"
      [disabled]="loading() || !canSubmit()"
    >Invia POST simulato</button>

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

  <!-- La nota di simulazione resta accanto all'azione di scrittura. -->
  <p class="http__note">
    <strong>Scrittura simulata:</strong> JSONPlaceholder risponde ma non salva il post.
    L’ID restituito può ripetersi (per esempio 101) e non viene aggiunto a una lista GET.
  </p>

  @if (error()) {
    <p class="http__error" role="alert">{{ error() }}</p>
  }

  <section class="http__created" aria-labelledby="created-title">
    <h4 id="created-title" class="http__subtitle">Ultima risposta POST di questa visita</h4>

    @if (created(); as result) {
      <article class="created" [attr.data-operation-id]="result.operationId">
        <p class="created__eyebrow">Operazione locale {{ result.operationId }} · ID API {{ result.post.id }}</p>
        <h5 class="created__title">{{ result.post.title }}</h5>
        <p class="created__body">{{ result.post.body }}</p>
        <p class="http__hint">
          Questa risposta è distinta dalle risorse GET: non è persistita e non viene inserita nella lista.
        </p>
      </article>
    } @else {
      <p class="http__empty">Nessuna risposta POST ricevuta in questa visita.</p>
    }
  </section>

  <section class="http__exchange" aria-labelledby="post-exchange">
    <h4 id="post-exchange" class="http__subtitle">Osserva l’ultimo scambio</h4>

    <p class="http__label">Richiesta</p>
    @if (requestPreview(); as request) {
      <pre
        class="http__output"
        tabindex="0"
        role="region"
        aria-label="Ultima richiesta HTTP"
      >{{ request | json }}</pre>
    } @else {
      <p class="http__empty">Nessuna richiesta ancora inviata.</p>
    }

    <p class="http__label">Risposta</p>
    @if (loading()) {
      <p class="http__waiting" role="status">In attesa della risposta HTTP…</p>
    }
    @if (response() !== null) {
      <pre
        class="http__output"
        tabindex="0"
        role="region"
        aria-label="Ultima risposta HTTP"
      >{{ response() | json }}</pre>
    } @else if (!loading()) {
      <p class="http__empty">Nessuna risposta ricevuta.</p>
    }
    @if (error()) {
      <p class="http__error">La richiesta è terminata con errore: {{ error() }}</p>
    }
  </section>
</section>`,
  css: `/* Il modulo usa una colonna: i campi restano larghi anche su schermi stretti. */
.http {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  font-size: max(1rem, 16px);
}

.http__header,
.http__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
}

.http__actions {
  gap: 0.5rem;
}

.http__fields {
  display: grid;
  gap: 0.75rem;
}

.http__field {
  width: 100%;
}

.http__title,
.http__subtitle,
.http__hint,
.http__status,
.http__error,
.http__empty,
.http__waiting,
.http__label,
.http__note {
  margin: 0;
}

.http__title {
  font: var(--mat-sys-title-medium);
}

.http__subtitle {
  font: var(--mat-sys-title-small);
}

.http__hint {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* La nota di simulazione ha una superficie secondaria: non è un errore. */
.http__note {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.http__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-medium);
}

.http__error {
  color: var(--mat-sys-error);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* La risposta creata ha un aspetto distinto dalle card della lista. */
.created {
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-primary);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
}

.created__eyebrow {
  margin: 0;
  font: var(--mat-sys-label-large);
}

.created__title,
.created__body {
  margin: 0;
  overflow-wrap: anywhere;
}

.created__title {
  font: var(--mat-sys-title-small);
}

.created__body {
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.http__created,
.http__exchange {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.http__label {
  color: var(--mat-sys-primary);
  font: var(--mat-sys-label-large);
}

.http__waiting {
  padding: 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font: var(--mat-sys-body-medium);
}

/* Il JSON inviato e ricevuto resta leggibile e circoscritto. */
.http__output {
  max-height: 16rem;
  margin: 0;
  padding: 0.75rem;
  overflow: auto;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: max(1rem, 16px);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}`,
};

const WRITES_SOURCES: PlaygroundSources = {
  typescript: `import { JsonPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription, finalize } from 'rxjs';
import { POSTS_URL, Post, PostsService } from './posts.service';

interface RequestPreview {
  method: string;
  url: string;
  body?: unknown;
}

// GET carica la risorsa; PUT e DELETE aggiornano la vista solo dopo il successo.
@Component({
  selector: 'app-http-writes',
  imports: [
    JsonPipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class HttpWrites {
  private readonly postsService = inject(PostsService);
  private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription;

  // La demo usa sempre il post 1: il focus resta sulle scritture, non sulla scelta dell'ID.
  private readonly resourceId = 1;

  readonly resource = signal<Post | null>(null);
  readonly draftTitle = signal('');
  readonly draftBody = signal('');
  readonly canSave = computed(() =>
    this.resource() !== null &&
    this.draftTitle().trim().length > 0 &&
    this.draftBody().trim().length > 0,
  );
  readonly confirmingDelete = signal(false);
  readonly loading = signal(false);
  readonly responseReceived = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal('Nessuna richiesta inviata: carica il post 1 dal server.');
  readonly requestPreview = signal<RequestPreview | null>(null);
  readonly response = signal<unknown>(null);

  setTitle(value: string): void {
    this.draftTitle.set(value);
  }

  setBody(value: string): void {
    this.draftBody.set(value);
  }

  load(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.error.set(null);
    this.confirmingDelete.set(false);
    this.status.set('GET in corso: la risorsa attualmente visibile resta finché non arriva la nuova.');
    this.requestPreview.set({ method: 'GET', url: POSTS_URL + '/' + this.resourceId });

    this.request = this.postsService.getPost(this.resourceId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: post => {
        // La GET è la fonte del server: sostituisce sia la vista sia la bozza.
        this.resource.set(post);
        this.draftTitle.set(post.title);
        this.draftBody.set(post.body);
        this.responseReceived.set(true);
        this.response.set(post);
        this.status.set('GET completata: la risorsa del server è anche nella bozza.');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.describeError('GET', error));
        this.status.set('GET terminata con errore: la risorsa già visibile resta invariata.');
      },
    });
  }

  save(): void {
    const current = this.resource();
    if (!current || this.loading() || !this.canSave()) return;

    // PUT invia l'intera risorsa: id e userId vengono dalla GET, titolo e testo dalla bozza.
    const payload: Post = {
      id: current.id,
      userId: current.userId,
      title: this.draftTitle().trim(),
      body: this.draftBody().trim(),
    };

    this.loading.set(true);
    this.error.set(null);
    this.confirmingDelete.set(false);
    this.status.set('PUT in corso: la vista resta sul valore precedente finché il server non conferma.');
    this.requestPreview.set({ method: 'PUT', url: POSTS_URL + '/' + payload.id, body: payload });

    this.request = this.postsService.updatePost(payload.id, payload).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: updated => {
        // Solo una risposta riuscita cambia la vista locale.
        this.resource.set(updated);
        this.draftTitle.set(updated.title);
        this.draftBody.set(updated.body);
        this.responseReceived.set(true);
        this.response.set(updated);
        this.status.set('PUT riuscito: la vista locale mostra la risposta del server.');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.describeError('PUT', error));
        this.status.set('PUT non riuscito: vista e bozza restano invariate.');
      },
    });
  }

  prepareDelete(): void {
    if (this.loading() || !this.resource()) return;

    // Il primo clic apre solo la conferma: nessuna DELETE è stata inviata.
    this.confirmingDelete.set(true);
    this.status.set('Conferma richiesta: la DELETE parte solo con Conferma DELETE.');
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
    this.status.set('DELETE annullata: nessuna richiesta inviata.');
  }

  remove(): void {
    const current = this.resource();
    if (!current || this.loading() || !this.confirmingDelete()) return;

    this.loading.set(true);
    this.error.set(null);
    this.confirmingDelete.set(false);
    this.responseReceived.set(false);
    this.status.set('DELETE in corso: la risorsa resta visibile finché il server non conferma.');
    this.requestPreview.set({ method: 'DELETE', url: POSTS_URL + '/' + current.id });

    this.request = this.postsService.deletePost(current.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: value => {
        // La rimozione locale avviene solo dopo il successo della DELETE.
        this.resource.set(null);
        this.draftTitle.set('');
        this.draftBody.set('');
        this.responseReceived.set(true);
        this.response.set(value);
        this.status.set('DELETE riuscito: risorsa rimossa dalla vista. Una nuova GET la ripristina.');
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(this.describeError('DELETE', error));
        this.status.set('DELETE non riuscita: la risorsa resta visibile.');
      },
    });
  }

  cancel(): void {
    if (!this.loading()) return;

    // unsubscribe ferma l'attesa del client. Non annulla una scrittura
    // che il server ha già accettato: la vista locale non lo dimostra.
    this.request?.unsubscribe();
    this.status.set('Richiesta annullata dal client: nessun risultato locale applicato.');
  }

  reset(): void {
    this.request?.unsubscribe();
    this.resource.set(null);
    this.draftTitle.set('');
    this.draftBody.set('');
    this.confirmingDelete.set(false);
    this.error.set(null);
    this.responseReceived.set(false);
    this.requestPreview.set(null);
    this.response.set(null);
    this.status.set('Demo ripristinata: carica il post 1 per ricominciare.');
  }

  private describeError(operation: string, error: HttpErrorResponse): string {
    if (error.status === 0) {
      return operation + ': nessuna risposta HTTP ricevuta (stato 0).';
    }

    return operation + ' non riuscita (stato ' + error.status + ').';
  }
}`,
  files: {
    'app.config.ts': APP_CONFIG,
    'posts.service.ts': WRITES_SERVICE,
  },
  html: `<section class="http" aria-labelledby="writes-title">
  <header class="http__header">
    <h3 id="writes-title" class="http__title">Leggi, sostituisci, elimina</h3>
    <p class="http__hint">
      La vista mostra la risorsa del server. PUT e DELETE cambiano la vista locale solo dopo una risposta riuscita.
    </p>
  </header>

  <div class="http__actions">
    <button
      matButton="filled"
      type="button"
      (click)="load()"
      [disabled]="loading()"
    >
      {{ error() ? 'Riprova GET' : resource() ? 'Ricarica GET' : 'Carica risorsa GET' }}
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

  <p class="http__status" role="status">{{ status() }}</p>

  @if (error()) {
    <p class="http__error" role="alert">{{ error() }}</p>
  }

  <!-- La vista riflette solo risposte riuscite: durante l'attesa conserva il valore precedente. -->
  @if (resource(); as post) {
    <article class="resource" data-testid="resource-view">
      <p class="resource__eyebrow">Risorsa visibile · post {{ post.id }}</p>
      <h4 class="resource__title">{{ post.title }}</h4>
      <p class="resource__body">{{ post.body }}</p>
      <p class="http__hint">userId {{ post.userId }} · id {{ post.id }}</p>
    </article>
  } @else {
    <p class="http__empty">Nessuna risorsa visibile: carica il post 1 con la GET.</p>
  }

  <section class="http__write" aria-labelledby="put-title">
    <h4 id="put-title" class="http__subtitle">PUT: sostituisci la risorsa completa</h4>
    <p class="http__hint">
      Il payload include id, userId, title e body. La bozza non modifica la vista finché il server non risponde.
    </p>

    <div class="http__fields">
      <mat-form-field class="http__field" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Titolo da inviare</mat-label>
        <input
          matInput
          id="draft-title"
          type="text"
          [ngModel]="draftTitle()"
          (ngModelChange)="setTitle($event)"
          [disabled]="loading() || !resource()"
        />
      </mat-form-field>

      <mat-form-field class="http__field" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Testo da inviare</mat-label>
        <textarea
          matInput
          id="draft-body"
          rows="3"
          [ngModel]="draftBody()"
          (ngModelChange)="setBody($event)"
          [disabled]="loading() || !resource()"
        ></textarea>
      </mat-form-field>
    </div>

    <!-- Nota di simulazione accanto al pulsante di scrittura. -->
    <p class="http__note">
      <strong>PUT simulato:</strong> il server risponde ma non conserva la modifica. Una nuova GET ripristina il dato originale.
    </p>

    <div class="http__actions">
      <button
        matButton="filled"
        type="button"
        (click)="save()"
        [disabled]="loading() || !canSave()"
      >Invia PUT completo</button>
    </div>
  </section>

  <section class="http__write" aria-labelledby="delete-title">
    <h4 id="delete-title" class="http__subtitle">DELETE: conferma dentro la pagina</h4>
    <p class="http__hint">
      Il primo pulsante prepara la conferma. Solo Conferma DELETE invia la richiesta.
    </p>

    @if (resource()) {
      @if (confirmingDelete()) {
        <div class="delete-confirm" role="group" aria-label="Conferma eliminazione">
          <p class="http__hint">Eliminare la risorsa solo dalla vista locale?</p>
          <div class="http__actions">
            <button
              matButton="filled"
              type="button"
              (click)="remove()"
              [disabled]="loading()"
            >Conferma DELETE</button>
            <button
              matButton="outlined"
              type="button"
              (click)="cancelDelete()"
              [disabled]="loading()"
            >Annulla eliminazione</button>
          </div>
        </div>
      } @else {
        <div class="http__actions">
          <button
            matButton="outlined"
            type="button"
            (click)="prepareDelete()"
            [disabled]="loading()"
          >Prepara DELETE</button>
        </div>
      }

      <!-- La stessa avvertenza accompagna anche la scrittura DELETE. -->
      <p class="http__note">
        <strong>DELETE simulato:</strong> la risposta non elimina una risorsa persistita; una nuova GET la riporta.
      </p>
    } @else {
      <p class="http__empty">Carica una risorsa per abilitare la DELETE.</p>
    }
  </section>

  <section class="http__exchange" aria-labelledby="writes-exchange">
    <h4 id="writes-exchange" class="http__subtitle">Osserva l’ultimo scambio</h4>

    <p class="http__label">Richiesta</p>
    @if (requestPreview(); as request) {
      <pre
        class="http__output"
        tabindex="0"
        role="region"
        aria-label="Ultima richiesta HTTP"
      >{{ request | json }}</pre>
    } @else {
      <p class="http__empty">Nessuna richiesta ancora inviata.</p>
    }

    <p class="http__label">Risposta</p>
    @if (loading()) {
      <p class="http__waiting" role="status">In attesa della risposta HTTP…</p>
    }
    @if (responseReceived()) {
      @if (response() === null) {
        <p class="http__empty">Risposta ricevuta senza contenuto.</p>
      } @else {
        <pre
          class="http__output"
          tabindex="0"
          role="region"
          aria-label="Ultima risposta HTTP"
        >{{ response() | json }}</pre>
      }
    } @else if (!loading()) {
      <p class="http__empty">Nessuna risposta ricevuta.</p>
    }
    @if (error()) {
      <p class="http__error">La richiesta è terminata con errore: {{ error() }}</p>
    }
  </section>
</section>`,
  css: `/* Il pannello delle scritture usa una griglia a una colonna con sezioni separate. */
.http {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-medium);
  background: var(--mat-sys-surface-container-low);
  color: var(--mat-sys-on-surface);
  font-size: max(1rem, 16px);
}

.http__header,
.http__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.75rem;
}

.http__actions {
  gap: 0.5rem;
}

.http__title,
.http__subtitle,
.http__hint,
.http__status,
.http__error,
.http__empty,
.http__waiting,
.http__label,
.http__note {
  margin: 0;
}

.http__title {
  font: var(--mat-sys-title-medium);
}

.http__subtitle {
  font: var(--mat-sys-title-small);
}

.http__hint {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.http__status {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
  font: var(--mat-sys-body-medium);
}

.http__error {
  color: var(--mat-sys-error);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* La risorsa visibile è la fonte del server, con bordo primario. */
.resource {
  padding: 0.75rem;
  border-inline-start: 0.25rem solid var(--mat-sys-primary);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.resource__eyebrow {
  margin: 0;
  color: var(--mat-sys-primary);
  font: var(--mat-sys-label-large);
}

.resource__title,
.resource__body {
  margin: 0;
  overflow-wrap: anywhere;
}

.resource__title {
  font: var(--mat-sys-title-small);
}

.resource__body {
  color: var(--mat-sys-on-surface-variant);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

/* PUT e DELETE hanno riquadri distinti per non confondere le due scritture. */
.http__write {
  display: grid;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.http__fields {
  display: grid;
  gap: 0.75rem;
}

.http__field {
  width: 100%;
}

/* La nota di simulazione non è un errore: usa la superficie secondaria. */
.http__note {
  padding: 0.75rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font: var(--mat-sys-body-medium);
  line-height: 1.6;
}

.delete-confirm {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-error);
  border-radius: var(--mat-sys-corner-small);
}

.http__exchange {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--mat-sys-outline-variant);
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface);
}

.http__label {
  color: var(--mat-sys-primary);
  font: var(--mat-sys-label-large);
}

.http__waiting {
  padding: 0.5rem;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-secondary-container);
  color: var(--mat-sys-on-secondary-container);
  font: var(--mat-sys-body-medium);
}

/* Il JSON può contenere il payload completo o la risposta della DELETE. */
.http__output {
  max-height: 16rem;
  margin: 0;
  padding: 0.75rem;
  overflow: auto;
  border-radius: var(--mat-sys-corner-small);
  background: var(--mat-sys-surface-container-highest);
  color: var(--mat-sys-on-surface);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: max(1rem, 16px);
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}`,
};

/** Four independent runnable examples; every request starts from an explicit user action. */
export const HTTP_EXAMPLES: readonly LessonExample[] = [
  {
    id: 'list',
    label: '1. GET lista',
    title: 'Caricare una lista e osservare l’attesa',
    prompt:
      'Premi **Carica lista GET** e osserva attesa, anteprima dei primi cinque post e risposta completa. Nel servizio aggiungi `?userId=0` a `POSTS_URL` per ottenere una lista vuota. **Annulla richiesta** interrompe l’attesa.',
    takeaway:
      '`HttpClient.get` restituisce un `Observable` freddo: la richiesta parte con `subscribe`. `next` porta i dati, `error` l’esito negativo e `finalize` chiude l’attesa. `unsubscribe` annulla l’attesa; non garantisce di annullare un’operazione già accettata dal server.',
    sources: LIST_SOURCES,
    diagram: LIST_DIAGRAM,
  },
  {
    id: 'detail',
    label: '2. GET per ID',
    title: 'Un dettaglio scelto dall’ID',
    prompt:
      'Inserisci un **intero positivo** e premi Leggi dettaglio. Prova 999 per vedere il 404: il dettaglio precedente sparisce subito. Torna a 1 per recuperare una risposta valida.',
    takeaway:
      'Un ID non valido viene fermato prima della richiesta. Una nuova GET svuota il dettaglio precedente, così un 404 non lascia in vista dati obsoleti. Il generico `get<Post>` non valida il JSON a runtime.',
    sources: DETAIL_SOURCES,
    diagram: DETAIL_DIAGRAM,
  },
  {
    id: 'post',
    label: '3. POST',
    title: 'Inviare una bozza normalizzata',
    prompt:
      'Compila titolo e testo, anche con spazi agli estremi: il payload viene tagliato con `trim()`. Un errore conserva la bozza; il successo la svuota. Due POST possono ricevere lo stesso ID 101, ma l’operazione locale resta distinta.',
    takeaway:
      '`POST` invia la bozza al server. JSONPlaceholder simula la creazione: la risposta non è persistita e non entra nella lista GET. Il generico descrive il tipo atteso, non convalida il JSON.',
    sources: POST_SOURCES,
    diagram: POST_DIAGRAM,
  },
  {
    id: 'writes',
    label: '4. PUT e DELETE',
    title: 'Scrivere solo dopo la conferma del server',
    prompt:
      'Carica la risorsa, modifica titolo o testo e invia il **PUT completo**. Se la richiesta fallisce, vista e bozza restano invariate. Poi elimina con **Prepara DELETE** e **Conferma DELETE**. Una nuova GET ripristina il dato del server.',
    takeaway:
      'La vista locale cambia solo in `next`, cioè dopo che il server ha confermato. `PUT` sostituisce l’intera risorsa; `DELETE` qui non invia un payload e richiede una conferma nella pagina. Ripetere la GET mostra che le scritture sono simulate.',
    sources: WRITES_SOURCES,
    diagram: WRITES_DIAGRAM,
  },
];
