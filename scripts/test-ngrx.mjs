// Exercise the real NgRx seeds through the generated preview and jsdom.
// The editable files come from ngrx.example.ts, so the runtime sees exactly
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
        "const __filename = process.cwd() + '/scripts/test-ngrx.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { NGRX_EXAMPLES } = await fixture('src/app/ngrx-example/ngrx.example.ts');
const [COUNTER, TODO] = NGRX_EXAMPLES.map((example) => example.sources);

const preview = await readFile('public/playground/generated/preview.html', 'utf8');

function listen(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`Timed out waiting for ${kind}`));
    }, 10000);
    const handler = (event) => {
      if (event.data?.channel !== 'test-ngrx') return;
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
    url: 'http://localhost/playground/generated/preview.html#test-ngrx',
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
      data: { channel: 'test-ngrx', kind: 'render', revision, sources },
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

function counterValue(document, label) {
  return text(document, `.counter__value[aria-label="${label}"]`);
}

function traceTypes(document, scope) {
  return [...document.querySelectorAll(`${scope} .counter__type, ${scope} .todo__type`)]
    .map((element) => element.textContent.trim());
}

function todoCount(document, label) {
  return text(document, `[aria-label="${label}"]`);
}

function todoTitles(document) {
  return [...document.querySelectorAll('.todo__text')].map((element) => element.textContent.trim());
}

function todoIds(document) {
  return [...document.querySelectorAll('.todo__id')].map((element) => element.textContent.trim());
}

function pressed(document, label) {
  return document.querySelector(`[aria-label="${label}"]`)?.getAttribute('aria-pressed');
}

test('counter dispatches real actions, derives the double and keeps only the last eight entries', async () => {
  const dom = await environment();
  try {
    await render(dom, COUNTER, 1);
    await settle();
    const document = dom.window.document;

    assert.equal(counterValue(document, 'Conteggio corrente'), '0');
    assert.equal(counterValue(document, 'Valore doppio'), '0');
    assert.match(text(document, '[aria-label="Ultime azioni"]'), /Nessuna azione registrata/);

    click(document, 'Incrementa di uno');
    click(document, 'Incrementa di uno');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '2');
    assert.equal(counterValue(document, 'Valore doppio'), '4');
    assert.deepEqual(traceTypes(document, '.counter'), ['[Counter] increment', '[Counter] increment']);

    click(document, 'Decrementa di uno');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '1');
    assert.equal(counterValue(document, 'Valore doppio'), '2');

    for (let index = 0; index < 9; index += 1) click(document, 'Incrementa di uno');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '10');
    assert.equal(counterValue(document, 'Valore doppio'), '20');
    assert.deepEqual(traceTypes(document, '.counter'), new Array(8).fill('[Counter] increment'));
    assert.equal(text(document, '.counter__entry:last-child .counter__result'), 'count 10');

    click(document, 'Svuota la traccia');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '10');
    assert.equal(counterValue(document, 'Valore doppio'), '20');
    assert.match(text(document, '[aria-label="Ultime azioni"]'), /Nessuna azione registrata/);

    click(document, 'Azzera conteggio e traccia');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '0');
    assert.equal(counterValue(document, 'Valore doppio'), '0');
    assert.match(text(document, '[aria-label="Ultime azioni"]'), /Nessuna azione registrata/);
  } finally {
    dom.window.close();
  }
});

test('editing the counter reducer changes the actual result of a dispatched action', async () => {
  const dom = await environment();
  try {
    const original = COUNTER.files['counter.reducer.ts'];
    const edited = original.replace('state.count + 1', 'state.count + 3');
    assert.notEqual(edited, original);

    await render(dom, { ...COUNTER, files: { ...COUNTER.files, 'counter.reducer.ts': edited } }, 2);
    await settle();
    click(dom.window.document, 'Incrementa di uno');
    await settle();

    assert.equal(counterValue(dom.window.document, 'Conteggio corrente'), '3');
    assert.equal(counterValue(dom.window.document, 'Valore doppio'), '6');
    assert.deepEqual(traceTypes(dom.window.document, '.counter'), ['[Counter] increment']);
    assert.equal(text(dom.window.document, '.counter__entry .counter__result'), 'count 3');
  } finally {
    dom.window.close();
  }
});

test('todo trims, assigns deterministic ids, toggles, filters, removes and resets in the store', async () => {
  const dom = await environment();
  try {
    await render(dom, TODO, 1);
    await settle();
    const document = dom.window.document;

    assert.equal(todoCount(document, 'Totale attività'), '0');
    assert.equal(todoCount(document, 'Attività completate'), '0');
    assert.equal(todoCount(document, 'Attività visibili'), '0');
    assert.equal(pressed(document, 'Mostra tutte le attività'), 'true');

    typeInto(dom.window, '.todo__field input', '  Comprare pane  ');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoTitles(document), ['Comprare pane']);
    assert.deepEqual(todoIds(document), ['#1']);
    assert.equal(todoCount(document, 'Totale attività'), '1');
    assert.equal(todoCount(document, 'Attività visibili'), '1');

    typeInto(dom.window, '.todo__field input', '   ');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoTitles(document), ['Comprare pane']);
    assert.equal(todoCount(document, 'Totale attività'), '1');

    typeInto(dom.window, '.todo__field input', 'Studiare NgRx');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoIds(document), ['#1', '#2']);

    click(document, 'Segna come completata: Comprare pane');
    await settle();
    assert.equal(todoCount(document, 'Attività completate'), '1');
    assert.equal(pressed(document, 'Segna come attiva: Comprare pane'), 'true');

    click(document, 'Mostra le attività attive');
    await settle();
    assert.deepEqual(todoTitles(document), ['Studiare NgRx']);
    assert.equal(todoCount(document, 'Attività visibili'), '1');
    assert.equal(pressed(document, 'Mostra le attività attive'), 'true');

    click(document, 'Mostra le attività completate');
    await settle();
    assert.deepEqual(todoTitles(document), ['Comprare pane']);
    assert.equal(pressed(document, 'Mostra le attività completate'), 'true');

    click(document, 'Mostra tutte le attività');
    await settle();
    assert.deepEqual(todoTitles(document), ['Comprare pane', 'Studiare NgRx']);

    click(document, 'Rimuovi: Studiare NgRx');
    await settle();
    assert.deepEqual(todoTitles(document), ['Comprare pane']);
    assert.equal(todoCount(document, 'Totale attività'), '1');

    typeInto(dom.window, '.todo__field input', 'Terza attività');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoIds(document), ['#1', '#3']);
    assert.equal(todoCount(document, 'Totale attività'), '2');

    const types = traceTypes(document, '.todo');
    assert.equal(types.length, 8);
    assert.ok(types.includes('[Todo] add'));
    assert.ok(types.includes('[Todo] toggle'));
    assert.ok(types.includes('[Todo] remove'));
    assert.ok(types.includes('[Todo] setFilter'));
    assert.ok(text(document, '[aria-label="Ultime azioni"]').includes('#1 «Comprare pane»'));

    typeInto(dom.window, '.todo__field input', 'Bozza non inviata');
    await settle();
    click(document, 'Azzera lista e filtro');
    await settle();
    assert.equal(document.querySelector('.todo__field input').value, '');
    await settle();
    assert.deepEqual(todoTitles(document), []);
    assert.equal(todoCount(document, 'Totale attività'), '0');
    assert.equal(todoCount(document, 'Attività completate'), '0');
    assert.equal(todoCount(document, 'Attività visibili'), '0');
    assert.equal(pressed(document, 'Mostra tutte le attività'), 'true');
    assert.match(text(document, '[aria-label="Ultime azioni"]'), /Nessuna azione registrata/);
  } finally {
    dom.window.close();
  }
});

test('a new render starts each preview from its own store instead of the previous one', async () => {
  const dom = await environment();
  try {
    await render(dom, COUNTER, 1);
    await settle();
    click(dom.window.document, 'Incrementa di uno');
    click(dom.window.document, 'Incrementa di uno');
    await settle();
    assert.equal(counterValue(dom.window.document, 'Conteggio corrente'), '2');

    await render(dom, TODO, 2);
    await settle();
    typeInto(dom.window, '.todo__field input', 'Solo in questa preview');
    await settle();
    click(dom.window.document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoTitles(dom.window.document), ['Solo in questa preview']);

    await render(dom, COUNTER, 3);
    await settle();
    assert.equal(counterValue(dom.window.document, 'Conteggio corrente'), '0');
    assert.equal(counterValue(dom.window.document, 'Valore doppio'), '0');
    assert.match(text(dom.window.document, '[aria-label="Ultime azioni"]'), /Nessuna azione registrata/);

    await render(dom, TODO, 4);
    await settle();
    assert.deepEqual(todoTitles(dom.window.document), []);
    assert.equal(todoCount(dom.window.document, 'Totale attività'), '0');
  } finally {
    dom.window.close();
  }
});

test('generated declarations resolve @ngrx/store across every virtual file', async () => {
  const { createTypeService } = await fixture('playground/type-service.ts');
  const generated = await readFile('public/playground/generated/typescript-libs.json', 'utf8');
  const { files: declarationFiles } = JSON.parse(generated);

  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@ngrx/store/types/ngrx-store.d.ts'));

  const service = createTypeService({ ...declarationFiles, '/component.ts': '' });

  for (const example of NGRX_EXAMPLES) {
    const files = { 'component.ts': example.sources.typescript, ...example.sources.files };

    for (const [name, source] of Object.entries(files)) {
      if (!name.endsWith('.ts')) continue;

      const diagnostics = service.check(source, name, files);
      assert.deepEqual(
        diagnostics,
        [],
        `Unexpected diagnostics for ${example.id}/${name}:\n${JSON.stringify(diagnostics, null, 2)}`,
      );
    }
  }
});
