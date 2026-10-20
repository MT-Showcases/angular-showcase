// Exercise separate editable project files through the real runtime and TypeScript
// language service. The generated preview and declaration graph come from
// scripts/build-playground.mjs, so these tests inspect shipped behavior.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
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
        "const __filename = process.cwd() + '/scripts/test-projects.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const ROOT = {
  typescript: `import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import GreetingCard from './greeting-card.component';
import { TagListPipe } from './tag-list.pipe';

// Il componente principale resta il punto di ingresso del progetto.
@Component({
  selector: 'app-project-root',
  imports: [GreetingCard, TagListPipe],
  templateUrl: './component.html',
  styleUrl: './component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class ProjectRoot {
  readonly title = signal('progetto');
  readonly person = signal('Ada');
  readonly received = signal('');

  onPicked(value: string) {
    this.received.set(value);
  }
}`,
  html: `<section class="project">
  <h2 id="title">{{ title() | tagList }}</h2>

  <app-greeting-card
    [name]="person()"
    (picked)="onPicked($event)"
  ></app-greeting-card>

  <p id="received">{{ received() }}</p>
</section>`,
  css: `.project {
  display: grid;
  gap: 0.75rem;
}`,
};

const FILES = {
  'tag-list.pipe.ts': `import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'tagList' })
export class TagListPipe implements PipeTransform {
  transform(value: string): string {
    return value.toUpperCase();
  }
}`,
  'greeting-card.component.ts': `import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-greeting-card',
  templateUrl: './greeting-card.component.html',
  styleUrl: './greeting-card.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export default class GreetingCard {
  // Input e output moderni: l'initializerTransform deve coprire anche questo file.
  readonly name = input('Ada');
  readonly picked = output<string>();

  pick() {
    this.picked.emit('Ciao ' + this.name());
  }
}`,
  'greeting-card.component.html': `<div class="card">
  <span id="greeting">Ciao {{ name() }}</span>
  <button
    type="button"
    id="pick"
    (click)="pick()"
  >
    Saluta
  </button>
</div>`,
  'greeting-card.component.css': `.card {
  display: grid;
  gap: 0.5rem;
  padding: 0.75rem;
}`,
};

const CHILD_TS = 'greeting-card.component.ts';
const CHILD_HTML = 'greeting-card.component.html';

function project(files = FILES, root = ROOT) {
  return { 'component.ts': root.typescript, ...files };
}

function omit(files, name) {
  const copy = { ...files };
  delete copy[name];
  return copy;
}

const preview = await readFile('public/playground/generated/preview.html', 'utf8');
const generated = await readFile('public/playground/generated/typescript-libs.json', 'utf8');
const { files: declarationFiles } = JSON.parse(generated);
const { createTypeService } = await fixture('playground/type-service.ts');

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

const settle = () => new Promise((resolve) => setTimeout(resolve, 30));

function labels(result) {
  return result.options.map((option) => option.label);
}

test('separate pipe and default child component render with external child files', async () => {
  const dom = await environment();
  try {
    await render(dom, { ...ROOT, files: FILES }, 1);
    const doc = dom.window.document;

    assert.equal(doc.querySelector('#title').textContent.trim(), 'PROGETTO');
    assert.match(doc.querySelector('#greeting').textContent, /Ciao Ada/);

    doc.querySelector('#pick').click();
    await settle();
    assert.match(doc.querySelector('#received').textContent, /Ciao Ada/);
  } finally {
    dom.window.close();
  }
});

test('one child-only edit updates its TypeScript, HTML and CSS on rerender', async () => {
  const dom = await environment();
  try {
    await render(dom, { ...ROOT, files: FILES }, 1);
    const edited = {
      ...FILES,
      [CHILD_TS]: FILES[CHILD_TS].replace("'Ciao '", "'Firmato '"),
      [CHILD_HTML]: FILES[CHILD_HTML].replace('Ciao {{', 'Benvenuta {{'),
      'greeting-card.component.css': '.card { border: 0.25rem solid #6b4eff; }',
    };

    await render(dom, { ...ROOT, files: edited }, 2);
    const doc = dom.window.document;
    assert.match(doc.querySelector('#greeting').textContent, /Benvenuta Ada/);

    doc.querySelector('#pick').click();
    await settle();
    assert.match(doc.querySelector('#received').textContent, /Firmato Ada/);
  } finally {
    dom.window.close();
  }
});

test('missing imported module and template resource fail clearly and recover', async () => {
  const dom = await environment();
  try {
    const withoutPipe = await render(
      dom,
      { ...ROOT, files: omit(FILES, 'tag-list.pipe.ts') },
      1,
      'error',
    );
    assert.match(withoutPipe.message, /Modulo non trovato: "\.\/tag-list\.pipe"/);

    await render(dom, { ...ROOT, files: FILES }, 2);

    const missingTemplate = {
      ...FILES,
      [CHILD_TS]: FILES[CHILD_TS].replace(
        "'./greeting-card.component.html'",
        "'./missing.html'",
      ),
    };
    const withoutTemplate = await render(dom, { ...ROOT, files: missingTemplate }, 3, 'error');
    assert.match(withoutTemplate.message, /Risorsa non trovata: "\.\/missing\.html"/);

    await render(dom, { ...ROOT, files: FILES }, 4);
  } finally {
    dom.window.close();
  }
});

test('virtual traversal, external resource URLs and prototype keys are rejected', async () => {
  const dom = await environment();
  try {
    const traversal = await render(
      dom,
      { ...ROOT, files: { ...FILES, '../escape.ts': 'export const escape = 1;' } },
      1,
      'error',
    );
    assert.match(traversal.message, /dentro la cartella|non valido/);

    const protoFiles = Object.fromEntries([
      ...Object.entries(FILES),
      ['__proto__', 'export const polluted = 1;'],
    ]);
    const prototype = await render(dom, { ...ROOT, files: protoFiles }, 2, 'error');
    assert.match(prototype.message, /file virtuale non valido/i);

    const externalRoot = {
      ...ROOT,
      typescript: ROOT.typescript.replace(
        "templateUrl: './component.html'",
        "templateUrl: 'https://example.test/component.html'",
      ),
    };
    const external = await render(dom, { ...externalRoot, files: FILES }, 3, 'error');
    assert.match(external.message, /URL esterni/);

    await render(dom, { ...ROOT, files: FILES }, 4);
  } finally {
    dom.window.close();
  }
});

test('stale render messages stay ignored', async () => {
  const dom = await environment();
  try {
    await render(dom, { ...ROOT, files: FILES }, 2);
    const seen = [];
    dom.window.addEventListener('message', (event) => {
      if (event.data?.channel === 'test-preview') seen.push(event.data);
    });

    const failed = render(
      dom,
      { ...ROOT, files: omit(FILES, 'tag-list.pipe.ts') },
      4,
      'error',
    );
    dom.window.dispatchEvent(
      new dom.window.MessageEvent('message', {
        source: dom.window,
        data: { channel: 'test-preview', kind: 'render', revision: 3, sources: { ...ROOT, files: FILES } },
      }),
    );
    await failed;
    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.equal(seen.some((item) => item.revision === 3 && item.kind === 'rendered'), false);
    assert.match(dom.window.document.querySelector('#title').textContent, /PROGETTO/);
  } finally {
    dom.window.close();
  }
});

test('TypeScript resolves child modules, reports errors and completes in child files', () => {
  const service = createTypeService({ ...declarationFiles, '/component.ts': '' });
  assert.deepEqual(service.check(ROOT.typescript, 'component.ts', project()), []);

  const brokenRoot = ROOT.typescript.replace(
    "readonly title = signal('progetto');",
    "readonly title: number = 'progetto';",
  );
  const rootError = service.check(brokenRoot, 'component.ts', project(FILES, { ...ROOT, typescript: brokenRoot }));
  assert.ok(rootError.some((diagnostic) => diagnostic.code === 2322), JSON.stringify(rootError));

  const brokenChild = FILES[CHILD_TS].replace(
    "readonly name = input('Ada');",
    "readonly name = input('Ada');\n  count: number = 'no';",
  );
  const childFiles = { ...project(), [CHILD_TS]: brokenChild };
  const childError = service.check(brokenChild, CHILD_TS, childFiles);
  assert.ok(childError.some((diagnostic) => diagnostic.code === 2322), JSON.stringify(childError));

  const marker = 'this.pi';
  const completionSource = FILES[CHILD_TS].replace(
    'this.picked.emit',
    `const probe = ${marker};\n    this.picked.emit`,
  );
  const completion = service.complete(
    completionSource,
    completionSource.indexOf(marker) + marker.length,
    CHILD_TS,
    { ...project(), [CHILD_TS]: completionSource },
  );
  assert.ok(labels(completion).includes('picked'), labels(completion).join(', '));
});

test('TypeScript service invalidates edits, deletions and replaced projects', () => {
  const service = createTypeService({ ...declarationFiles, '/component.ts': '' });
  assert.deepEqual(service.check(ROOT.typescript, 'component.ts', project()), []);

  const brokenRoot = ROOT.typescript.replace(
    "readonly title = signal('progetto');",
    "readonly title: number = 'progetto';",
  );
  const broken = service.check(brokenRoot, 'component.ts', project());
  assert.ok(broken.length > 0, JSON.stringify(broken));
  assert.deepEqual(service.check(ROOT.typescript, 'component.ts', project()), []);

  const withoutPipe = service.check(
    ROOT.typescript,
    'component.ts',
    project(omit(FILES, 'tag-list.pipe.ts')),
  );
  assert.ok(
    withoutPipe.some((diagnostic) => diagnostic.code === 2307),
    JSON.stringify(withoutPipe),
  );

  const withoutChild = service.check(
    ROOT.typescript,
    'component.ts',
    project(omit(FILES, CHILD_TS)),
  );
  assert.ok(
    withoutChild.some((diagnostic) => diagnostic.code === 2307),
    JSON.stringify(withoutChild),
  );

  assert.deepEqual(service.check(ROOT.typescript, 'component.ts', project()), []);
});

test('generated worker forwards the selected fileName and project files', async () => {
  const script = await readFile('public/playground/generated/typescript-worker.js', 'utf8');
  const messages = [];
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const scope = {
    location: { href: 'https://example.test/playground/generated/typescript-worker.js' },
    postMessage(message) {
      messages.push(message);
      if (message.type === 'ready' || message.type === 'error') resolveReady();
    },
  };
  runInNewContext(script, {
    self: scope,
    URL,
    console,
    setTimeout,
    clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({ files: declarationFiles }) }),
  });
  await ready;
  assert.equal(messages[0].type, 'ready', JSON.stringify(messages));

  const brokenChild = FILES[CHILD_TS].replace(
    "readonly name = input('Ada');",
    "readonly name = input('Ada');\n  count: number = 'no';",
  );
  await scope.onmessage({
    data: {
      id: 1,
      kind: 'check',
      source: brokenChild,
      fileName: CHILD_TS,
      files: { ...project(), [CHILD_TS]: brokenChild },
    },
  });

  const result = messages.at(-1);
  assert.equal(result.id, 1);
  assert.ok(result.result.some((diagnostic) => diagnostic.code === 2322), JSON.stringify(result));
});
