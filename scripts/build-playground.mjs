// Keep compiler/runtime code out of the host application's initial and lesson bundles.
import { build } from 'esbuild';
import { compile } from 'sass';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
// The small initializer bridge depends on Angular 22's signal-input JIT metadata.
// Fail at build time on a major upgrade until its contract tests are reviewed.
const angular = JSON.parse(await readFile('node_modules/@angular/core/package.json', 'utf8'));
if (!angular.version.startsWith('22.')) throw new Error('Review the playground initializer bridge before upgrading Angular beyond 22.');
// Share the application's public Material theme, including shapes and focus indicators.
const theme = compile('playground/preview.scss', { loadPaths: ['node_modules', 'src/styles'], style: 'compressed' }).css;
const result = await build({
  entryPoints: ['playground/runtime.ts'], bundle: true, write: false,
  platform: 'browser', format: 'iife', target: 'es2022', minify: true,
  define: { ngDevMode: 'true' }, legalComments: 'inline',
  external: ['fs', 'path', 'os', 'crypto', 'perf_hooks', 'inspector'],
});
// An inline hash permits only the bundled runtime script; learner JS runs through JIT evaluation.
const script = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const hash = createHash('sha256').update(script).digest('base64');
await mkdir('public/playground/generated', { recursive: true });
await writeFile('public/playground/generated/preview.html', `<!doctype html><html lang="it" class="site-html"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash}' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
<title>Anteprima componente Angular</title>
<style>${theme}</style>
</head><body><main id="preview"></main><script>${script}</script></body></html>`);
console.log(`Playground runtime generated (${(Buffer.byteLength(script) / 1024 / 1024).toFixed(2)} MB, loaded only by the preview).`);

// Build a portable, self-contained declaration graph for the editor worker.
// The worker cannot resolve node_modules or touch the network, so package
// metadata and every transitive .d.ts file are embedded in one JSON asset.
const require = createRequire(import.meta.url);
const ts = require('typescript');
const supportedModules = [
  '@angular/core',
  '@angular/common',
  '@angular/forms',
  '@angular/router',
  '@angular/material/button',
  '@angular/material/form-field',
  '@angular/material/input',
];
const editorOptions = {
  strict: true,
  skipLibCheck: true,
  noEmit: true,
  experimentalDecorators: true,
  useDefineForClassFields: false,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  types: [],
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
};
const syntheticPath = path.join(process.cwd(), 'playground', '__type-entry.ts');
const syntheticSource = `${supportedModules
  .map((name, index) => `import type * as supported${index} from '${name}';`)
  .join('\n')}

export type SupportedModules = [
${supportedModules.map((_, index) => `  typeof supported${index}`).join(',\n')}
];
`;
const baseHost = ts.createCompilerHost(editorOptions);
const readFileFromDisk = baseHost.readFile.bind(baseHost);
const fileExistsOnDisk = baseHost.fileExists.bind(baseHost);
const getSourceFileFromDisk = baseHost.getSourceFile.bind(baseHost);
const syntheticFile = ts.createSourceFile(
  syntheticPath,
  syntheticSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TS,
);
baseHost.readFile = (fileName) =>
  fileName === syntheticPath ? syntheticSource : readFileFromDisk(fileName);
baseHost.fileExists = (fileName) =>
  fileName === syntheticPath || fileExistsOnDisk(fileName);
baseHost.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
  fileName === syntheticPath
    ? syntheticFile
    : getSourceFileFromDisk(fileName, languageVersion, onError, shouldCreateNewSourceFile);

const typeProgram = ts.createProgram([syntheticPath], editorOptions, baseHost);
const programErrors = ts
  .getPreEmitDiagnostics(typeProgram)
  .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
if (programErrors.length) {
  throw new Error(
    'Impossibile generare le dichiarazioni TypeScript:\n' +
      programErrors
        .map((diagnostic) => {
          const location = diagnostic.file ? `${diagnostic.file.fileName}: ` : '';
          return location + ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        })
        .join('\n'),
  );
}

const declarationFiles = new Map();
const packageDirectories = new Set();
// node_modules may be a symlink, so compiler paths can be outside the worktree.
// Anchor portable paths on the last node_modules segment rather than cwd.
const relativePath = (fileName) => {
  const normalized = fileName.split(path.sep).join('/');
  const marker = '/node_modules/';
  const index = normalized.lastIndexOf(marker);
  return index >= 0 ? normalized.slice(index + 1) : normalized;
};

const collectPackageDirectories = (relative) => {
  const segments = relative.split('/');
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index] !== 'node_modules' || index + 1 >= segments.length) continue;
    const nameLength = segments[index + 1].startsWith('@') ? 2 : 1;
    if (index + 1 + nameLength > segments.length) continue;
    packageDirectories.add(segments.slice(0, index + 1 + nameLength).join('/'));
  }
};

for (const sourceFile of typeProgram.getSourceFiles()) {
  const relative = relativePath(sourceFile.fileName);
  if (relative.startsWith('node_modules/typescript/lib/')) {
    declarationFiles.set(`/lib/${path.posix.basename(relative)}`, sourceFile.text);
  } else if (relative.startsWith('node_modules/')) {
    declarationFiles.set(`/${relative}`, sourceFile.text);
    collectPackageDirectories(relative);
  }
}

for (const directory of [...packageDirectories].sort()) {
  const packagePath = path.join(process.cwd(), directory, 'package.json');
  if (!fileExistsOnDisk(packagePath)) continue;

  const packageJson = JSON.parse(readFileFromDisk(packagePath));
  const metadata = {};
  for (const key of ['name', 'version', 'type', 'main', 'module', 'types', 'typings', 'exports']) {
    if (packageJson[key] !== undefined) metadata[key] = packageJson[key];
  }
  declarationFiles.set(`/${directory}/package.json`, JSON.stringify(metadata));
}

// The language service asks for the default full lib; keep it available even
// though the program only pulled the individual ES2022/DOM reference files.
const defaultLibPath = path.join(
  process.cwd(),
  'node_modules/typescript/lib/lib.es2022.full.d.ts',
);
if (!declarationFiles.has('/lib/lib.es2022.full.d.ts')) {
  const defaultLib = readFileFromDisk(defaultLibPath);
  if (defaultLib === undefined) throw new Error('Libreria TypeScript predefinita non trovata.');
  declarationFiles.set('/lib/lib.es2022.full.d.ts', defaultLib);
}

const portableFiles = Object.fromEntries(
  [...declarationFiles.entries()].sort(([left], [right]) => left.localeCompare(right)),
);
const libsJson = JSON.stringify({ files: portableFiles });
if (libsJson.includes(process.cwd())) {
  throw new Error('Il grafo TypeScript contiene percorsi assoluti non portabili.');
}
await writeFile('public/playground/generated/typescript-libs.json', libsJson);
console.log(
  `TypeScript declarations generated (${(Buffer.byteLength(libsJson) / 1024 / 1024).toFixed(2)} MB, ${declarationFiles.size} files).`,
);

const worker = await build({
  entryPoints: ['playground/type-worker.ts'],
  bundle: true,
  write: false,
  platform: 'browser',
  format: 'iife',
  target: 'es2022',
  minify: true,
  legalComments: 'inline',
  external: ['fs', 'path', 'os', 'crypto', 'perf_hooks', 'inspector'],
});
await writeFile('public/playground/generated/typescript-worker.js', worker.outputFiles[0].text);
console.log(
  `TypeScript editor worker generated (${(Buffer.byteLength(worker.outputFiles[0].text) / 1024 / 1024).toFixed(2)} MB, lazy-loaded).`,
);
