import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { provideRouter } from '@angular/router';
import { DataBinding } from './data-binding';

describe('Data Binding lesson', () => {
  let fixture: ComponentFixture<DataBinding>;
  let loader: HarnessLoader;
  let page: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataBinding],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DataBinding);
    loader = TestbedHarnessEnvironment.loader(fixture);
    page = fixture.nativeElement;
    await fixture.whenStable();
  });

  async function input(id: string): Promise<MatInputHarness> {
    return loader.getHarness(MatInputHarness.with({ selector: `#${id}` }));
  }

  async function click(id: string): Promise<void> {
    await (await loader.getHarness(MatButtonHarness.with({ selector: `#${id}` }))).click();
  }

  async function dispatchNameInput(value: string): Promise<void> {
    const field = page.querySelector<HTMLInputElement>('#binding-event-name')!;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  async function expectAllNames(value: string): Promise<void> {
    const fields = await loader.getAllHarnesses(MatInputHarness);
    expect(await Promise.all(fields.map((field) => field.getValue()))).toEqual([value, value, value]);
    expect(page.querySelector('#binding-current-value')?.textContent).toContain(`«${value}»`);
    expect(page.querySelector('#binding-greeting')?.textContent).toBe(`Ciao, ${value || 'visitatore'}!`);
  }

  it('transfers an explicit input event into state and all dependent views', async () => {
    await expectAllNames('Ada');
    expect(await (await input('binding-copy')).isReadonly()).toBe(true);

    await dispatchNameInput('Luca');
    await expectAllNames('Luca');
    expect(page.querySelector('#binding-event-state')?.textContent)
      .toContain('Ultimo evento: input; eventi input: 1');
  });

  it('updates both directions through ngModel and a component action without inventing DOM input events', async () => {
    await (await input('binding-two-way-name')).setValue('Marta');
    await expectAllNames('Marta');
    expect(page.querySelector('#binding-event-state')?.textContent)
      .toContain('Ultimo evento: nessuno; eventi input: 0');

    await click('binding-preset');
    await expectAllNames('Grace');
    expect(page.querySelector('[role="status"]')?.textContent)
      .toContain('Nome impostato dal componente');
    expect(page.querySelector('#binding-event-state')?.textContent).toContain('eventi input: 0');
  });

  it('binds a boolean DOM property and the corresponding accessible toggle attribute reversibly', async () => {
    const copy = await input('binding-copy');
    const toggle = page.querySelector<HTMLButtonElement>('#binding-lock')!;
    expect(await copy.isDisabled()).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    await click('binding-lock');
    expect(await copy.isDisabled()).toBe(true);
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('bloccata');
    await (await input('binding-two-way-name')).setValue('Nina');
    expect(await copy.getValue()).toBe('Nina');

    await click('binding-lock');
    expect(await copy.isDisabled()).toBe(false);
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    await expectAllNames('Nina');
  });

  it('uses a greeting fallback for an empty value and interpolates entered markup as plain text', async () => {
    const name = await input('binding-two-way-name');
    await name.setValue('');
    await expectAllNames('');
    const markup = '<img src="missing.png" alt="test">';
    await name.setValue(markup);
    await expectAllNames(markup);
    expect(page.querySelector('#binding-greeting img')).toBeNull();
  });

  it('resets the entire experiment including disabled state and event instrumentation', async () => {
    await (await input('binding-event-name')).setValue('Roberta');
    await click('binding-lock');
    await click('binding-reset');

    await expectAllNames('Ada');
    expect(await (await input('binding-copy')).isDisabled()).toBe(false);
    expect(page.querySelector('#binding-lock')?.getAttribute('aria-pressed')).toBe('false');
    expect(page.querySelector('#binding-event-state')?.textContent)
      .toContain('Ultimo evento: nessuno; eventi input: 0');
    expect(page.querySelector('[role="status"]')?.textContent).toContain('Demo ripristinata');
  });

  it('keeps the learner experiment intact when code and deeper explanations are opened and closed', async () => {
    await dispatchNameInput('Elena');
    await click('binding-lock');
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    for (const panel of panels) {
      expect(await panel.isExpanded()).toBe(false);
      await panel.expand();
      await panel.collapse();
    }

    await expectAllNames('Elena');
    expect(await (await input('binding-copy')).isDisabled()).toBe(true);
    expect(page.querySelector('#binding-event-state')?.textContent).toContain('eventi input: 1');
  });
});
