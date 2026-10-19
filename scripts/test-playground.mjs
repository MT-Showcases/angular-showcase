// Execute the generated browser runtime against the actual lesson seed in an isolated jsdom window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
async function fixture(path) {
  const result = await build({ entryPoints: [path], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { FIRST_COMPONENT } = await fixture('src/app/getting-started/first-component.example.ts');
const { BINDING_EXAMPLE } = await fixture('src/app/data-binding/binding.example.ts');
const { IF_EXAMPLE, FOR_EXAMPLE, SWITCH_EXAMPLE, DIRECTIVE_EXAMPLE } = await fixture('src/app/directives/control-flow.example.ts');
const { INPUT_EXAMPLE, OUTPUT_EXAMPLE, COMMUNICATION_EXAMPLE } = await fixture('src/app/component-communication/communication.example.ts');
const { DATE_EXAMPLE, CURRENCY_EXAMPLE, UPPERCASE_EXAMPLE, TAG_LIST_EXAMPLE } = await fixture('src/app/pipes/pipes.example.ts');
const { CONTROL_EXAMPLE, CONTACT_EXAMPLE } = await fixture('src/app/forms/forms.example.ts');

const source = await readFile('public/playground/generated/preview.html', 'utf8');
function listen(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { window.removeEventListener('message', handler); reject(new Error(`Timed out waiting for ${kind}`)); }, 6000);
    const handler = event => {
      if (event.data?.channel !== 'test-preview') return;
      if (revision !== undefined && event.data.revision !== revision) return;
      if (event.data.kind !== kind && event.data.kind !== 'error') return;
      clearTimeout(timer); window.removeEventListener('message', handler);
      if (event.data.kind === 'error' && kind !== 'error') reject(new Error(event.data.message));
      else resolve(event.data);
    };
    window.addEventListener('message', handler);
  });
}
async function environment() {
  const warnings = [];
  const console = new VirtualConsole();
  console.on('warn', (...args) => warnings.push(args.join(' ')));
  const dom = new JSDOM(source, { url: 'http://localhost/playground/generated/preview.html#test-preview', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console });
  dom.warnings = warnings;
  await listen(dom.window, 'ready');
  return dom;
}
async function render(dom, sources, revision, expected = 'rendered') {
  const done = listen(dom.window, expected, revision);
  dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window, data: { channel: 'test-preview', kind: 'render', revision, sources } }));
  return done;
}
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
async function input(dom, selector, value, event = 'input') {
  const element = dom.window.document.querySelector(selector);
  element.value = value;
  element.dispatchEvent(new dom.window.Event(event, { bubbles: true }));
  await settle();
}
async function click(dom, selector) {
  dom.window.document.querySelector(selector).click();
  await settle();
}
async function blur(dom, selector) {
  const element = dom.window.document.querySelector(selector);
  element.focus();
  element.blur();
  await settle();
}

test('binding seed synchronizes both input directions, properties, escaped text and reset', async () => {
  const dom = await environment();
  try {
    await render(dom, BINDING_EXAMPLE, 1);
    const doc = dom.window.document;
    await input(dom, '#event-name', 'Luca');
    assert.equal(doc.querySelector('#copy').value, 'Luca');
    assert.equal(doc.querySelector('#two-way-name').value, 'Luca');
    assert.match(doc.querySelector('#events').textContent, /1/);
    await click(dom, '#lock');
    assert.equal(doc.querySelector('#copy').disabled, true);
    assert.equal(doc.querySelector('#lock').getAttribute('aria-pressed'), 'true');
    await input(dom, '#two-way-name', '<img src=x>');
    assert.equal(doc.querySelector('#greeting').textContent, 'Ciao, <img src=x>!');
    assert.equal(doc.querySelector('#greeting img'), null);
    assert.match(doc.querySelector('#events').textContent, /1/);
    await input(dom, '#two-way-name', '');
    assert.match(doc.querySelector('#greeting').textContent, /visitatore/);
    await click(dom, '#preset');
    assert.equal(doc.querySelector('#two-way-name').value, 'Grace');
    await click(dom, '#reset');
    assert.equal(doc.querySelector('#copy').value, 'Ada');
    assert.equal(doc.querySelector('#copy').disabled, false);
    assert.match(doc.querySelector('#events').textContent, /0/);
    await render(dom, { ...BINDING_EXAMPLE, typescript: BINDING_EXAMPLE.typescript.replaceAll("'Ada'", "'Nina'") }, 2);
    assert.match(doc.querySelector('#greeting').textContent, /Nina/);
  } finally { dom.window.close(); }
});

test('@if creates only the selected branch', async () => {
  const dom = await environment();
  try {
    await render(dom, IF_EXAMPLE, 1);
    const doc = dom.window.document;
    assert.ok(doc.querySelector('#greeting'));
    assert.equal(doc.querySelector('#alternative'), null);
    await click(dom, 'button');
    assert.equal(doc.querySelector('#greeting'), null);
    assert.ok(doc.querySelector('#alternative'));
    await click(dom, 'button');
    assert.ok(doc.querySelector('#greeting'));
  } finally { dom.window.close(); }
});

test('@for preserves actual DOM rows when reordered and reaches @empty', async () => {
  const dom = await environment();
  try {
    await render(dom, FOR_EXAMPLE, 1);
    const doc = dom.window.document;
    const first = doc.querySelector('[data-item-id="1"]');
    await click(dom, '#reverse');
    assert.equal([...doc.querySelectorAll('[data-item-id]')].at(-1), first);
    await click(dom, '#clear');
    assert.ok(doc.querySelector('#empty'));
    assert.equal(doc.querySelectorAll('[data-item-id]').length, 0);
    await click(dom, '#reset');
    assert.equal(doc.querySelectorAll('[data-item-id]').length, 3);
    assert.equal(doc.querySelector('#empty'), null);
  } finally { dom.window.close(); }
});

test('@switch exposes every case and its default', async () => {
  const dom = await environment();
  try {
    await render(dom, SWITCH_EXAMPLE, 1);
    for (const [state, text] of [['review', 'In revisione'], ['published', 'Pubblicato'], ['unknown', 'Stato sconosciuto'], ['draft', 'Bozza']]) {
      await input(dom, '#state', state, 'change');
      assert.match(dom.window.document.querySelector('#publication').textContent, new RegExp(text));
    }
  } finally { dom.window.close(); }
});

test('attribute directive updates the same native button and its accessible state', async () => {
  const dom = await environment();
  try {
    await render(dom, DIRECTIVE_EXAMPLE, 1);
    const doc = dom.window.document;
    const button = doc.querySelector('button');
    assert.equal(button.getAttribute('aria-pressed'), 'false');
    await click(dom, 'button');
    assert.equal(doc.querySelector('button'), button);
    assert.equal(button.classList.contains('highlighted'), true);
    assert.equal(button.getAttribute('aria-pressed'), 'true');
    await click(dom, 'button');
    assert.equal(button.classList.contains('highlighted'), false);
  } finally { dom.window.close(); }
});

test('input() receives and reacts to the actual parent value', async () => {
  const dom = await environment();
  try {
    await render(dom, INPUT_EXAMPLE, 1);
    assert.equal(dom.window.document.querySelector('#greeting').textContent, 'Ciao, Ada!');
    await input(dom, '#name', 'Grace');
    assert.equal(dom.window.document.querySelector('#greeting').textContent, 'Ciao, Grace!');
    await render(dom, { ...INPUT_EXAMPLE, html: INPUT_EXAMPLE.html.replace('[name]="name"', '') }, 2);
    assert.equal(dom.window.document.querySelector('#greeting').textContent, 'Ciao, visitatore!');
  } finally { dom.window.close(); }
});

test('output() delivers the emitted string to the parent', async () => {
  const dom = await environment();
  try {
    await render(dom, OUTPUT_EXAMPLE, 1);
    assert.match(dom.window.document.querySelector('#message').textContent, /Nessun messaggio/);
    await click(dom, 'app-message-button button');
    assert.equal(dom.window.document.querySelector('#message').textContent, 'Ciao dal figlio!');
  } finally { dom.window.close(); }
});

test('combined input/output keeps ownership in the parent; an unhandled event cannot change it', async () => {
  const dom = await environment();
  try {
    await render(dom, COMMUNICATION_EXAMPLE, 1);
    const doc = dom.window.document;
    await click(dom, 'app-counter-button button');
    assert.equal(doc.querySelector('#count').textContent, 'Totale: 1');
    await click(dom, '#reset');
    assert.equal(doc.querySelector('#count').textContent, 'Totale: 0');
    await render(dom, { ...COMMUNICATION_EXAMPLE, html: COMMUNICATION_EXAMPLE.html.replace('(incremented)="count = count + 1"', '') }, 2);
    await click(dom, 'app-counter-button button');
    assert.equal(doc.querySelector('#count').textContent, 'Totale: 0');
  } finally { dom.window.close(); }
});

test('date seed keeps the ISO value while format and fixed offset change', async () => {
  const dom = await environment();
  try {
    await render(dom, DATE_EXAMPLE, 1);
    const doc = dom.window.document;
    const result = () => doc.querySelector('#date-result').textContent.trim();
    assert.equal(doc.querySelector('#date-raw').textContent.trim(), '2026-10-16T10:30:00Z');
    assert.equal(result(), '2026-10-16');
    await input(dom, '#date-format', 'dd/MM/yyyy', 'change');
    assert.equal(result(), '16/10/2026');
    await input(dom, '#date-format', 'HH:mm', 'change');
    assert.equal(result(), '10:30');
    await input(dom, '#timezone', '+0200', 'change');
    assert.equal(result(), '12:30');
    assert.equal(doc.querySelector('#date-raw').textContent.trim(), '2026-10-16T10:30:00Z');
  } finally { dom.window.close(); }
});

test('currency seed changes presentation without converting or losing the number', async () => {
  const dom = await environment();
  try {
    await render(dom, CURRENCY_EXAMPLE, 1);
    const doc = dom.window.document;
    const result = () => doc.querySelector('#currency-result').textContent.trim();
    assert.equal(result(), '€1,234.50');
    await input(dom, '#currency', 'USD', 'change');
    assert.equal(result(), '$1,234.50');
    await input(dom, '#currency-display', 'code', 'change');
    assert.match(result(), /USD/);
    await input(dom, '#amount', '42.2');
    assert.match(result(), /USD/);
    assert.match(result(), /42\.20/);
    assert.equal(doc.querySelector('#amount-raw').textContent.trim(), '42.2');
    await input(dom, '#amount', '');
    assert.match(result(), /Inserisci un numero/);
    assert.equal(doc.querySelector('#amount-raw').textContent.trim(), 'Nessun importo');
  } finally { dom.window.close(); }
});

test('uppercase seed transforms edited text while keeping the source casing', async () => {
  const dom = await environment();
  try {
    await render(dom, UPPERCASE_EXAMPLE, 1);
    const doc = dom.window.document;
    assert.equal(doc.querySelector('#uppercase-result').textContent.trim(), 'ANGULAR SI IMPARA PROVANDO');
    await input(dom, '#uppercase-text', 'Ciao Angular');
    assert.equal(doc.querySelector('#uppercase-result').textContent.trim(), 'CIAO ANGULAR');
    assert.equal(doc.querySelector('#text-raw').textContent.trim(), 'Ciao Angular');
    await input(dom, '#uppercase-text', '');
    assert.equal(doc.querySelector('#uppercase-result').textContent.trim(), '(testo vuoto)');
    assert.equal(doc.querySelector('#text-raw').textContent.trim(), '(testo vuoto)');
  } finally { dom.window.close(); }
});

test('tag list seed adds an immutable label, changes separator and guards blanks', async () => {
  const dom = await environment();
  try {
    await render(dom, TAG_LIST_EXAMPLE, 1);
    const doc = dom.window.document;
    const button = doc.querySelector('button');
    const result = () => doc.querySelector('#labels-result').textContent.trim();
    const disabled = () => button.disabled || button.getAttribute('aria-disabled') === 'true';
    assert.equal(disabled(), true);
    await input(dom, '#new-label', '   ');
    assert.equal(disabled(), true);
    await input(dom, '#new-label', '  componenti  ');
    assert.equal(disabled(), false);
    await click(dom, 'button');
    assert.equal(result(), 'template · dati · componenti');
    assert.equal(doc.querySelector('#labels-raw').textContent.trim(), 'template,dati,componenti');
    assert.equal(doc.querySelector('#new-label').value, '');
    assert.equal(disabled(), true);
    await input(dom, '#separator', ' / ', 'change');
    assert.equal(result(), 'template / dati / componenti');
  } finally { dom.window.close(); }
});

test('edited pipe source re-renders the preview with the new initial value', async () => {
  const dom = await environment();
  try {
    await render(dom, UPPERCASE_EXAMPLE, 1);
    assert.equal(dom.window.document.querySelector('#uppercase-result').textContent.trim(), 'ANGULAR SI IMPARA PROVANDO');
    await render(dom, {
      ...UPPERCASE_EXAMPLE,
      typescript: UPPERCASE_EXAMPLE.typescript.replace("'Angular si impara provando'", "'Pipe modificate'"),
    }, 2);
    assert.equal(dom.window.document.querySelector('#uppercase-result').textContent.trim(), 'PIPE MODIFICATE');
  } finally { dom.window.close(); }
});

test('control seed shows editing versus blur states and resets to its initial value', async () => {
  const dom = await environment();
  try {
    await render(dom, CONTROL_EXAMPLE, 1);
    const doc = dom.window.document;
    const state = id => doc.querySelector(id).textContent.trim();
    assert.equal(doc.querySelector('#control-name').value, 'Ada');
    assert.equal(state('#control-value'), 'Ada');
    assert.equal(state('#control-valid'), 'true');
    assert.equal(state('#control-dirty'), 'false');
    assert.equal(state('#control-touched'), 'false');
    assert.equal(doc.querySelector('mat-error'), null);

    await input(dom, '#control-name', '');
    assert.equal(state('#control-value'), '');
    assert.equal(state('#control-valid'), 'false');
    assert.equal(state('#control-dirty'), 'true');
    assert.equal(state('#control-touched'), 'false');
    assert.equal(doc.querySelector('mat-error'), null);

    await blur(dom, '#control-name');
    assert.equal(state('#control-touched'), 'true');
    assert.match(doc.querySelector('#control-name-error').textContent, /obbligatorio/i);

    await click(dom, '#control-reset');
    assert.equal(doc.querySelector('#control-name').value, 'Ada');
    assert.equal(state('#control-value'), 'Ada');
    assert.equal(state('#control-valid'), 'true');
    assert.equal(state('#control-dirty'), 'false');
    assert.equal(state('#control-touched'), 'false');
    assert.equal(doc.querySelector('mat-error'), null);
  } finally { dom.window.close(); }
});

test('contact seed validates blanks, length and email after blur and recovers', async () => {
  const dom = await environment();
  try {
    await render(dom, CONTACT_EXAMPLE, 1);
    const doc = dom.window.document;
    const submit = () => doc.querySelector('#contact-submit');
    assert.deepEqual([...doc.querySelectorAll('mat-label')].map(label => label.textContent.trim()), [
      'Nome',
      'Cognome',
      'Email',
      'Organizzazione',
    ]);
    assert.match(doc.querySelector('#contact-name').getAttribute('aria-describedby'), /contact-name-help/);
    assert.equal(submit().disabled, true);
    assert.match(doc.querySelector('#contact-reason').textContent, /Invio disabilitato/);
    assert.equal(doc.querySelector('mat-error'), null);
    assert.equal(doc.querySelector('#contact-dirty').textContent.trim(), 'false');
    assert.equal(doc.querySelector('#contact-touched').textContent.trim(), 'false');
    assert.equal(doc.querySelector('#contact-submitted').textContent.trim(), 'false');

    await blur(dom, '#contact-name');
    assert.match(doc.querySelector('#contact-name-error').textContent, /obbligatorio/i);
    await input(dom, '#contact-name', '   ');
    await blur(dom, '#contact-name');
    assert.match(doc.querySelector('#contact-name-error').textContent, /solo spazi/i);
    await input(dom, '#contact-name', 'a'.repeat(81));
    await blur(dom, '#contact-name');
    assert.match(doc.querySelector('#contact-name-error').textContent, /80 caratteri/i);
    await input(dom, '#contact-name', 'Jean-Luc');
    assert.equal(doc.querySelector('#contact-name-error'), null);

    await input(dom, '#contact-surname', '  ');
    await blur(dom, '#contact-surname');
    assert.match(doc.querySelector('#contact-surname-error').textContent, /solo spazi/i);
    await input(dom, '#contact-surname', 'Li');
    assert.equal(doc.querySelector('#contact-surname-error'), null);

    await input(dom, '#contact-email', 'invalid-email');
    await blur(dom, '#contact-email');
    assert.match(doc.querySelector('#contact-email-error').textContent, /Formato email/i);
    await input(dom, '#contact-email', 'Elia@Example.technology');
    assert.equal(doc.querySelector('#contact-email-error'), null);

    await input(dom, '#contact-name', 'Èlia');
    assert.equal(submit().disabled, false);
    assert.match(doc.querySelector('#contact-reason').textContent, /puoi inviare/);
  } finally { dom.window.close(); }
});

test('contact seed submits a normalized snapshot independent of later edits', async () => {
  const dom = await environment();
  try {
    await render(dom, CONTACT_EXAMPLE, 1);
    const doc = dom.window.document;
    await input(dom, '#contact-name', ' Èlia Maria ');
    await input(dom, '#contact-surname', " D'Amico-Li ");
    await input(dom, '#contact-email', 'Elia@Example.technology');
    await click(dom, '#contact-submit');

    const payload = () => doc.querySelector('#contact-payload');
    const snapshot = payload().textContent;
    assert.deepEqual(JSON.parse(snapshot), {
      name: 'Èlia Maria',
      surname: "D'Amico-Li",
      email: 'Elia@Example.technology',
    });
    assert.equal(doc.querySelector('#contact-submitted').textContent.trim(), 'true');
    assert.match(doc.querySelector('#contact-status').textContent, /Invio locale completato/);

    await input(dom, '#contact-name', 'Li');
    assert.equal(payload().textContent, snapshot);
    assert.equal(JSON.parse(payload().textContent).name, 'Èlia Maria');
  } finally { dom.window.close(); }
});

test('contact seed keeps disabled organization data in raw values and out of the payload', async () => {
  const dom = await environment();
  try {
    await render(dom, CONTACT_EXAMPLE, 1);
    const doc = dom.window.document;
    const organization = () => doc.querySelector('#contact-organization');
    const value = () => JSON.parse(doc.querySelector('#contact-value').textContent);
    const raw = () => JSON.parse(doc.querySelector('#contact-raw').textContent);
    const payload = () => JSON.parse(doc.querySelector('#contact-payload').textContent);
    assert.equal(organization().disabled, true);
    assert.equal('organization' in value(), false);
    assert.equal(raw().organization, '');

    await click(dom, '#organization-toggle');
    assert.equal(organization().disabled, false);
    await input(dom, '#contact-organization', 'Angular Lab');
    assert.equal(value().organization, 'Angular Lab');
    await click(dom, '#organization-toggle');
    assert.equal(organization().disabled, true);
    assert.equal('organization' in value(), false);
    assert.equal(raw().organization, 'Angular Lab');

    await input(dom, '#contact-name', 'Èlia');
    await input(dom, '#contact-surname', "D'Amico-Li");
    await input(dom, '#contact-email', 'Elia@Example.technology');
    await click(dom, '#contact-submit');
    assert.deepEqual(payload(), {
      name: 'Èlia',
      surname: "D'Amico-Li",
      email: 'Elia@Example.technology',
    });

    await click(dom, '#organization-toggle');
    await click(dom, '#contact-submit');
    assert.equal(payload().organization, 'Angular Lab');
  } finally { dom.window.close(); }
});

test('contact seed resets values, interaction and submission states, optional data and payload', async () => {
  const dom = await environment();
  try {
    await render(dom, CONTACT_EXAMPLE, 1);
    const doc = dom.window.document;
    await input(dom, '#contact-name', 'Èlia');
    await input(dom, '#contact-surname', "D'Amico-Li");
    await input(dom, '#contact-email', 'Elia@Example.technology');
    await click(dom, '#organization-toggle');
    await input(dom, '#contact-organization', 'Angular Lab');
    await click(dom, '#contact-submit');
    assert.equal(doc.querySelector('#contact-submitted').textContent.trim(), 'true');
    assert.ok(doc.querySelector('#contact-payload'));

    await input(dom, '#contact-name', 'Li');
    await click(dom, '#contact-reset');
    assert.equal(doc.querySelector('#contact-name').value, '');
    assert.equal(doc.querySelector('#contact-surname').value, '');
    assert.equal(doc.querySelector('#contact-email').value, '');
    assert.equal(doc.querySelector('#contact-organization').value, '');
    assert.equal(doc.querySelector('#contact-organization').disabled, true);
    assert.equal(doc.querySelector('#contact-valid').textContent.trim(), 'false');
    assert.equal(doc.querySelector('#contact-dirty').textContent.trim(), 'false');
    assert.equal(doc.querySelector('#contact-touched').textContent.trim(), 'false');
    assert.equal(doc.querySelector('#contact-submitted').textContent.trim(), 'false');
    assert.equal(doc.querySelector('#contact-payload'), null);
    assert.match(doc.querySelector('#contact-status').textContent, /Nessun invio/);
    assert.match(doc.querySelector('#contact-reason').textContent, /Invio disabilitato/);
    assert.equal(doc.querySelector('mat-error'), null);
  } finally { dom.window.close(); }
});

test('edited forms source re-renders the preview with the new initial value', async () => {
  const dom = await environment();
  try {
    await render(dom, CONTROL_EXAMPLE, 1);
    assert.equal(dom.window.document.querySelector('#control-name').value, 'Ada');
    await render(dom, {
      ...CONTROL_EXAMPLE,
      typescript: CONTROL_EXAMPLE.typescript.replace("new FormControl('Ada'", "new FormControl('Nina'"),
    }, 2);
    assert.equal(dom.window.document.querySelector('#control-name').value, 'Nina');
    assert.equal(dom.window.document.querySelector('#control-value').textContent.trim(), 'Nina');
  } finally { dom.window.close(); }
});

test('preview instantiates real Material input directives inside form fields', async () => {
  const dom = await environment();
  try {
    await render(dom, {
      typescript: `import { Component, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-material-field-contract',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './component.html',
})
export default class MaterialFieldContract {
  @ViewChild(MatInput) input!: MatInput;
  @ViewChild(MatFormField) field!: MatFormField;
  readonly control = new FormControl('Ada', { nonNullable: true });
  result = '';

  check(): void {
    this.result = [
      this.input instanceof MatInput,
      this.field instanceof MatFormField,
      this.field.appearance,
      this.input.controlType,
    ].join('|');
  }
}`,
      html: `<mat-form-field
  appearance="outline"
  subscriptSizing="dynamic"
>
  <mat-label>Campo Material</mat-label>
  <input matInput [formControl]="control" />
  <mat-hint id="field-hint">Testo di supporto</mat-hint>
</mat-form-field>
<p id="directives">{{ result }}</p>
<button type="button" (click)="check()">Verifica</button>`,
      css: '',
    }, 1);
    await click(dom, 'button');
    assert.equal(dom.window.document.querySelector('#directives').textContent.trim(), 'true|true|outline|mat-input');
  } finally { dom.window.close(); }
});

test('JIT input bridge supports required inputs, static aliases, import aliases and signal transforms', async () => {
  const dom = await environment();
  try {
    await render(dom, {
      ...INPUT_EXAMPLE,
      typescript: INPUT_EXAMPLE.typescript
        .replace('Component, input,', 'Component, input as accept,')
        .replace("input('visitatore')", "accept.required<string>({ alias: 'displayName', transform: value => String(value).toUpperCase() })"),
      html: INPUT_EXAMPLE.html.replace('[name]', '[displayName]'),
    }, 1);
    assert.equal(dom.window.document.querySelector('#greeting').textContent, 'Ciao, ADA!');
    await input(dom, '#name', 'Grace');
    assert.equal(dom.window.document.querySelector('#greeting').textContent, 'Ciao, GRACE!');
    await render(dom, {
      ...OUTPUT_EXAMPLE,
      typescript: OUTPUT_EXAMPLE.typescript
        .replace('Component, output,', 'Component, output as emitEvent,')
        .replace('output<string>()', "emitEvent<string>({ alias: 'messageSent' })"),
      html: OUTPUT_EXAMPLE.html.replace('(sent)', '(messageSent)'),
    }, 2);
    await click(dom, 'app-message-button button');
    assert.equal(dom.window.document.querySelector('#message').textContent, 'Ciao dal figlio!');
  } finally { dom.window.close(); }
});

test('unsupported initializer options fail visibly and corrected modern code recovers', async () => {
  const dom = await environment();
  try {
    const error = await render(dom, {
      ...INPUT_EXAMPLE,
      typescript: INPUT_EXAMPLE.typescript.replace("input('visitatore')", "input('visitatore', { alias: ['dynamic'].join('') })"),
    }, 1, 'error');
    assert.match(error.message, /alias.*stringa letterale/);
    const model = await render(dom, {
      ...INPUT_EXAMPLE,
      typescript: INPUT_EXAMPLE.typescript.replace('Component, input,', 'Component, model,').replace("input('visitatore')", "model('visitatore')"),
    }, 2, 'error');
    assert.match(model.message, /model\(\).*non è ancora supportato/);
    await render(dom, INPUT_EXAMPLE, 3);
    assert.equal(dom.window.document.querySelector('#greeting').textContent, 'Ciao, Ada!');
    const missing = await render(dom, {
      ...INPUT_EXAMPLE,
      typescript: INPUT_EXAMPLE.typescript.replace("input('visitatore')", 'input.required<string>()'),
      html: INPUT_EXAMPLE.html.replace('[name]="name"', ''),
    }, 4, 'error');
    assert.match(missing.message, /NG0950|Input is required/i);
    await render(dom, INPUT_EXAMPLE, 5);
    assert.equal(dom.window.document.querySelector('#greeting').textContent, 'Ciao, Ada!');
  } finally { dom.window.close(); }
});

test('actual Angular seed renders, handles clicks and reflects edits to all three files', async () => {
  const dom = await environment();
  try {
    await render(dom, FIRST_COMPONENT, 1);
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Angular!');
    dom.window.document.querySelector('button').click();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(dom.window.document.querySelector('strong').textContent, '1');
    await render(dom, {
      typescript: FIRST_COMPONENT.typescript.replace("'Ciao, Angular!'", "'Ciao, Ada!'"),
      html: FIRST_COMPONENT.html.replace('Hai premuto', 'Totale click:'),
      css: FIRST_COMPONENT.css.replace('#faf8ff', '#ff0000'),
    }, 2);
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Ada!');
    assert.match(dom.window.document.querySelector('p').textContent, /Totale click:/);
    assert.equal(dom.window.document.querySelector('strong').textContent, '0');
    assert.match([...dom.window.document.querySelectorAll('style')].map(style => style.textContent).join(''), /#ff0000/);
    assert.doesNotMatch(dom.warnings.join('\n'), /NG0912/);
  } finally { dom.window.close(); }
});

test('syntax and Angular template errors are reported and corrected code recovers', async () => {
  const dom = await environment();
  try {
    const syntax = await render(dom, { ...FIRST_COMPONENT, typescript: 'export default class {' }, 1, 'error');
    assert.match(syntax.message, /component.ts/);
    const template = await render(dom, { ...FIRST_COMPONENT, html: '<p>{{ message + }}</p>' }, 2, 'error');
    assert.match(template.message, /Parser Error|Unexpected token|expression/i);
    await render(dom, FIRST_COMPONENT, 3);
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Angular!');
  } finally { dom.window.close(); }
});

test('unsupported imports fail visibly; wrong channels and older revisions cannot replace the preview', async () => {
  const dom = await environment();
  try {
    const error = await render(dom, { ...FIRST_COMPONENT, typescript: "import { unknown } from 'arbitrary-package'; console.log(unknown);" }, 1, 'error');
    assert.match(error.message, /Import non disponibile/);
    await render(dom, FIRST_COMPONENT, 3);
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window, data: { channel: 'wrong', kind: 'render', revision: 4, sources: { ...FIRST_COMPONENT, html: 'Wrong' } } }));
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window, data: { channel: 'test-preview', kind: 'render', revision: 2, sources: { ...FIRST_COMPONENT, html: 'Old' } } }));
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Angular!');
  } finally { dom.window.close(); }
});


test('preview shares the host theme and instantiates real Material button directives', async () => {
  assert.match(source, /class="site-html"/);
  assert.match(source, /--mat-sys-primary:/);
  assert.match(source, /--mat-button-filled-container-shape:/);
  const dom = await environment();
  try {
    await render(dom, {
      typescript: `import { Component, ViewChild } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-material-contract',
  imports: [MatButtonModule],
  templateUrl: './component.html',
})
export default class MaterialContract {
  @ViewChild(MatButton) button!: MatButton;
  disable() { this.button.disabled = true; }
}`,
      html: '<button matButton="filled" (click)="disable()">Material action</button>',
      css: '',
    }, 1);
    await click(dom, 'button');
    assert.equal(dom.window.document.querySelector('button').disabled, true);
    // Verify child and parent templates both import the real directive.
    await render(dom, COMMUNICATION_EXAMPLE, 2);
    await click(dom, 'app-counter-button button');
    assert.match(dom.window.document.querySelector('#count').textContent, /1/);
    await click(dom, '#reset');
    assert.match(dom.window.document.querySelector('#count').textContent, /0/);
  } finally { dom.window.close(); }
});
