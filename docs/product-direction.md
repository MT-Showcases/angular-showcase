# Product direction: editable Angular playgrounds

Updated: 2026-10-17. This is the user's confirmed direction; the First Component lesson is the reference implementation.

## Lesson experience

1. **Interactive preview first.** The learner can use the rendered component immediately.
2. **Editable code directly below.** Syntax-highlighted TypeScript, HTML and CSS belong to the example and drive its actual preview. The main source is visible without opening an accordion.
3. **Readable teaching code.** Add concise Italian comments explaining key concepts, blank lines between logical blocks and multiline attributes/declarations. Do not compress examples to save vertical space.
4. **Short, formatted context.** Use meaningful headings, bold terms, code styling and semantic accent colors. Explain only what helps the current experiment. Use semantic `<strong>` for emphasis; selected keywords may use the shared primary accent. Mark API names, bindings, selectors and inline snippets with `<code>`, including inside dynamic prompts and takeaways. Keep prose emphasis and inline-code foreground/background styles centralized and based on public Material tokens. Use a contrast-appropriate accent on the branded page background; never communicate meaning through color alone. Inline code should remain visually distinct from ordinary bold text; syntax highlighting belongs to full examples.
5. **Optional depth.** Accordions can hold extra theory or secondary examples to reduce crowding. Changing tabs or explanations preserves the current experiment.
6. **Useful editing feedback.** Refresh after a short typing pause, show errors inline and provide run, pause and restore actions. Recompiling resets the component's runtime state; switching file tabs does not.
7. **Consistent icons.** Use Angular Material `mat-icon` for all site UI icons, with accessible labels on icon-only controls. Do not use emoji or other icon libraries as UI icons.
8. **Mobile sizing.** Keep editable text at least 16px, avoid automatic text inflation and keep menus within the viewport. Preserve manual pinch zoom and scroll code/file tabs inside their own panels.

## What is implemented

`/basics/getting-started` now uses the shared AngularPlayground component. Its preview precedes a CodeMirror editor with three virtual files. The former long introduction and code accordion have been replaced by a compact header, one prompt, three short concept cards and optional context.

Data Binding, Control Flow, Component Communication, Pipes, Reactive Forms, Services/DI and Routing now use the same compact layout and editable runtime. Their actual seed modules are exercised by generated-runtime interaction tests. Component Communication and Services/DI add per-example concept diagrams after the editable source. Communication shows input values and output events separately, with parent-owned state and clickable binding/child files. Services/DI shows named provider scopes, distinct service instances and labelled injection arrows. File nodes select the matching editor tab without restarting the preview. Diagrams explain the initial seed configuration, while edited providers can change runtime behavior. First Component, Data Binding, Control Flow, Pipes and Forms also provide concise schemas after the editor, linked to their actual source tabs. Schema descriptions follow the seed behavior, including presentation-only pipes and conditional form errors. Other lessons retain their existing demos.

## Runtime choice

- **Component prototype, delivered:** TypeScript transpilation and Angular JIT execute in a separate iframe, using the installed Angular version and the shared Material theme. The example's external HTML/CSS filenames are resolved from the editor. CodeMirror and the 4.90 MB raw compiler/runtime are loaded by the lesson/preview, not the host's initial bundle.
- **Project playground, next:** package installation and the Angular CLI build pipeline need a broader runtime. WebContainers is a candidate; evaluate browser support, startup cost and current usage/licensing terms before choosing it. The current runner supports local virtual files, but does not run the Angular CLI or install arbitrary packages.

The runner supports one default-exported root component plus local virtual TypeScript modules and their HTML/CSS resources, linked through relative imports. Supporting child components, custom pipes, directives and validators have separate editable tabs. Small child components keep short templates inline in their own TypeScript tab; longer or structurally complex templates use separate HTML files. Inline declarations remain supported. The bundled external imports are Angular core/common/forms and Material button, form-field and input modules. Direct input(), input.required() and output() class fields are supported by a narrow TypeScript AST bridge that supplies the metadata needed by Angular 22 JIT, preserving the real signal/emitter initializers. Literal aliases, aliased imports and input transforms are covered by runtime tests. The bridge depends on Angular-internal isSignal metadata; tests and an explicit major-version build guard protect upgrades. This does not provide model(), initializer query transforms or a complete ngc pipeline. Decorator inputs/outputs remain supported. A lazy Web Worker runs the TypeScript Language Service with the installed Angular declarations, providing syntax/semantic diagnostics and context completions without executing learner code. Its compiler and declaration assets are separate from the initial app bundle. Decorator-injected fields use strictPropertyInitialization=false. Angular template errors still come from runtime compilation; Angular template type checking and the full AOT transformation pipeline remain outside this runner. The editor includes inline diagnostics, a navigable problem list, bracket completion and folding. An opaque Material loading state covers the preview until the current authenticated render completes, including example switches, errors and retry. CSS is plain, self-contained CSS.

## Execution boundary

Learner source never executes in the showcase window or on the development server. The preview uses `sandbox="allow-scripts"` without same-origin privileges, a restrictive CSP and messages checked against the actual iframe window, instance channel and current revision. A fresh Angular application resets renderer/style caches on recompilation. Route destruction removes host listeners, editors and the iframe.

This isolation protects the host's DOM and origin data; it is not a resource-quota system for arbitrary hostile programs. A general project runtime needs its own resource/lifecycle design before broader rollout.

## Next steps

1. Finish real-device iOS/Android selection, long-press and virtual keyboard acceptance.
2. Validate the updated editor, Forms and Routing visually on desktop and narrow screens.
3. Add a real project runtime for multi-file examples, rather than claiming the component prototype supports arbitrary projects.

References: [Angular JIT/AOT](https://angular.dev/tools/cli/aot-compiler), [createApplication](https://angular.dev/api/platform-browser/createApplication), [CodeMirror](https://codemirror.net/), [WebContainers browser support](https://webcontainers.io/guides/browser-support).


## Verification of the reference implementation

Previous extension: 107 host tests in 24 files and 6 generated-runtime tests passed. Production initial bundle is 467.53 kB; the shared lazy editor chunk is 483.24 kB and the isolated compiler asset remains 4.57 MB raw. Only the existing stylesheet budget warnings remain. The first four lessons now share the editor chunk. [Browser and mobile evidence](verification/playground-mobile.md) distinguishes measured Chromium results from pending real-device checks. GitHub Actions validates locked installs, host/runtime tests and the production build; it does not gate Vercel's separate Git deployments.

On 2026-10-17: 124 Angular tests and 3 generated-runtime tests passed. The runtime tests render the actual lesson source, click its controls, edit all three files and exercise error recovery. Host tests cover debouncing, pause/run/reset, tab state, message validation, replacing one selected occurrence and preserving selection through preview updates and undo. Production initial bundle remains 451.06 kB; the lesson chunk is 488.28 kB and the separate preview/compiler asset is 4.57 MB raw. npm audit reports zero vulnerabilities. Only the existing NgRx/BehaviorSubject stylesheet warnings remain.

After selection feedback, the editor uses a single native selection, without automatic occurrence marks or a second drawn selection layer. The font is set on the scroller so text and measurement inherit the same metrics. Automated selection tests pass; real pointer-drag verification is still pending because VS Code UI control was interrupted.

The reference preview and highlighted editor were inspected in VS Code's browser, including successful Angular startup. The complete responsive and keyboard acceptance matrix remains to be checked; automated DOM tests do not certify it.

Mobile follow-up on 2026-10-17: navigation icons now use `mat-icon` with the official self-hosted Material Icons font. Mobile dropdowns are anchored to the whole navbar, and editable text is at least 16px. Automatic text inflation is set to 100%; manual zoom stays available. Seven targeted navbar/editor tests and the production build pass (initial bundle approximately 467.3 kB). The font is served successfully on port 4200. Real mobile layout/focus verification is pending: browser control timed out, so these checks do not establish that every reported overflow/zoom case is resolved.

## Focused examples — 2026-10-18

Control flow is split into independent @if, @for, @switch and attribute-directive examples. The directive explains selector, imports, host events, state, CSS class and aria-pressed in concise Italian comments. Component Communication starts with input() alone, then output() alone and a short combination. The host example picker retains each source draft, restores original source on reset and mounts only one iframe/editor set at a time. Runtime state restarts on an example change.

User-visible sources use modern input/output APIs; do not choose older syntax merely to fit runner limitations. The runtime remains a bounded component runner rather than a full project compiler.

Verification: 108 host tests across 25 files and 13 generated-runtime tests pass. The initializer bridge also passes a standalone TypeScript check. Production initial bundle remains 467.53 kB. Browser checks confirmed the independent @if/@for previews, input() startup and actual output() message delivery; real-device selection/keyboard acceptance remains separate.


## Material preview and lesson polish — 2026-10-18

The isolated preview compiles the same public Material theme as the host and supports real `@angular/material/button` imports, including in inline child components. All editable lesson buttons use Material directives; local button skins were removed. The focused four-lesson review removed CSS unrelated to individual examples, aligned binding input colors/shapes to theme tokens, improved teaching-code line breaks and corrected the supported-runtime explanation. Interactions and existing reset controls are unchanged.

The correction diff was reviewed by the coordinating Codex session after a bounded DeepSeek audit and edit. Native browser control could not start (Sky native pipe startup failure; no available browser surface), so visual acceptance of this revision remains pending. Real-device iOS/Android selection and virtual-keyboard acceptance remain pending as well.

Verification for this revision: 108 host tests and 14 generated-runtime tests passed; standalone playground type checking and production build passed. Initial bundle remains 467.53 kB; the two pre-existing stylesheet budget warnings remain.


## Shared prose typography — 2026-10-18

The first four lessons now share semantic emphasis and inline-code styles. Use `lesson-prose` for prose, ordinary `<strong>` for neutral emphasis, `lesson-emphasis` for selected primary accents and `<code>` for APIs/bindings/snippets. `lesson-prose--on-brand` uses a contrasting Material container pair over the branded page background. Inline styles exclude preformatted code blocks and do not change the editor or iframe.

Dynamic example prompts/takeaways use LessonInline: only `**keyword**` and backtick-delimited code are recognized; plain strings, whitespace and HTML-looking text remain literal. Nested formatting and HTML interpretation are intentionally unsupported.

Verification: 111 host tests and 14 runtime tests passed, including three renderer tests for safe text, updates and delimiter behavior. Strict playground type checking and production build passed; initial bundle 468.29 kB. Static theme contrast checks passed. Browser control remains unavailable, so visual and real-device acceptance remain pending.

## Routing playground

Routing uses three independent editable examples: navigation, reactive route parameters and a last-position wildcard with recovery. Component modules, route configuration and application configuration are separate virtual files. The preview runs the real Angular router against a per-application in-memory location strategy. This path is displayed inside the demo; it deliberately does not change the host page URL or browser history. A local application uses its browser location instead. Recompiling/resetting creates a fresh application and resets navigation. Conventional virtual `app.config.ts` supplies `appConfig.providers`; runtime-owned location and error handling remain authoritative inside the isolated preview.

## Advanced lessons

Signals follows the same editable lesson structure as Basics: independent writable-state, computed-value, imperative-effect and immutable-cart examples, with concise Italian comments and source-linked schemas after the editor. The title effect operates only inside the preview document and includes opt-in and cleanup; derived values use computed rather than effects that copy state. The existing /advanced/signals URL remains unchanged. HTTP/services uses four independent editable projects for GET lists, detail/error handling, POST and PUT/DELETE. Each project includes its own service and application config. Actual HttpClient calls reach JSONPlaceholder from the sandbox; the preview permits connections to that host only. No automatic requests run at startup. Loading/error/empty states, explicit cancellation, reset/destroy teardown and simulated nonpersistent writes are part of the teaching flow. Transport-stubbed integration tests exercise the real HttpClient and editable seeds without public-network dependencies.

## Category entry pages

Every dropdown has a dedicated overview: Basics, Advanced, State and Examples. These pages provide concise orientation, a recommended starting point and resource cards that explain the learning outcome. Basics exposes progressive phase filters; the shorter categories avoid unnecessary filtering. Published lesson data comes from TOPICS, while section metadata adds the State/Examples resources and navigation context. Overview routes and all existing lesson URLs remain stable; no completion tracking, time estimates or unpublished lesson links are implied.

## State curriculum

The state path progresses from RxJS foundations to BehaviorSubject and NgRx Store. RxJS introduces independent cold subscriptions, real filter/map outputs and explicit interval completion/cancellation. Use the same preview → editable source → linked diagram structure throughout, preserving colorful role panels with paired Material tokens. All three lessons use this shared structure; SignalStore and additional Users examples remain separate future work.

BehaviorSubject now uses three independent editable projects: late subscribers compared with Subject, an immutable counter with a derived stream and bounded history, and a root-scoped profile service read by two consumers. AsyncPipe owns view subscriptions; `.value` is explained as a synchronous snapshot for creating the next state. Child components and service have separate editable files and source-linked schemas.

NgRx Store has two isolated editable projects: counter and Todo. Each owns its `provideStore` configuration, actions, pure reducer and selectors; `selectSignal` connects Store selectors to Angular signals. Shared educational DevTools live inside each preview, alongside the demo on wide screens and below it on narrow screens. A real meta-reducer records bounded action history, payloads and immutable before/after snapshots outside domain state. The inspector offers Material tabs for the selected action, current live root state and actual changed fields. Inspecting history does not restore state; clearing history leaves live Store data intact, and domain resets remain recorded actions. Journal and inspector sources have separate editable tabs. Todo ids remain deterministic and filters belong to Store; preview reruns recreate their own state. The obsolete host-global store stays removed. Effects, SignalStore and time travel remain separate future work.
