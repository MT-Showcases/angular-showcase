// Keep compiler/runtime code out of the host application's initial and lesson bundles.
import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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
await writeFile('public/playground/generated/preview.html', `<!doctype html><html lang="it"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash}' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'">
<title>Anteprima componente Angular</title>
<style>body{margin:0;padding:24px;color:#1a1b22;background:#fff;font:16px/1.5 system-ui,sans-serif;overflow-wrap:anywhere}*{box-sizing:border-box}button,input,textarea,select{font:inherit}button{cursor:pointer}button:focus-visible,input:focus-visible{outline:3px solid #3c55bf;outline-offset:3px}</style>
</head><body><main id="preview"></main><script>${script}</script></body></html>`);
console.log(`Playground runtime generated (${(Buffer.byteLength(script) / 1024 / 1024).toFixed(2)} MB, loaded only by the preview).`);
