// COMPONENT TYPE: Test Suite
// SECTION: Angular Basics
// ROLE: Verify nested route navigation, reactive parameters, query changes and local recovery.
// PATTERNS USED: RouterTestingHarness with a route contract isolated from application configuration.
// NOTES FOR CONTRIBUTORS: Assert same-instance reuse, not only URLs or initial snapshots.
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { DEMO_ROUTES } from './demo.routes';
import { DemoDetail } from './demo-views';
import { RoutingLesson } from './routing-lesson';

const testRoutes: Routes = [{
  path: 'basics/routing',
  component: RoutingLesson,
  children: DEMO_ROUTES,
}];

describe('RoutingLesson', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ providers: [provideRouter(testRoutes)] }).compileComponents();
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  function text(id: string): string {
    return harness.routeNativeElement?.querySelector(`[data-testid="${id}"]`)?.textContent ?? '';
  }

  async function click(label: string): Promise<void> {
    const loader = TestbedHarnessEnvironment.loader(harness.fixture);
    await (await loader.getHarness(MatButtonHarness.with({ text: label }))).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('redirects the empty child to overview and opens a detail through the nested outlet', async () => {
    await harness.navigateByUrl('/basics/routing', RoutingLesson);
    expect(router.url).toBe('/basics/routing/overview');
    expect(harness.routeNativeElement?.textContent).toContain('Panoramica della demo');
    await click('Apri il dettaglio 1');
    expect(router.url).toBe('/basics/routing/detail/1');
    expect(text('detail-id')).toContain('1');
    expect(text('detail-content')).toContain('Componenti');
  });

  it('reacts to a second ID in the same child instance and keeps parent state', async () => {
    const parent = await harness.navigateByUrl('/basics/routing/detail/1', RoutingLesson);
    const first = harness.routeDebugElement?.query(By.directive(DemoDetail)).componentInstance;
    await click('Incrementa promemoria');
    await click('Passa al dettaglio 2');
    const second = harness.routeDebugElement?.query(By.directive(DemoDetail)).componentInstance;
    expect(second).toBe(first);
    expect(parent.reminders()).toBe(1);
    expect(text('detail-id')).toContain('2');
    expect(text('detail-content')).toContain('Servizi');
    expect(router.url).toBe('/basics/routing/detail/2');
  });

  it('updates the query in place, preserves it across details and clears it on reset', async () => {
    await harness.navigateByUrl('/basics/routing/detail/1', RoutingLesson);
    await click('Query compatta');
    expect(router.url).toBe('/basics/routing/detail/1?mode=compact');
    expect(text('detail-mode')).toContain('compatta');
    await click('Dettaglio 2');
    expect(router.url).toBe('/basics/routing/detail/2?mode=compact');
    expect(text('detail-mode')).toContain('compatta');
    await click('Incrementa promemoria');
    await click('Ripristina laboratorio');
    expect(router.url).toBe('/basics/routing/overview');
    expect(text('parent-state')).toContain('Promemoria del padre: 0');
    expect(text('parent-state')).toContain('completa');
  });

  it('handles absent data separately from a path mismatch and recovers from deep unknown paths locally', async () => {
    await harness.navigateByUrl('/basics/routing/detail/999', RoutingLesson);
    expect(text('detail-content')).toContain('Nessuna scheda');
    const parent = await harness.navigateByUrl('/basics/routing/no/such/path', RoutingLesson);
    expect(harness.routeNativeElement?.textContent).toContain('Percorso della demo non trovato');
    expect(harness.routeNativeElement?.querySelector('app-lesson-shell')).not.toBeNull();
    expect(parent).toBeInstanceOf(RoutingLesson);
    await click('Torna alla panoramica');
    expect(router.url).toBe('/basics/routing/overview');
    await click('Percorso sconosciuto');
    expect(router.url).toBe('/basics/routing/missing-demo');
    expect(harness.routeNativeElement?.textContent).toContain('rotta jolly **');
  });

  it('supports direct links with query parameters and ignores unsupported query values', async () => {
    await harness.navigateByUrl('/basics/routing/detail/2?mode=compact', RoutingLesson);
    expect(text('detail-content')).toContain('Scheda 2');
    expect(text('detail-mode')).toContain('compatta');
    expect(text('current-url')).toContain('/basics/routing/detail/2?mode=compact');
    await harness.navigateByUrl('/basics/routing/detail/2?mode=unknown', RoutingLesson);
    expect(text('detail-mode')).toContain('completa');
  });
});
