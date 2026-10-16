import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { vi } from 'vitest';
import { CodeBlock } from '../components/code-block/code-block';
import { DesignSystem } from './design-system';

describe('DesignSystem catalog', () => {
  let fixture: ComponentFixture<DesignSystem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignSystem],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DesignSystem);
    await fixture.whenStable();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('validates an edited email and restores the required error after clearing it', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const field = await loader.getHarness(MatFormFieldHarness.with({ selector: '[data-testid="email-field"]' }));
    const email = await loader.getHarness(MatInputHarness.with({ selector: '[data-testid="email-input"]' }));
    expect(await field.getTextErrors()).toEqual(['Inserisci un indirizzo email valido.']);

    await email.setValue('maria@example.com');
    await email.blur();
    expect(await field.getTextErrors()).toEqual([]);

    await email.setValue('');
    await email.blur();
    expect(await field.getTextErrors()).toEqual(['L’email è obbligatoria.']);
  });

  it('toggles native buttons and Reactive Forms disabled states together', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const toggle = await loader.getHarness(MatButtonHarness.with({ text: 'Disabilita controlli' }));
    const buttons = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '.design-system__buttons button' }));
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    await toggle.click();
    expect(await Promise.all(buttons.map((button) => button.isDisabled()))).toEqual(Array(5).fill(true));
    expect(await Promise.all(inputs.map((input) => input.isDisabled()))).toEqual([true, true]);
    expect(fixture.nativeElement.querySelector('[data-testid="toggle-controls"]').getAttribute('aria-pressed')).toBe('true');

    await toggle.click();
    expect(await Promise.all(buttons.map((button) => button.isDisabled()))).toEqual(Array(5).fill(false));
    expect(await Promise.all(inputs.map((input) => input.isDisabled()))).toEqual([false, false]);
    await buttons[0].click();
    expect(fixture.nativeElement.querySelector('.design-system__status').textContent).toContain('azione primaria');
  });

  it('resets edited and disabled controls through the labelled icon action', async () => {
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const name = await loader.getHarness(MatInputHarness.with({ selector: '[data-testid="name-input"]' }));
    const email = await loader.getHarness(MatInputHarness.with({ selector: '[data-testid="email-input"]' }));
    await name.setValue('Maria');
    await email.setValue('maria@example.com');
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Disabilita controlli' }))).click();
    const reset = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Ripristina gli esempi"]' }));
    await reset.click();

    expect(await name.getValue()).toBe('');
    expect(await email.getValue()).toBe('email-non-valida');
    expect(await email.isDisabled()).toBe(false);
    const field = await loader.getHarness(MatFormFieldHarness.with({ selector: '[data-testid="email-field"]' }));
    expect(await field.getTextErrors()).toEqual(['Inserisci un indirizzo email valido.']);
    expect(fixture.nativeElement.querySelector('.design-system__status').textContent).toContain('Esempi ripristinati');
  });

  it('links a real shared card to Forms and copies the usable button example', async () => {
    expect(fixture.nativeElement.querySelector('app-feature-card a').getAttribute('href')).toBe('/basics/forms');
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const snippet = fixture.debugElement.queryAll(By.directive(CodeBlock)).find(
      (element) => element.componentInstance.code === fixture.componentInstance.buttonCode,
    )!;
    snippet.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith(fixture.componentInstance.buttonCode);
    expect(snippet.nativeElement.textContent).toContain('Copiato');
  });
});
