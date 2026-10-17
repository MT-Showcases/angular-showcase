// Execute the generated browser runtime against the actual lesson seed in an isolated jsdom window.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build } from 'esbuild';
async function fixture(path) {
  const result = await build({ entryPoints: [path], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { FIRST_COMPONENT } = await fixture('src/app/getting-started/first-component.example.ts');
const { BINDING_EXAMPLE } = await fixture('src/app/data-binding/binding.example.ts');
const { CONTROL_FLOW_EXAMPLE } = await fixture('src/app/directives/control-flow.example.ts');
const { COMMUNICATION_EXAMPLE } = await fixture('src/app/component-communication/communication.example.ts');

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
  const warnings = [];
  const console = new VirtualConsole();
  console.on('warn', (...args) => warnings.push(args.join(' ')));
  const dom = new JSDOM(source, { url: 'http://localhost/playground/generated/preview.html#test-preview', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: console });
  dom.warnings = warnings;
  await listen(dom.window, 'ready');
  return dom;
}
async function render(dom, sources, revision, expected = 'rendered') {
  const done = listen(dom.window, expected, revision);
  dom.window.dispatchEvent(new dom.window.MessageEvent('message', { source: dom.window, data: { channel: 'test-preview', kind: 'render', revision, sources } }));
  return done;
}
const settle = () => new Promise(resolve => setTimeout(resolve, 30));
async function input(dom, selector, value, event = 'input') {
  const element = dom.window.document.querySelector(selector);
  element.value = value;
  element.dispatchEvent(new dom.window.Event(event, { bubbles: true }));
  await settle();
}
async function click(dom, selector) {
  dom.window.document.querySelector(selector).click();
  await settle();
}

test('binding seed synchronizes both input directions, properties, escaped text and reset', async () => {
  const dom = await environment();
  try {
    await render(dom, BINDING_EXAMPLE, 1);
    const doc = dom.window.document;
    await input(dom, '#event-name', 'Luca');
    assert.equal(doc.querySelector('#copy').value, 'Luca');
    assert.equal(doc.querySelector('#two-way-name').value, 'Luca');
    assert.match(doc.querySelector('#events').textContent, /1/);
    await click(dom, '#lock');
    assert.equal(doc.querySelector('#copy').disabled, true);
    assert.equal(doc.querySelector('#lock').getAttribute('aria-pressed'), 'true');
    await input(dom, '#two-way-name', '<img src=x>');
    assert.equal(doc.querySelector('#greeting').textContent, 'Ciao, <img src=x>!');
    assert.equal(doc.querySelector('#greeting img'), null);
    assert.match(doc.querySelector('#events').textContent, /1/);
    await input(dom, '#two-way-name', '');
    assert.match(doc.querySelector('#greeting').textContent, /visitatore/);
    await click(dom, '#preset');
    assert.equal(doc.querySelector('#two-way-name').value, 'Grace');
    await click(dom, '#reset');
    assert.equal(doc.querySelector('#copy').value, 'Ada');
    assert.equal(doc.querySelector('#copy').disabled, false);
    assert.match(doc.querySelector('#events').textContent, /0/);
    await render(dom, { ...BINDING_EXAMPLE, typescript: BINDING_EXAMPLE.typescript.replaceAll("'Ada'", "'Nina'") }, 2);
    assert.match(doc.querySelector('#greeting').textContent, /Nina/);
  } finally { dom.window.close(); }
});

test('control-flow seed preserves DOM identity, accepts duplicate labels and reaches every branch', async () => {
  const dom = await environment();
  try {
    await render(dom, CONTROL_FLOW_EXAMPLE, 1);
    const doc = dom.window.document;
    const first = doc.querySelector('[data-item-id="1"]');
    await click(dom, '#reverse');
    assert.equal(doc.querySelector('[data-item-id="1"]'), first);
    assert.equal([...doc.querySelectorAll('[data-item-id]')].at(-1), first);
    for (let i = 0; i < 2; i++) {
      await input(dom, '#item-name', '  Mela  ');
      await click(dom, '#add');
    }
    const ids = [...doc.querySelectorAll('[data-item-id]')].map(row => row.dataset.itemId);
    assert.equal(new Set(ids).size, 5);
    await input(dom, '#item-name', '   ');
    assert.equal(doc.querySelector('#add').disabled, true);
    await click(dom, '[data-item-id="1"] button');
    assert.equal(doc.querySelector('[data-item-id="1"]'), null);
    assert.equal(doc.activeElement, doc.querySelector('#item-name'));
    await click(dom, '#clear');
    assert.ok(doc.querySelector('#empty'));
    assert.equal(doc.querySelector('#reverse').disabled, true);
    await click(dom, '#reset');
    assert.equal(doc.querySelectorAll('[data-item-id]').length, 3);
    await click(dom, '.demo > button');
    assert.match(doc.querySelector('#condition').textContent, /@else/);
    for (const [state, text] of [['review', 'In revisione'], ['published', 'Pubblicato'], ['unknown', 'Stato sconosciuto'], ['draft', 'Bozza']]) {
      await input(dom, '#state', state, 'change');
      assert.match(doc.querySelector('#publication').textContent, new RegExp(text));
    }
    const highlight = doc.querySelector('#highlight');
    await click(dom, '.demo > button:last-of-type');
    assert.equal(doc.querySelector('#highlight'), highlight);
    assert.equal(highlight.classList.contains('active'), true);
  } finally { dom.window.close(); }
});

test('actual parent and child communicate, enforce limits/pause and leave data ownership with the parent', async () => {
  const dom = await environment();
  try {
    await render(dom, COMMUNICATION_EXAMPLE, 1);
    const doc = dom.window.document;
    const cards = doc.querySelectorAll('app-vote-card');
    await click(dom, 'app-vote-card button');
    assert.equal(cards[0].querySelector('strong').textContent, '1');
    assert.equal(cards[1].querySelector('strong').textContent, '0');
    assert.match(doc.querySelector('#last-request').textContent, /templates/);
    await input(dom, '#title', 'Pratica');
    assert.equal(cards[0].querySelector('h3').textContent, 'Pratica');
    await click(dom, '#pause');
    assert.equal(cards[0].querySelector('button').disabled, true);
    await click(dom, '#pause');
    await click(dom, 'app-vote-card button');
    await click(dom, 'app-vote-card button');
    assert.equal(cards[0].querySelector('strong').textContent, '3');
    assert.equal(cards[0].querySelector('button').disabled, true);
    await click(dom, '#reset');
    assert.equal(cards[0].querySelector('strong').textContent, '0');
    assert.equal(cards[0].querySelector('h3').textContent, 'Template');
    // Remove the handler: the child still emits, but cannot change the parent's votes.
    await render(dom, { ...COMMUNICATION_EXAMPLE, html: COMMUNICATION_EXAMPLE.html.replace('(voteRequested)="recordVote($event)"', '') }, 2);
    await click(dom, 'app-vote-card button');
    assert.equal(doc.querySelector('app-vote-card strong').textContent, '0');
  } finally { dom.window.close(); }
});

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
    assert.doesNotMatch(dom.warnings.join('\n'), /NG0912/);
  } finally { dom.window.close(); }
});

test('syntax and Angular template errors are reported and corrected code recovers', async () => {
  const dom = await environment();
  try {
    const syntax = await render(dom, { ...FIRST_COMPONENT, typescript: 'export default class {' }, 1, 'error');
    assert.match(syntax.message, /component.ts/);
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
