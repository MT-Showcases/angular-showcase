// Exercise the real routing seeds through the generated preview and jsdom.
// The editable files come from routing.example.ts, so the runtime sees exactly
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
        "const __filename = process.cwd() + '/scripts/test-routing.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

async function memoryFixture() {
  // Angular's fallback JIT compilation must travel with the class bundle.
  const result = await build({
    stdin: {
      contents:
        "import '@angular/compiler';\n" +
        "export { MemoryLocationStrategy } from './playground/memory-location';",
      resolveDir: process.cwd(),
      sourcefile: 'memory-location.fixture.ts',
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { ROUTING_EXAMPLES } = await fixture('src/app/routing-lesson/routing.example.ts');
const { MemoryLocationStrategy } = await memoryFixture();
const { createTypeService } = await fixture('playground/type-service.ts');
const preview = await readFile('public/playground/generated/preview.html', 'utf8');
const generated = await readFile('public/playground/generated/typescript-libs.json', 'utf8');
const { files: declarationFiles } = JSON.parse(generated);

const [NAVIGATION, PARAMETERS, FALLBACK] = ROUTING_EXAMPLES;
const PARENT_URL = 'http://localhost/playground/generated/preview.html#test-preview';

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
    url: PARENT_URL,
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 80));

function byTestId(document, id) {
  return document.querySelector(`[data-testid="${id}"]`);
}

function text(document, id) {
  return byTestId(document, id)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function click(document, id) {
  const element = byTestId(document, id);
  assert.ok(element, `Missing element "${id}"`);
  element.click();
}

function href(element) {
  return element.getAttribute('href');
}

function edited(seed, file, change) {
  const original = seed.sources.files[file];
  const text = change(original);
  assert.notEqual(text, original, `The edit of ${file} did not change the seed`);
  return { ...seed.sources, files: { ...seed.sources.files, [file]: text } };
}

test('navigation seed keeps root state across RouterLink changes and internal history', async () => {
  const dom = await environment();
  try {
    await render(dom, NAVIGATION.sources, 1);
    const document = dom.window.document;

    assert.match(text(document, 'overview-copy'), /\/overview/);
    assert.match(text(document, 'router-url'), /\/overview$/);
    assert.match(text(document, 'root-state'), /0/);
    assert.equal(href(byTestId(document, 'nav-overview')).endsWith('/overview'), true);
    assert.notEqual(href(byTestId(document, 'nav-about')), '#');

    click(document, 'root-increment');
    await settle();
    assert.match(text(document, 'root-state'), /1/);

    click(document, 'nav-about');
    await settle();
    assert.match(text(document, 'about-copy'), /promemoria della radice/);
    assert.match(text(document, 'router-url'), /\/about$/);
    assert.match(text(document, 'root-state'), /1/);

    click(document, 'history-back');
    await settle();
    assert.match(text(document, 'overview-copy'), /\/overview/);
    assert.match(text(document, 'router-url'), /\/overview$/);
    assert.match(text(document, 'root-state'), /1/);

    click(document, 'history-forward');
    await settle();
    assert.match(text(document, 'about-copy'), /promemoria della radice/);
    assert.match(text(document, 'router-url'), /\/about$/);

    assert.equal(dom.window.location.href, PARENT_URL);
  } finally {
    dom.window.close();
  }
});

test('parameters seed reuses one detail instance for ID 1 and 2 and separates missing data', async () => {
  const dom = await environment();
  try {
    await render(dom, PARAMETERS.sources, 1);
    const document = dom.window.document;

    assert.match(text(document, 'detail-id'), /Scheda 1/);
    assert.match(text(document, 'detail-content'), /Componenti/);
    assert.match(text(document, 'router-url'), /\/detail\/1$/);

    const firstDetail = byTestId(document, 'detail-id').closest('article');
    click(document, 'detail-local-button');
    click(document, 'detail-local-button');
    await settle();
    assert.match(text(document, 'detail-local'), /2/);

    click(document, 'param-link-2');
    await settle();
    assert.match(text(document, 'detail-id'), /Scheda 2/);
    assert.match(text(document, 'detail-content'), /Servizi/);
    assert.equal(byTestId(document, 'detail-id').closest('article'), firstDetail);
    assert.match(text(document, 'detail-local'), /2/);
    assert.match(text(document, 'router-url'), /\/detail\/2$/);

    click(document, 'param-link-999');
    await settle();
    assert.match(text(document, 'detail-id'), /Scheda 999/);
    assert.match(text(document, 'detail-content'), /Nessuna scheda/);
    assert.match(text(document, 'router-url'), /\/detail\/999$/);

    const recover = [...document.querySelectorAll('a')]
      .find(link => link.textContent?.trim() === "Vai all'ID 1");
    assert.ok(recover);
    recover.click();
    await settle();
    assert.match(text(document, 'detail-id'), /Scheda 1/);
    assert.match(text(document, 'router-url'), /\/detail\/1$/);

    // A full rerender creates a new application, router and detail instance.
    await render(dom, PARAMETERS.sources, 2);
    assert.match(text(document, 'router-url'), /\/detail\/1$/);
    assert.match(text(document, 'detail-local'), /0/);
    assert.equal(dom.window.location.href, PARENT_URL);
  } finally {
    dom.window.close();
  }
});

test('editing app.routes.ts changes the initial route and rerender resets the path', async () => {
  const dom = await environment();
  try {
    const redirected = edited(PARAMETERS, 'app.routes.ts', source =>
      source.replace("redirectTo: 'detail/1'", "redirectTo: 'detail/2'"));
    await render(dom, redirected, 1);
    const document = dom.window.document;

    assert.match(text(document, 'router-url'), /\/detail\/2$/);
    assert.match(text(document, 'detail-id'), /Scheda 2/);

    await render(dom, PARAMETERS.sources, 2);
    assert.match(text(document, 'router-url'), /\/detail\/1$/);
  } finally {
    dom.window.close();
  }
});

test('editing app.config.ts changes providers; invalid configs fail safely and recover', async () => {
  const dom = await environment();
  try {
    const withoutProviders = edited(PARAMETERS, 'app.config.ts', source =>
      source.replace('providers: [provideRouter(routes, withComponentInputBinding())]', 'providers: []'));
    const failure = await render(dom, withoutProviders, 1, 'error');
    assert.match(failure.message, /Router|provider/i);

    const invalidShape = edited(PARAMETERS, 'app.config.ts', source =>
      source.replace('providers: [provideRouter(routes, withComponentInputBinding())]', 'providers: {}'));
    const shape = await render(dom, invalidShape, 2, 'error');
    assert.match(shape.message, /appConfig\.providers deve essere un array/);

    await render(dom, PARAMETERS.sources, 3);
    assert.match(text(dom.window.document, 'router-url'), /\/detail\/1$/);
    assert.match(dom.window.location.href, /#test-preview$/);
  } finally {
    dom.window.close();
  }
});

test('fallback seed catches unknown and deep paths, then recovers home', async () => {
  const dom = await environment();
  try {
    await render(dom, FALLBACK.sources, 1);
    const document = dom.window.document;
    assert.match(text(document, 'home-copy'), /riconosciuto prima del jolly/);
    assert.match(text(document, 'router-url'), /\/home$/);

    click(document, 'fallback-missing');
    await settle();
    assert.match(text(document, 'not-found'), /Percorso non riconosciuto/);
    assert.match(text(document, 'router-url'), /\/missing-page$/);
    assert.ok(document.querySelector('[data-testid="fallback-home"]'));

    click(document, 'fallback-deep');
    await settle();
    assert.match(text(document, 'not-found'), /jolly/);
    assert.match(text(document, 'router-url'), /\/sezioni\/inesistente$/);

    click(document, 'not-found-recover');
    await settle();
    assert.match(text(document, 'home-copy'), /\/home/);
    assert.match(text(document, 'router-url'), /\/home$/);
    assert.equal(dom.window.location.href, PARENT_URL);
  } finally {
    dom.window.close();
  }
});

test('editing wildcard order exposes the route-order rule', async () => {
  const dom = await environment();
  try {
    const wildcardFirst = edited(FALLBACK, 'app.routes.ts', source =>
      source.replace(
        "  { path: 'home', component: HomeView },\n  { path: '**', component: NotFoundView },",
        "  { path: '**', component: NotFoundView },\n  { path: 'home', component: HomeView },",
      ));
    await render(dom, wildcardFirst, 1);
    const document = dom.window.document;

    assert.match(text(document, 'not-found'), /Percorso non riconosciuto/);
    assert.match(text(document, 'router-url'), /\/home$/);
  } finally {
    dom.window.close();
  }
});

test('MemoryLocationStrategy preserves query/hash, moves silently and cleans listeners', () => {
  const strategy = new MemoryLocationStrategy();
  const events = [];
  const stop = strategy.onPopState(event => events.push(event));

  assert.equal(strategy.path(), '/');
  assert.equal(strategy.path(true), '/');
  assert.equal(strategy.getBaseHref(), '/');
  assert.equal(strategy.prepareExternalUrl('about'), '/about');
  assert.equal(strategy.prepareExternalUrl('/about'), '/about');

  strategy.pushState({ page: 'about' }, '', '/about', '?da=elenco');
  assert.equal(strategy.path(), '/about?da=elenco');
  assert.deepEqual(strategy.getState(), { page: 'about' });
  assert.equal(events.length, 0);

  strategy.pushState({ page: 'team' }, '', '/about#team', '');
  strategy.replaceState({ page: 'team-2' }, '', '/about#contatti', '');
  assert.equal(strategy.path(true), '/about#contatti');
  assert.equal(strategy.path(false), '/about');
  assert.deepEqual(strategy.getState(), { page: 'team-2' });
  assert.equal(events.length, 0);

  strategy.back();
  assert.equal(strategy.path(true), '/about?da=elenco');
  assert.deepEqual(events.at(-1), { type: 'popstate', state: { page: 'about' } });

  strategy.forward();
  assert.equal(strategy.path(true), '/about#contatti');
  assert.deepEqual(events.at(-1), { type: 'popstate', state: { page: 'team-2' } });

  strategy.historyGo(-1);
  assert.equal(strategy.path(true), '/about?da=elenco');
  const count = events.length;
  strategy.historyGo(0);
  strategy.back();
  strategy.back();
  assert.equal(events.length, count + 1, 'out-of-range moves and historyGo(0) stay silent');

  stop();
  const afterStop = events.length;
  strategy.forward();
  assert.equal(events.length, afterStop, 'the returned cleanup removes the popstate listener');
});

test('unsupported runtime imports fail clearly and the next render recovers', async () => {
  const dom = await environment();
  try {
    const unsupported = {
      ...FALLBACK.sources,
      typescript: "import 'rxjs';\n" + FALLBACK.sources.typescript,
    };
    const failure = await render(dom, unsupported, 1, 'error');
    assert.match(failure.message, /Import non disponibile: rxjs/);

    await render(dom, FALLBACK.sources, 2);
    assert.match(text(dom.window.document, 'router-url'), /\/home$/);
    assert.equal(dom.window.location.href, PARENT_URL);
  } finally {
    dom.window.close();
  }
});

test('routing seeds type-check with @angular/router and unsupported imports stay rejected', () => {
  const service = createTypeService({ ...declarationFiles, '/component.ts': '' });

  for (const seed of ROUTING_EXAMPLES) {
    const files = {
      'component.ts': seed.sources.typescript,
      ...Object.fromEntries(
        Object.entries(seed.sources.files ?? {}).filter(([name]) => name.endsWith('.ts')),
      ),
    };
    const diagnostics = Object.entries(files)
      .flatMap(([name, source]) => service.check(source, name, files))
      .filter(diagnostic => diagnostic.severity === 'error');
    assert.deepEqual(
      diagnostics,
      [],
      `Unexpected diagnostics for ${seed.id}:\n${JSON.stringify(diagnostics, null, 2)}`,
    );
  }

  const routerImport = service.check(
    "import { RouterLink } from '@angular/router';\nexport default class Probe {}",
    'component.ts',
  );
  assert.equal(routerImport.some(diagnostic => diagnostic.code === 90001), false);

  const unsupported = service.check("import { map } from 'rxjs';", 'component.ts');
  assert.ok(unsupported.some(diagnostic => diagnostic.code === 90001));
  assert.match(
    unsupported.find(diagnostic => diagnostic.code === 90001).message,
    /Import non supportato/,
  );
});


test('a throwing environment initializer reports an error and the next edit recovers', async () => {
  const dom = await environment();
  try {
    const broken = { ...NAVIGATION.sources, files: { ...NAVIGATION.sources.files,
      'app.config.ts': `import { provideEnvironmentInitializer } from '@angular/core';
export const appConfig = { providers: [provideEnvironmentInitializer(() => {
  throw new Error('config startup failed');
})] };` } };
    const error = await render(dom, broken, 1, 'error');
    assert.match(error.message, /config startup failed/);
    await render(dom, NAVIGATION.sources, 2);
    assert.match(text(dom.window.document, 'router-url'), /\/overview$/);
  } finally { dom.window.close(); }
});

test('initial navigation errors never report a successful render', async () => {
  const dom = await environment();
  const rendered = [];
  const listener = event => {
    if (event.data?.kind === 'rendered') rendered.push(event.data.revision);
  };
  dom.window.addEventListener('message', listener);
  try {
    const broken = edited(NAVIGATION, 'app.routes.ts', source =>
      source.replace("{ path: 'overview', component: OverviewView }",
        "{ path: 'overview', component: OverviewView, canActivate: [() => { throw new Error('navigation blocked'); }] }"));
    await render(dom, broken, 1, 'error');
    await settle();
    assert.deepEqual(rendered, []);
    await render(dom, NAVIGATION.sources, 2);
    assert.deepEqual(rendered, [2]);
  } finally { dom.window.removeEventListener('message', listener); dom.window.close(); }
});

test('a new revision supersedes a render held by a pending task', async () => {
  const dom = await environment();
  try {
    const waiting = { ...NAVIGATION.sources,
      typescript: NAVIGATION.sources.typescript
        .replace('DestroyRef, inject, signal', 'DestroyRef, PendingTasks, inject, signal')
        .replace('  constructor() {', '  constructor() { inject(PendingTasks).add();') };
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', {
      source: dom.window,
      data: { channel: 'test-preview', kind: 'render', revision: 1, sources: waiting },
    }));
    await settle();
    await render(dom, NAVIGATION.sources, 2);
    assert.match(text(dom.window.document, 'router-url'), /\/overview$/);
  } finally { dom.window.close(); }
});
