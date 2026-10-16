import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Signals } from './signals';

describe('Signals', () => {
  let fixture: ComponentFixture<Signals>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Signals] }).compileComponents();
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
});
