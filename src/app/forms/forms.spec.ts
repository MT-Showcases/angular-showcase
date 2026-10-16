import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { vi } from 'vitest';
import { Forms } from './forms';

describe('Forms', () => {
  let fixture: ComponentFixture<Forms>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Forms] }).compileComponents();
    fixture = TestBed.createComponent(Forms);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  afterEach(() => vi.restoreAllMocks());

  async function fillValidForm() {
    const values = { name: 'Mario', surname: 'Rossi', email: 'mario@example.com' };
    for (const [name, value] of Object.entries(values)) {
      const input = await loader.getHarness(
        MatInputHarness.with({ selector: `[formControlName="${name}"]` }),
      );
      await input.setValue(value);
    }
  }

  it('starts with labeled outlined fields, no errors and a disabled submit button', async () => {
    const fields = await loader.getAllHarnesses(MatFormFieldHarness);
    expect(await Promise.all(fields.map((field) => field.getLabel()))).toEqual([
      'Nome', 'Cognome', 'Email',
    ]);
    expect(await Promise.all(fields.map((field) => field.getAppearance()))).toEqual([
      'outline', 'outline', 'outline',
    ]);
    expect(await Promise.all(fields.map((field) => field.getTextErrors()))).toEqual([[], [], []]);
    const submit = await loader.getHarness(MatButtonHarness.with({ buttonType: 'submit' }));
    expect(await submit.isDisabled()).toBe(true);
  });

  it('shows the specific name error after interaction and clears it when corrected', async () => {
    const input = await loader.getHarness(
      MatInputHarness.with({ selector: '[formControlName="name"]' }),
    );
    const field = await loader.getHarness(
      MatFormFieldHarness.with({ floatingLabelText: /^Nome/ }),
    );
    await input.focus();
    await input.blur();
    expect(await field.getTextErrors()).toEqual(['Il nome è obbligatorio']);

    await input.setValue('Al');
    expect(await field.getTextErrors()).toEqual(['Minimo 3 caratteri']);
    await input.setValue('Mario1');
    expect(await field.getTextErrors()).toEqual(['Solo lettere alfabetiche']);
    await input.setValue('Mario');
    expect(await field.getTextErrors()).toEqual([]);
  });

  it('reports a single email format error even when both email validators fail', async () => {
    const input = await loader.getHarness(
      MatInputHarness.with({ selector: '[formControlName="email"]' }),
    );
    await input.setValue('invalid-email');
    await input.blur();
    const field = await loader.getHarness(
      MatFormFieldHarness.with({ floatingLabelText: /^Email/ }),
    );
    expect(await field.getTextErrors()).toEqual(['Formato email non valido']);
  });

  it('submits valid values and resets values, touched state and submitted state', async () => {
    const notify = vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await fillValidForm();
    const submit = await loader.getHarness(MatButtonHarness.with({ buttonType: 'submit' }));
    expect(await submit.isDisabled()).toBe(false);
    await submit.click();
    expect(notify).toHaveBeenCalledWith('Form reattivo inviato con successo!');

    const directive = fixture.debugElement.query(By.directive(FormGroupDirective))
      .injector.get(FormGroupDirective);
    expect(directive.submitted).toBe(true);
    const reset = await loader.getHarness(MatButtonHarness.with({ buttonType: 'reset' }));
    await reset.click();
    expect(directive.submitted).toBe(false);
    expect(fixture.componentInstance.reactiveForm.pristine).toBe(true);
    expect(fixture.componentInstance.reactiveForm.untouched).toBe(true);
    expect(await Promise.all((await loader.getAllHarnesses(MatInputHarness)).map((input) => input.getValue())))
      .toEqual(['', '', '']);
    expect(await submit.isDisabled()).toBe(true);
    expect(await Promise.all((await loader.getAllHarnesses(MatFormFieldHarness)).map((field) => field.getTextErrors())))
      .toEqual([[], [], []]);
  });
});
