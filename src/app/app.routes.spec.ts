import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideStore } from '@ngrx/store';
import { routes } from './app.routes';
import { appReducers } from './store/app.reducers';
import { TOPICS } from './learning/topics';

// Verify lazy imports, templates and required providers together after dependency upgrades.
describe('Showcase routes', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideStore(appReducers),
      ],
    }),
  );

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  const pages = [
    ['/', 'Angular Showcase'],
    ['/basics', 'Le basi di Angular'],
    ['/advanced', 'Approfondisci Angular'],
    ['/basics/data-binding', 'Data Binding'],
    ['/basics/directives', 'Control flow e direttive'],
    ['/basics/forms', 'Reactive Forms'],
    ['/basics/getting-started', 'Il primo componente'],
    ['/basics/components', 'Comunicazione tra componenti'],
    ['/basics/pipes', 'Pipes'],
    ['/basics/services', 'Servizi e dependency injection'],
    ['/basics/routing', 'Routing'],
    ['/advanced/signals', 'Signals'],
    ['/advanced/http', 'HTTP e servizi'],
    ['/state/rxjs', 'RxJS: flussi e sottoscrizioni'],
    ['/state/ngrx', 'NgRx - State Management'],
    ['/state/behavior-subject', 'BehaviorSubject'],
    ['/examples/users', 'Lista Utenti'],
    ['/code-block-demo', 'CodeBlock Component'],
    ['/design-system', 'Design system'],
  ];

  for (const [url, title] of pages) {
    it(`renders ${url}`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(url);
      if (url === '/examples/users') {
        TestBed.inject(HttpTestingController)
          .expectOne('https://jsonplaceholder.typicode.com/users')
          .flush([]);
        await harness.fixture.whenStable();
      }
      expect(harness.routeNativeElement?.textContent).toContain(title);
    });
  }

  it('exposes every published topic from its category and Home', async () => {
    const harness = await RouterTestingHarness.create('/');
    const home = harness.routeNativeElement!;
    for (const topic of TOPICS.filter(topic => topic.published)) {
      expect(home.querySelector(`a[href="${topic.route}"]`)).not.toBeNull();
    }
    for (const category of ['basics', 'advanced', 'state']) {
      await harness.navigateByUrl('/' + category);
      for (const topic of TOPICS.filter(topic => topic.category === category && topic.published)) {
        expect(harness.routeNativeElement!.querySelector(`a[href="${topic.route}"]`)).not.toBeNull();
      }
    }
  });

  it('offers working overview pages for the State and Examples dropdowns', async () => {
    const harness = await RouterTestingHarness.create('/state');
    const sections = [
      { url: '/state', links: ['/state/rxjs', '/state/behavior-subject', '/state/ngrx'] },
      { url: '/examples', links: ['/examples/users', '/design-system'] },
    ];

    for (const section of sections) {
      await harness.navigateByUrl(section.url);
      const page = harness.routeNativeElement!;
      expect(page.querySelectorAll('h1')).toHaveLength(1);
      expect(page.querySelector('h1')?.textContent?.trim()).toBeTruthy();
      for (const link of section.links) {
        expect(page.querySelector(`a[href="${link}"]`)).not.toBeNull();
      }
    }
  });

  it('recovers legacy routing URLs and keeps the playground mounted at code anchors', async () => {
    const harness = await RouterTestingHarness.create('/basics/routing/detail/2?mode=compact');
    const router = TestBed.inject(Router);
    expect(router.url.split('?')[0]).toBe('/basics/routing');
    const page = harness.routeNativeElement!;
    const frame = page.querySelector('iframe');
    expect(frame).not.toBeNull();
    await harness.navigateByUrl('/basics/routing#code');
    expect(router.url).toBe('/basics/routing#code');
    expect(page.querySelector('iframe')).toBe(frame);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
  });

  it('keeps the Signals playground mounted while opening its code anchor', async () => {
    const harness = await RouterTestingHarness.create('/advanced/signals');
    const page = harness.routeNativeElement!;
    const frame = page.querySelector('iframe');
    expect(frame).not.toBeNull();
    expect(page.querySelectorAll('iframe')).toHaveLength(1);

    await harness.navigateByUrl('/advanced/signals#code');
    expect(TestBed.inject(Router).url).toBe('/advanced/signals#code');
    expect(page.querySelector('iframe')).toBe(frame);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
  });

  it('updates the NgRx counter, history and action log from the demo UI', async () => {
    const harness = await RouterTestingHarness.create('/state/ngrx');
    const page = harness.routeNativeElement!;
    Array.from(page.querySelectorAll<HTMLButtonElement>('.tab'))
      .find((button) => button.textContent?.includes('Counter Demo'))!
      .click();
    await harness.fixture.whenStable();
    page.querySelector<HTMLButtonElement>('.btn-increment')!.click();
    await harness.fixture.whenStable();
    expect(page.querySelector('.count-value')?.textContent?.trim()).toBe('1');
    expect(page.querySelector('.history-list')?.textContent).toContain('1');
    expect(page.querySelector('.log-list')?.textContent).toContain('INCREMENT');
  });

  it('recreates the isolated HTTP preview after leaving and returning to the lesson', async () => {
    const harness = await RouterTestingHarness.create('/advanced/http');
    const frame = harness.routeNativeElement!.querySelector('iframe');
    expect(frame).not.toBeNull();
    TestBed.inject(HttpTestingController).expectNone('https://jsonplaceholder.typicode.com/posts');

    await harness.navigateByUrl('/basics');
    expect(harness.routeNativeElement?.textContent).toContain('Le basi di Angular');
    expect(harness.routeNativeElement?.querySelector('iframe')).toBeNull();
    await harness.navigateByUrl('/advanced/http');
    const freshFrame = harness.routeNativeElement!.querySelector('iframe');
    expect(freshFrame).not.toBeNull();
    expect(freshFrame).not.toBe(frame);
  });

  it('keeps the HTTP editor visible and preview mounted at its code anchor', async () => {
    const harness = await RouterTestingHarness.create('/advanced/http');
    const page = harness.routeNativeElement!;
    const frame = page.querySelector('iframe');
    expect(frame).not.toBeNull();

    await harness.navigateByUrl('/advanced/http#code');
    expect(TestBed.inject(Router).url).toBe('/advanced/http#code');
    expect(page.querySelector('iframe')).toBe(frame);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
  });

  it('keeps the NgRx todo add, complete, filter and delete flow working', async () => {
    const harness = await RouterTestingHarness.create('/state/ngrx');
    const page = harness.routeNativeElement!;
    Array.from(page.querySelectorAll<HTMLButtonElement>('.tab'))
      .find((button) => button.textContent?.includes('Todo Demo'))!.click();
    await harness.fixture.whenStable();
    const input = page.querySelector<HTMLInputElement>('.todo-input')!;
    input.value = 'Verify Angular upgrade';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
    page.querySelector<HTMLButtonElement>('.btn-add')!.click();
    await harness.fixture.whenStable();
    expect(input.value).toBe('');
    let added = Array.from(page.querySelectorAll<HTMLElement>('.todo-item'))
      .find((item) => item.textContent?.includes('Verify Angular upgrade'))!;
    expect(added).toBeTruthy();
    added.querySelector<HTMLInputElement>('.todo-checkbox')!.click();
    await harness.fixture.whenStable();
    Array.from(page.querySelectorAll<HTMLButtonElement>('.filter-btn'))
      .find((button) => button.textContent?.includes('Completati'))!.click();
    await harness.fixture.whenStable();
    added = Array.from(page.querySelectorAll<HTMLElement>('.todo-item'))
      .find((item) => item.textContent?.includes('Verify Angular upgrade'))!;
    expect(added.classList.contains('completed')).toBe(true);
    added.querySelector<HTMLButtonElement>('.btn-delete')!.click();
    await harness.fixture.whenStable();
    expect(page.querySelector('.todo-list')?.textContent).not.toContain('Verify Angular upgrade');
  });

  it('keeps the BehaviorSubject playground mounted at its visible code anchor', async () => {
    const harness = await RouterTestingHarness.create('/state/behavior-subject');
    const page = harness.routeNativeElement!;
    const frame = page.querySelector('iframe');
    expect(frame).not.toBeNull();
    expect(page.querySelectorAll('iframe')).toHaveLength(1);
    await harness.navigateByUrl('/state/behavior-subject#code');
    expect(TestBed.inject(Router).url).toBe('/state/behavior-subject#code');
    expect(page.querySelector('iframe')).toBe(frame);
    expect(page.querySelector('#code')?.closest('mat-expansion-panel')).toBeNull();
  });

  it('filters and deletes users after the HTTP response', async () => {
    const harness = await RouterTestingHarness.create('/examples/users');
    const page = harness.routeNativeElement!;
    TestBed.inject(HttpTestingController)
      .expectOne('https://jsonplaceholder.typicode.com/users')
      .flush([
        { id: 1, name: 'Ada Lovelace', username: 'ada', email: 'ada@example.com' },
        { id: 2, name: 'Grace Hopper', username: 'grace', email: 'grace@example.com' },
      ]);
    await harness.fixture.whenStable();
    expect(page.querySelectorAll('app-user-card').length).toBe(2);
    const input = page.querySelector<HTMLInputElement>('.search-box__input')!;
    input.value = 'ada@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
    expect(page.querySelectorAll('app-user-card').length).toBe(1);
    expect(page.querySelector('.user-card__name')?.textContent).toContain('Ada Lovelace');
    page.querySelector<HTMLButtonElement>('.user-card__delete-btn')!.click();
    await harness.fixture.whenStable();
    expect(page.querySelector('.user-list__empty')).toBeTruthy();
  });

  it('keeps the control-flow playground mounted while opening optional explanation', async () => {
    const harness = await RouterTestingHarness.create('/basics/directives');
    const page = harness.routeNativeElement!;
    const frame = page.querySelector('iframe');
    const editor = page.querySelector('.cm-editor');
    const explanation = page.querySelector<HTMLElement>('#deepen mat-expansion-panel-header')!;
    expect(frame).toBeTruthy();
    expect(editor).toBeTruthy();
    explanation.click();
    await harness.fixture.whenStable();
    expect(explanation.getAttribute('aria-expanded')).toBe('true');
    expect(page.querySelector('iframe')).toBe(frame);
    expect(page.querySelector('.cm-editor')).toBe(editor);
  });

});
