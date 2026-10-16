import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroupDirective } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { Forms } from './forms';

describe('Forms lesson', () => {
  let fixture: ComponentFixture<Forms>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forms], providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(Forms);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  async function inputFor(name: string) {
    return loader.getHarness(MatInputHarness.with({ selector: `[formControlName="${name}"]` }));
  }

  async function fillValidForm(values = { name: 'Èlia Maria', surname: "D'Amico-Li", email: 'Elia@Example.technology' }) {
    for (const [name, value] of Object.entries(values)) {
      await (await inputFor(name)).setValue(value);
    }
  }

  async function submitButton() {
    return loader.getHarness(MatButtonHarness.with({ buttonType: 'submit' }));
  }

  function formDirective() {
    return fixture.debugElement.query(By.directive(FormGroupDirective)).injector.get(FormGroupDirective);
  }

  it('starts with accessible labels, no premature errors and a visible disabled explanation', async () => {
    const fields = await loader.getAllHarnesses(MatFormFieldHarness);
    expect(await Promise.all(fields.map(field => field.getLabel()))).toEqual([
      'Nome', 'Cognome', 'Email', 'Organizzazione facoltativa',
    ]);
    expect(await Promise.all(fields.map(field => field.getTextErrors()))).toEqual([[], [], [], []]);
    expect(await (await submitButton()).isDisabled()).toBe(true);
    expect(fixture.nativeElement.querySelector('#submit-reason').textContent).toContain('Invio disabilitato');
    const panels = await loader.getAllHarnesses(MatExpansionPanelHarness);
    expect(await Promise.all(panels.map(panel => panel.isExpanded()))).toEqual([false, false]);
    expect(fixture.nativeElement.querySelector('#demo form')).toBeTruthy();
  });

  it('distinguishes touched from dirty and rejects whitespace-only names without restricting real names', async () => {
    const input = await inputFor('name');
    const field = await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: /^Nome/ }));
    await input.focus();
    await input.blur();
    expect(await field.getTextErrors()).toEqual(['Il nome è obbligatorio']);
    expect(fixture.componentInstance.reactiveForm.controls.name.touched).toBe(true);
    expect(fixture.componentInstance.reactiveForm.controls.name.pristine).toBe(true);
    await input.setValue('   ');
    expect(await field.getTextErrors()).toEqual(['Il nome non può contenere solo spazi']);
    expect(fixture.componentInstance.reactiveForm.controls.name.dirty).toBe(true);
    await input.setValue('Li');
    expect(await field.getTextErrors()).toEqual([]);
    await fillValidForm();
    expect(await (await submitButton()).isDisabled()).toBe(false);
    const surname = await inputFor('surname');
    await surname.setValue('  ');
    await surname.blur();
    const surnameField = await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: /^Cognome/ }));
    expect(await surnameField.getTextErrors()).toEqual(['Il cognome non può contenere solo spazi']);
    expect(await (await submitButton()).isDisabled()).toBe(true);
  });

  it('explains the length limit and recovers when a name is shortened', async () => {
    const input = await inputFor('name');
    await input.setValue('a'.repeat(81));
    await input.blur();
    const field = await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: /^Nome/ }));
    expect(await field.getTextErrors()).toEqual(['Il nome può avere al massimo 80 caratteri']);
    await input.setValue('Jean-Luc');
    expect(await field.getTextErrors()).toEqual([]);
  });

  it('shows one email error and accepts uppercase addresses with a long extension', async () => {
    const input = await inputFor('email');
    await input.setValue('invalid-email');
    await input.blur();
    const field = await loader.getHarness(MatFormFieldHarness.with({ floatingLabelText: /^Email/ }));
    expect(await field.getTextErrors()).toEqual(['Formato email non valido']);
    await input.setValue('Elia@Example.technology');
    expect(await field.getTextErrors()).toEqual([]);
  });

  it('submits a normalized snapshot inline and keeps it independent of later edits', async () => {
    await fillValidForm({ name: ' Èlia Maria ', surname: " D'Amico-Li ", email: 'Elia@Example.technology' });
    await (await submitButton()).click();
    expect(formDirective().submitted).toBe(true);
    expect(fixture.componentInstance.submittedPayload).toEqual({
      name: 'Èlia Maria', surname: "D'Amico-Li", email: 'Elia@Example.technology',
    });
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Invio locale completato');
    const payload = fixture.nativeElement.querySelector('[aria-label="Payload dell\'ultimo invio"]');
    expect(JSON.parse(payload.textContent)).toEqual(fixture.componentInstance.submittedPayload);
    await (await inputFor('name')).setValue('Li');
    expect(fixture.componentInstance.submittedPayload?.name).toBe('Èlia Maria');
  });

  it('shows value versus rawValue, retains disabled data and excludes it from the submitted payload', async () => {
    const panel = await loader.getHarness(MatExpansionPanelHarness.with({ title: /Approfondisci validatori/ }));
    await panel.expand();
    const toggle = await loader.getHarness(MatButtonHarness.with({ text: 'Attiva organizzazione' }));
    const input = await loader.getHarness(MatInputHarness.with({ selector: '[autocomplete="organization"]' }));
    expect(await input.isDisabled()).toBe(true);
    await toggle.click();
    await input.setValue('Angular Lab');
    expect(fixture.componentInstance.reactiveForm.value.organization).toBe('Angular Lab');
    await panel.collapse();
    await panel.expand();
    expect(await input.getValue()).toBe('Angular Lab');
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Disattiva organizzazione' }))).click();
    expect(await input.isDisabled()).toBe(true);
    expect(fixture.componentInstance.reactiveForm.value).not.toHaveProperty('organization');
    expect(fixture.componentInstance.reactiveForm.getRawValue().organization).toBe('Angular Lab');
    const raw = fixture.nativeElement.querySelector('[aria-label="Tutti i valori inclusi i controlli disabilitati"]');
    expect(JSON.parse(raw.textContent).organization).toBe('Angular Lab');
    await fillValidForm();
    await (await submitButton()).click();
    expect(fixture.componentInstance.submittedPayload).not.toHaveProperty('organization');
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Attiva organizzazione' }))).click();
    await (await submitButton()).click();
    expect(fixture.componentInstance.submittedPayload?.organization).toBe('Angular Lab');
  });

  it('resets values, interaction and submission states, optional availability and the result', async () => {
    await fillValidForm();
    const panel = await loader.getHarness(MatExpansionPanelHarness.with({ title: /Approfondisci validatori/ }));
    await panel.expand();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Attiva organizzazione' }))).click();
    await (await loader.getHarness(MatInputHarness.with({ selector: '[autocomplete="organization"]' }))).setValue('Angular Lab');
    await (await submitButton()).click();
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Ripristina tutto' }))).click();
    expect(formDirective().submitted).toBe(false);
    const form = fixture.componentInstance.reactiveForm;
    expect(form.pristine).toBe(true);
    expect(form.untouched).toBe(true);
    expect(form.getRawValue()).toEqual({ name: '', surname: '', email: '', organization: '' });
    expect(form.controls.organization.disabled).toBe(true);
    expect(fixture.componentInstance.submittedPayload).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Payload dell\'ultimo invio"]')).toBeNull();
    expect(await (await submitButton()).isDisabled()).toBe(true);
    const fields = await loader.getAllHarnesses(MatFormFieldHarness);
    expect(await Promise.all(fields.map(field => field.getTextErrors()))).toEqual([[], [], [], []]);
  });
});
