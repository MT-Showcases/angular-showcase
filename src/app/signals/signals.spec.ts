import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { provideRouter } from '@angular/router';
import { Signals } from './signals';

describe('Signals', () => {
  let fixture: ComponentFixture<Signals>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Signals], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(Signals);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  async function clickAction(label: string) {
    const button = await loader.getHarness(
      MatButtonHarness.with({ selector: `[aria-label="${label}"]` }),
    );
    await button.click();
  }

  function computedValues() {
    return Array.from(fixture.nativeElement.querySelectorAll('.computed-card__value')).map(
      (element) => (element as HTMLElement).textContent?.trim(),
    );
  }

  it('updates all derived counter values and resets them through Material buttons', async () => {
    await clickAction('Aumenta contatore');
    expect(computedValues()).toEqual(['1', '2', '3']);
    await clickAction('Diminuisci contatore');
    await clickAction('Diminuisci contatore');
    expect(computedValues()).toEqual(['-1', '-2', '-3']);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Reset' }))).click();
    expect(computedValues()).toEqual(['0', '0', '0']);
  });

  it('recalculates cart totals and prevents quantities below zero', async () => {
    expect(fixture.componentInstance.total()).toBe(4746);
    await clickAction('Diminuisci quantità di MacBook Pro');
    expect(fixture.componentInstance.total()).toBe(2247);
    const decrement = await loader.getHarness(
      MatButtonHarness.with({ selector: '[aria-label="Diminuisci quantità di MacBook Pro"]' }),
    );
    expect(await decrement.isDisabled()).toBe(true);
    await decrement.click();
    expect(fixture.componentInstance.items()[0].quantity).toBe(0);
    await clickAction('Aumenta quantità di MacBook Pro');
    expect(await decrement.isDisabled()).toBe(false);
    expect(fixture.nativeElement.querySelector('.cart-total__value').textContent).toContain('4746');
  });

  it('removes products, displays an empty cart and can add a new product', async () => {
    for (const product of ['MacBook Pro', 'iPhone 15', 'AirPods Pro']) {
      await clickAction(`Rimuovi ${product}`);
    }
    expect(fixture.componentInstance.total()).toBe(0);
    expect(fixture.nativeElement.querySelector('.cart__empty').textContent).toContain('Il carrello è vuoto');
    const add = await loader.getHarness(MatButtonHarness.with({ text: 'Aggiungi Magic Mouse' }));
    await add.click();
    expect(fixture.componentInstance.total()).toBe(99);
    expect(fixture.nativeElement.querySelectorAll('.cart-item')).toHaveLength(1);
  });

  it('keeps only the five latest effect entries after independent counter changes', async () => {
    for (let index = 0; index < 6; index++) {
      await clickAction('Aumenta contatore');
    }
    const entries = Array.from(fixture.nativeElement.querySelectorAll('.effect-logs__item')).map(
      (element) => (element as HTMLElement).textContent?.trim(),
    );
    expect(entries).toEqual([2, 3, 4, 5, 6].map((count) => `Conteggio aggiornato: ${count}`));
  });
  it('keeps duplicate products distinct and preserves the remaining DOM row when one is removed', async () => {
    const add = await loader.getHarness(MatButtonHarness.with({ text: 'Aggiungi Magic Mouse' }));
    await add.click(); await add.click();
    const first = fixture.nativeElement.querySelector('[data-item-id="4"]');
    const second = fixture.nativeElement.querySelector('[data-item-id="5"]');
    first.querySelector('[aria-label="Rimuovi Magic Mouse"]').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[data-item-id="4"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-item-id="5"]')).toBe(second);
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Ripristina carrello' }))).click();
    expect(fixture.componentInstance.total()).toBe(4746);
    expect(fixture.nativeElement.querySelectorAll('.cart-item')).toHaveLength(3);
  });

  it('opts into an imperative title effect and restores the title when disabled or destroyed', async () => {
    const originalTitle = document.title;
    const header: HTMLElement = fixture.nativeElement.querySelector('#deepen mat-expansion-panel-header');
    header.click(); await fixture.whenStable();
    const toggle = await loader.getHarness(MatButtonHarness.with({ text: 'Sincronizza titolo browser' }));
    await toggle.click(); await clickAction('Aumenta contatore');
    expect(document.title).toBe('Contatore 1 · Angular Showcase');
    await toggle.click(); expect(document.title).toBe(originalTitle);
    await clickAction('Aumenta contatore'); expect(document.title).toBe(originalTitle);
    await toggle.click(); expect(document.title).toBe('Contatore 2 · Angular Showcase');
    fixture.destroy(); expect(document.title).toBe(originalTitle);
  });

  it('retains the counter and cart while opening and closing explanations', async () => {
    await clickAction('Aumenta contatore');
    await clickAction('Rimuovi iPhone 15');
    const header: HTMLElement = fixture.nativeElement.querySelector('#code mat-expansion-panel-header');
    header.click(); await fixture.whenStable(); header.click(); await fixture.whenStable();
    expect(computedValues()).toEqual(['1', '2', '3']);
    expect(fixture.componentInstance.total()).toBe(2748);
  });

});
