// Exercise the real services seeds through the generated preview and jsdom.
// The editable files come from services.example.ts, so the runtime sees exactly
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
        "const __filename = process.cwd() + '/scripts/test-services.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { SCOPED_SERVICE_EXAMPLE, SHARED_SERVICE_EXAMPLE } = await fixture(
  'src/app/services-lesson/services.example.ts',
);
const preview = await readFile('public/playground/generated/preview.html', 'utf8');

const SHARED_LABELS = ['Condivisa A', 'Condivisa B'];
const SCOPED_LABELS = [...SHARED_LABELS, 'Isolata A', 'Isolata B'];

function listen(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`Timed out waiting for ${kind}`));
    }, 10000);
    const handler = (event) => {
      if (event.data?.channel !== 'test-preview') return;
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
    url: 'http://localhost/playground/generated/preview.html#test-preview',
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
      data: { channel: 'test-preview', kind: 'render', revision, sources },
    }),
  );
  return done;
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

function count(document, label) {
  const section = document.querySelector(`[aria-label="${label}"]`);
  assert.ok(section, `Missing counter "${label}"`);
  return section.querySelector('.counter__value').textContent.trim();
}

function counts(document, labels) {
  return labels.map((label) => count(document, label));
}

function click(document, label) {
  const button = document.querySelector(`[aria-label="${label}"]`);
  assert.ok(button, `Missing button "${label}"`);
  button.click();
}

function textButton(document, text) {
  return [...document.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === text,
  );
}

test('shared provider updates and resets both views with real Material controls', async () => {
  const dom = await environment();
  try {
    await render(dom, SHARED_SERVICE_EXAMPLE, 1);
    const document = dom.window.document;

    assert.deepEqual(counts(document, SHARED_LABELS), ['0', '0']);
    assert.equal(document.querySelector('[aria-label="Condivisa A"] .counter__label').textContent.trim(), 'Condivisa A');

    click(document, 'Aumenta Condivisa A');
    await settle();
    assert.deepEqual(counts(document, SHARED_LABELS), ['1', '1']);

    click(document, 'Aumenta Condivisa B');
    await settle();
    assert.deepEqual(counts(document, SHARED_LABELS), ['2', '2']);

    click(document, 'Azzera Condivisa B');
    await settle();
    assert.deepEqual(counts(document, SHARED_LABELS), ['0', '0']);
  } finally {
    dom.window.close();
  }
});

test('a nearer provider isolates each counter while the shared pair keeps its state', async () => {
  const dom = await environment();
  try {
    await render(dom, SCOPED_SERVICE_EXAMPLE, 1);
    const document = dom.window.document;

    click(document, 'Aumenta Condivisa A');
    click(document, 'Aumenta Isolata A');
    click(document, 'Aumenta Isolata B');
    click(document, 'Aumenta Isolata B');
    await settle();
    assert.deepEqual(counts(document, SCOPED_LABELS), ['1', '1', '1', '2']);

    click(document, 'Azzera Isolata A');
    await settle();
    assert.deepEqual(counts(document, SCOPED_LABELS), ['1', '1', '0', '2']);

    click(document, 'Azzera Condivisa A');
    await settle();
    assert.deepEqual(counts(document, SCOPED_LABELS), ['0', '0', '0', '2']);
  } finally {
    dom.window.close();
  }
});

test('removing and recreating the isolated pair keeps shared state and resets local services', async () => {
  const dom = await environment();
  try {
    await render(dom, SCOPED_SERVICE_EXAMPLE, 1);
    const document = dom.window.document;

    click(document, 'Aumenta Condivisa A');
    click(document, 'Aumenta Isolata A');
    await settle();
    assert.deepEqual(counts(document, SCOPED_LABELS), ['1', '1', '1', '0']);

    textButton(document, 'Rimuovi gli isolati').click();
    await settle();
    assert.equal(document.querySelectorAll('app-isolated-counter').length, 0);
    assert.deepEqual(counts(document, SHARED_LABELS), ['1', '1']);
    assert.match(document.querySelector('#isolated-counters').textContent, /rimossa/);

    textButton(document, 'Ricrea gli isolati').click();
    await settle();
    assert.equal(document.querySelectorAll('app-isolated-counter').length, 2);
    assert.deepEqual(counts(document, SCOPED_LABELS), ['1', '1', '0', '0']);

    click(document, 'Aumenta Isolata B');
    await settle();
    assert.deepEqual(counts(document, SCOPED_LABELS), ['1', '1', '0', '1']);
  } finally {
    dom.window.close();
  }
});

test('rerendering the scoped seed starts a fresh application with zeroed services', async () => {
  const dom = await environment();
  try {
    await render(dom, SCOPED_SERVICE_EXAMPLE, 1);
    const document = dom.window.document;
    click(document, 'Aumenta Condivisa B');
    click(document, 'Aumenta Isolata B');
    await settle();
    assert.deepEqual(counts(document, SCOPED_LABELS), ['1', '1', '0', '1']);

    await render(dom, SCOPED_SERVICE_EXAMPLE, 2);
    assert.deepEqual(counts(document, SCOPED_LABELS), ['0', '0', '0', '0']);

    await render(dom, SHARED_SERVICE_EXAMPLE, 3);
    assert.deepEqual(counts(document, SHARED_LABELS), ['0', '0']);
    assert.equal(document.querySelectorAll('app-isolated-counter').length, 0);
  } finally {
    dom.window.close();
  }
});

test('editing the service file changes both increment and reset behavior', async () => {
  const dom = await environment();
  try {
    const original = SHARED_SERVICE_EXAMPLE.files['counter.service.ts'];
    const edited = original
      .replace('value + 1', 'value + 10')
      .replace('this.currentCount.set(0);', 'this.currentCount.set(5);');
    assert.notEqual(edited, original);

    await render(
      dom,
      {
        ...SHARED_SERVICE_EXAMPLE,
        files: { ...SHARED_SERVICE_EXAMPLE.files, 'counter.service.ts': edited },
      },
      1,
    );
    const document = dom.window.document;

    click(document, 'Aumenta Condivisa A');
    await settle();
    assert.deepEqual(counts(document, SHARED_LABELS), ['10', '10']);

    click(document, 'Azzera Condivisa B');
    await settle();
    assert.deepEqual(counts(document, SHARED_LABELS), ['5', '5']);
  } finally {
    dom.window.close();
  }
});

test('a missing provider reports the actual service and recovers on the next render', async () => {
  const dom = await environment();
  try {
    const withoutProvider = SHARED_SERVICE_EXAMPLE.typescript.replace(
      '  providers: [CounterService],\n',
      '',
    );
    assert.notEqual(withoutProvider, SHARED_SERVICE_EXAMPLE.typescript);

    const failure = await render(
      dom,
      { ...SHARED_SERVICE_EXAMPLE, typescript: withoutProvider },
      1,
      'error',
    );
    assert.match(failure.message, /CounterService/);
    assert.match(failure.message, /provider/i);
    await settle();

    await render(dom, SHARED_SERVICE_EXAMPLE, 2);
    click(dom.window.document, 'Aumenta Condivisa A');
    await settle();
    assert.deepEqual(counts(dom.window.document, SHARED_LABELS), ['1', '1']);
  } finally {
    dom.window.close();
  }
});
