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

interface Sources { typescript: string; html: string; css: string }
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

function evaluate(sources: Sources): core.Type<unknown> {
  let componentIndex = 0;
  const result = ts.transpileModule(sources.typescript, {
    fileName: 'component.ts', reportDiagnostics: true,
    transformers: { before: [initializerTransform] },
    compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      experimentalDecorators: true, useDefineForClassFields: false,
      isolatedModules: true,
    },
  });
  const errors = result.diagnostics?.filter(item => item.category === ts.DiagnosticCategory.Error);
  if (errors?.length) {
    throw new Error(errors.map(item => {
      const position = item.file && item.start !== undefined ? item.file.getLineAndCharacterOfPosition(item.start) : null;
      return `${position ? `component.ts:${position.line + 1}:${position.character + 1} — ` : ''}${ts.flattenDiagnosticMessageText(item.messageText, '\n')}`;
    }).join('\n'));
  }
  // Resolve the two virtual resources before asking Angular's real JIT compiler to compile them.
  const Component = (metadata: core.Component): core.TypeDecorator => {
    const { templateUrl, styleUrl, styleUrls, ...inline } = metadata;
    if (templateUrl && templateUrl !== './component.html') throw new Error('Usa templateUrl: ./component.html per il file HTML del playground.');
    if (styleUrl && styleUrl !== './component.css') throw new Error('Usa styleUrl: ./component.css per il file CSS del playground.');
    if (styleUrls) throw new Error('Questo esempio usa styleUrl: ./component.css.');
    return core.Component({ ...inline,
      // Re-evaluation creates new types with the same selector. Distinguish their
      // public host metadata to avoid Angular component ID collisions (NG0912).
      host: { ...inline.host, 'data-playground-component': `${revision}-${++componentIndex}` },
      ...(templateUrl ? { template: sources.html } : {}),
      ...(styleUrl ? { styles: [sources.css] } : {}),
    });
  };
  const modules: Record<string, unknown> = {
    '@angular/core': { ...core, Component }, '@angular/common': common, '@angular/forms': forms,
    '@angular/material/button': buttons, '@angular/material/form-field': formFields,
    '@angular/material/input': inputs,
  };
  const require = (name: string): unknown => {
    if (!Object.hasOwn(modules, name)) throw new Error(`Import non disponibile: ${name}. Sono disponibili Angular core, common, forms e Material button, form-field e input.`);
    return modules[name];
  };
  const exports: { default?: core.Type<unknown> } = {};
  // Intentionally evaluate learner code only in the sandbox, never in the showcase application.
  new Function('require', 'exports', result.outputText)(require, exports);
  if (typeof exports.default !== 'function' || !core.reflectComponentType(exports.default)) {
    throw new Error('Esporta il componente principale con export default class NomeComponente.');
  }
  return exports.default;
}

async function render(sources: Sources, requested: number): Promise<void> {
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
      !['typescript', 'html', 'css'].every(key => typeof sources[key] === 'string' && sources[key].length <= 50000)) return;
  revision = requested;
  queue = queue.then(() => render(sources, requested));
});
addEventListener('error', event => reply('error', { message: event.message }));
addEventListener('unhandledrejection', event => reply('error', { message: message(event.reason) }));
void app.then(() => reply('ready'), error => reply('error', { message: message(error) }));
