# Playground verification — 2026-10-17

## Published baseline

Target: https://angular-showcase.micheletornello.com/basics/getting-started, commit `b6bdf7b`.
Checked through VS Code's integrated Chromium browser and its responsive device toolbar.

| Viewport | Document scroll width | Result |
| --- | --- | --- |
| 320 px | 320 px | No horizontal page overflow; open menu ends at x=312 |
| 360 px | 360 px | Scale 1; editor computed font size 16px |
| 768 px | 768 px | Scale 1 |
| 1440 px | 1440 px | Scale 1 |

At 360px the open Basics menu spans x=8–352. Material navigation icons and arrows were visually inspected.
Keyboard selection replaced one identifier; Command-Z restored it; Escape then Tab moved focus from the editor to Run.
The native accessibility `selectText` action did not reliably target code, and a drag in touch emulation behaved as touch interaction. These are not passing pointer-selection checks. The example was restored after testing.

## Updated playground

- Preview height follows content, bounded to 240–680px. The iframe remains mounted when code or file tabs change.
- Data Binding was exercised in the actual local browser: editing the event input updated the greeting, read-only copy and ngModel input. At 360px document scroll width was 360px and the preview adapted to 514px.
- Runtime tests execute all four real lesson seed modules with Angular JIT. They verify state synchronization, escaped interpolation, property binding, resets, stable list DOM identity, duplicate labels, empty lists, every switch branch, directive class changes, parent/child events, vote limits and pause.
- Previous host-only demo tests were replaced by host integration and executable-source tests, so test counts are not directly comparable with the previous layout.
- Host tests verify authentication and bounds for resize messages, retained editor selection, undo, tabs, debounce, errors and resets.
- Recompilation adds unique component host metadata to prevent Angular NG0912 ID-collision warnings.

## Remaining real-device acceptance

Desktop Chromium emulation does not certify iOS/Android virtual keyboards, long-press selection handles, orientation changes with the keyboard open or assistive technology. Verify these on actual phones before marking mobile acceptance complete. Manual pinch zoom remains enabled.
