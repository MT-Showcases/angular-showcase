// Exercise the real BehaviorSubject seeds through the generated preview and jsdom.
// The editable files come from behavior.example.ts, so the runtime sees exactly
// the code a learner can change in the lesson.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';

async function fixture(path) {
  const result = await build({
    entryPoints: [path],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    // TypeScript's CommonJS bundle lazily requires Node built-ins. The data-URL
    // module has no ambient require, so give the fixture a real one.
    banner: {
      js:
        "import { createRequire as __createRequire } from 'node:module';\n" +
        "const __filename = process.cwd() + '/scripts/test-behavior.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { BEHAVIOR_EXAMPLES } = await fixture('src/app/behavior-subject/behavior.example.ts');
const [COMPARE, COUNTER, PROFILE] = BEHAVIOR_EXAMPLES.map((example) => example.sources);

const preview = await readFile('public/playground/generated/preview.html', 'utf8');

function listen(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`Timed out waiting for ${kind}`));
    }, 10000);
    const handler = (event) => {
      if (event.data?.channel !== 'test-behavior') return;
      if (revision !== undefined && event.data.revision !== revision) return;
      if (event.data.kind !== kind && event.data.kind !== 'error') return;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      if (event.data.kind === 'error' && kind !== 'error') reject(new Error(event.data.message));
      else resolve(event.data);
    };
    window.addEventListener('message', handler);
  });
}

async function environment() {
  const dom = new JSDOM(preview, {
    url: 'http://localhost/playground/generated/preview.html#test-behavior',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
  });
  await listen(dom.window, 'ready');
  return dom;
}

async function render(dom, sources, revision, expected = 'rendered') {
  const done = listen(dom.window, expected, revision);
  dom.window.dispatchEvent(
    new dom.window.MessageEvent('message', {
      source: dom.window,
      data: { channel: 'test-behavior', kind: 'render', revision, sources },
    }),
  );
  return done;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

function text(document, selector) {
  const element = document.querySelector(selector);
  assert.ok(element, `Missing element "${selector}"`);
  return element.textContent.replace(/\s+/g, ' ').trim();
}

function click(document, label) {
  const element = document.querySelector(`[aria-label="${label}"]`);
  assert.ok(element, `Missing control "${label}"`);
  element.click();
}

function typeInto(window, selector, value) {
  const input = window.document.querySelector(selector);
  assert.ok(input, `Missing input "${selector}"`);
  input.value = value;
  input.dispatchEvent(new window.Event('input', { bubbles: true }));
}

function panelText(document, panel, observer) {
  const scope = document.querySelector(`[aria-label="${panel}"]`);
  assert.ok(scope, `Missing panel "${panel}"`);
  return text(scope, `[aria-label="${observer}"] .observer__value`);
}

function counter(document, label) {
  return text(document, `.counter__value[aria-label="${label}"]`);
}

function history(document) {
  return [...document.querySelectorAll('.counter__change')].map((element) => element.textContent.trim());
}

function user(document, label) {
  const panel = document.querySelector(`[aria-label="${label}"]`);
  assert.ok(panel, `Missing consumer "${label}"`);
  return {
    name: text(panel, '.panel__name'),
    status: text(panel, '.panel__status'),
  };
}

test('a late consumer gets the current BehaviorSubject value but no past Subject value', async () => {
  const dom = await environment();
  try {
    await render(dom, COMPARE, 1);
    await settle();
    const document = dom.window.document;

    assert.equal(panelText(document, 'Sorgente Subject', 'A · sempre attivo'), 'Nessuna emissione');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), 'Benvenuto!');
    assert.equal(document.querySelectorAll('[aria-label="B · tardivo"]').length, 0);

    typeInto(dom.window, '.compare__field input', 'prima');
    await settle();
    click(document, 'Invia a Subject e BehaviorSubject');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'A · sempre attivo'), 'prima');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), 'prima');

    click(document, 'Mostra o nascondi il consumatore tardivo B');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'B · tardivo'), 'Nessuna emissione');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'B · tardivo'), 'prima');

    typeInto(dom.window, '.compare__field input', 'seconda');
    await settle();
    click(document, 'Invia a Subject e BehaviorSubject');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'B · tardivo'), 'seconda');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'B · tardivo'), 'seconda');

    click(document, 'Mostra o nascondi il consumatore tardivo B');
    await settle();
    assert.equal(document.querySelectorAll('[aria-label="B · tardivo"]').length, 0);

    typeInto(dom.window, '.compare__field input', 'terza');
    await settle();
    click(document, 'Invia a Subject e BehaviorSubject');
    await settle();
    click(document, 'Mostra o nascondi il consumatore tardivo B');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'B · tardivo'), 'Nessuna emissione');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'B · tardivo'), 'terza');
  } finally {
    dom.window.close();
  }
});

test('blank input is ignored, the trim is sent, and reset restores only the BehaviorSubject value', async () => {
  const dom = await environment();
  try {
    await render(dom, COMPARE, 1);
    await settle();
    const document = dom.window.document;

    typeInto(dom.window, '.compare__field input', '   ');
    await settle();
    click(document, 'Invia a Subject e BehaviorSubject');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'A · sempre attivo'), 'Nessuna emissione');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), 'Benvenuto!');

    typeInto(dom.window, '.compare__field input', '  ciao  ');
    await settle();
    click(document, 'Invia a Subject e BehaviorSubject');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'A · sempre attivo'), 'ciao');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), 'ciao');

    click(document, 'Invia stringa vuota');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'A · sempre attivo'), '«vuoto»');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), '«vuoto»');

    click(document, 'Ripristina il valore iniziale');
    await settle();
    assert.equal(panelText(document, 'Sorgente Subject', 'A · sempre attivo'), '«vuoto»');
    assert.equal(panelText(document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), 'Benvenuto!');
    assert.equal(document.querySelector('.compare__field input').value, '');
  } finally {
    dom.window.close();
  }
});

test('the counter updates a derived double and keeps only the last five changes', async () => {
  const dom = await environment();
  try {
    await render(dom, COUNTER, 1);
    await settle();
    const document = dom.window.document;

    assert.equal(counter(document, 'Conteggio corrente'), '0');
    assert.equal(counter(document, 'Valore doppio'), '0');
    assert.match(text(document, '.counter__changes'), /Nessun cambio/);

    for (let index = 0; index < 6; index += 1) click(document, 'Incrementa di uno');
    await settle();
    assert.equal(counter(document, 'Conteggio corrente'), '6');
    assert.equal(counter(document, 'Valore doppio'), '12');
    assert.deepEqual(history(document), ['2', '3', '4', '5', '6']);

    click(document, 'Decrementa di uno');
    await settle();
    assert.equal(counter(document, 'Conteggio corrente'), '5');
    assert.equal(counter(document, 'Valore doppio'), '10');
    assert.deepEqual(history(document), ['3', '4', '5', '6', '5']);

    click(document, 'Azzera contatore');
    await settle();
    assert.equal(counter(document, 'Conteggio corrente'), '0');
    assert.equal(counter(document, 'Valore doppio'), '0');
    assert.match(text(document, '.counter__changes'), /Nessun cambio/);
  } finally {
    dom.window.close();
  }
});

test('both panels share the root service, follow trim and reset, and use an edited service source', async () => {
  const dom = await environment();
  try {
    await render(dom, PROFILE, 1);
    await settle();
    let document = dom.window.document;

    for (const label of ['Consumatore A', 'Consumatore B']) {
      assert.equal(user(document, label).name, 'Ospite');
      assert.match(user(document, label).status, /Offline/);
    }

    typeInto(dom.window, '.profile__field input', '  Ada  ');
    await settle();
    click(document, 'Aggiorna lo stato condiviso');
    await settle();
    for (const label of ['Consumatore A', 'Consumatore B']) {
      assert.equal(user(document, label).name, 'Ada');
      assert.match(user(document, label).status, /Online/);
    }

    typeInto(dom.window, '.profile__field input', '   ');
    await settle();
    click(document, 'Aggiorna lo stato condiviso');
    await settle();
    assert.equal(user(document, 'Consumatore A').name, 'Ada');
    assert.equal(user(document, 'Consumatore B').name, 'Ada');

    click(document, 'Riporta l\'ospite');
    await settle();
    for (const label of ['Consumatore A', 'Consumatore B']) {
      assert.equal(user(document, label).name, 'Ospite');
      assert.match(user(document, label).status, /Offline/);
    }

    const original = PROFILE.files['user-state.service.ts'];
    const edited = original
      .replace('online: true', 'online: false')
      .replace("name: 'Ospite'", "name: 'Visitatore'");
    assert.notEqual(edited, original);

    await render(
      dom,
      { ...PROFILE, files: { ...PROFILE.files, 'user-state.service.ts': edited } },
      2,
    );
    await settle();
    document = dom.window.document;
    for (const label of ['Consumatore A', 'Consumatore B']) {
      assert.equal(user(document, label).name, 'Visitatore');
      assert.match(user(document, label).status, /Offline/);
    }

    typeInto(dom.window, '.profile__field input', 'Bruno');
    await settle();
    click(document, 'Aggiorna lo stato condiviso');
    await settle();
    for (const label of ['Consumatore A', 'Consumatore B']) {
      assert.equal(user(document, label).name, 'Bruno');
      assert.match(user(document, label).status, /Offline/);
    }

    click(document, 'Riporta l\'ospite');
    await settle();
    for (const label of ['Consumatore A', 'Consumatore B']) {
      assert.equal(user(document, label).name, 'Visitatore');
    }
  } finally {
    dom.window.close();
  }
});

test('a new render starts from the seed state instead of the previous preview', async () => {
  const dom = await environment();
  try {
    await render(dom, COUNTER, 1);
    await settle();
    click(dom.window.document, 'Incrementa di uno');
    click(dom.window.document, 'Incrementa di uno');
    await settle();
    assert.equal(counter(dom.window.document, 'Conteggio corrente'), '2');

    await render(dom, COUNTER, 2);
    await settle();
    assert.equal(counter(dom.window.document, 'Conteggio corrente'), '0');
    assert.match(text(dom.window.document, '.counter__changes'), /Nessun cambio/);

    await render(dom, COMPARE, 3);
    await settle();
    typeInto(dom.window, '.compare__field input', 'prima');
    await settle();
    click(dom.window.document, 'Invia a Subject e BehaviorSubject');
    await settle();
    assert.equal(panelText(dom.window.document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), 'prima');

    await render(dom, COMPARE, 4);
    await settle();
    assert.equal(panelText(dom.window.document, 'Sorgente BehaviorSubject', 'A · sempre attivo'), 'Benvenuto!');
    assert.equal(panelText(dom.window.document, 'Sorgente Subject', 'A · sempre attivo'), 'Nessuna emissione');
  } finally {
    dom.window.close();
  }
});
