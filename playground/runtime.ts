// This entry is bundled separately and executes only inside the opaque-origin preview iframe.
import '@angular/compiler';
import * as core from '@angular/core';
import * as common from '@angular/common';
import * as forms from '@angular/forms';
import * as buttons from '@angular/material/button';
import * as formFields from '@angular/material/form-field';
import * as inputs from '@angular/material/input';
import { createApplication } from '@angular/platform-browser';
import * as ts from 'typescript';
import { initializerTransform } from './initializer-transform';
import type { PlaygroundSources } from '../src/app/components/angular-playground/playground.types';

const MAX_FILE_LENGTH = 50000;
const MAX_EXTRA_FILES = 24;
const ROOT_FILE = 'component.ts';
const RESERVED_FILES = new Set(['component.ts', 'component.html', 'component.css']);

type FileKind = 'ts' | 'html' | 'css';

interface VirtualFile {
  text: string;
  kind: FileKind;
}

interface ModuleRecord {
  exports: Record<string, unknown>;
}

const channel = decodeURIComponent(location.hash.slice(1));
let revision = 0;
let component: core.ComponentRef<unknown> | undefined;
const reply = (kind: string, payload: object = {}) => parent.postMessage({ channel, kind, revision, ...payload }, '*');
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
class PreviewErrors implements core.ErrorHandler {
  handleError(error: unknown): void { reply('error', { message: message(error) }); }
}
const applicationOptions = { providers: [{ provide: core.ErrorHandler, useClass: PreviewErrors }] };
let app = createApplication(applicationOptions);
let queue = Promise.resolve();
const reportSize = () => reply('resize', {
  height: Math.ceil(document.querySelector('#preview')!.getBoundingClientRect().height + 48),
});
// Observe content, not the iframe viewport, so short examples can shrink again.
if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(reportSize).observe(document.querySelector('#preview')!);
}

class VirtualFileError extends Error {
  readonly reported = true;
}

function fail(text: string): never {
  throw new VirtualFileError(text);
}

/** Reject URLs, absolute paths, traversal and hidden files before touching the virtual map. */
function normalizeVirtualPath(raw: string): string {
  const name = raw.replace(/\\/g, '/');
  if (!name || name.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(name) ||
      name.includes('?') || name.includes('#')) {
    fail(`Percorso virtuale non valido: "${raw}". Usa un percorso relativo come greeting.component.ts.`);
  }
  if (name === '__proto__' || name === 'constructor' || name === 'prototype') {
    fail(`Nome di file virtuale non valido: "${raw}".`);
  }

  const segments = name.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    fail(`Il percorso virtuale "${raw}" deve restare dentro la cartella del progetto.`);
  }
  return segments.join('/');
}

function kindOf(path: string): FileKind | undefined {
  if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'ts';
  if (path.endsWith('.html')) return 'html';
  if (path.endsWith('.css')) return 'css';
  return undefined;
}

function joinVirtualPath(fromFile: string, specifier: string): string {
  if (specifier.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(specifier) ||
      specifier.includes('?') || specifier.includes('#')) {
    fail(`Percorso non valido: "${specifier}". Il playground usa solo file locali al progetto.`);
  }

  const stack = fromFile.split('/').slice(0, -1);
  for (const segment of specifier.replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (!stack.length) fail(`Il percorso "${specifier}" esce dalla cartella del progetto.`);
      stack.pop();
      continue;
    }
    stack.push(segment);
  }
  if (!stack.length) fail(`Il percorso "${specifier}" esce dalla cartella del progetto.`);
  return stack.join('/');
}

function createFiles(sources: PlaygroundSources): Map<string, VirtualFile> {
  const files = new Map<string, VirtualFile>([
    [ROOT_FILE, { text: sources.typescript, kind: 'ts' }],
    ['component.html', { text: sources.html, kind: 'html' }],
    ['component.css', { text: sources.css, kind: 'css' }],
  ]);

  const extras = sources.files;
  if (extras === undefined) return files;
  if (typeof extras !== 'object' || extras === null || Array.isArray(extras)) {
    fail('Il campo files deve essere un oggetto di percorsi e testi.');
  }

  const entries = Object.entries(extras);
  if (entries.length > MAX_EXTRA_FILES) {
    fail(`Troppi file nel progetto: massimo ${MAX_EXTRA_FILES}.`);
  }

  for (const [rawName, text] of entries) {
    const name = normalizeVirtualPath(rawName);
    if (RESERVED_FILES.has(name)) {
      fail(`Il file "${name}" è già un file principale del playground.`);
    }
    if (files.has(name)) fail(`File virtuale duplicato: "${name}".`);
    if (typeof text !== 'string' || text.length > MAX_FILE_LENGTH) {
      fail(`Il file "${name}" supera il limite di ${MAX_FILE_LENGTH} caratteri.`);
    }
    const kind = kindOf(name);
    if (!kind) fail(`Tipo di file non supportato: "${name}". Usa .ts, .html o .css.`);
    files.set(name, { text, kind });
  }

  return files;
}

function compile(path: string, text: string): string {
  const result = ts.transpileModule(text, {
    fileName: path,
    reportDiagnostics: true,
    transformers: { before: [initializerTransform] },
    compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      experimentalDecorators: true, useDefineForClassFields: false,
      isolatedModules: true,
    },
  });
  const errors = result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error);
  if (errors?.length) {
    fail(errors.map(item => {
      const position = item.file && item.start !== undefined
        ? item.file.getLineAndCharacterOfPosition(item.start)
        : null;
      return `${position ? `${path}:${position.line + 1}:${position.character + 1} — ` : ''}${ts.flattenDiagnosticMessageText(item.messageText, '\n')}`;
    }).join('\n'));
  }
  return result.outputText;
}

function resolveModule(specifier: string, from: string, files: Map<string, VirtualFile>): string {
  const base = joinVirtualPath(from, specifier);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`];

  // TypeScript-style imports may still spell the emitted .js extension.
  if (base.endsWith('.js')) candidates.push(base.slice(0, -3) + '.ts');
  if (base.endsWith('.mjs')) candidates.push(base.slice(0, -4) + '.ts');

  for (const candidate of candidates) {
    if (files.get(candidate)?.kind === 'ts') return candidate;
  }
  if (files.has(base)) {
    fail(`"${specifier}" non è un modulo TypeScript importabile (in ${from}).`);
  }
  fail(`Modulo non trovato: "${specifier}" (importato da ${from}).`);
}

function evaluate(sources: PlaygroundSources): core.Type<unknown> {
  const files = createFiles(sources);
  const cache = new Map<string, ModuleRecord>();
  let componentIndex = 0;

  const componentDecorator = (modulePath: string): ((metadata: core.Component) => core.TypeDecorator) => {
    return (metadata: core.Component): core.TypeDecorator => {
      const { templateUrl, styleUrl, styleUrls, ...inline } = metadata;

      const resource = (url: unknown, expected: 'html' | 'css', label: string): string => {
        if (typeof url !== 'string' || !url) {
          fail(`${modulePath}: ${label} deve essere un percorso stringa.`);
        }
        if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//') ||
            url.includes('?') || url.includes('#')) {
          fail(`${modulePath}: ${label} non può usare URL esterni ("${url}").`);
        }
        const path = joinVirtualPath(modulePath, url);
        const file = files.get(path);
        if (!file) fail(`Risorsa non trovata: "${url}" (in ${modulePath}).`);
        if (file.kind !== expected) {
          fail(`${modulePath}: ${label} deve puntare a un file .${expected}.`);
        }
        return file.text;
      };

      const template = templateUrl !== undefined ? resource(templateUrl, 'html', 'templateUrl') : undefined;
      const styleSheets = styleUrls !== undefined
        ? (Array.isArray(styleUrls) ? styleUrls : fail(`${modulePath}: styleUrls deve essere un array.`))
          .map((url, index) => resource(url, 'css', `styleUrls[${index}]`))
        : undefined;
      const style = styleUrl !== undefined ? resource(styleUrl, 'css', 'styleUrl') : undefined;

      return core.Component({ ...inline,
        // Re-evaluation creates new types with the same selector. Distinguish their
        // public host metadata to avoid Angular component ID collisions (NG0912).
        host: { ...inline.host, 'data-playground-component': `${revision}-${++componentIndex}-${modulePath}` },
        ...(template !== undefined ? { template } : {}),
        ...(styleSheets !== undefined ? { styles: styleSheets } : {}),
        ...(style !== undefined ? { styles: [style] } : {}),
      });
    };
  };

  const bundled: Record<string, unknown> = {
    '@angular/common': common, '@angular/forms': forms,
    '@angular/material/button': buttons, '@angular/material/form-field': formFields,
    '@angular/material/input': inputs,
  };

  const load = (path: string): unknown => {
    const cached = cache.get(path);
    if (cached) return cached.exports;

    const file = files.get(path);
    if (!file || file.kind !== 'ts') fail(`Modulo TypeScript non trovato: "${path}".`);

    const record: ModuleRecord = { exports: {} };
    cache.set(path, record);
    try {
      // Intentionally evaluate learner code only in the sandbox, never in the showcase application.
      const localRequire = (specifier: string): unknown => {
        if (specifier === '@angular/core') {
          return { ...core, Component: componentDecorator(path) };
        }
        if (specifier.startsWith('.')) {
          return load(resolveModule(specifier, path, files));
        }
        if (!Object.hasOwn(bundled, specifier)) {
          throw new Error(
            `Import non disponibile: ${specifier} (in ${path}). Sono disponibili Angular core, ` +
            'common, forms e Material button, form-field e input.',
          );
        }
        return bundled[specifier];
      };

      const output = compile(path, file.text);
      new Function('require', 'exports', 'module', output)(localRequire, record.exports, record);
      return record.exports;
    } catch (error) {
      cache.delete(path);
      if (error instanceof Error && (error as VirtualFileError).reported) throw error;
      fail(`${path}: ${message(error)}`);
    }
  };

  const root = load(ROOT_FILE) as { default?: core.Type<unknown> };
  if (!root || typeof root.default !== 'function' || !core.reflectComponentType(root.default)) {
    fail('Esporta il componente principale con export default class NomeComponente (in component.ts).');
  }
  return root.default;
}

async function render(sources: PlaygroundSources, requested: number): Promise<void> {
  if (requested !== revision) return;
  try {
    const previous = await app;
    if (requested !== revision) return;
    const type = evaluate(sources);
    component?.destroy();
    if (!previous.destroyed) previous.destroy();
    // A fresh application also resets Angular's renderer/style cache for the same selector.
    app = createApplication(applicationOptions);
    const application = await app;
    if (requested !== revision) return;
    const host = document.createElement('div');
    document.querySelector('#preview')!.replaceChildren(host);
    component = core.createComponent(type, { hostElement: host, environmentInjector: application.injector });
    application.attachView(component.hostView);
    component.changeDetectorRef.detectChanges();
    reportSize();
    reply('rendered');
  } catch (error) { reply('error', { message: message(error) }); }
}

addEventListener('message', event => {
  if (event.source !== parent || event.data?.channel !== channel || event.data?.kind !== 'render') return;
  const { sources, revision: requested } = event.data;
  if (!Number.isInteger(requested) || requested < revision || !sources ||
      !['typescript', 'html', 'css'].every(key => typeof sources[key] === 'string' && sources[key].length <= MAX_FILE_LENGTH)) return;
  revision = requested;
  queue = queue.then(() => render(sources, requested));
});
addEventListener('error', event => reply('error', { message: event.message }));
addEventListener('unhandledrejection', event => reply('error', { message: message(event.reason) }));
void app.then(() => reply('ready'), error => reply('error', { message: message(error) }));
