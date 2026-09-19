## 1. Ring overlay component

- [x] 1.1 Create `src/lib/components/SelectionRings.svelte`: a pointer-events-none, absolutely positioned overlay containing two SVG circle rings, each with `fill: none`, hairline `stroke-width: 1`, `stroke-dasharray` gaps, and a CSS `ring-spin` keyframe animation (opposite directions, staggered durations and phases).
- [x] 1.2 Give the component `GraphGrid`-shaped props: a `getRingState()` callback returning `{ color, center, radiusPx }` (or `null` when hidden) and a `revision` counter; apply center as a wrapper transform and circle radius/color per ring factor.
- [x] 1.3 Define the ring styling constants (ring radius factors, stroke width, dash pattern, spin durations) as module constants in the component file.

## 2. GraphViewer wiring

- [x] 2.1 Add a `getRingState()` reader in the `GraphViewer.svelte` closure that returns `null` when `primaryNode` is unset, otherwise the primary node's `color` attribute, its viewport center via `renderer.graphToViewport`, and each ring's pixel radius via the projected `x + size * factor` distance.
- [x] 2.2 Mount `SelectionRings` inside the sigma `container` div and a rAF-debounced `scheduleRingsSync()` (mirroring `scheduleGridRedraw`) that bumps the `revision` prop.
- [x] 2.3 Invoke `scheduleRingsSync()` from the selection mutators (`selectPrimaryNode`, `handleNodeClick` clear/replace paths, `clearSelection`) so rings appear, retarget, and disappear with the selection.
- [x] 2.4 Invoke `scheduleRingsSync()` from the existing camera `updated` handler and the node-attribute listeners that fire during FA2 layout, so rings track camera motion and node movement (reuse the `wakeAutoFit` subscription hooks or call the sync from the same events).
- [x] 2.5 Extend `rugbyGraphSelectionTest.snapshot()` with `rings: { visible: boolean; color: string | null }` per design D5.

## 3. Verification

- [x] 3.1 Manually verify every spec scenario with agent-browser (`/?test=selection`): rings appear on primary selection, persist with a pair, clear on deselect/empty-space click, match the primary node color, track camera and layout motion, and never block clicks/hovers/drags.
- [x] 3.2 Extend `tests/specifications/node-selection.spec.ts` with rings scenarios asserting the controller `rings` datum and the on-screen overlay (color and visibility) — only after agent-browser confirms the behavior.
- [x] 3.3 Run `just verify` (type checks, Oxlint, Oxfmt, production build) and `just performance` per AGENTS.md for a rendering change; confirm the rings do not cause per-frame layout thrash.
- [x] 3.4 Refresh the `ccc`/code search index after the code change, per the project's code-intelligence workflow.