# Angular Showcase

An Italian-language Angular 22 learning site for newcomers and experienced developers. Lessons put a useful interaction first, with concise context and optional deeper discussion. The UI uses Angular Material and the project's purple theme.

Project workflow rules live in [AGENTS.md](AGENTS.md). The current [product direction](docs/product-direction.md) puts a live preview first and editable, commented code directly below it. First Component, Data Binding, Control Flow and Component Communication use the shared playground. Control Flow presents independent `@if`, `@for`, `@switch` and attribute-directive examples; Component Communication separates input, output and their combination. Switching examples retains source drafts within the page and mounts only one preview at a time.

## Learning paths

Start at `/basics` and follow the suggested order, or open a lesson directly:

| Basics | Route |
| --- | --- |
| First component: class, template, styles and standalone imports | `/basics/getting-started` |
| Interpolation, property/attribute, events and two-way binding | `/basics/data-binding` |
| Control flow, stable list identity and a custom directive | `/basics/directives` |
| Component inputs, outputs and ownership of state | `/basics/components` |
| Built-in formatting and a custom pure pipe | `/basics/pipes` |
| Typed Reactive Forms, validation and reset semantics | `/basics/forms` |
| Services, injection and provider scopes | `/basics/services` |
| Nested navigation, parameters, queries and local fallback | `/basics/routing` |

The `/advanced` path covers Signals (`/advanced/signals`) and HTTP (`/advanced/http`). Separate examples for NgRx, BehaviorSubject and users retain their existing URLs.

The first four Basics lessons have real Angular previews and editable TypeScript/HTML/CSS directly below them. The remaining lessons currently have an always-mounted demo, `#code` and `#deepen` expansion panels, prerequisites, a glossary and previous/next navigation. Section links preserve nested routes and query parameters. Floating exploration controls are opt-in on lesson pages. The component runner supports one default-exported root, inline child components/directives in the same TypeScript module and bundled Angular core/common/forms. It supports direct `input()`, `input.required()` and `output()` fields through a narrow Angular 22 JIT metadata bridge. The introductory examples use these APIs; decorators remain supported. Inline literal aliases and input transforms are covered by executable tests. This bridge uses Angular-internal signal metadata and must be reviewed on upgrades; the build rejects an unreviewed Angular major version. `model()`, initializer queries, indirect initializer factories and full ngc transforms are not implemented. Preview height follows content within bounds; full project editing and package installation remain future work. External documentation links provide optional supporting material.

### HTTP demonstration

The online API is JSONPlaceholder. Reads use the real public service; writes are simulated and are not persisted. POST responses appear in separate history with unique local operation IDs, even if the API returns the same resource ID repeatedly. PUT and DELETE update only the preview of fetched resources. A new GET restores remote data. Do not submit personal information.

The demo exposes request/response, loading, errors, retry, inline delete confirmation, cancellation and component teardown. Tests use Angular's HTTP testing provider and do not depend on the external API being available.

## Run locally

Use Node **24.22.0** (`.nvmrc`) and npm **12.2.0** (`packageManager`). Runtime selection is scoped to this repository; a global replacement is unnecessary.

```bash
nvm use
npx --yes npm@12.2.0 ci
npm start
```

Open [localhost:4200](http://localhost:4200). The integrated preview reloads as source files change.

```bash
npm test -- --watch=false
npm run build
npm audit
```

`npm start`, `npm run build` and `npm test` type-check and generate the isolated playground runtime first. Use `npm run playground:check` for its standalone strict TypeScript check. `npm test -- --watch=false` also runs the generated runtime tests after the Angular suite. Use `npm run playground:test` to verify the runtime on its own. Direct `ng` commands bypass npm lifecycle hooks; run `npm run playground:build` first when using them. Generated preview assets are ignored by Git and included in production build assets.

The app uses Angular/Material 22.2.3, NgRx 22, TypeScript 6.0.x and Vitest 5. Existing components retain Angular 22's explicit `ChangeDetectionStrategy.Eager`; this project does not perform a blanket change-detection migration. npm's version-pinned `allowScripts` entries allow the required native build dependencies.

GitHub Actions runs locked dependency installation, the Angular suite, the generated-runtime interaction tests and a production build on pushes to `main` and pull requests. It uses the Node/npm versions above, pinned action commits and read-only repository permissions. Vercel Git integration deploys independently; this workflow does not gate or deploy production.

Production warning budgets remain 500 kB for the initial bundle and 10 kB for each component stylesheet. The existing NgRx concepts and BehaviorSubject styles exceed their warning threshold; these warnings are separate from functional failures. Do not raise budgets to hide regressions.

## Architecture and design system

- `src/app/learning/topics.ts` is the typed navigation registry. Expose only published lessons whose routes have been integrated.
- `src/app/components/lesson-shell/` owns learning context and navigation; feature folders own demo state.
- `src/app/components/lesson-disclosure/` wraps public Material expansion APIs, supports fragment navigation and retains projected content when collapsed.
- `src/styles/` owns the theme, semantic colors, spacing and surface tokens. Use native Material controls directly, without private Material selectors or `::ng-deep` customizations.
- `/design-system` is the internal catalog, including the progressive lesson pattern and control states.
- `src/services/` contains shared data-access services; intentionally local teaching services stay beside their lesson.

State Management and Examples receive regression coverage but are not part of the Basics/Advanced content rewrite. Keep Reactive Forms, Signals, RxJS and NgRx distinct in explanations.

## Contributing

Implementation identifiers, internal comments, technical documentation and commit messages are English. Product text and comments in user-visible examples are Italian. Use standalone components, explicit types and meaningful interaction tests. Keep snippets labelled as complete examples or fragments, with necessary imports/setup.

Read the [project instructions](.github/copilot-instructions.md), [styling conventions](.github/copilot-instructions/styling-conventions.md), [component guide](.github/copilot-instructions/reusable-components.md) and [implementation plan](docs/plans/basics-advanced-update.md).

For parallel development, use a separate branch/worktree, dependency directory and Angular cache for each worker. Assign exclusive feature ownership. The coordinator owns shared components, routes, registry, global styles and dependency files, integrates one contribution at a time and verifies each wave before starting the next. Keep port 4200 for the integrated preview. A worktree separates edits; it does not give an AI agent a separate usage allowance.

## Future work

Search, related-topic drawers, full project IDEs, progress persistence and AI tutoring remain future possibilities. A component editor is available in the first four Basics lessons. They are not prerequisites for the current lessons and are not advertised as delivered functionality.

Licensed under [MIT](LICENSE).
