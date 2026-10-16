// Execute the generated browser runtime against the actual lesson seed in an isolated jsdom window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import { transform } from 'esbuild';
const fixtureSource = await readFile('src/app/getting-started/first-component.example.ts', 'utf8');
const fixtureModule = await transform(fixtureSource, { loader: 'ts', format: 'esm' });
const { FIRST_COMPONENT } = await import('data:text/javascript;base64,' + Buffer.from(fixtureModule.code).toString('base64')); 

const source = await readFile('public/playground/generated/preview.html', 'utf8');
function listen(window, kind, revision) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { window.removeEventListener('message', handler); reject(new Error(`Timed out waiting for ${kind}`)); }, 6000);
    const handler = event => {
      if (event.data?.channel !== 'test-preview') return;
      if (revision !== undefined && event.data.revision !== revision) return;
      if (event.data.kind !== kind && event.data.kind !== 'error') return;
      clearTimeout(timer); window.removeEventListener('message', handler);
      if (event.data.kind === 'error' && kind !== 'error') reject(new Error(event.data.message));
      else resolve(event.data);
    };
    window.addEventListener('message', handler);
  });
}
async function environment() {
  const dom = new JSDOM(source, { url: 'http://localhost/playground/generated/preview.html#test-preview', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  await listen(dom.window, 'ready');
  return dom;
}
async function render(dom, sources, revision, expected = 'rendered') {
  const done = listen(dom.window, expected, revision);
  dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window, data: { channel: 'test-preview', kind: 'render', revision, sources } }));
  return done;
}

test('actual Angular seed renders, handles clicks and reflects edits to all three files', async () => {
  const dom = await environment();
  try {
    await render(dom, FIRST_COMPONENT, 1);
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Angular!');
    dom.window.document.querySelector('button').click();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(dom.window.document.querySelector('strong').textContent, '1');
    await render(dom, {
      typescript: FIRST_COMPONENT.typescript.replace("'Ciao, Angular!'", "'Ciao, Ada!'"),
      html: FIRST_COMPONENT.html.replace('Hai premuto', 'Totale click:'),
      css: FIRST_COMPONENT.css.replace('#faf8ff', '#ff0000'),
    }, 2);
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Ada!');
    assert.match(dom.window.document.querySelector('p').textContent, /Totale click:/);
    assert.equal(dom.window.document.querySelector('strong').textContent, '0');
    assert.match([...dom.window.document.querySelectorAll('style')].map(style => style.textContent).join(''), /#ff0000/);
  } finally { dom.window.close(); }
});

test('syntax and Angular template errors are reported and corrected code recovers', async () => {
  const dom = await environment();
  try {
    const syntax = await render(dom, { ...FIRST_COMPONENT, typescript: 'export default class {' }, 1, 'error');
    assert.match(syntax.message, /welcome-card.ts/);
    const template = await render(dom, { ...FIRST_COMPONENT, html: '<p>{{ message + }}</p>' }, 2, 'error');
    assert.match(template.message, /Parser Error|Unexpected token|expression/i);
    await render(dom, FIRST_COMPONENT, 3);
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Angular!');
  } finally { dom.window.close(); }
});

test('unsupported imports fail visibly; wrong channels and older revisions cannot replace the preview', async () => {
  const dom = await environment();
  try {
    const error = await render(dom, { ...FIRST_COMPONENT, typescript: "import { unknown } from 'arbitrary-package'; console.log(unknown);" }, 1, 'error');
    assert.match(error.message, /Import non disponibile/);
    await render(dom, FIRST_COMPONENT, 3);
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window, data: { channel: 'wrong', kind: 'render', revision: 4, sources: { ...FIRST_COMPONENT, html: 'Wrong' } } }));
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window, data: { channel: 'test-preview', kind: 'render', revision: 2, sources: { ...FIRST_COMPONENT, html: 'Old' } } }));
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.equal(dom.window.document.querySelector('h2').textContent, 'Ciao, Angular!');
  } finally { dom.window.close(); }
});
