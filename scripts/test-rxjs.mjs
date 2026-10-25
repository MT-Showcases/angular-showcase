// Exercise the real RxJS seeds through the generated preview and jsdom.
// The editable files come from rxjs.example.ts, so the runtime sees exactly
// the code a learner can change in the lesson. Interval tests replace only the
// window.setInterval/clearInterval transport: RxJS still owns the stream.
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
        "const __filename = process.cwd() + '/scripts/test-rxjs.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { RXJS_EXAMPLES } = await fixture('src/app/rxjs-lesson/rxjs.example.ts');
const [COLD, PIPELINE, INTERVAL] = RXJS_EXAMPLES.map((example) => example.sources);

const preview = await readFile('public/playground/generated/preview.html', 'utf8');

function listen(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`Timed out waiting for ${kind}`));
    }, 10000);
    const handler = (event) => {
      if (event.data?.channel !== 'test-rxjs') return;
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
    url: 'http://localhost/playground/generated/preview.html#test-rxjs',
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
      data: { channel: 'test-rxjs', kind: 'render', revision, sources },
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

function button(scope, label) {
  const element = scope.querySelector(`[aria-label="${label}"]`);
  assert.ok(element, `Missing button "${label}"`);
  return element;
}

function textButton(document, label) {
  const element = [...document.querySelectorAll('button')].find(
    (item) => item.textContent.trim() === label,
  );
  assert.ok(element, `Missing button "${label}"`);
  return element;
}

/** Replace only the timer transport, then let the test fire the real callback. */
function intervalTransport(window) {
  const pending = new Map();
  const cleared = [];
  let nextId = 1000;

  window.setInterval = (handler) => {
    const id = nextId++;
    pending.set(id, handler);
    return id;
  };

  window.clearInterval = (id) => {
    cleared.push(id);
    pending.delete(id);
  };

  return { pending, cleared };
}

async function tick(transport, times = 1) {
  for (let index = 0; index < times; index += 1) {
    const entry = [...transport.pending.entries()].at(-1);
    assert.ok(entry, `Missing scheduled interval before tick ${index + 1}`);
    entry[1]();
    await settle();
  }
}

function values(document, selector) {
  return [...document.querySelectorAll(`${selector} .cold__value, ${selector} .operators__value, ${selector} .interval__value`)]
    .map((element) => element.textContent.trim());
}

test('a cold Observable paints nothing until A and B each run their own producer', async () => {
  const dom = await environment();
  try {
    await render(dom, COLD, 1);
    const document = dom.window.document;
    const observer = (name) => `[aria-label="Osservatore ${name}"]`;

    assert.equal(text(document, '.cold__runs strong'), '0');
    assert.equal(text(document, `${observer('A')} .cold__values`), 'Nessun valore');
    assert.equal(text(document, `${observer('B')} .cold__values`), 'Nessun valore');
    assert.equal(text(document, `${observer('A')} .cold__status`), 'Nessuna sottoscrizione');
    assert.equal(text(document, `${observer('B')} .cold__status`), 'Nessuna sottoscrizione');

    button(document, 'Iscriviti osservatore A').click();
    await settle();
    assert.equal(text(document, '.cold__runs strong'), '1');
    assert.deepEqual(values(document, observer('A')), ['1', '2', '3']);
    assert.equal(text(document, `${observer('A')} .cold__status`), 'Completato: 3 valori ricevuti');
    assert.equal(text(document, `${observer('B')} .cold__values`), 'Nessun valore');
    assert.equal(text(document, `${observer('B')} .cold__status`), 'Nessuna sottoscrizione');

    button(document, 'Iscriviti osservatore B').click();
    await settle();
    assert.equal(text(document, '.cold__runs strong'), '2');
    assert.deepEqual(values(document, observer('A')), ['1', '2', '3']);
    assert.deepEqual(values(document, observer('B')), ['1', '2', '3']);
    assert.equal(text(document, `${observer('B')} .cold__status`), 'Completato: 3 valori ricevuti');

    button(document, 'Iscriviti osservatore A').click();
    await settle();
    assert.equal(text(document, '.cold__runs strong'), '3');
    assert.deepEqual(values(document, observer('A')), ['1', '2', '3']);
    assert.deepEqual(values(document, observer('B')), ['1', '2', '3']);
  } finally {
    dom.window.close();
  }
});

test('of, filter and map emit real outputs and follow an edited predicate', async () => {
  const dom = await environment();
  try {
    await render(dom, PIPELINE, 1);
    const document = dom.window.document;

    assert.equal(text(document, '.operators__card--inputs .operators__text'), '1, 2, 3, 4, 5, 6');
    assert.equal(text(document, '.operators__card--steps .operators__text'), 'filter(pari) → map(×10)');
    assert.equal(text(document, '.operators__values'), 'Nessun valore: esegui la pipeline');
    assert.equal(text(document, '.operators__status'), 'Nessuna esecuzione');

    textButton(document, 'Esegui pipeline').click();
    await settle();
    assert.deepEqual(values(document, '.operators'), ['20', '40', '60']);
    assert.equal(text(document, '.operators__status'), 'Completato: 3 valori trasformati');

    textButton(document, 'Azzera').click();
    await settle();
    assert.equal(text(document, '.operators__values'), 'Nessun valore: esegui la pipeline');
    assert.equal(text(document, '.operators__status'), 'Nessuna esecuzione');

    const edited = PIPELINE.typescript.replace('value % 2 === 0', 'value > 3');
    assert.notEqual(edited, PIPELINE.typescript);
    await render(dom, { ...PIPELINE, typescript: edited }, 2);
    textButton(document, 'Esegui pipeline').click();
    await settle();
    assert.deepEqual(values(document, '.operators'), ['40', '50', '60']);
  } finally {
    dom.window.close();
  }
});

test('interval starts only on action, completes after take(4), and stops without complete', async () => {
  const dom = await environment();
  const transport = intervalTransport(dom.window);
  try {
    await render(dom, INTERVAL, 1);
    const document = dom.window.document;

    assert.equal(transport.pending.size, 0, 'no timer may start on render');
    assert.equal(text(document, '.interval__status'), 'Pronto: nessun timer attivo');
    assert.equal(text(document, '.interval__values'), 'Nessun valore');
    assert.equal(text(document, '[aria-label="Complete ricevuti"]'), 'complete 0');
    assert.equal(text(document, '[aria-label="Pulizie finalize"]'), 'finalize 0');

    textButton(document, 'Avvia intervallo').click();
    await settle();
    assert.equal(transport.pending.size, 1);
    assert.match(text(document, '.interval__status'), /Sottoscrizione attiva/);

    await tick(transport, 3);
    assert.deepEqual(values(document, '.interval__history'), ['1', '2', '3']);
    assert.equal(text(document, '[aria-label="Pulizie finalize"]'), 'finalize 0');

    await tick(transport, 1);
    assert.deepEqual(values(document, '.interval__history'), ['2', '3', '4']);
    assert.equal(text(document, '.interval__status'), 'Completato: take(4) ha chiuso il flusso');
    assert.equal(text(document, '[aria-label="Complete ricevuti"]'), 'complete 1');
    assert.equal(text(document, '[aria-label="Pulizie finalize"]'), 'finalize 1');
    assert.equal(transport.pending.size, 0);
    assert.ok(transport.cleared.length >= 1);
    assert.equal(textButton(document, 'Ferma intervallo').disabled, true);

    textButton(document, 'Avvia intervallo').click();
    await settle();
    assert.equal(transport.pending.size, 1);
    await tick(transport, 1);
    assert.deepEqual(values(document, '.interval__history'), ['1']);

    textButton(document, 'Ferma intervallo').click();
    await settle();
    assert.equal(text(document, '.interval__status'), 'Fermato: nessun complete, timer annullato');
    assert.equal(text(document, '[aria-label="Complete ricevuti"]'), 'complete 0');
    assert.equal(text(document, '[aria-label="Pulizie finalize"]'), 'finalize 1');
    assert.equal(transport.pending.size, 0);
    assert.deepEqual(values(document, '.interval__history'), ['1']);
  } finally {
    dom.window.close();
  }
});

test('reset and rerender clear an active interval and leave no stale values', async () => {
  const dom = await environment();
  const transport = intervalTransport(dom.window);
  try {
    await render(dom, INTERVAL, 1);
    const document = dom.window.document;

    textButton(document, 'Avvia intervallo').click();
    await settle();
    await tick(transport, 2);
    assert.deepEqual(values(document, '.interval__history'), ['1', '2']);

    textButton(document, 'Azzera').click();
    await settle();
    assert.equal(text(document, '.interval__status'), 'Pronto: nessun timer attivo');
    assert.equal(text(document, '.interval__values'), 'Nessun valore');
    assert.equal(transport.pending.size, 0);
    assert.ok(transport.cleared.length >= 1);
    await settle();
    assert.equal(text(document, '.interval__values'), 'Nessun valore');

    textButton(document, 'Avvia intervallo').click();
    await settle();
    await tick(transport, 2);
    assert.deepEqual(values(document, '.interval__history'), ['1', '2']);

    await render(dom, INTERVAL, 2);
    await settle();
    assert.equal(text(document, '.interval__status'), 'Pronto: nessun timer attivo');
    assert.equal(text(document, '.interval__values'), 'Nessun valore');
    assert.equal(text(document, '[aria-label="Complete ricevuti"]'), 'complete 0');
    assert.equal(text(document, '[aria-label="Pulizie finalize"]'), 'finalize 0');
    assert.equal(transport.pending.size, 0);

    await settle();
    assert.equal(text(document, '.interval__values'), 'Nessun valore');
  } finally {
    dom.window.close();
  }
});
