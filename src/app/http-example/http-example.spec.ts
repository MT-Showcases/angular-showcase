// Verify UI actions against actual HttpClient contracts without using the public network.
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { HttpExample } from './http-example';
const API = 'https://jsonplaceholder.typicode.com/posts';
const post = { id: 1, userId: 1, title: 'Primo', body: 'Contenuto remoto' };

describe('HTTP lesson', () => {
  let fixture: ComponentFixture<HttpExample>;
  let http: HttpTestingController;
  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [HttpExample], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(HttpExample);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });
  afterEach(() => http.verify());
  function text(): string { return fixture.nativeElement.textContent; }
  async function click(label: string): Promise<void> {
    await (await TestbedHarnessEnvironment.loader(fixture).getHarness(MatButtonHarness.with({ text: label }))).click();
  }
  async function action(label: string): Promise<void> {
    await (await TestbedHarnessEnvironment.loader(fixture).getHarness(MatButtonHarness.with({ selector: `[aria-label="${label}"]` }))).click();
  }
  async function load(): Promise<void> {
    await click(fixture.componentInstance.loaded() ? 'Ricarica lista GET' : 'Carica lista GET');
    const req = http.expectOne(API); expect(req.request.method).toBe('GET');
    req.flush([post]); await fixture.whenStable();
  }
  async function draft(title = '  Titolo  ', body = '  Corpo  '): Promise<void> {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await (await loader.getHarness(MatInputHarness.with({ selector: 'input[required]' }))).setValue(title);
    await (await loader.getHarness(MatInputHarness.with({ selector: 'textarea' }))).setValue(body);
  }

  it('does not auto-fetch and shows loading, a returned list, empty response and retry', async () => {
    http.expectNone(API);
    await click('Carica lista GET');
    expect(fixture.componentInstance.loading()).toBe(true);
    expect(await (await TestbedHarnessEnvironment.loader(fixture).getHarness(MatButtonHarness.with({ text: 'Carica lista GET' }))).isDisabled()).toBe(true);
    http.expectOne(API).flush('No', { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable(); expect(text()).toContain('GET non riuscito (503)');
    await load(); expect(text()).not.toContain('GET non riuscito'); expect(text()).toContain('Primo');
    await click('Ricarica lista GET'); http.expectOne(API).flush([]);
    await fixture.whenStable(); expect(text()).toContain('La lista è vuota');
  });

  it('reads a detail by ID and clears stale detail before a failed second request', async () => {
    await click('Leggi ID'); const req = http.expectOne(API + '/1');
    expect(req.request.method).toBe('GET'); req.flush(post); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-testid="post-detail"]').textContent).toContain('Primo');
    const input = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatInputHarness.with({ selector: 'input[type="number"]' }));
    await input.setValue('999'); await click('Leggi ID');
    http.expectOne(API + '/999').flush({}, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable(); expect(fixture.nativeElement.querySelector('[data-testid="post-detail"]')).toBeNull();
    expect(text()).toContain('404');
  });

  it('normalizes POST and keeps repeated fake ID responses distinct from fetched resources', async () => {
    await load();
    for (let index = 0; index < 2; index++) {
      await draft(); await click('Invia POST simulato');
      const req = http.expectOne(API); expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ userId: 1, title: 'Titolo', body: 'Corpo' });
      req.flush({ id: 101, ...req.request.body }); await fixture.whenStable();
    }
    expect(fixture.componentInstance.posts()).toEqual([post]);
    const rows = [...fixture.nativeElement.querySelectorAll('[data-operation-id]')] as HTMLElement[];
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map(row => row.dataset['operationId'])).size).toBe(2);
    expect(rows.every(row => row.querySelector('button') === null)).toBe(true);
  });

  it('rejects whitespace and retains the draft after failed POST, then clears error on success', async () => {
    await draft('   ', 'text');
    const submit = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatButtonHarness.with({ text: 'Invia POST simulato' }));
    expect(await submit.isDisabled()).toBe(true); await submit.click(); http.expectNone(API);
    await draft('Title', 'Body'); await submit.click();
    http.expectOne(API).flush({}, { status: 500, statusText: 'Failure' }); await fixture.whenStable();
    expect(fixture.componentInstance.newPost().title).toBe('Title');
    await submit.click(); http.expectOne(API).flush({ ...post, id: 101 }); await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBeNull(); expect(fixture.componentInstance.newPost().title).toBe('');
  });

  it('sends full PUT and changes the local preview only after success, clearing earlier errors', async () => {
    await load();
    await action('Modifica post 1'); const failed = http.expectOne(API + '/1');
    expect(failed.request.method).toBe('PUT'); expect(failed.request.body).toEqual({ ...post, title: 'Primo (modificato)' });
    failed.flush({}, { status: 500, statusText: 'Failure' }); await fixture.whenStable();
    expect(fixture.componentInstance.posts()).toEqual([post]);
    await action('Modifica post 1'); http.expectOne(API + '/1').flush({ ...post, title: 'Primo (modificato)' }); await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBeNull(); expect(fixture.componentInstance.posts()[0].title).toContain('(modificato)');
    await load(); expect(fixture.componentInstance.posts()[0].title).toBe('Primo');
  });

  it('requires inline DELETE confirmation, permits cancellation and recovers from a failed deletion', async () => {
    await load(); await action('Elimina post 1'); await click('Annulla eliminazione'); http.expectNone(API + '/1');
    await action('Elimina post 1'); await click('Conferma DELETE 1');
    const failed = http.expectOne(API + '/1'); expect(failed.request.method).toBe('DELETE');
    failed.flush({}, { status: 500, statusText: 'Failure' }); await fixture.whenStable();
    expect(fixture.componentInstance.posts()).toHaveLength(1);
    await action('Elimina post 1'); await click('Conferma DELETE 1'); http.expectOne(API + '/1').flush({}); await fixture.whenStable();
    expect(fixture.componentInstance.posts()).toHaveLength(0); expect(fixture.componentInstance.error()).toBeNull();
  });

  it('cancels pending requests explicitly and on component destruction without applying results', async () => {
    await click('Carica lista GET'); const canceled = http.expectOne(API);
    await click('Annulla richiesta'); expect(canceled.cancelled).toBe(true); expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.posts()).toEqual([]);
    await click('Carica lista GET'); const leaving = http.expectOne(API);
    fixture.destroy(); expect(leaving.cancelled).toBe(true);
  });

  it('resets a pending operation and all local inputs and results', async () => {
    await load(); await draft(); await click('Invia POST simulato'); const pending = http.expectOne(API);
    await click('Ripristina demo'); expect(pending.cancelled).toBe(true);
    expect(fixture.componentInstance.posts()).toEqual([]); expect(fixture.componentInstance.creations()).toEqual([]);
    expect(fixture.componentInstance.request()).toBeNull(); expect(fixture.componentInstance.error()).toBeNull();
    expect(fixture.componentInstance.newPost()).toEqual({ userId: 1, title: '', body: '' });
  });
});
