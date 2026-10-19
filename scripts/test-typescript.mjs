// Exercise the real TypeScript LanguageService against the generated declaration
// graph and the actual editable lesson sources.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';

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
        "const __filename = process.cwd() + '/scripts/test-typescript.mjs';\n" +
        "const __dirname = process.cwd() + '/scripts';\n" +
        'const require = __createRequire(__filename);',
    },
  });
  return import(
    'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
  );
}

const { createTypeService } = await fixture('playground/type-service.ts');
const generated = await readFile('public/playground/generated/typescript-libs.json', 'utf8');
const { files: declarationFiles } = JSON.parse(generated);

const { FIRST_COMPONENT } = await fixture('src/app/getting-started/first-component.example.ts');
const { BINDING_EXAMPLE } = await fixture('src/app/data-binding/binding.example.ts');
const {
  IF_EXAMPLE,
  FOR_EXAMPLE,
  SWITCH_EXAMPLE,
  DIRECTIVE_EXAMPLE,
} = await fixture('src/app/directives/control-flow.example.ts');
const {
  INPUT_EXAMPLE,
  OUTPUT_EXAMPLE,
  COMMUNICATION_EXAMPLE,
} = await fixture('src/app/component-communication/communication.example.ts');
const {
  DATE_EXAMPLE,
  CURRENCY_EXAMPLE,
  UPPERCASE_EXAMPLE,
  TAG_LIST_EXAMPLE,
} = await fixture('src/app/pipes/pipes.example.ts');
const { CONTROL_EXAMPLE, CONTACT_EXAMPLE } = await fixture('src/app/forms/forms.example.ts');

const SEEDS = [
  FIRST_COMPONENT,
  BINDING_EXAMPLE,
  IF_EXAMPLE,
  FOR_EXAMPLE,
  SWITCH_EXAMPLE,
  DIRECTIVE_EXAMPLE,
  INPUT_EXAMPLE,
  OUTPUT_EXAMPLE,
  COMMUNICATION_EXAMPLE,
  DATE_EXAMPLE,
  CURRENCY_EXAMPLE,
  UPPERCASE_EXAMPLE,
  TAG_LIST_EXAMPLE,
  CONTROL_EXAMPLE,
  CONTACT_EXAMPLE,
];

function session() {
  // Copy the declaration map per session; each service owns its versions.
  return createTypeService({ ...declarationFiles, '/component.ts': '' });
}

function labels(result) {
  return result.options.map((option) => option.label);
}

function firstWithCode(diagnostics, codes) {
  return diagnostics.find((diagnostic) => codes.includes(diagnostic.code));
}

test('generated declaration graph is portable and includes Angular package metadata', () => {
  assert.ok(generated.length > 100_000, 'the declaration graph should be substantial');
  assert.ok(!generated.includes(process.cwd()), 'generated assets must not leak workstation paths');
  assert.ok(Object.hasOwn(declarationFiles, '/lib/lib.es2022.d.ts'));
  assert.ok(Object.hasOwn(declarationFiles, '/lib/lib.es2022.full.d.ts'));
  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@angular/core/package.json'));
  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@angular/core/types/core.d.ts'));
  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@angular/material/package.json'));
  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@angular/material/types/button.d.ts'));
  assert.ok(Object.hasOwn(declarationFiles, '/node_modules/@angular/material/types/input.d.ts'));
});

test('all installed lesson TypeScript seeds type-check without false semantic errors', () => {
  const service = session();
  for (const seed of SEEDS) {
    const diagnostics = service.check(seed.typescript);
    assert.deepEqual(
      diagnostics,
      [],
      `Unexpected diagnostics for a lesson seed:\n${JSON.stringify(diagnostics, null, 2)}`,
    );
  }
});

test('reports a real number/string assignment mismatch', () => {
  const source = `import { Component } from '@angular/core';

@Component({ selector: 'app-counter', template: '' })
export default class Counter {
  count: number = 'non un numero';
}`;
  const diagnostics = session().check(source);
  const assignment = firstWithCode(diagnostics, [2322]);

  assert.ok(assignment, JSON.stringify(diagnostics, null, 2));
  assert.equal(assignment.severity, 'error');
  assert.match(assignment.message, /Type 'string' is not assignable to type 'number'/);
  assert.ok(assignment.from >= 0);
  assert.ok(assignment.to > assignment.from);
  assert.ok(assignment.to <= source.length);
});

test('reports a property typo on the component', () => {
  const source = `export default class Example {
  message = 'ciao';

  read() {
    return this.mesage;
  }
}`;
  const diagnostics = session().check(source);
  const typo = firstWithCode(diagnostics, [2339, 2551]);

  assert.ok(typo, JSON.stringify(diagnostics, null, 2));
  assert.match(typo.message, /mesage/);
});

test('reports an invalid Angular export and an unsupported import', () => {
  const invalidAngular = `import { NotARealExport } from '@angular/core';`;
  const unresolved = firstWithCode(session().check(invalidAngular), [2305]);
  assert.ok(unresolved, 'the real Angular declarations must reject unknown exports');
  assert.match(unresolved.message, /NotARealExport/);

  const unsupportedSource = `import { Component } from 'lodash';`;
  const unsupported = firstWithCode(session().check(unsupportedSource), [90001]);
  assert.ok(unsupported, 'imports outside the sandbox allowlist must be reported');
  assert.match(unsupported.message, /Import non supportato/);
  assert.equal(unsupported.severity, 'error');
});

test('recovers after a syntax error', () => {
  const service = session();
  const broken = `export const value = ;`;
  const brokenDiagnostics = service.check(broken);
  assert.ok(brokenDiagnostics.some((diagnostic) => diagnostic.severity === 'error'));

  assert.deepEqual(service.check(`export const value = 1;`), []);
});

test('completes component instance properties and Angular declarations', () => {
  const instanceSource = `import { Component } from '@angular/core';

@Component({ selector: 'app-example', template: '' })
export default class Example {
  message = 'ciao';

  read() {
    return this.mes;
  }
}`;
  const instancePosition = instanceSource.indexOf('this.mes') + 'this.mes'.length;
  const instance = session().complete(instanceSource, instancePosition);
  assert.ok(instance.from <= instancePosition);
  assert.ok(
    labels(instance).includes('message'),
    `Expected the component property in completions: ${labels(instance).join(', ')}`,
  );

  const importSource = `import { in } from '@angular/core';`;
  const importPosition = importSource.indexOf('in }') + 'in'.length;
  const angularImport = session().complete(importSource, importPosition);
  assert.ok(
    labels(angularImport).includes('input'),
    `Expected input() from @angular/core: ${labels(angularImport).join(', ')}`,
  );

  const materialSource = `import { Mat } from '@angular/material/input';`;
  const materialPosition = materialSource.indexOf('Mat }') + 'Mat'.length;
  const materialImport = session().complete(materialSource, materialPosition);
  assert.ok(
    labels(materialImport).includes('MatInputModule'),
    `Expected MatInputModule from Material input: ${labels(materialImport).join(', ')}`,
  );
});

test('keeps independent sessions and updates sources without stale diagnostics', () => {
  const clean = `export default class Clean { message = 'ok'; }`;
  const broken = `export default class Broken { count: number = 'no'; }`;
  const first = session();
  const second = session();

  assert.ok(first.check(broken).length > 0);
  assert.deepEqual(second.check(clean), []);
  assert.deepEqual(first.check(clean), [], 'the same session must recover after an update');
  assert.ok(second.check(broken).length > 0, 'the second session must stay independent');
});

test('type checking never executes learner code', () => {
  const probe = '__typeServiceProbe__';
  globalThis[probe] = 0;

  try {
    const source = `(globalThis as any).${probe} = 1;
throw new Error('learner code must not run during type checking');`;
    const diagnostics = session().check(source);

    assert.ok(Array.isArray(diagnostics));
    assert.equal(globalThis[probe], 0);
  } finally {
    delete globalThis[probe];
  }
});


test('generated browser worker boots and answers the actual client protocol', async () => {
  const script = await readFile('public/playground/generated/typescript-worker.js', 'utf8');
  const messages = [];
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const scope = {
    location: { href: 'https://example.test/playground/generated/typescript-worker.js' },
    postMessage(message) { messages.push(message); if (message.type === 'ready' || message.type === 'error') resolveReady(); },
  };
  runInNewContext(script, {
    self: scope, URL, console, setTimeout, clearTimeout,
    fetch: async url => {
      assert.equal(url.href, 'https://example.test/playground/generated/typescript-libs.json');
      return { ok: true, json: async () => ({ files: declarationFiles }) };
    },
  });
  await ready;
  assert.equal(messages[0].type, 'ready', JSON.stringify(messages));
  await scope.onmessage({ data: { id: 1, kind: 'check', source: 'const amount: number = "wrong";' } });
  assert.equal(messages.at(-1).id, 1);
  assert.ok(messages.at(-1).result.some(item => item.code === 2322));
  await scope.onmessage({ data: { id: 2, kind: 'complete', source: 'const amount = 1; amount.', position: 25 } });
  assert.equal(messages.at(-1).id, 2);
  assert.ok(messages.at(-1).result.options.some(item => item.label === 'toFixed'));
});
