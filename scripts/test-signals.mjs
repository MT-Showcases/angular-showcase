// Exercise the real Signals seeds through the generated preview and jsdom.
// The editable files come from signals.example.ts, so the runtime sees exactly
// the code a learner can change in the lesson. The preview runs in a nested
// frame: the host document title is the proof that the effect never leaves it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';

async function fixture(sourcePath) {
  const result = await build({
    entryPoints: [sourcePath],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    // TypeScript's CommonJS bundle lazily requires Node built-ins. The data-URL
    // module has no ambient require, so give the fixture a real one.
    banner: {
      js:
        "import { createRequire as __createRequire } from 'node:module';\n" +
        "const __filename = process.cwd() + '/scripts/test-signals.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { SIGNALS_EXAMPLES } = await fixture('src/app/signals/signals.example.ts');
const [COUNTER, COMPUTED, EFFECT, CART] = SIGNALS_EXAMPLES.map(example => example.sources);

const CHANNEL = 'test-signals';
const HOST_TITLE = 'Titolo della pagina host';
const PREVIEW_TITLE = 'Anteprima componente Angular';
const previewUrl = pathToFileURL(path.resolve('public/playground/generated/preview.html')).href;
const hostUrl = pathToFileURL(path.resolve('public/playground/generated/host.html')).href;

function listen(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`Timed out waiting for ${kind}`));
    }, 20000);
    const handler = (event) => {
      if (event.data?.channel !== CHANNEL) return;
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
  // The host owns a real document title; the preview frame owns another one.
  const outer = new JSDOM(
    `<!doctype html><html><head><title>${HOST_TITLE}</title></head><body></body></html>`,
    {
      url: hostUrl,
      runScripts: 'dangerously',
      resources: 'usable',
      pretendToBeVisual: true,
      virtualConsole: new VirtualConsole(),
    },
  );
  const frame = outer.window.document.createElement('iframe');
  const ready = listen(outer.window, 'ready');
  frame.src = previewUrl + '#' + CHANNEL;
  outer.window.document.body.append(frame);
  await ready;
  return { outer, frame };
}

async function render({ outer, frame }, sources, revision, expected = 'rendered') {
  const done = listen(outer.window, expected, revision);
  frame.contentWindow.dispatchEvent(
    new frame.contentWindow.MessageEvent('message', {
      source: outer.window,
      data: { channel: CHANNEL, kind: 'render', revision, sources },
    }),
  );
  return done;
}

const frameDocument = ({ frame }) => frame.contentWindow.document;
const frameTitle = ({ frame }) => frame.contentWindow.document.title;
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

function row(document, id) {
  const element = document.querySelector(`[data-item-id="${id}"]`);
  assert.ok(element, `Missing cart row "${id}"`);
  return element;
}

function quantity(document, id) {
  return row(document, id).querySelector('.cart__quantity').textContent.trim();
}

test('counter reads a signal, writes with update and set, and follows an edited source', async () => {
  const dom = await environment();
  try {
    await render(dom, COUNTER, 1);
    const document = frameDocument(dom);

    assert.equal(text(document, '.counter__value'), '0');
    textButton(document, 'Aumenta').click();
    await settle();
    assert.equal(text(document, '.counter__value'), '1');

    textButton(document, 'Diminuisci').click();
    await settle();
    assert.equal(text(document, '.counter__value'), '0');

    textButton(document, 'Aumenta').click();
    textButton(document, 'Aumenta').click();
    await settle();
    assert.equal(text(document, '.counter__value'), '2');

    textButton(document, 'Azzera').click();
    await settle();
    assert.equal(text(document, '.counter__value'), '0');

    const edited = COUNTER.typescript.replace('value + 1', 'value + 10');
    assert.notEqual(edited, COUNTER.typescript);
    await render(dom, { ...COUNTER, typescript: edited }, 2);
    textButton(document, 'Aumenta').click();
    await settle();
    assert.equal(text(document, '.counter__value'), '10');
  } finally {
    dom.outer.window.close();
  }
});

test('computed derives the current count without a duplicated state', async () => {
  const dom = await environment();
  try {
    await render(dom, COMPUTED, 1);
    const document = frameDocument(dom);
    const values = () => [...document.querySelectorAll('.computed__value')]
      .map((element) => element.textContent.trim());

    assert.deepEqual(values(), ['0', '0']);
    textButton(document, '+1 al conteggio').click();
    await settle();
    assert.deepEqual(values(), ['1', '2']);

    textButton(document, '+10 al conteggio').click();
    await settle();
    assert.deepEqual(values(), ['11', '22']);

    textButton(document, 'Azzera').click();
    await settle();
    assert.deepEqual(values(), ['0', '0']);
  } finally {
    dom.outer.window.close();
  }
});

test('the effect syncs the frame title only while opted in and restores it on disable and rerender', async () => {
  const dom = await environment();
  try {
    await render(dom, EFFECT, 1);
    const document = frameDocument(dom);
    assert.equal(frameTitle(dom), PREVIEW_TITLE);
    assert.equal(dom.outer.window.document.title, HOST_TITLE);

    textButton(document, 'Aumenta').click();
    await settle();
    assert.equal(frameTitle(dom), PREVIEW_TITLE, 'disabled effect must not read count');

    textButton(document, 'Attiva sincronizzazione').click();
    await settle();
    assert.equal(frameTitle(dom), 'Conteggio 1 · Anteprima Angular');

    textButton(document, 'Aumenta').click();
    await settle();
    assert.equal(frameTitle(dom), 'Conteggio 2 · Anteprima Angular');
    assert.equal(text(document, '.effect__title output'), frameTitle(dom));
    assert.equal(dom.outer.window.document.title, HOST_TITLE);

    textButton(document, 'Disattiva sincronizzazione').click();
    await settle();
    assert.equal(frameTitle(dom), PREVIEW_TITLE);
    assert.equal(text(document, '.effect__title output'), PREVIEW_TITLE);
    textButton(document, 'Aumenta').click();
    await settle();
    assert.equal(frameTitle(dom), PREVIEW_TITLE);

    textButton(document, 'Attiva sincronizzazione').click();
    await settle();
    assert.equal(frameTitle(dom), 'Conteggio 3 · Anteprima Angular');

    await render(dom, EFFECT, 2);
    assert.equal(frameTitle(dom), PREVIEW_TITLE);
    assert.equal(dom.outer.window.document.title, HOST_TITLE);
  } finally {
    dom.outer.window.close();
  }
});

test('cart quantities update immutably with a lower bound and a derived total', async () => {
  const dom = await environment();
  try {
    await render(dom, CART, 1);
    const document = frameDocument(dom);

    assert.equal(text(document, '.cart__total'), 'Totale: 12 €');
    assert.equal(quantity(document, 1), '1');
    assert.equal(button(row(document, 1), 'Diminuisci Taccuino').disabled, true);

    const first = row(document, 1);
    button(first, 'Aumenta Taccuino').click();
    await settle();
    assert.equal(quantity(document, 1), '2');
    assert.equal(text(document, '.cart__total'), 'Totale: 18 €');
    assert.equal(row(document, 1), first, 'stable id keeps the row node');

    button(row(document, 1), 'Diminuisci Taccuino').click();
    await settle();
    assert.equal(quantity(document, 1), '1');
    assert.equal(button(row(document, 1), 'Diminuisci Taccuino').disabled, true);
    button(row(document, 1), 'Diminuisci Taccuino').click();
    await settle();
    assert.equal(quantity(document, 1), '1', 'quantity never goes below one');
    assert.equal(text(document, '.cart__total'), 'Totale: 12 €');

    button(row(document, 2), 'Diminuisci Penna').click();
    await settle();
    assert.equal(quantity(document, 2), '1');
    assert.equal(text(document, '.cart__total'), 'Totale: 9 €');
  } finally {
    dom.outer.window.close();
  }
});

test('cart removal, empty feedback, unique added ids and reset stay consistent', async () => {
  const dom = await environment();
  try {
    await render(dom, CART, 1);
    const document = frameDocument(dom);
    const rows = () => [...document.querySelectorAll('.cart__item')].map(
      (element) => element.getAttribute('data-item-id'),
    );

    button(row(document, 1), 'Rimuovi Taccuino').click();
    button(row(document, 2), 'Rimuovi Penna').click();
    await settle();
    assert.deepEqual(rows(), []);
    assert.equal(text(document, '.cart__total'), 'Totale: 0 €');
    assert.match(text(document, '.cart__empty'), /carrello è vuoto/);

    textButton(document, 'Aggiungi borraccia').click();
    textButton(document, 'Aggiungi borraccia').click();
    await settle();
    assert.deepEqual(rows(), ['3', '4']);
    assert.equal(text(document, '.cart__total'), 'Totale: 24 €');

    const third = row(document, 3);
    button(row(document, 4), 'Aumenta Borraccia').click();
    await settle();
    assert.equal(text(document, '.cart__total'), 'Totale: 36 €');
    assert.equal(row(document, 3), third, 'adding another row keeps existing ids');

    button(row(document, 4), 'Rimuovi Borraccia').click();
    await settle();
    assert.deepEqual(rows(), ['3']);
    assert.equal(row(document, 3), third);
    assert.equal(text(document, '.cart__total'), 'Totale: 12 €');

    textButton(document, 'Ripristina').click();
    await settle();
    assert.deepEqual(rows(), ['1', '2']);
    assert.equal(text(document, '.cart__total'), 'Totale: 12 €');

    textButton(document, 'Aggiungi borraccia').click();
    await settle();
    assert.deepEqual(rows(), ['1', '2', '3']);
  } finally {
    dom.outer.window.close();
  }
});
