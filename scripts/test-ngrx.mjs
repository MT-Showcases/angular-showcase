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

function openTab(document, label) {
  const tab = [...document.querySelectorAll('[role="tab"]')]
    .find((element) => element.textContent.trim() === label);
  assert.ok(tab, `Missing DevTools tab "${label}"`);
  tab.click();
}

function devtoolsTypes(document) {
  return [...document.querySelectorAll('.devtools__entry-type')]
    .map((element) => element.textContent.trim());
}

function inspect(document, index) {
  const button = document.querySelectorAll('.devtools__select')[index];
  assert.ok(button, `Missing DevTools action at index ${index}`);
  button.click();
}

function selectedType(document) {
  return text(document, '.devtools__type');
}

function snapshot(document, selector) {
  const element = document.querySelector(selector);
  assert.ok(element, `Missing JSON element "${selector}"`);
  // JSON.parse accetta gli spazi dell'indentazione ma conserva quelli dentro le stringhe.
  return JSON.parse(element.textContent);
}

function changes(document) {
  return [...document.querySelectorAll('.devtools__change')].map((item) => ({
    path: item.querySelector('.devtools__path').textContent.trim(),
    before: item.querySelector('.devtools__old').textContent.trim(),
    after: item.querySelector('.devtools__new').textContent.trim(),
  }));
}

test('counter records real actions, keeps a pinned inspection and bounds the journal', async () => {
  const dom = await environment();
  try {
    await render(dom, COUNTER, 1);
    await settle();
    const document = dom.window.document;

    assert.equal(counterValue(document, 'Conteggio corrente'), '0');
    assert.equal(counterValue(document, 'Valore doppio'), '0');
    assert.deepEqual(
      [...document.querySelectorAll('[role="tab"]')].map((element) => element.textContent.trim()),
      ['Azione', 'Stato', 'Modifiche'],
    );
    assert.deepEqual(devtoolsTypes(document), ['@ngrx/store/init']);
    assert.equal(selectedType(document), '@ngrx/store/init');
    assert.equal(
      document.querySelector('.devtools__select').getAttribute('aria-label'),
      'Ispeziona azione 1 @ngrx/store/init',
    );
    assert.match(text(document, '.devtools__payload'), /Nessun payload/);
    assert.match(text(document, '.devtools__before'), /Nessuno stato precedente/);
    assert.deepEqual(snapshot(document, '.devtools__after'), { counter: { count: 0 } });
    assert.equal(
      document.querySelector('.devtools__select').getAttribute('aria-pressed'),
      'true',
    );

    openTab(document, 'Stato');
    await settle();
    assert.equal(snapshot(document, '.devtools__live').counter.count, 0);

    openTab(document, 'Modifiche');
    await settle();
    assert.deepEqual(changes(document).map((change) => change.path), ['counter']);
    assert.equal(changes(document)[0].before, 'assente');
    assert.equal(JSON.parse(changes(document)[0].after).count, 0);

    click(document, 'Incrementa di uno');
    click(document, 'Incrementa di uno');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '2');
    assert.equal(counterValue(document, 'Valore doppio'), '4');
    assert.deepEqual(devtoolsTypes(document), [
      '@ngrx/store/init',
      '[Counter] increment',
      '[Counter] increment',
    ]);
    assert.equal(selectedType(document), '[Counter] increment');
    assert.equal(text(document, '.devtools__payload'), '{}');
    assert.equal(snapshot(document, '.devtools__before').counter.count, 1);
    assert.equal(snapshot(document, '.devtools__after').counter.count, 2);

    click(document, 'Decrementa di uno');
    await settle();
    assert.deepEqual(changes(document).map((change) => change.path), ['counter.count']);
    assert.equal(changes(document)[0].before, '2');
    assert.equal(changes(document)[0].after, '1');

    // Seleziona un'azione vecchia: gli snapshot restano quelli del momento.
    inspect(document, 1);
    await settle();
    assert.equal(
      document.querySelectorAll('.devtools__select')[1].getAttribute('aria-pressed'),
      'true',
    );
    assert.equal(snapshot(document, '.devtools__after').counter.count, 1);
    assert.equal(snapshot(document, '.devtools__before').counter.count, 0);

    click(document, 'Incrementa di uno');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '2');
    assert.equal(
      document.querySelectorAll('.devtools__select')[1].getAttribute('aria-pressed'),
      'true',
    );
    assert.equal(snapshot(document, '.devtools__after').counter.count, 1);
    openTab(document, 'Stato');
    await settle();
    assert.equal(snapshot(document, '.devtools__live').counter.count, 2);

    for (let index = 0; index < 9; index += 1) click(document, 'Incrementa di uno');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '11');
    assert.equal(counterValue(document, 'Valore doppio'), '22');
    assert.deepEqual(devtoolsTypes(document), new Array(8).fill('[Counter] increment'));
    assert.equal(snapshot(document, '.devtools__before').counter.count, 10);
    assert.equal(snapshot(document, '.devtools__after').counter.count, 11);
    assert.equal(snapshot(document, '.devtools__live').counter.count, 11);

    click(document, 'Pulisci la cronologia DevTools');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '11');
    assert.equal(counterValue(document, 'Valore doppio'), '22');
    assert.deepEqual(devtoolsTypes(document), []);
    assert.match(text(document, '.devtools__history'), /Nessuna azione registrata/);
    assert.match(
      text(document, '[aria-label="Dettaglio azione selezionata"]'),
      /Seleziona un'azione/,
    );
    assert.equal(
      document.querySelector('[aria-label="Pulisci la cronologia DevTools"]').disabled,
      true,
    );
    assert.equal(snapshot(document, '.devtools__live').counter.count, 11);

    click(document, 'Azzera il conteggio');
    await settle();
    assert.equal(counterValue(document, 'Conteggio corrente'), '0');
    assert.equal(counterValue(document, 'Valore doppio'), '0');
    assert.deepEqual(devtoolsTypes(document), ['[Counter] reset']);
    assert.equal(selectedType(document), '[Counter] reset');
    assert.equal(text(document, '.devtools__payload'), '{}');
    assert.equal(snapshot(document, '.devtools__before').counter.count, 11);
    assert.equal(snapshot(document, '.devtools__after').counter.count, 0);
    assert.deepEqual(changes(document).map((change) => change.path), ['counter.count']);
    assert.equal(changes(document)[0].before, '11');
    assert.equal(changes(document)[0].after, '0');
    assert.equal(snapshot(document, '.devtools__live').counter.count, 0);
  } finally {
    dom.window.close();
  }
});

test('editing the counter reducer changes the value and the recorded snapshot', async () => {
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
    assert.equal(selectedType(dom.window.document), '[Counter] increment');
    assert.equal(snapshot(dom.window.document, '.devtools__before').counter.count, 0);
    assert.equal(snapshot(dom.window.document, '.devtools__after').counter.count, 3);

    openTab(dom.window.document, 'Modifiche');
    await settle();
    assert.deepEqual(changes(dom.window.document).map((change) => change.path), ['counter.count']);
    assert.equal(changes(dom.window.document)[0].before, '0');
    assert.equal(changes(dom.window.document)[0].after, '3');
  } finally {
    dom.window.close();
  }
});

test('todo records real payloads and snapshots for add, toggle, filter, remove and blank titles', async () => {
  const dom = await environment();
  try {
    await render(dom, TODO, 1);
    await settle();
    const document = dom.window.document;

    assert.equal(todoCount(document, 'Totale attività'), '0');
    assert.deepEqual(devtoolsTypes(document), ['@ngrx/store/init']);

    openTab(document, 'Stato');
    await settle();
    assert.deepEqual(snapshot(document, '.devtools__live'), {
      todos: { todos: [], filter: 'all', nextId: 1 },
    });

    openTab(document, 'Modifiche');
    await settle();
    assert.deepEqual(changes(document).map((change) => change.path), ['todos']);

    typeInto(dom.window, '.todo__field input', '  Comprare pane  ');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoTitles(document), ['Comprare pane']);
    assert.deepEqual(todoIds(document), ['#1']);
    assert.equal(todoCount(document, 'Totale attività'), '1');
    assert.equal(todoCount(document, 'Attività visibili'), '1');

    assert.equal(selectedType(document), '[Todo] add');
    assert.deepEqual(snapshot(document, '.devtools__payload'), { title: '  Comprare pane  ' });
    assert.deepEqual(snapshot(document, '.devtools__before'), {
      todos: { todos: [], filter: 'all', nextId: 1 },
    });
    assert.deepEqual(snapshot(document, '.devtools__after'), {
      todos: {
        todos: [{ id: 1, title: 'Comprare pane', completed: false }],
        filter: 'all',
        nextId: 2,
      },
    });
    assert.deepEqual(changes(document).map((change) => change.path), ['todos.todos', 'todos.nextId']);
    assert.equal(changes(document)[0].before, '[]');
    assert.equal(JSON.parse(changes(document)[0].after)[0].title, 'Comprare pane');

    // Un titolo vuoto è un'azione reale, ma prima e dopo sono identici.
    typeInto(dom.window, '.todo__field input', '   ');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoTitles(document), ['Comprare pane']);
    assert.equal(todoCount(document, 'Totale attività'), '1');
    assert.equal(selectedType(document), '[Todo] add');
    assert.deepEqual(snapshot(document, '.devtools__payload'), { title: '   ' });
    assert.deepEqual(snapshot(document, '.devtools__before'), snapshot(document, '.devtools__after'));
    assert.deepEqual(changes(document), []);
    assert.match(text(document, '[aria-label="Modifiche dell\'azione selezionata"]'), /Nessuna variazione/);

    typeInto(dom.window, '.todo__field input', 'Studiare NgRx');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoIds(document), ['#1', '#2']);

    click(document, 'Segna come completata: Comprare pane');
    await settle();
    assert.equal(todoCount(document, 'Attività completate'), '1');
    assert.equal(selectedType(document), '[Todo] toggle');
    assert.deepEqual(snapshot(document, '.devtools__payload'), { id: 1 });
    assert.equal(snapshot(document, '.devtools__after').todos.todos[0].completed, true);

    click(document, 'Mostra le attività attive');
    await settle();
    assert.deepEqual(todoTitles(document), ['Studiare NgRx']);
    assert.equal(todoCount(document, 'Attività visibili'), '1');
    assert.equal(pressed(document, 'Mostra le attività attive'), 'true');
    assert.equal(selectedType(document), '[Todo] setFilter');
    assert.deepEqual(snapshot(document, '.devtools__payload'), { filter: 'active' });
    assert.deepEqual(changes(document).map((change) => change.path), ['todos.filter']);
    assert.equal(changes(document)[0].before, '"all"');
    assert.equal(changes(document)[0].after, '"active"');

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
    assert.equal(selectedType(document), '[Todo] remove');
    assert.deepEqual(snapshot(document, '.devtools__payload'), { id: 2 });

    typeInto(dom.window, '.todo__field input', 'Terza attività');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoIds(document), ['#1', '#3']);
    assert.equal(todoCount(document, 'Totale attività'), '2');

    const types = devtoolsTypes(document);
    assert.equal(types.length, 8);
    assert.ok(types.includes('[Todo] add'));
    assert.ok(types.includes('[Todo] toggle'));
    assert.ok(types.includes('[Todo] remove'));
    assert.ok(types.includes('[Todo] setFilter'));

    // Il reset azzera il dominio e la bozza, non il journal DevTools.
    typeInto(dom.window, '.todo__field input', 'Bozza non inviata');
    await settle();
    click(document, 'Azzera lista e filtro');
    await settle();
    assert.equal(document.querySelector('.todo__field input').value, '');
    assert.deepEqual(todoTitles(document), []);
    assert.equal(todoCount(document, 'Totale attività'), '0');
    assert.equal(todoCount(document, 'Attività completate'), '0');
    assert.equal(todoCount(document, 'Attività visibili'), '0');
    assert.equal(pressed(document, 'Mostra tutte le attività'), 'true');
    assert.equal(selectedType(document), '[Todo] reset');
    assert.equal(text(document, '.devtools__payload'), '{}');
    assert.deepEqual(snapshot(document, '.devtools__after'), {
      todos: { todos: [], filter: 'all', nextId: 1 },
    });
    assert.deepEqual(changes(document).map((change) => change.path), ['todos.todos', 'todos.nextId']);
    assert.equal(changes(document)[1].before, '4');
    assert.equal(changes(document)[1].after, '1');
    assert.equal(devtoolsTypes(document).length, 8);

    // nextId è tornato a 1: la nuova attività riparte da #1.
    typeInto(dom.window, '.todo__field input', 'Dopo il reset');
    await settle();
    click(document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoIds(document), ['#1']);
    assert.equal(selectedType(document), '[Todo] add');

    assert.equal(snapshot(document, '.devtools__after').todos.nextId, 2);

    // Dopo una rimozione l'array vuoto è nuovo: il reset cambia solo nextId.
    click(document, 'Rimuovi: Dopo il reset');
    await settle();
    click(document, 'Azzera lista e filtro');
    await settle();
    assert.deepEqual(changes(document).map(change => change.path), ['todos.nextId']);
    assert.equal(changes(document)[0].before, '2');
    assert.equal(changes(document)[0].after, '1');
  } finally {
    dom.window.close();
  }
});

test('a new render starts each preview with its own store and journal', async () => {
  const dom = await environment();
  try {
    await render(dom, COUNTER, 1);
    await settle();
    click(dom.window.document, 'Incrementa di uno');
    click(dom.window.document, 'Incrementa di uno');
    await settle();
    assert.equal(counterValue(dom.window.document, 'Conteggio corrente'), '2');
    assert.equal(devtoolsTypes(dom.window.document).length, 3);

    await render(dom, TODO, 2);
    await settle();
    typeInto(dom.window, '.todo__field input', 'Solo in questa preview');
    await settle();
    click(dom.window.document, 'Aggiungi attività');
    await settle();
    assert.deepEqual(todoTitles(dom.window.document), ['Solo in questa preview']);
    assert.deepEqual(devtoolsTypes(dom.window.document), [
      '@ngrx/store/init',
      '[Todo] add',
    ]);
    openTab(dom.window.document, 'Stato');
    await settle();
    assert.equal(snapshot(dom.window.document, '.devtools__live').todos.todos.length, 1);

    await render(dom, COUNTER, 3);
    await settle();
    assert.equal(counterValue(dom.window.document, 'Conteggio corrente'), '0');
    assert.equal(counterValue(dom.window.document, 'Valore doppio'), '0');
    assert.deepEqual(devtoolsTypes(dom.window.document), ['@ngrx/store/init']);
    assert.equal(selectedType(dom.window.document), '@ngrx/store/init');
    openTab(dom.window.document, 'Stato');
    await settle();
    assert.equal(snapshot(dom.window.document, '.devtools__live').counter.count, 0);

    await render(dom, TODO, 4);
    await settle();
    assert.deepEqual(todoTitles(dom.window.document), []);
    assert.equal(todoCount(dom.window.document, 'Totale attività'), '0');
    assert.deepEqual(devtoolsTypes(dom.window.document), ['@ngrx/store/init']);
  } finally {
    dom.window.close();
  }
});

test('generated declarations resolve @ngrx/store and @angular/material/tabs in every virtual file', async () => {
  const { createTypeService } = await fixture('playground/type-service.ts');
  const generated = await readFile('public/playground/generated/typescript-libs.json', 'utf8');
  const { files: declarationFiles } = JSON.parse(generated);

  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@ngrx/store/types/ngrx-store.d.ts'));
  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@angular/material/types/tabs.d.ts'));

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
