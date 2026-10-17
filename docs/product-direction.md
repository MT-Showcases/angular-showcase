# Product direction: editable Angular playgrounds

Updated: 2026-10-17. This is the user's confirmed direction; the First Component lesson is the reference implementation.

## Lesson experience

1. **Interactive preview first.** The learner can use the rendered component immediately.
2. **Editable code directly below.** Syntax-highlighted TypeScript, HTML and CSS belong to the example and drive its actual preview. The main source is visible without opening an accordion.
3. **Readable teaching code.** Add concise Italian comments explaining key concepts, blank lines between logical blocks and multiline attributes/declarations. Do not compress examples to save vertical space.
4. **Short, formatted context.** Use meaningful headings, bold terms, code styling and semantic accent colors. Explain only what helps the current experiment.
5. **Optional depth.** Accordions can hold extra theory or secondary examples to reduce crowding. Changing tabs or explanations preserves the current experiment.
6. **Useful editing feedback.** Refresh after a short typing pause, show errors inline and provide run, pause and restore actions. Recompiling resets the component's runtime state; switching file tabs does not.
7. **Consistent icons.** Use Angular Material `mat-icon` for all site UI icons, with accessible labels on icon-only controls. Do not use emoji or other icon libraries as UI icons.
8. **Mobile sizing.** Keep editable text at least 16px, avoid automatic text inflation and keep menus within the viewport. Preserve manual pinch zoom and scroll code/file tabs inside their own panels.

## What is implemented

`/basics/getting-started` now uses the shared AngularPlayground component. Its preview precedes a CodeMirror editor with three virtual files. The former long introduction and code accordion have been replaced by a compact header, one prompt, three short concept cards and optional context.

The other lessons still use their existing demos. They have not yet been converted to editable playgrounds.

## Runtime choice

- **Component prototype, delivered:** TypeScript transpilation and Angular JIT execute in a separate iframe, using the installed Angular version. The example's external HTML/CSS filenames are resolved from the editor. CodeMirror and the 4.57 MB raw compiler/runtime are loaded by the lesson/preview, not the host's initial bundle.
- **Project playground, next:** multiple linked component/service files, package dependencies and the Angular CLI build pipeline need a broader runtime. WebContainers is a candidate; evaluate browser support, startup cost and current usage/licensing terms before choosing it. The current component runner is not a full project IDE.

The prototype supports one default-exported component and the bundled Angular core/common/forms modules. It reports TypeScript syntax and Angular runtime/template errors, without full TypeScript semantic checking or Angular's full AOT transformation pipeline. CSS is plain, self-contained CSS.

## Execution boundary

Learner source never executes in the showcase window or on the development server. The preview uses `sandbox="allow-scripts"` without same-origin privileges, a restrictive CSP and messages checked against the actual iframe window, instance channel and current revision. A fresh Angular application resets renderer/style caches on recompilation. Route destruction removes host listeners, editors and the iframe.

This isolation protects the host's DOM and origin data; it is not a resource-quota system for arbitrary hostile programs. A general project runtime needs its own resource/lifecycle design before broader rollout.

## Next steps

1. Review the First Component experience, including code comments, spacing and mobile ergonomics.
2. Refine the shared playground from that feedback before converting additional lessons.
3. Add a real project runtime for multi-file examples, rather than claiming the component prototype supports arbitrary projects.

References: [Angular JIT/AOT](https://angular.dev/tools/cli/aot-compiler), [createApplication](https://angular.dev/api/platform-browser/createApplication), [CodeMirror](https://codemirror.net/), [WebContainers browser support](https://webcontainers.io/guides/browser-support).


## Verification of the reference implementation

On 2026-10-17: 124 Angular tests and 3 generated-runtime tests passed. The runtime tests render the actual lesson source, click its controls, edit all three files and exercise error recovery. Host tests cover debouncing, pause/run/reset, tab state, message validation, replacing one selected occurrence and preserving selection through preview updates and undo. Production initial bundle remains 451.06 kB; the lesson chunk is 488.28 kB and the separate preview/compiler asset is 4.57 MB raw. npm audit reports zero vulnerabilities. Only the existing NgRx/BehaviorSubject stylesheet warnings remain.

After selection feedback, the editor uses a single native selection, without automatic occurrence marks or a second drawn selection layer. The font is set on the scroller so text and measurement inherit the same metrics. Automated selection tests pass; real pointer-drag verification is still pending because VS Code UI control was interrupted.

The reference preview and highlighted editor were inspected in VS Code's browser, including successful Angular startup. The complete responsive and keyboard acceptance matrix remains to be checked; automated DOM tests do not certify it.

Mobile follow-up on 2026-10-17: navigation icons now use `mat-icon` with the official self-hosted Material Icons font. Mobile dropdowns are anchored to the whole navbar, and editable text is at least 16px. Automatic text inflation is set to 100%; manual zoom stays available. Seven targeted navbar/editor tests and the production build pass (initial bundle approximately 467.3 kB). The font is served successfully on port 4200. Real mobile layout/focus verification is pending: browser control timed out, so these checks do not establish that every reported overflow/zoom case is resolved.
