# Project instructions

## Product direction

- Build an Italian-language Angular playground with progressive depth for beginners and experienced developers.
- Put a useful interaction at the center of each lesson. Keep the initial explanation short and adjacent to the action it explains.
- Show the effect of a change immediately: input, state, output or relevant code. Opening an accordion alone is not a learning interaction.
- Put each example’s editable, syntax-highlighted source directly below its interactive preview. Keep the main code visible; use accordions for optional depth or secondary examples.
- Runnable examples must include concise comments explaining key decisions and blank lines between logical blocks. Use multiline formatting for attributes and style declarations; avoid compressed teaching code.
- Reveal theory, prerequisites and glossary when useful; avoid repeating the same introductory scaffolding on every page.
- Preserve demo state while switching explanations. Support keyboard use, labels, feedback, reset and narrow viewports.
- Use the First Component lesson as the reference for the new playground experience before extending it across the curriculum.
- See `docs/product-direction.md` for open design decisions and the next steps. Earlier implementation plans describe history, not a mandate to retain the current layout.

## Working process

- Use one agent by default. Keep parallel work bounded and explicitly authorized; do not automatically launch another multi-agent wave.
- Keep tasks and tool output focused. Avoid copying the entire conversation or rereading large documents when a small contract is sufficient.
- The integrated preview uses port 4200. Check existing listeners before starting another server.
- Make reviewable changes. Report actual verification and outstanding checks separately. Do not claim visual acceptance from unit tests alone.
- Do not push or publish without user instruction. Preserve unrelated user edits.

## Worktree hygiene

- Inspect `git worktree list` at the start and end of work involving extra worktrees.
- Create a worktree only for an active, named task with an owner and exclusive file scope.
- Before removing one, verify that its agent/process has stopped, its tracked and untracked changes are saved, and its contribution is integrated or safely exported.
- For cherry-picked or copied work, compare the actual feature paths or patches; differing commit hashes alone do not mean the work is missing.
- Inspect ignored files too. Remove disposable dependency/build copies with their retired worktree; preserve unknown files and unfinished work.
- Use `git worktree remove` without force. Investigate a refusal instead of bypassing it. Prune stale metadata after cleanup.
- Retire finished worktrees promptly. Keep branches when useful for recovery; deleting a worktree does not require deleting its branch.

## Implementation conventions

- Implementation identifiers, internal comments and technical docs are English. Product text and comments inside user-visible teaching code are Italian.
- Use standalone Angular components and existing public Angular Material APIs and design tokens. Read the relevant `.github/copilot-instructions/` reference for technical changes.
- Use Angular Material `mat-icon` for all product UI icons. Do not introduce emoji, other icon libraries or hand-drawn SVG icons as UI icons. Give icon-only controls an accessible label; hide decorative icons from assistive technology.
- Keep feature state local and shared navigation/configuration coordinated. Preserve established lesson URLs.
- Test meaningful behavior changed by the task. Documentation-only changes do not require an application test run.
- Keep JSONPlaceholder's simulated writes explicit; never present them as persisted resources.
