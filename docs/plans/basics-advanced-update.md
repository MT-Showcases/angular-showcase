# Basics and Advanced learning experience update

Status: implementation in progress; shared learning foundation and Binding prototype prepared.

Prepared: 2026-10-16. Baseline: `0782efb` (`main`). No push was performed.

## 1. Product direction and scope

Build a coherent Angular learning journey for both newcomers and experienced developers, with progressive depth. Assume familiarity with HTML, CSS and elementary JavaScript; explain necessary TypeScript concepts where they first appear. Do not require React knowledge.

The current scope contains three Basics pages (Data Binding, Directives, Forms) and two Advanced pages (Signals, HTTP). Home and navigation are part of the learning entry experience. State Management and Examples remain separate categories and receive regression checks, not a content rewrite.

Improve the existing three Basics lessons first, then fill the missing foundations, then complete the two Advanced lessons. The expanded curriculum below is a proposal, not a description of existing functionality. Do not publish navigation cards for lessons that have not been delivered.

Keep Angular 22, the existing runtime, Material theming and port 4200. Dependency upgrades are not part of this content project. Preserve the distinction between Reactive Forms, Signals, RxJS and NgRx. Do not combine this work with a general zoneless or change-detection migration.

### Learning levels

Each lesson offers three levels on the same page:

1. **Understand**: outcome, prerequisites, a plain explanation and a minimal working demonstration.
2. **Try and inspect**: a guided action, the expected observation, state/output and matching code.
3. **Deepen**: tradeoffs, common errors, implementation details and optional framework comparisons.

The first level must be useful on its own. Experienced readers can jump directly to code or advanced topics through section links. No account, completion lock or persistent progress system is required.

Use a small shared glossary for terms such as component, template, binding, observable and dependency injection. Internal explanations must stand on their own; external documentation is supporting evidence, not required reading to finish the lesson.

## 2. Audit findings

This is a source review plus the prior visual checks of Home, Forms and Signals. Mobile risks in the legacy Binding, Directives and HTTP styles require browser confirmation during implementation; they are not reported here as measured overflow defects.

| Priority | Finding and evidence | Planned action |
| --- | --- | --- |
| P0 content | Home promises two-way binding (`src/app/home/home.ts:51`), but DataBinding imports only PageHeader and has no two-way example (`src/app/data-binding/data-binding.ts:26`). | Add a real editable example and explain property + event binding before `ngModel`. |
| P0 content | Home promises `@switch` and custom directives (`home.ts:59`); Directives contains neither. Its `[ngClass]` and `[ngStyle]` headings actually demonstrate `[class.active]` and `[style.color]` (`directives.html:52`, `:64`). | Separate built-in control flow, native bindings and actual directives; add the promised demonstrations. |
| P0 content | Home promises custom validators (`home.ts:66`); Forms uses only built-in Validators (`forms.ts:44`). | Add one useful, explained custom validator and keep card claims synchronized with delivered content. |
| P1 behavior | Forms adds a lowercase-only email regex with a maximum four-character TLD (`forms.ts:60`); the name field accepts ASCII letters only and surname accepts whitespace. | Remove arbitrary email restrictions; make human-name and whitespace rules explicit and appropriate for an Italian-facing demo. |
| P1 behavior | HTTP update/delete do not clear an earlier error (`http-example.ts:165`, `:189`). | Reset operation feedback consistently and test failure followed by success. |
| P1 inferred defect | HTTP inserts every created post using the returned API ID, tracks rows by it and updates/deletes by that same ID (`http-example.ts:141`, `:170`, `:194`; template `:108`). JSONPlaceholder mutations are simulated. | Separate POST response history from the GET resource list; do not turn non-persisted responses into editable remote resources. Prove repeated requests remain distinct. |
| P1 behavior | HTTP accepts whitespace-only input (`http-example.ts:130`) and uses alert/confirm for results and confirmation. | Validate normalized input and show request/result/error feedback in the lesson. |
| P1 content | HTTP starts with facade terminology and CREATE before GET; the only code example is GET. `loadPost` and `selectedPost` are not exposed in the template. | Start from request/response and GET; make GET-by-ID usable; provide corresponding examples for all taught operations. |
| P1 content | Signals has working demos but lacks a clear reading/writing model, reference-identity explanation and boundaries for effects. The effect log is instrumentation, not a recommended state-propagation pattern (`signals.ts:120`). | Explain `count()`, set/update/computed and immutable updates; identify effect instrumentation and teach when effects are appropriate. |
| P1 access | Directives jumps from h1 to h3 and does not expose toggle state; HTTP async status has no explicit announcement semantics. | Correct heading structure, control labels/states, live feedback and focus behavior. |
| P1 design | Binding, Directives and HTTP use legacy local colors, fixed spacing and custom controls. | Apply the existing Material theme and shared layout tokens; verify contrast and responsive behavior. |
| P1 architecture | Lessons are flat pages; ConceptCard and GuideStep are presentational and do not implement progressive disclosure. | Build one small common lesson contract and prove it on Binding before parallel page changes. |
| P2 shared | CodeBlock does not handle clipboard rejection (`components/code-block/code-block.ts:46`). | Add visible failure feedback and a manual-selection fallback. |
| P2 clarity | Binding intentionally breaks an image and contains an unused `any` helper; framework comparisons appear before Angular foundations are established. | Use meaningful, reversible examples; remove unused code; move comparisons to optional depth. |

P0 here means misleading educational content, not a production outage. The simulated-ID issue is a deduction from code and the API contract; it still needs a reproducible test, rather than being described as an observed browser failure.

## 3. Target curriculum

Preserve all five existing lesson URLs. Add explicit category landing pages at `/basics` and `/advanced`. They should explain the recommended path, prerequisites and the option to explore individual topics.

### Basics

| Order | Lesson / route | Minimum outcome | Optional depth |
| --- | --- | --- | --- |
| 1 | First component — `/basics/getting-started` (new) | Identify class, template, styles, selector and standalone imports; change a value and observe the result. | Project anatomy, first lifecycle/cleanup concepts, a short signal-reading primer where needed. |
| 2 | Data Binding — `/basics/data-binding` | Distinguish interpolation, DOM property/attribute binding, events and two-way binding; edit and reset a value. | `$event`, component state, common binding mistakes and limited performance guidance. |
| 3 | Control flow and directives — `/basics/directives` | Use `@if/@else`, `@for/track/@empty`, `@switch`, class/style binding and a small custom attribute directive. | Built-in blocks versus directives, identity and historical syntax. Keep legacy syntax clearly labelled. |
| 4 | Component communication — `/basics/components` (new) | Pass data to a child and handle an event from it, with visible parent/child state. | Inputs, outputs, two-way component models and ownership of state; projection as optional depth. |
| 5 | Pipes — `/basics/pipes` (new) | Format the same value with and without a pipe, including currency/date examples. | Parameters, purity and a small custom pipe; link async-pipe usage to HTTP. |
| 6 | Reactive Forms — `/basics/forms` | Understand control/group/value/validation; observe states, submit a valid payload and reset. | Typed/non-nullable forms, a custom validator, disabled fields and value versus raw value. |
| 7 | Services and DI — `/basics/services` (new) | Understand why behavior is extracted into a service and how a component receives it. | Provider scope and a minimal shared-service demonstration; bridge to HttpClient without assuming RxJS mastery. |
| 8 | Routing — `/basics/routing` (new) | Navigate between views, read a parameter and understand links/outlets/lazy-loaded pages. | Route state, fallback routes and teardown when leaving a page. Keep demo navigation inside the lesson sandbox. |

Teach routing through nested demonstration routes under its lesson, so trying navigation does not unexpectedly leave the learner's context. First demonstrate local state with ordinary fields or a short explained signal; do not require the full Advanced Signals lesson to understand Basics.

### Advanced

| Lesson | Entry requirements | Sequence and outcome |
| --- | --- | --- |
| Signals — existing URL | Components, events and collections. Forms is useful but not mandatory. | Read/write → derived state → immutable collections → a cart → effects as optional integration with imperative APIs. Distinguish invalidation from lazy recomputation. Explain dynamic dependencies and equality in the deeper level. |
| HTTP — existing URL | Services/DI, simple forms and elementary asynchronous concepts. | Request/response → Observable and subscription → GET list/detail → loading/empty/error/retry → POST → PUT/DELETE → cleanup and contracts. Make the exact request, response and resulting UI observable. |

Signals can remain in Advanced navigation while an introductory explanation is linked from Basics. Learning depth and navigation category need not be identical.

### HTTP simulation decision

Keep JSONPlaceholder as the clearly labelled online demonstration; do not add a backend in this project. Show a visible notice that mutations are simulated and reloading/refetching restores remote data. Do not imply durable persistence.

The GET list contains resources returned by GET. POST results appear in a separate request/response history, with a unique local operation identifier. They do not become PUT/DELETE targets merely because the fake service returned an ID. PUT/DELETE target existing fetched resources, update the local preview after success, and explain the difference between that preview and persistence. Keep current contracts simple rather than adding a second offline transport in the first release.

Tests use deterministic HTTP fixtures and simulated errors; real network availability is not a CI dependency. A fake API is not evidence of production persistence.

## 4. Shared learning and visual contract

Before page agents start, the coordinator delivers:

- A typed topic registry in `src/app/learning/` with stable topic ID, route, category, outcome, prerequisite IDs, next/relevant topic IDs and section anchors. No generic CMS or schema-driven page renderer.
- A small lesson shell under `src/app/components/` for outcome/prerequisites, section navigation and previous/next links. Keep each feature's state and demo logic in its feature folder.
- A standard disclosure composition using Material expansion panels and existing CodeBlock/ConceptCard/GuideStep. Native Material controls remain directly usable; do not introduce button/input wrappers.
- Always-visible minimal demos. Opening/closing explanations must not destroy demo state. Advanced content is opt-in, deep-linkable and usable by keyboard; direct section URLs reveal the requested disclosure and place focus predictably.
- Real headings, labels, focus styles, readable tokens, announced action results and a reset action with explicit scope. Avoid announcing every log entry or keystroke unnecessarily.
- Snippets labelled as complete examples or fragments, with needed imports/setup and behavior matching the visible demo. Critical examples should be exercised through actual demo interactions and compilation, not string-matching tests.
- A discreet optional area for exploratory floating-topic controls during lessons so they do not obscure form actions or distract from a guided task. Keep their existing behavior elsewhere.

Use the existing purple identity, public Material theming APIs and semantic tokens. Extend `src/styles/` only where a reusable token is actually missing. Do not use private Material selectors or `::ng-deep`.

Internal related-topic links are sufficient for the first release. Do not make the educational experience depend on external iframes or the current dynamic modal loader. A later cross-topic drawer must include focus management, state preservation and restoration, URL behavior and a verified component lifecycle; it is not a prerequisite for improving the five lessons.

Update the design-system catalog with the actual lesson/disclosure pattern and its keyboard/error/disabled states. Update README to distinguish delivered features from roadmap promises, and refresh conflicting documentation examples rather than preserving obsolete claims.

The registry must distinguish planned and published lessons. During waves 0–1, prerequisite, related-topic and next-step links resolve only to published destinations, including their anchors. Explain indispensable concepts inline or through the glossary until their lesson exists. The wave-1 gate covers the three improved Basics lessons and their available navigation; the complete prerequisite journey becomes mandatory after the missing foundations are integrated.

## 5. Execution sequence and worktree ownership

No worktrees or implementation changes are created by this plan. The baseline commit now allows ordinary independent branches/worktrees; the earlier uncommitted-baseline obstacle has been resolved.

Use at most three worker agents plus the coordinator concurrently. Select the available Codex agents at execution time; do not assume a model or concurrency level that the environment does not provide.

| Wave | Coordinator | Worker ownership |
| --- | --- | --- |
| 0 — foundation | Freeze topic/component contracts, lesson outline and acceptance scenarios; implement the shared shell/disclosure and one Binding prototype. Establish a reviewed common base. | Read-only content and accessibility review of the prototype if useful. |
| 1 — existing Basics | Own registry, Home/navbar, global tokens and cross-route integration. Accept a complete Basics slice before proceeding. | A: `data-binding/**`; B: `directives/**` and its local teaching directive; C: `forms/**` and local validators. Each owns its feature tests. |
| 2 — missing foundations | Integrate completed routes/category hubs and revise prerequisite/next links. | A: new getting-started + components lessons; B: new pipes + routing lessons and their nested demo route declaration; C: new services/DI lesson and its local demo service. |
| 3 — Advanced | Integrate prerequisites/navigation and assess the full beginner-to-advanced journey. | A: `signals/**`; B: `http-example/**` + `src/services/posts.service.ts` + service tests; C: independent read-only content/accessibility review and reproduction of edge cases. |
| 4 — acceptance | Own integration fixes, routed tests, documentation, full build/test/audit and browser verification on 4200. | Feature owners fix issues only in their assigned files; reviewer validates the corrected behavior. |

Coordinator-only files: app routes/config, Home, navbar, shared learning components, topic registry, global styles, package manifest/lockfile, design-system catalog, README and `app.routes.spec.ts`. Freeze those contracts before feature workers depend on them. A worker requesting a shared API change describes the need; the coordinator implements it once and propagates it to every active worktree.

Every worker receives: baseline SHA, owned paths, dependency contracts, lesson outline, required scenarios, non-goals and commands. Its handoff includes a summary, exact files, validation evidence and unresolved questions. Changes outside ownership require coordination first.

### Git and process protocol

1. At launch, verify `git status` and record the exact base SHA including approved shared foundations. Keep unrelated user changes separate.
2. Create one task branch and worktree per worker from the same reviewed base for that wave. Verify the source and required untracked files before agents edit anything; never assume dirty changes are inherited.
3. Give each worktree its own dependency directory and Angular/build cache. Share the package download cache if useful. The coordinator owns package and lockfile changes.
4. Keep 4200 for the integrated preview. Start worker preview servers only if needed, with explicit free task ports such as 4211/4212/4213.
5. Review and integrate one contribution at a time in dependency order. Use task commits when authorized for implementation; otherwise export task patches. The user's baseline-commit request does not by itself launch or authorize an entire future commit workflow.
6. Before integration, compare the worker base with current shared contracts; resolve conflicts explicitly. Do not use blanket ours/theirs resolutions or overwrite concurrent user changes.
7. After each wave, verify the integrated slice and establish the next common base. Do not start all waves against the original baseline.
8. Remove a worktree only after its changes are integrated or exported and verified. Do not force-remove an unreviewed dirty worktree. No push or publication is part of this plan.

## 6. Acceptance and test strategy

Baseline evidence from the previous verification: 54 tests in 14 files passed; production initial bundle 435.56 kB; npm audit reported zero vulnerabilities. Existing stylesheet warnings: NgRx concepts 11.63 kB and BehaviorSubject 15.61 kB, above the 10 kB warning threshold. These are historical baseline results, not tests rerun for this document.

### Required user scenarios

- A newcomer starts at Home/Basics, identifies prerequisites, follows the first lessons and reaches HTTP without an unexplained prerequisite gap.
- An experienced reader opens an existing direct URL, jumps to code/deeper content and returns to the demo with its state intact.
- Binding changes both input and output, explains the direction of the update and resets without deliberately requesting missing assets.
- Control flow covers every branch, changes a list, preserves identity when reordering, reaches an empty state and demonstrates the actual custom directive.
- Components demonstrate data down/events up; Pipes visibly changes formatting; Services demonstrates its actual sharing scope; Routing changes an internal view/parameter without losing the lesson shell.
- Forms explains its rules, handles realistic names and email, rejects whitespace-only required values, shows the submitted payload inline, and resets values plus interaction/submission state. Invalid submit remains disabled with a visible reason; do not teach an unreachable error path as the normal user flow.
- Signals preserves counter/cart behavior, handles item identity and empty/reset states, and explains effects without presenting them as the default mechanism for derived state.
- HTTP covers GET list/detail, empty and error recovery, every mutation's success/failure, repeated POST responses, a failed operation followed by a successful one, user cancellation, and leaving the route during a pending request. No stale callback should produce an alert after navigation.
- Clipboard success and rejection both provide understandable feedback.

### Verification gates

- Each feature has meaningful interaction tests; use Material harnesses where they expose relevant behavior. HTTP service tests verify method, URL, payload and errors with the Angular HTTP testing provider.
- Preserve existing routed regression tests for Users, NgRx and BehaviorSubject. The coordinator adds direct-link/category navigation coverage after integration.
- Check disclosure keyboard behavior, focus restoration, heading hierarchy, label/error associations and status announcements. Check contrast with computed colors; visual inspection alone is not a measured contrast result.
- Browser checks at 360, 768 and 1440 CSS pixels, plus 200% zoom. No page-level horizontal scrolling; code/table scrolling stays local, labelled and keyboard accessible. Primary controls stay reachable with floating controls and disclosures present.
- Production initial bundle remains below the 500 kB warning budget; retain the 1 MB error budget and 10/20 kB stylesheet thresholds. Keep new advanced content lazy-loaded and report any new warning separately from existing ones.
- Run the appropriate tests during feature work; run the full suite, production build and audit once on the completed integrated change, repeating only after relevant fixes.
- Verify one real read-only HTTP flow manually and separately from mocked tests. Report an unavailable external API as a network dependency failure, not a failing Angular lesson or proof of a working backend.

### Definition of done

Home/category promises match shipped lessons. The learning path works for both audiences. Every claimed demo is reachable and explained. Important failure states are observable and tested. Shared components and the catalog agree. No unrelated category rewrite, backend, live editor, AI tutor, account system or blanket framework migration has entered the scope.

## 7. Primary implementation references

- [Angular component anatomy](https://angular.dev/guide/components)
- [Two-way binding](https://angular.dev/guide/templates/two-way-binding)
- [Built-in control flow and tracking identity](https://angular.dev/guide/templates/control-flow)
- [Pipes](https://angular.dev/guide/templates/pipes)
- [Dependency injection](https://angular.dev/guide/di)
- [Typed Reactive Forms and reset semantics](https://angular.dev/guide/forms/typed-forms)
- [Signals and appropriate uses of effects](https://angular.dev/guide/signals/effect)
- [HTTP request behavior](https://angular.dev/guide/http/making-requests)
- [HTTP testing](https://angular.dev/guide/http/testing)
- [Angular Material theming](https://material.angular.dev/guide/theming)
- [JSONPlaceholder simulation contract](https://jsonplaceholder.typicode.com/)
- [Git worktrees](https://git-scm.com/docs/git-worktree), [applying patches](https://git-scm.com/docs/git-apply)

Confirm the exact API signatures against the installed Angular/Material version when implementing a new example. The goal is accurate teaching, not adoption of every newly available API.
