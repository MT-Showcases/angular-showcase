// COMPONENT TYPE: Test Suite
// SECTION: Angular Basics
// ROLE: Verify reachable control-flow branches, stable identity and accessible demo state.
// PATTERNS USED: Material harnesses for controls and DOM identity checks for tracked rows.
// NOTES FOR CONTRIBUTORS: Exercise the rendered lesson instead of only component methods.
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { provideRouter } from '@angular/router';
import { Directives } from './directives';

describe('Directives lesson', () => {
  let fixture: ComponentFixture<Directives>;
  let loader: HarnessLoader;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Directives],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Directives);
    loader = TestbedHarnessEnvironment.loader(fixture);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  async function click(text: string): Promise<void> {
    await (await loader.getHarness(MatButtonHarness.with({ text }))).click();
  }

  function output(testId: string): HTMLElement | null {
    return element.querySelector(`[data-testid="${testId}"]`);
  }

  it('removes conditional content and announces both access branches and toggle states', async () => {
    expect(output('conditional-message')).not.toBeNull();
    expect(output('login-result')?.textContent).toContain('ramo @else');
    await click('Mostra messaggio');
    expect(output('conditional-message')).toBeNull();
    expect(element.querySelector('button')?.getAttribute('aria-pressed')).toBe('false');
    await click('Simula accesso');
    expect(output('login-result')?.textContent).toContain('ramo @if');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Accesso simulato attivo');
    await click('Mostra messaggio');
    expect(output('conditional-message')).not.toBeNull();
    await click('Simula accesso');
    expect(output('login-result')?.textContent).toContain('ramo @else');
  });

  it('adds duplicate labels with distinct stable IDs and rejects whitespace-only input', async () => {
    const input = await loader.getHarness(MatInputHarness);
    const add = await loader.getHarness(MatButtonHarness.with({ text: 'Aggiungi elemento' }));
    await input.setValue('   ');
    expect(await add.isDisabled()).toBe(true);
    for (let count = 0; count < 2; count++) {
      await input.setValue('  Mela  ');
      await add.click();
    }
    const rows = [...element.querySelectorAll('[data-item-id]')];
    const ids = rows.map(row => row.getAttribute('data-item-id'));
    expect(rows).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(rows.at(-1)?.textContent).toContain('Mela');
    expect(await input.getValue()).toBe('');
  });

  it('preserves each actual DOM row when reordering instead of using the visual index as identity', async () => {
    const firstRow = element.querySelector('[data-item-id="1"]');
    const lastRow = element.querySelector('[data-item-id="3"]');
    await click('Inverti ordine');
    const rows = element.querySelectorAll('[data-item-id]');
    expect(rows[0]).toBe(lastRow);
    expect(rows[2]).toBe(firstRow);
    expect(firstRow?.textContent).toContain('3. Mela');
    expect(lastRow?.textContent).toContain('1. Arancia');
  });

  it('removes one identified item, moves focus to the add field, then reaches empty and reset states', async () => {
    const remove = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Rimuovi Mela, ID 1"]' }));
    await remove.click();
    expect(element.querySelector('[data-item-id="1"]')).toBeNull();
    expect(element.querySelectorAll('[data-item-id]')).toHaveLength(2);
    expect(document.activeElement).toBe(element.querySelector('input'));
    await click('Svuota lista');
    expect(output('empty-list')?.textContent).toContain('ramo @empty');
    expect(await (await loader.getHarness(MatButtonHarness.with({ text: 'Inverti ordine' }))).isDisabled()).toBe(true);
    await click('Ripristina lista');
    expect(output('empty-list')).toBeNull();
    expect(element.querySelectorAll('[data-item-id]')).toHaveLength(3);
    expect(element.querySelector('[data-item-id="1"]')?.textContent).toContain('1. Mela');
  });

  it('makes every switch case and its default reachable', async () => {
    for (const [button, expected] of [
      ['In revisione', 'In revisione: controlla'],
      ['Pubblicato', 'Pubblicato: il contenuto è visibile'],
      ['Sconosciuto', 'Stato sconosciuto: scegli'],
      ['Bozza', 'Bozza: puoi modificare'],
    ]) {
      await click(button);
      expect(output('switch-result')?.textContent).toContain(expected);
      const control = await loader.getHarness(MatButtonHarness.with({ text: button }));
      expect(await (await control.host()).getAttribute('aria-pressed')).toBe('true');
    }
  });

  it('updates class and style bindings without replacing their host elements', async () => {
    const classHost = output('class-result');
    const styleHost = output('style-result');
    await click('Attiva classe');
    await click('Usa colore primario');
    expect(output('class-result')).toBe(classHost);
    expect(classHost?.classList.contains('active')).toBe(true);
    expect(output('style-result')).toBe(styleHost);
    expect(styleHost?.style.color).toBe('var(--mat-sys-primary)');
    await click('Attiva classe');
    expect(classHost?.classList.contains('active')).toBe(false);
  });

  it('keeps demo state when optional code is expanded and collapsed', async () => {
    await click('Simula accesso');
    const header: HTMLElement = element.querySelector('#code mat-expansion-panel-header')!;
    header.click();
    await fixture.whenStable();
    expect(header.getAttribute('aria-expanded')).toBe('true');
    header.click();
    await fixture.whenStable();
    expect(header.getAttribute('aria-expanded')).toBe('false');
    expect(output('login-result')?.textContent).toContain('ramo @if');
  });
});
