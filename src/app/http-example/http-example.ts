// COMPONENT TYPE: Container
// ROLE: Make request, response and transient UI state visible without implying persistence.
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription, finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PostsService, Post } from '../../services/posts.service';
import { CodeBlock } from '../components/code-block/code-block';
import { LessonShell } from '../components/lesson-shell/lesson-shell';
import { LessonDisclosure } from '../components/lesson-disclosure/lesson-disclosure';

interface RequestPreview { method: string; url: string; body?: unknown }
interface CreationResult { operationId: number; post: Post }
const API = 'https://jsonplaceholder.typicode.com/posts';

@Component({
  selector: 'app-http-example',
  imports: [JsonPipe, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, CodeBlock, LessonShell, LessonDisclosure],
  templateUrl: './http-example.html',
  styleUrl: './http-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpExample {
  private readonly postsService = inject(PostsService);
  private readonly destroyRef = inject(DestroyRef);
  private requestSubscription?: Subscription;
  private operationId = 0;
  readonly posts = signal<Post[]>([]);
  readonly selectedPost = signal<Post | null>(null);
  readonly creations = signal<CreationResult[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly status = signal('Nessuna richiesta inviata. Inizia caricando la lista.');
  readonly request = signal<RequestPreview | null>(null);
  readonly response = signal<unknown>(null);
  readonly detailId = signal(1);
  readonly validId = computed(() => Number.isInteger(this.detailId()) && this.detailId() > 0);
  readonly newPost = signal({ userId: 1, title: '', body: '' });
  readonly canCreate = computed(() => !!this.newPost().title.trim() && !!this.newPost().body.trim());
  readonly deleteConfirmation = signal<number | null>(null);

  readonly setupCode = `// app.config.ts: provide the HTTP client once in the application.
import { provideHttpClient } from '@angular/common/http';
// Add provideHttpClient() to ApplicationConfig.providers.

// posts.service.ts: facade fragment (Post is the response interface).
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly http = inject(HttpClient);
  private readonly url = 'https://jsonplaceholder.typicode.com/posts';
  getPosts(): Observable<Post[]> { return this.http.get<Post[]>(this.url); }
  getPost(id: number): Observable<Post> { return this.http.get<Post>(this.url + '/' + id); }
  createPost(body: Omit<Post, 'id'>): Observable<Post> {
    return this.http.post<Post>(this.url, body);
  }
  updatePost(id: number, body: Post): Observable<Post> {
    return this.http.put<Post>(this.url + '/' + id, body);
  }
  deletePost(id: number): Observable<void> {
    return this.http.delete<void>(this.url + '/' + id);
  }
}`;
  readonly subscriptionCode = `// Component class fragment. Import inject, DestroyRef, signal from @angular/core,
// takeUntilDestroyed from @angular/core/rxjs-interop, finalize from rxjs.
private readonly service = inject(PostsService);
private readonly destroyRef = inject(DestroyRef);
posts = signal<Post[]>([]);
loading = signal(false);
error = signal<string | null>(null);

loadPosts(): void {
  if (this.loading()) return;
  this.loading.set(true);
  this.error.set(null);
  this.service.getPosts().pipe(
    takeUntilDestroyed(this.destroyRef),
    finalize(() => this.loading.set(false)),
  ).subscribe({
    next: posts => this.posts.set(posts.slice(0, 10)),
    error: () => this.error.set('Caricamento non riuscito. Riprova.'),
  });
}
// Retain the returned Subscription to allow an explicit unsubscribe() cancellation,
// as the live demo does. Do not subscribe a second time just to log the same request.`;
  readonly mutationCode = `// Component method fragments; subscribe using the same loading/error/cleanup
// pattern as GET. Read results only inside next, not immediately after subscribe().
this.service.createPost({ userId: 1, title: 'Titolo', body: 'Testo' }); // POST
this.service.updatePost(1, { id: 1, userId: 1, title: 'Nuovo', body: 'Testo' }); // PUT
this.service.deletePost(1); // DELETE
// These calls RETURN cold Observables: subscribe() starts each request.
// JSONPlaceholder simulates writes. Keep POST response history separate from GET resources.
// PUT/DELETE change only the local preview after the simulated response succeeds.`;

  loadPosts(): void {
    this.execute('GET', '', undefined, this.postsService.getPosts(), posts => {
      this.posts.set(posts.slice(0, 10));
      this.selectedPost.set(null);
      this.loaded.set(true);
      this.status.set(`Lista ricevuta: ${posts.length} post, anteprima dei primi 10. Le modifiche locali sono sostituite dai dati remoti.`);
    });
  }

  loadPost(id: number): void {
    if (!Number.isInteger(id) || id < 1) return;
    if (this.loading()) return;
    this.selectedPost.set(null);
    this.execute('GET', '/' + id, undefined, this.postsService.getPost(id), post => {
      this.selectedPost.set(post);
      this.status.set(`Dettaglio ${post.id} ricevuto. Non modifica la lista.`);
    });
  }

  createPost(): void {
    if (!this.canCreate()) return;
    const payload = { ...this.newPost(), title: this.newPost().title.trim(), body: this.newPost().body.trim() };
    this.execute('POST', '', payload, this.postsService.createPost(payload), post => {
      this.creations.update(results => [...results, { operationId: ++this.operationId, post }]);
      this.newPost.set({ userId: 1, title: '', body: '' });
      this.status.set(`POST simulato ricevuto con ID ${post.id}. Non è stato salvato e non è aggiunto alla lista GET.`);
    });
  }

  updatePost(post: Post): void {
    if (!this.posts().some(resource => resource.id === post.id)) return;
    const payload = { ...post, title: post.title + ' (modificato)' };
    this.execute('PUT', '/' + post.id, payload, this.postsService.updatePost(post.id, payload), updated => {
      this.posts.update(posts => posts.map(item => item.id === post.id ? updated : item));
      if (this.selectedPost()?.id === post.id) this.selectedPost.set(updated);
      this.status.set(`PUT ${post.id} riuscito: anteprima locale aggiornata. Il server non conserva la modifica.`);
    });
  }

  requestDelete(id: number): void {
    if (this.loading() || !this.posts().some(post => post.id === id)) return;
    this.deleteConfirmation.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmation.set(null);
    this.status.set('Eliminazione annullata: nessuna richiesta DELETE inviata.');
  }

  deletePost(id: number): void {
    if (this.deleteConfirmation() !== id || !this.posts().some(post => post.id === id)) return;
    this.execute('DELETE', '/' + id, undefined, this.postsService.deletePost(id), () => {
      this.posts.update(posts => posts.filter(post => post.id !== id));
      if (this.selectedPost()?.id === id) this.selectedPost.set(null);
      this.status.set(`DELETE ${id} riuscito: rimosso dall’anteprima locale. Una nuova GET lo ripristina.`);
    });
  }

  cancelRequest(): void {
    if (!this.loading()) return;
    this.requestSubscription?.unsubscribe();
    this.status.set('Richiesta annullata dal client. Nessun risultato applicato; una scrittura già ricevuta dal server non viene annullata automaticamente.');
  }

  reset(): void {
    this.requestSubscription?.unsubscribe();
    this.posts.set([]); this.selectedPost.set(null); this.creations.set([]);
    this.loaded.set(false); this.error.set(null); this.request.set(null); this.response.set(null);
    this.deleteConfirmation.set(null); this.detailId.set(1);
    this.newPost.set({ userId: 1, title: '', body: '' });
    this.status.set('Demo ripristinata. Nessuna richiesta in corso.');
  }

  updateTitle(title: string): void { this.newPost.update(post => ({ ...post, title })); }
  updateBody(body: string): void { this.newPost.update(post => ({ ...post, body })); }

  private execute<T>(method: string, path: string, body: unknown, source: Observable<T>, success: (value: T) => void): void {
    if (this.loading()) return;
    this.loading.set(true); this.error.set(null); this.response.set(null);
    this.deleteConfirmation.set(null);
    this.request.set({ method, url: API + path, ...(body === undefined ? {} : { body }) });
    this.status.set(`${method} in corso. Puoi annullare l’attesa.`);
    this.requestSubscription = source.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: value => { this.response.set(value ?? {}); success(value); },
      error: (error: HttpErrorResponse) => {
        this.error.set(`${method} non riuscito (${error.status || 'rete'}). Controlla la connessione e riprova l’operazione.`);
        this.status.set('Richiesta terminata con errore. I dati precedenti sono conservati.');
      },
    });
  }
}
