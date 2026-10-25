import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Data, provideRouter } from '@angular/router';
import { MatChipListboxHarness } from '@angular/material/chips/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { BehaviorSubject } from 'rxjs';
import { TOPICS } from '../topics';
import { LearningCategory } from './category';

describe('LearningCategory hubs', () => {
  let fixture: ComponentFixture<LearningCategory>;
  let routeData: BehaviorSubject<Data>;

  const cards = (): HTMLAnchorElement[] =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('a.category__card'));

  const cardRoutes = (): string[] =>
    cards().map((card) => card.getAttribute('href') ?? '');

  const routesFor = (category: 'basics' | 'advanced'): string[] =>
    TOPICS.filter((topic) => topic.category === category && topic.published).map(
      (topic) => topic.route,
    );

  const startTitle = (): string =>
    fixture.nativeElement.querySelector('.category__start-title')?.textContent?.trim() ?? '';

  async function setCategory(category: string): Promise<void> {
    routeData.next({ category });
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    routeData = new BehaviorSubject<Data>({ category: 'basics' });

    // A valid-enough activated route snapshot lets RouterLink build hrefs while
    // the observable data stream drives same-component category transitions.
    const snapshot = {
      url: [],
      params: {},
      queryParams: {},
      fragment: null,
      data: { category: 'basics' },
      outlet: 'primary',
      component: null,
      routeConfig: null,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [],
      paramMap: { keys: [], get: () => null, has: () => false, getAll: () => [] },
      queryParamMap: { keys: [], get: () => null, has: () => false, getAll: () => [] },
      title: null,
      root: null as unknown,
    };
    snapshot.root = snapshot;

    const routeStub = {
      data: routeData,
      snapshot,
      params: new BehaviorSubject<Record<string, string>>({}),
      queryParams: new BehaviorSubject<Record<string, string>>({}),
      fragment: new BehaviorSubject<string | null>(null),
      url: new BehaviorSubject<unknown[]>([]),
      outlet: 'primary',
      component: LearningCategory,
      routeConfig: null,
      parent: null,
      firstChild: null,
      children: [],
      pathFromRoot: [],
    };

    await TestBed.configureTestingModule({
      imports: [LearningCategory],
      providers: [provideRouter([]), { provide: ActivatedRoute, useValue: routeStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(LearningCategory);
    await fixture.whenStable();
  });

  it('derives every published basics and advanced topic in TOPICS order', async () => {
    expect(cardRoutes()).toEqual(routesFor('basics'));
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Le basi di Angular',
    );

    await setCategory('advanced');

    expect(cards()).toHaveLength(2);
    expect(cardRoutes()).toEqual(routesFor('advanced'));
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain(
      'Approfondisci Angular',
    );
  });

  it('filters the eight basics lessons by phase and restores them from All', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const listbox = await loader.getHarness(MatChipListboxHarness);
    expect(await listbox.isMultiple()).toBe(false);
    expect(await listbox.getChips()).toHaveLength(4);
    expect(await (await listbox.getChips())[0].isSelected()).toBe(true);
    expect(cards()).toHaveLength(8);

    await listbox.selectChips({ text: /Prime mosse/ });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cardRoutes()).toEqual([
      '/basics/getting-started',
      '/basics/data-binding',
      '/basics/directives',
    ]);

    await listbox.selectChips({ text: /Struttura/ });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cardRoutes()).toEqual(['/basics/services', '/basics/routing']);

    // Re-selecting the current phase must not clear its accessible selection.
    const structure = (await listbox.getChips({ text: /Struttura/ }))[0];
    await structure.toggle();
    await fixture.whenStable();
    expect(await structure.isSelected()).toBe(true);
    expect(cardRoutes()).toEqual(['/basics/services', '/basics/routing']);

    await listbox.selectChips({ text: /Tutte le fasi/ });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cards()).toHaveLength(8);
    expect(await (await listbox.getChips())[0].isSelected()).toBe(true);
  });

  it('resets selection and swaps cards and CTA when route data changes section', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const listbox = await loader.getHarness(MatChipListboxHarness);
    await listbox.selectChips({ text: /Struttura/ });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(cardRoutes()).toEqual(['/basics/services', '/basics/routing']);
    expect(startTitle()).toBe('Il primo componente');

    await setCategory('advanced');

    expect(cards()).toHaveLength(2);
    expect(cardRoutes()).toEqual(routesFor('advanced'));
    expect(fixture.nativeElement.querySelector('mat-chip-listbox')).toBeNull();
    expect(startTitle()).toBe('Signals');

    await setCategory('basics');

    expect(cards()).toHaveLength(8);
    expect(startTitle()).toBe('Il primo componente');
    const resetListbox = await loader.getHarness(MatChipListboxHarness);
    expect(await (await resetListbox.getChips())[0].isSelected()).toBe(true);
  });

  it('links the state and examples resources without search or filter controls', async () => {
    await setCategory('state');

    expect(cards()).toHaveLength(2);
    expect(cardRoutes()).toEqual(['/state/behavior-subject', '/state/ngrx']);
    expect(fixture.nativeElement.querySelector('mat-chip-listbox')).toBeNull();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('.category__catalog-title')?.textContent).toContain(
      'I due approcci',
    );

    await setCategory('examples');

    expect(cards()).toHaveLength(2);
    expect(cardRoutes()).toEqual(['/examples/users', '/design-system']);
    expect(fixture.nativeElement.querySelector('mat-chip-listbox')).toBeNull();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(startTitle()).toBe('Lista utenti');
  });
});
