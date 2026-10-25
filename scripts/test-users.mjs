// Exercise the real Users project through the generated preview and jsdom.
// The editable files come from users.example.ts, so the runtime sees exactly the
// code a learner can change. fetch is replaced only at the transport boundary:
// HttpClient, FetchBackend, the service and the component stay real. Responses
// are resolved manually, so asynchronous states are deterministic and offline.
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
        "const __filename = process.cwd() + '/scripts/test-users.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const seeds = await fixture('src/app/user-page/users.example.ts');
const EXAMPLES = Object.values(seeds).find(value => Array.isArray(value));
const USERS = EXAMPLES[0].sources;
const { createTypeService } = await fixture('playground/type-service.ts');
const generated = JSON.parse(await readFile('public/playground/generated/typescript-libs.json', 'utf8'));
const preview = await readFile('public/playground/generated/preview.html', 'utf8');

const CHANNEL = 'test-preview';
const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

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

/**
 * Angular 22's FetchBackend reads these globals from the preview realm.
 * Expose Node's implementations so the real backend can parse the stubbed responses.
 */
function installPlatform(window) {
  for (const name of [
    'Headers',
    'Request',
    'Response',
    'ReadableStream',
    'AbortController',
    'TextDecoder',
    'TextEncoder',
    'DOMException',
  ]) {
    window[name] = globalThis[name];
  }
}

/** Replace only fetch: the Angular client and the lesson service must stay real. */
function installTransport(window) {
  const calls = [];
  const pending = [];

  const settle = (call, action) => {
    if (call.settled) return;
    call.settled = true;
    const index = pending.indexOf(call);
    if (index >= 0) pending.splice(index, 1);
    action();
  };

  const respond = (call, body, status = 200) => settle(call, () => {
    call.resolve(new Response(body === null ? null : JSON.stringify(body), {
      status,
      headers: body === null ? {} : { 'content-type': 'application/json' },
    }));
  });

  window.fetch = (input, init = {}) => {
    const call = {
      url: String(input),
      method: (init.method || 'GET').toUpperCase(),
      headers: init.headers || {},
      body: init.body ?? null,
      signal: init.signal,
      settled: false,
      aborted: false,
    };
    const promise = new Promise((resolve, reject) => {
      call.resolve = resolve;
      call.reject = reject;
    });
    call.respond = (body, status) => respond(call, body, status);
    call.fail = (error) => settle(call, () => call.reject(error));
    call.abort = () => {
      call.aborted = true;
      settle(call, () => call.reject(new DOMException('Aborted', 'AbortError')));
    };

    calls.push(call);
    pending.push(call);

    if (call.signal?.aborted) call.abort();
    else call.signal?.addEventListener('abort', call.abort, { once: true });

    return promise;
  };

  return {
    calls,
    pending,
    take() {
      const call = pending[0];
      assert.ok(call, 'Expected a pending HTTP request');
      pending.shift();
      return call;
    },
    abortAll() {
      for (const call of [...pending]) call.abort();
    },
  };
}

async function environment() {
  const dom = new JSDOM(preview, {
    url: 'http://localhost/playground/generated/preview.html#test-preview',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
  });
  await listen(dom.window, 'ready');
  installPlatform(dom.window);
  return { dom, window: dom.window, transport: installTransport(dom.window) };
}

async function render(env, sources, revision, expected = 'rendered') {
  const done = listen(env.window, expected, revision);
  env.window.dispatchEvent(new env.window.MessageEvent('message', {
    source: env.window,
    data: { channel: CHANNEL, kind: 'render', revision, sources },
  }));
  return done;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

/** Wait for a DOM condition instead of guessing a network delay. */
async function until(predicate, label) {
  const deadline = Date.now() + 3000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      if (predicate()) return;
    } catch (error) {
      // The node can appear one render tick later; a missing node is not a failure yet.
      lastError = error;
    }
    await tick();
  }
  if (lastError) throw lastError;
  assert.fail(`Timed out waiting for ${label}`);
}

function text(document, selector) {
  const element = document.querySelector(selector);
  assert.ok(element, `Missing element "${selector}"`);
  return element.textContent.replace(/\s+/g, ' ').trim();
}

function textButton(document, label) {
  const element = [...document.querySelectorAll('button')].find(
    (button) => button.textContent.trim() === label,
  );
  assert.ok(element, `Missing button "${label}"`);
  return element;
}

function click(document, label) {
  textButton(document, label).click();
}

function setInput(env, selector, value) {
  const input = env.window.document.querySelector(selector);
  assert.ok(input, `Missing input "${selector}"`);
  input.value = value;
  input.dispatchEvent(new env.window.Event('input', { bubbles: true }));
}

function teardown(env) {
  env.transport.abortAll();
  env.dom.window.close();
}

const DATA = [
  { id: 1, name: 'Ada Lovelace', username: 'ada', email: 'ada@example.com', address: { city: 'Londra' } },
  { id: 2, name: 'Grace Hopper', username: 'grace', email: 'grace@example.com', address: { city: 'New York' } },
];
const cards = env => env.window.document.querySelectorAll('app-user-card');
async function load(env, label = 'Carica utenti', rows = DATA) {
  click(env.window.document, label);
  const call = env.transport.take();
  assert.equal(call.method, 'GET');
  assert.equal(call.url, USERS_URL);
  call.respond(rows);
  await until(() => /GET completata/.test(env.window.document.querySelector('[role="status"]')?.textContent ?? '') && !env.window.document.querySelector('[aria-busy="true"]'), 'GET completion');
  return call;
}

test('Users loads explicitly, filters locally, removes via child output and restores server data', async () => {
  const env = await environment();
  try {
    await render(env, USERS, 1);
    const document = env.window.document;
    assert.equal(env.transport.calls.length, 0, 'no automatic fetch');
    await load(env);
    assert.equal(cards(env).length, 2);
    setInput(env, '#users-search', ' ADA@EXAMPLE.COM ');
    await until(() => cards(env).length === 1, 'case-insensitive email search');
    assert.match(cards(env)[0].textContent, /Ada Lovelace/);
    cards(env)[0].querySelector('button').click();
    await until(() => document.querySelector('[data-testid="users-no-match"]'), 'locally removed match');
    assert.equal(env.transport.calls.length, 1, 'search and remove never write to server');
    await load(env, 'Ricarica utenti');
    assert.equal(document.querySelector('#users-search').value, ' ADA@EXAMPLE.COM ');
    assert.equal(cards(env).length, 1, 'reload preserves query and restores removed card');
    setInput(env, '#users-search', 'grace');
    await until(() => /Grace Hopper/.test(cards(env)[0]?.textContent ?? ''), 'name search');
    setInput(env, '#users-search', '');
    await until(() => cards(env).length === 2, 'clear search');
    for (const card of [...cards(env)]) card.querySelector('button').click();
    await until(() => document.querySelector('[data-testid="users-all-removed"]'), 'all locally removed');
    assert.equal(env.transport.calls.length, 2);
    await load(env, 'Ricarica utenti', []);
    assert.ok(document.querySelector('[data-testid="users-empty"]'), 'server empty differs from filtering');
  } finally { teardown(env); }
});

test('Users distinguishes errors, retries, cancellation and reset without stale responses', async () => {
  const env = await environment();
  try {
    await render(env, USERS, 1);
    const document = env.window.document;
    click(document, 'Carica utenti');
    const failed = env.transport.take();
    await until(() => document.querySelector('[aria-busy="true"]'), 'loading feedback');
    failed.respond({}, 500);
    await until(() => /500/.test(document.querySelector('[role="alert"]')?.textContent ?? ''), 'HTTP error');
    assert.equal(cards(env).length, 0);
    assert.equal(document.querySelector('[data-testid="users-empty"]'), null);
    await load(env, 'Riprova GET');
    click(document, 'Ricarica utenti');
    const cancelled = env.transport.take();
    await until(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Annulla richiesta'), 'cancel control');
    click(document, 'Annulla richiesta');
    await until(() => cancelled.aborted && /annullata/.test(document.querySelector('[role="status"]')?.textContent ?? ''), 'abort transport');
    assert.equal(cards(env).length, 2, 'previous successful list survives cancellation');
    assert.doesNotMatch(text(document, '[role="status"]'), /riuscita|ricevuti/i);
    click(document, 'Ricarica utenti');
    const reset = env.transport.take();
    click(document, 'Ripristina demo');
    await until(() => reset.aborted && /Demo ripristinata/.test(document.querySelector('[role="status"]')?.textContent ?? ''), 'reset abort');
    assert.equal(cards(env).length, 0);
    assert.equal(document.querySelector('#users-search').value, '');
    assert.equal(document.querySelector('[role="alert"]'), null);
    assert.ok(textButton(document, 'Carica utenti'));
    click(document, 'Carica utenti');
    const destroyed = env.transport.take();
    await render(env, USERS, 2);
    await until(() => destroyed.aborted, 'rerender aborts previous request');
    assert.equal(cards(env).length, 0);
  } finally { teardown(env); }
});

test('Users keeps old data on reload failure and allows a clean retry', async () => {
  const env = await environment();
  try {
    await render(env, USERS, 1);
    await load(env);
    click(env.window.document, 'Ricarica utenti');
    env.transport.take().fail(new TypeError('network unavailable'));
    await until(() => /stato 0/.test(env.window.document.querySelector('[role="alert"]')?.textContent ?? ''), 'network error');
    assert.equal(cards(env).length, 2);
    await load(env, 'Riprova GET');
    assert.equal(env.window.document.querySelector('[role="alert"]'), null);
  } finally { teardown(env); }
});

test('Users editable service changes the real request and every TS tab passes semantic checks', async () => {
  const env = await environment();
  try {
    const original = USERS.files['users.service.ts'];
    const edited = original.replace('this.http.get<User[]>(USERS_URL)', "this.http.get<User[]>(USERS_URL + '?id=1')");
    assert.notEqual(edited, original);
    await render(env, { ...USERS, files: { ...USERS.files, 'users.service.ts': edited } }, 1);
    click(env.window.document, 'Carica utenti');
    const call = env.transport.take();
    assert.equal(call.url, USERS_URL + '?id=1');
    call.respond([DATA[0]]);
    await until(() => cards(env).length === 1, 'edited service response');
  } finally { teardown(env); }
  const service = createTypeService({ ...generated.files, '/component.ts': '' });
  const files = { 'component.ts': USERS.typescript, ...USERS.files };
  for (const [name, source] of Object.entries(files).filter(([name]) => name.endsWith('.ts'))) {
    assert.deepEqual(service.check(source, name, files), [], `Unexpected diagnostics in ${name}`);
  }
});
