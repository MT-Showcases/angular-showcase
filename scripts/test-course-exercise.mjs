// Execute the actual exercise checkpoints inside the generated Angular runtime.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { JSDOM, VirtualConsole } from 'jsdom';

const bundled = await build({
  entryPoints: ['src/app/course-exercise/course-exercise.steps.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
});
const { COURSE_EXERCISE_STEPS } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64')
);
const preview = await readFile('public/playground/generated/preview.html', 'utf8');

function message(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error(`Timed out waiting for ${kind}`));
    }, 10000);
    function handler(event) {
      const data = event.data;
      if (data?.channel !== 'test-preview') return;
      if (revision !== undefined && data.revision !== revision) return;
      if (data.kind !== kind && data.kind !== 'error') return;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      if (data.kind === 'error') reject(new Error(data.message));
      else resolve(data);
    }
    window.addEventListener('message', handler);
  });
}

async function mount(sources) {
  const dom = new JSDOM(preview, {
    url: 'http://localhost/playground/generated/preview.html#test-preview',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),
  });
  try {
    await message(dom.window, 'ready');
    const done = message(dom.window, 'rendered', 1);
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', {
      source: dom.window,
      data: { channel: 'test-preview', kind: 'render', revision: 1, sources },
    }));
    await done;
    return dom;
  } catch (error) {
    dom.window.close();
    throw error;
  }
}

for (const step of COURSE_EXERCISE_STEPS) {
  for (const mode of ['starter', 'solution']) {
    test(`course exercise ${step.id}: ${mode} compiles and renders`, async () => {
      const dom = await mount(step[mode]);
      try {
        assert.ok(dom.window.document.querySelector('#preview')?.children.length, 'The exercise must mount a component');
      } finally {
        dom.window.close();
      }
    });
  }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 50));
function click(document, label) {
  const button = [...document.querySelectorAll('button')].find(button => button.textContent.trim() === label);
  assert.ok(button, `Missing button ${label}`);
  button.click();
}

test('interaction solution toggles both visual selection and pressed state', async () => {
  const dom = await mount(COURSE_EXERCISE_STEPS[1].solution);
  try {
    const document = dom.window.document;
    click(document, 'Seleziona corso');
    await settle();
    assert.ok(document.querySelector('.course--selected'));
    assert.equal(document.querySelector('button').getAttribute('aria-pressed'), 'true');
    click(document, 'Deseleziona corso');
    await settle();
    assert.equal(document.querySelector('.course--selected'), null);
    assert.equal(document.querySelector('button').getAttribute('aria-pressed'), 'false');
  } finally { dom.window.close(); }
});

test('catalog solution handles unavailable courses, empty state and restore', async () => {
  const dom = await mount(COURSE_EXERCISE_STEPS[2].solution);
  try {
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('.course').length, 4);
    assert.ok(document.querySelector('.catalog').textContent.includes('Non disponibile'));
    click(document, 'Svuota catalogo');
    await settle();
    assert.equal(document.querySelectorAll('.course').length, 0);
    assert.ok(document.querySelector('.empty').textContent.includes('Nessun corso'));
    assert.equal([...document.querySelectorAll('button')].find(b => b.textContent.includes('Svuota')).disabled, true);
    click(document, 'Ripristina catalogo');
    await settle();
    assert.equal(document.querySelectorAll('.course').length, 4);
    assert.equal(document.querySelector('.empty'), null);
  } finally { dom.window.close(); }
});

for (const index of [3, 4]) {
  test(`${COURSE_EXERCISE_STEPS[index].id}: child output updates parent selection and retains catalog controls`, async () => {
    const dom = await mount(COURSE_EXERCISE_STEPS[index].solution);
    try {
      const document = dom.window.document;
      document.querySelectorAll('app-course-card button')[1].click();
      await settle();
      assert.ok(document.querySelector('.summary').textContent.includes('typescript-avanzato'));
      assert.equal(document.querySelectorAll('.course--selected').length, 1);
      assert.ok(document.querySelectorAll('app-course-card')[1].querySelector('.course--selected'));
      click(document, 'Svuota catalogo');
      await settle();
      assert.equal(document.querySelectorAll('app-course-card').length, 0);
      click(document, 'Ripristina catalogo');
      await settle();
      assert.equal(document.querySelectorAll('app-course-card').length, 4);
    } finally { dom.window.close(); }
  });
}

test('pipes solution formats actual child values and responds to an edited custom separator', async () => {
  const original = COURSE_EXERCISE_STEPS[4].solution;
  const snapshot = JSON.stringify(original);
  const edited = { ...original, files: { ...original.files,
    'course-card.component.ts': original.files['course-card.component.ts'].replace("tags:' / '", "tags:' + '") } };
  const dom = await mount(edited);
  try {
    const card = dom.window.document.querySelector('app-course-card');
    assert.equal(card.querySelector('h2').textContent.trim(), 'ANGULAR: FONDAMENTI');
    assert.equal(card.querySelectorAll('dd')[0].textContent.trim(), '$149');
    assert.equal(card.querySelectorAll('dd')[1].textContent.trim(), '09/11/2026');
    assert.equal(card.querySelector('.course__tags').textContent.trim(), 'Angular + Basi');
    assert.equal(JSON.stringify(original), snapshot);
  } finally { dom.window.close(); }
});
