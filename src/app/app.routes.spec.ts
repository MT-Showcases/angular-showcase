import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideStore } from '@ngrx/store';
import { routes } from './app.routes';
import { appReducers } from './store/app.reducers';

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
    ['/basics/data-binding', 'Data Binding in Angular'],
    ['/basics/directives', 'Direttive Angular'],
    ['/basics/forms', 'Reactive Forms'],
    ['/advanced/signals', 'Signals API'],
    ['/advanced/http', 'HTTP & Service Facade'],
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

  it('updates computed values after a Signals counter click', async () => {
    const harness = await RouterTestingHarness.create('/advanced/signals');
    const page = harness.routeNativeElement!;
    const increment = Array.from(page.querySelectorAll<HTMLButtonElement>('.counter button')).find(
      (button) => button.textContent?.trim() === '+',
    )!;
    increment.click();
    await harness.fixture.whenStable();
    expect(
      Array.from(page.querySelectorAll('.computed-card__value')).map((element) =>
        element.textContent?.trim(),
      ),
    ).toEqual(['1', '2', '3']);
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

  it('renders posts returned by the HTTP facade after loading', async () => {
    const harness = await RouterTestingHarness.create('/advanced/http');
    const page = harness.routeNativeElement!;
    page.querySelector<HTMLButtonElement>('.button--secondary')!.click();
    TestBed.inject(HttpTestingController)
      .expectOne('https://jsonplaceholder.typicode.com/posts')
      .flush([{ userId: 1, id: 1, title: 'A test post', body: 'Loaded successfully' }]);
    await harness.fixture.whenStable();
    expect(page.querySelector('.post-card')?.textContent).toContain('A test post');
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

  it('updates BehaviorSubject message and counter demos through their UI', async () => {
    const harness = await RouterTestingHarness.create('/state/behavior-subject');
    const page = harness.routeNativeElement!;
    const messageDemo = page.querySelector<HTMLElement>('app-message-demo')!;
    const input = messageDemo.querySelector<HTMLInputElement>('input')!;
    input.value = 'Reactive update after migration';
    messageDemo.querySelector<HTMLButtonElement>('.btn-primary')!.click();
    await harness.fixture.whenStable();
    expect(messageDemo.querySelector('.value-display')?.textContent)
      .toContain('Reactive update after migration');
    Array.from(page.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('Incrementa'))!.click();
    await harness.fixture.whenStable();
    expect(page.querySelector('.value-display.large')?.textContent?.trim()).toBe('1');
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

  it('renders the HTTP error state and recovers after retrying', async () => {
    const harness = await RouterTestingHarness.create('/advanced/http');
    const page = harness.routeNativeElement!;
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      page.querySelector<HTMLButtonElement>('.button--secondary')!.click();
      TestBed.inject(HttpTestingController)
        .expectOne('https://jsonplaceholder.typicode.com/posts')
        .flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
      await harness.fixture.whenStable();
      expect(page.textContent).toContain('Errore nel caricamento dei post');
      const retry = page.querySelector<HTMLButtonElement>('.button--secondary')!;
      expect(retry.disabled).toBe(false);
      retry.click();
      TestBed.inject(HttpTestingController)
        .expectOne('https://jsonplaceholder.typicode.com/posts')
        .flush([{ id: 1, userId: 1, title: 'Recovered', body: 'Available again' }]);
      await harness.fixture.whenStable();
      expect(page.querySelector('.post-card')?.textContent).toContain('Recovered');
      expect(page.textContent).not.toContain('Errore nel caricamento dei post');
    } finally {
      errorLog.mockRestore();
    }
  });

  it('shows and hides the built-in control flow examples', async () => {
    const harness = await RouterTestingHarness.create('/basics/directives');
    const page = harness.routeNativeElement!;
    expect(page.querySelector('.message')).toBeTruthy();
    page.querySelector<HTMLButtonElement>('.section__button')!.click();
    await harness.fixture.whenStable();
    expect(page.querySelector('.message')).toBeNull();
    expect(page.querySelectorAll('.section__list-item').length).toBe(3);
  });

});
