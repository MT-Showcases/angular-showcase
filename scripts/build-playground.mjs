// Keep compiler/runtime code out of the host application's initial and lesson bundles.
import { build } from 'esbuild';
import { compile } from 'sass';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
