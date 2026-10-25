// Exercise the real HTTP seeds through the generated preview and jsdom.
// The editable files come from http.example.ts, so the runtime sees exactly the
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
        "const __filename = process.cwd() + '/scripts/test-http.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { HTTP_EXAMPLES } = await fixture('src/app/http-example/http.example.ts');
const [LIST, DETAIL, POST, WRITES] = HTTP_EXAMPLES.map((example) => example.sources);
const { createTypeService } = await fixture('playground/type-service.ts');
const generated = JSON.parse(await readFile('public/playground/generated/typescript-libs.json', 'utf8'));
const preview = await readFile('public/playground/generated/preview.html', 'utf8');

const CHANNEL = 'test-preview';
const POSTS_URL = 'https://jsonplaceholder.typicode.com/posts';
const ORIGINAL_POST = { id: 1, userId: 1, title: 'Originale', body: 'Testo originale' };

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

function bodyOf(call) {
  assert.equal(typeof call.body, 'string', 'Expected a serialized JSON request body');
  return JSON.parse(call.body);
}

function teardown(env) {
  env.transport.abortAll();
  env.dom.window.close();
}

test('GET list shows waiting, empty, preserved data and retry feedback', async () => {
  const env = await environment();
  try {
    await render(env, LIST, 1);
    const document = env.window.document;

    assert.match(text(document, '.http__empty'), /Nessuna lista caricata/);
    click(document, 'Carica lista GET');
    const first = env.transport.take();
    assert.equal(first.method, 'GET');
    assert.equal(first.url, POSTS_URL);
    await until(() => text(document, '.http__waiting').includes('In attesa'), 'waiting feedback');

    first.respond([]);
    await until(() => text(document, '.http__empty').includes('lista ricevuta è vuota'), 'empty list');
    assert.equal(document.querySelectorAll('.post-card').length, 0);
    assert.equal(text(document, '[aria-label="Ultima risposta HTTP"]'), '[]');

    click(document, 'Ricarica lista GET');
    env.transport.take().respond([
      { id: 1, userId: 1, title: 'Primo post', body: 'Uno' },
      { id: 2, userId: 1, title: 'Secondo post', body: 'Due' },
    ]);
    await until(() => document.querySelectorAll('.post-card').length === 2, 'list rows');
    assert.match(text(document, '[aria-label="Ultima risposta HTTP"]'), /Primo post/);

    click(document, 'Ricarica lista GET');
    env.transport.take().respond({ message: 'errore' }, 500);
    await until(() => text(document, '.http__error').includes('500'), '500 feedback');
    assert.equal(document.querySelectorAll('.post-card').length, 2, 'previous list is preserved');

    click(document, 'Riprova GET');
    env.transport.take().fail(new TypeError('fetch failed'));
    await until(() => text(document, '.http__error').includes('stato 0'), 'network feedback');
    assert.equal(document.querySelectorAll('.post-card').length, 2);

    click(document, 'Riprova GET');
    env.transport.take().respond([{ id: 3, userId: 1, title: 'Recuperato', body: 'Tre' }]);
    await until(
      () => document.querySelectorAll('.post-card').length === 1 &&
        text(document, '[data-post-id="3"] .post-card__title').includes('Recuperato'),
      'retry success',
    );
    assert.equal(document.querySelector('.http__error'), null, 'the error clears on the next request');
  } finally {
    teardown(env);
  }
});

test('cancel, reset and rerender abort pending GETs without stale results', async () => {
  const env = await environment();
  try {
    await render(env, LIST, 1);
    const document = env.window.document;

    click(document, 'Carica lista GET');
    const cancelled = env.transport.take();
    await until(() => text(document, '.http__waiting').includes('In attesa'), 'waiting feedback');
    click(document, 'Annulla richiesta');
    await until(() => cancelled.aborted, 'abort on cancel');
    await until(() => text(document, '.http__status').includes('annullata'), 'cancel status');

    cancelled.respond([{ id: 1, userId: 1, title: 'Troppo tardi', body: 'No' }]);
    await tick();
    assert.equal(document.querySelectorAll('.post-card').length, 0, 'no stale result after cancel');

    click(document, 'Carica lista GET');
    const reset = env.transport.take();
    click(document, 'Ripristina demo');
    await until(() => reset.aborted, 'abort on reset');
    await until(() => text(document, '.http__status').includes('ripristinata'), 'reset status');
    assert.equal(document.querySelector('[aria-label="Ultima richiesta HTTP"]'), null);

    click(document, 'Carica lista GET');
    const rerendered = env.transport.take();
    await render(env, LIST, 2);
    await until(() => rerendered.aborted, 'abort on rerender');
    assert.equal(document.querySelectorAll('.post-card').length, 0);
    assert.match(text(document, '.http__status'), /Nessuna richiesta inviata/);
  } finally {
    teardown(env);
  }
});

test('detail validates a positive integer, clears stale data and recovers from 404', async () => {
  const env = await environment();
  try {
    await render(env, DETAIL, 1);
    const document = env.window.document;
    const submit = textButton(document, 'Leggi dettaglio');

    assert.equal(submit.disabled, false, 'the default ID 1 is valid');
    setInput(env, '#detail-id', '0');
    await until(() => submit.disabled, 'zero disables the request');
    setInput(env, '#detail-id', '1.5');
    await until(() => submit.disabled, 'fractional id disables the request');
    setInput(env, '#detail-id', '');
    await until(() => submit.disabled, 'empty id disables the request');
    setInput(env, '#detail-id', '1');
    await until(() => !submit.disabled, 'positive integer enables the request');

    click(document, 'Leggi dettaglio');
    const first = env.transport.take();
    assert.equal(first.url, POSTS_URL + '/1');
    first.respond({ id: 1, userId: 1, title: 'Dettaglio uno', body: 'Corpo uno' });
    await until(() => text(document, '[data-testid="post-detail"]').includes('Dettaglio uno'), 'detail');

    setInput(env, '#detail-id', '999');
    click(document, 'Leggi dettaglio');
    const missing = env.transport.take();
    assert.equal(missing.url, POSTS_URL + '/999');
    await until(() => !document.querySelector('[data-testid="post-detail"]'), 'stale detail cleared');
    missing.respond({ message: 'not found' }, 404);
    await until(() => text(document, '.http__error').includes('404'), '404 recovery message');
    assert.equal(document.querySelector('[data-testid="post-detail"]'), null);

    setInput(env, '#detail-id', '1');
    click(document, 'Leggi dettaglio');
    env.transport.take().respond({ id: 1, userId: 1, title: 'Recuperato', body: 'Di nuovo' });
    await until(() => text(document, '[data-testid="post-detail"]').includes('Recuperato'), 'detail recovery');
  } finally {
    teardown(env);
  }
});

test('POST trims the payload, keeps a failed draft, clears success and repeats no persistent id', async () => {
  const env = await environment();
  try {
    await render(env, POST, 1);
    const document = env.window.document;
    const submit = textButton(document, 'Invia POST simulato');

    assert.equal(submit.disabled, true, 'blank fields disable the POST');
    setInput(env, '#post-title', '  Titolo  ');
    setInput(env, '#post-body', '  Testo  ');
    await until(() => !submit.disabled, 'trimmed draft enables the POST');

    click(document, 'Invia POST simulato');
    const failed = env.transport.take();
    assert.equal(failed.method, 'POST');
    assert.equal(failed.url, POSTS_URL);
    assert.deepEqual(bodyOf(failed), { userId: 1, title: 'Titolo', body: 'Testo' });
    failed.respond({ message: 'errore' }, 500);
    await until(() => text(document, '.http__error').includes('500'), 'POST failure');
    assert.equal(document.querySelector('#post-title').value, '  Titolo  ', 'draft title survives failure');
    assert.equal(document.querySelector('#post-body').value, '  Testo  ', 'draft body survives failure');
    assert.equal(document.querySelector('.created'), null);

    click(document, 'Invia POST simulato');
    env.transport.take().respond({ id: 101, userId: 1, title: 'Titolo', body: 'Testo' });
    await until(() => document.querySelector('[data-operation-id="1"]'), 'first created response');
    assert.equal(document.querySelector('#post-title').value, '', 'success clears the title');
    assert.equal(document.querySelector('#post-body').value, '', 'success clears the body');
    assert.match(text(document, '[data-operation-id="1"]'), /Operazione locale 1 · ID API 101/);
    assert.match(text(document, '.http__note'), /simulata/i);

    setInput(env, '#post-title', 'Secondo');
    setInput(env, '#post-body', 'Contenuto');
    await until(() => !submit.disabled, 'second draft enables the POST');
    click(document, 'Invia POST simulato');
    env.transport.take().respond({ id: 101, userId: 1, title: 'Secondo', body: 'Contenuto' });
    await until(() => document.querySelector('[data-operation-id="2"]'), 'second operation id');
    assert.equal(document.querySelectorAll('.created').length, 1, 'only the last POST response is kept');
    assert.match(text(document, '[data-operation-id="2"]'), /ID API 101/);
    assert.equal(document.querySelectorAll('.post-card').length, 0, 'POST never enters a GET list');
  } finally {
    teardown(env);
  }
});

test('PUT updates the view only on success, preserves it on failure and reGET restores the server', async () => {
  const env = await environment();
  try {
    await render(env, WRITES, 1);
    const document = env.window.document;

    click(document, 'Carica risorsa GET');
    env.transport.take().respond(ORIGINAL_POST);
    await until(() => text(document, '[data-testid="resource-view"]').includes('Originale'), 'loaded resource');
    assert.equal(document.querySelector('#draft-title').value, 'Originale');

    setInput(env, '#draft-title', '  Modificato  ');
    setInput(env, '#draft-body', '  Nuovo testo  ');
    click(document, 'Invia PUT completo');
    const failed = env.transport.take();
    assert.equal(failed.method, 'PUT');
    assert.equal(failed.url, POSTS_URL + '/1');
    assert.deepEqual(bodyOf(failed), { id: 1, userId: 1, title: 'Modificato', body: 'Nuovo testo' });
    assert.match(text(document, '[data-testid="resource-view"]'), /Originale/, 'view waits for next');
    failed.respond({ message: 'errore' }, 500);
    await until(() => text(document, '.http__error').includes('PUT'), 'PUT failure');
    assert.match(text(document, '[data-testid="resource-view"]'), /Originale/, 'failed PUT preserves the view');
    assert.equal(document.querySelector('#draft-title').value, '  Modificato  ', 'failed PUT preserves the draft');

    click(document, 'Invia PUT completo');
    env.transport.take().respond({ id: 1, userId: 1, title: 'Modificato', body: 'Nuovo testo' });
    await until(() => text(document, '[data-testid="resource-view"]').includes('Modificato'), 'PUT success');
    assert.equal(document.querySelector('#draft-title').value, 'Modificato');

    click(document, 'Ricarica GET');
    env.transport.take().respond(ORIGINAL_POST);
    await until(() => text(document, '[data-testid="resource-view"]').includes('Originale'), 'reGET restore');
    assert.equal(document.querySelector('#draft-title').value, 'Originale');
  } finally {
    teardown(env);
  }
});

test('DELETE requires an inline confirmation, preserves the view on failure and reGET restores it', async () => {
  const env = await environment();
  try {
    await render(env, WRITES, 1);
    const document = env.window.document;

    click(document, 'Carica risorsa GET');
    env.transport.take().respond(ORIGINAL_POST);
    await until(() => text(document, '[data-testid="resource-view"]').includes('Originale'), 'loaded resource');
    const callsBefore = env.transport.calls.length;

    click(document, 'Prepara DELETE');
    await until(() => document.querySelector('.delete-confirm'), 'inline confirmation');
    assert.equal(env.transport.calls.length, callsBefore, 'preparing DELETE sends no request');

    click(document, 'Annulla eliminazione');
    await until(() => !document.querySelector('.delete-confirm'), 'confirmation cancelled');
    assert.equal(env.transport.calls.length, callsBefore, 'cancelling sends no request');

    click(document, 'Prepara DELETE');
    await until(() => document.querySelector('.delete-confirm'), 'confirmation reopened');
    click(document, 'Conferma DELETE');
    const failed = env.transport.take();
    assert.equal(failed.method, 'DELETE');
    assert.equal(failed.url, POSTS_URL + '/1');
    assert.ok(document.querySelector('[data-testid="resource-view"]'), 'view waits for the DELETE response');
    failed.respond({ message: 'errore' }, 500);
    await until(() => text(document, '.http__error').includes('DELETE'), 'DELETE failure');
    assert.ok(document.querySelector('[data-testid="resource-view"]'), 'failed DELETE preserves the view');

    click(document, 'Prepara DELETE');
    await until(() => document.querySelector('.delete-confirm'), 'confirmation reopened after failure');
    click(document, 'Conferma DELETE');
    env.transport.take().respond({});
    await until(() => !document.querySelector('[data-testid="resource-view"]'), 'successful DELETE clears the view');
    await until(() => text(document, '.http__status').includes('DELETE riuscito'), 'DELETE success status');

    click(document, 'Carica risorsa GET');
    env.transport.take().respond(ORIGINAL_POST);
    await until(() => text(document, '[data-testid="resource-view"]').includes('Originale'), 'reGET after delete');
  } finally {
    teardown(env);
  }
});

test('an edited service changes the real request and new modules type-check in service files', async () => {
  // The preview may contact only the teaching API, without widening its network policy.
  assert.match(preview, /connect-src https:\/\/jsonplaceholder\.typicode\.com;/);
  const env = await environment();
  try {
    const original = LIST.files['posts.service.ts'];
    const edited = original.replace(
      'this.http.get<Post[]>(POSTS_URL)',
      "this.http.get<Post[]>('https://jsonplaceholder.typicode.com/posts?_limit=2')",
    );
    assert.notEqual(edited, original);

    await render(
      env,
      { ...LIST, files: { ...LIST.files, 'posts.service.ts': edited } },
      1,
    );
    click(env.window.document, 'Carica lista GET');
    const call = env.transport.take();
    assert.equal(call.url, POSTS_URL + '?_limit=2');
    call.respond([{ id: 1, userId: 1, title: 'Solo uno', body: 'Limite due' }]);
    await until(
      () => env.window.document.querySelectorAll('.post-card').length === 1,
      'edited service rows',
    );
  } finally {
    teardown(env);
  }

  assert.ok(generated.files['/node_modules/@angular/common/types/http.d.ts'], 'http declarations are generated');
  const service = createTypeService({ ...generated.files, '/component.ts': '' });
  for (const seed of HTTP_EXAMPLES) {
    const files = { 'component.ts': seed.sources.typescript, ...seed.sources.files };
    for (const [name, source] of Object.entries(files).filter(([name]) => name.endsWith('.ts'))) {
      assert.deepEqual(
        service.check(source, name, files),
        [],
        `Unexpected diagnostics for ${seed.id}/${name}`,
      );
    }
  }

  const broken = LIST.files['posts.service.ts'] + "\nconst wrong: number = 'no';\n";
  const diagnostics = service.check(broken, 'posts.service.ts', {
    ...LIST.files,
    'posts.service.ts': broken,
  });
  assert.ok(
    diagnostics.some((diagnostic) => diagnostic.code === 2322),
    `Expected a real service diagnostic: ${JSON.stringify(diagnostics)}`,
  );
});
