## Context

See proposal.md for motivation. The feature lives entirely inside `GraphViewer.svelte` and `graph-camera.ts`.

- The viewer footer (`GraphViewer.svelte:891-893`) is a flex row containing the `nodes N · edges N` count. The checkbox joins this row.
- Today, fit happens once: `doubleClickStage` (`GraphViewer.svelte:738-742`) calls `centerEmptyGraph` for an empty graph or `fitVisibleNodes` for a populated one, which animates the camera for `animationDurationMs` (600 ms).
- All camera math lives in `graph-camera.ts`. `fitVisibleNodes` = `focusNodes(graph.nodes(), null)`: a single O(V) pass that expands each node bounds by its size, normalizes via the renderer, multiplies span by `ratioFactor` (padding), and falls back to `radiusOneMinimumSpan` for a single node.
- The renderer runs with `autoRescale: false` (renderer settings in `GraphViewer.svelte`), so sigma does not re-frame content as the graph changes. The app's own bounds math must do the framing. Under sigma's default `autoRescale: true`, pinning the camera to `{x: 0.5, y: 0.5, ratio: 1}` is an O(1) whole-graph fit; that shortcut does not apply here, and this design does not depend on it.
- The FA2 layout runs inside a Web Worker (`graphology-layout-forceatlas2/worker`). The worker streams position updates by writing `x`/`y` attributes back into the graph (`updateEachNodeAttributes`) every tick, so node positions mutate asynchronously without any app-level `requestAnimationFrame`.
- The camera already emits `updated`, and the component subscribes to it for grid redraws (`GraphViewer.svelte:424`).
- Sigma contributes the interaction events already wired here: `clickNode`, `doubleClickNode`, `clickStage` (`clearSelection`), `doubleClickStage`. There is no movement/wheel listener today.
- `GraphViewerControls.svelte:232` shows the established checkbox idiom: `<input type="checkbox" class="size-4 accent-ink">` wrapped in a `text-caption` label.

## Goals / Non-Goals

**Goals:**
- Fit the camera to all nodes currently in the graph while the checkbox is on, tracking layout and node additions live.
- Zero per-frame cost when the graph is stable, and at most one refit per animation frame while it changes (see specs, "Auto-fit does no unnecessary work").
- Detect pan, wheel zoom, and node click as manual actions that switch the checkbox off without fighting the user's camera state.
- Reuse `focusGraphBounds` so the fit matches the existing framing math (padding, aspect, single-node minimum span).
- Verify every interaction with agent-browser before any Playwright test is written.

**Non-Goals:**
- No animation easing for the auto-fit loop; it sets the camera directly each frame.
- No new settings-panel entry; the checkbox lives in the viewer footer only.
- No fitting to a subset (selected nodes, neighborhoods). Auto-fit always frames all nodes.
- No new dependencies, no dataset changes, no new unit-test runner; verification is agent-browser plus the existing Playwright suites.

## Decisions

**D1 — Event-driven dirty flag plus a suspendable requestAnimationFrame loop.**
Graph events (`nodeAdded`, `nodeDropped`, `edgeAdded`, `edgeDropped`, `nodeAttributesUpdated`, `edgeAttributesUpdated`, `eachNodeAttributesUpdated`, `eachEdgeAttributesUpdated`) set a `dirty` flag. The batch events carry `hints.attributes`, so the handler can wake only when `x` or `y` changed; the per-node events cover a worker that writes positions one node at a time. A `requestAnimationFrame` loop runs only while the checkbox is checked: when `dirty` is set it recomputes the fit (O(V)), sets the camera, and clears `dirty`. When `dirty` is clear it defers to the next frame. When the flag stays clear across frames it suspends the loop entirely and graph events wake it. Stable graph = zero ticks. Layout or auto-add mutating every frame = exactly one refit per frame.
- Alternative rejected: refit inside `camera.updated` or `sigma.afterRender`. That couples fitting to rendering and would thrash during pure camera animations.
- Alternative rejected: refit on a fixed `setInterval`. It wastes ticks when stable and can double-fit within one frame; the dirty flag is strictly cheaper.

**D2 — Immediate, non-animated camera set.**
`camera.animate` (600 ms) cannot keep up with a layout that moves every frame; queued animations lag and multiply. Add an immediate path in `graph-camera.ts` that computes the same `focusGraphBounds` state as today and applies it with `camera.setState`. Refactor `focusNodes` so the bounds computation is one pure function used by both the animated path (existing focus interactions) and the immediate path (auto-fit). Guard cases: zero nodes in the graph produces no state change at all; a single node uses the existing `radiusOneMinimumSpan` fallback. `camera.setState` emits no `updated` event when the state is unchanged, so re-applying an identical fit costs nothing and idle frames stay quiet.
- Alternative rejected: clamping ratio each frame with custom math. Reusing the validated bounds function keeps auto-fit framing identical to the double-click fit users already know.

**D3 — Manual gestures detected on the camera `updated` event, with a self-caused suppression flag, plus an explicit node-click disable.**
Every manual camera gesture (drag pan, wheel zoom) converges on `camera.updated`, because sigma's mouse captor drives the camera through the same public API (`setState` for drag, `animate` for wheel). The loop sets `isAutoFitCameraUpdate = true` before its `setState` and clears it after; the `updated` handler treats any `updated` that is not self-caused, while auto-fit is on, as a user gesture and switches the checkbox off, leaving the camera exactly where the user put it. `clickNode` disables explicitly, because re-clicking the already-focused node may not move the camera and would otherwise miss the `updated` signal. `clickStage` does not disable (an empty-canvas click only clears selection, and `doubleClickStage` needs to enable afterwards).
- Alternative rejected: disabling from interaction events such as `downStage` and `wheelStage`. A `downStage` fires on every mousedown on the stage, including the click that begins an empty-canvas double-click, which the spec must leave alone so that `doubleClickStage` can enable. Event names also drift across sigma versions; the camera event is the single convergent signal, and the suppression flag makes the classification exact.

**D4 — Enable on double-click on empty canvas, in the existing handler.**
`doubleClickStage` currently fits once. It now sets the checkbox on (which starts the loop) and performs one immediate fit so the change is visible at once (keeping the `centerEmptyGraph` path when the graph is empty, per the existing behavior).
- Alternative rejected: a separate `doubleClickStage` listener. Modifying the existing handler keeps one source of truth for the fit-on-double-click behavior.

**D5 — Footer checkbox with the existing control idiom; local rune state.**
`let autoFit = $state(true)`. The footer gains a checkbox with label `auto fit` left of the count, styled exactly like the settings checkboxes (`size-4 accent-ink`, `text-caption`). The loop, dirty tracking, and gesture handler live in the component alongside the renderer lifecycle; `graph-camera.ts` stays a pure module.

**D6 — Test controller surface and a fit counter.**
`rugbyGraphSelectionTest.snapshot()` gains `autoFit: boolean` and a `fitCount` that increments on every actual refit; the controller also gains `setAutoFit(value)`. `rugbyGraphProjectionTest` exposes the same `setAutoFit` handle (and `autoFit` in its snapshot) because the projection harness exercises the camera heavily and its tests must be able to pin the manual-camera state.

**D7 — Existing camera tests may need expectation updates.**
`graph-projection.spec.ts` has double-click-canvas tests whose assertions assume an idle camera after the double-click (e.g. "double-clicking the canvas fits visible nodes"). With auto-fit on by default, the fit persists and may shift the settled camera. Each affected scenario gets re-verified in agent-browser and its assertion updated to the intended post-double-click state, or the test pins `setAutoFit(false)` first if its purpose is the manual one-shot fit.

## Risks / Trade-offs

[Per-frame `camera.setState` while the layout runs also triggers the existing `camera.updated` → grid redraw path, so the background grid recomputes once per frame during layout] → The grid redraw is already rAF-debounced in the component; per-frame grid updates during an actively moving layout are acceptable and visually imperceptible. If profiling shows a problem, gate the grid redraw on user gestures instead of all camera updates.

[Per-frame refit during layout can look jittery because the layout iterates] → The refit uses the same snap camera state as the double-click fit, and the layout converges smoothly; accept while verifying, with smoothing as a follow-up only if agent-browser shows objectionable motion.

[Wheel zoom disable depends on the camera `updated` event; an untrusted synthetic `WheelEvent` is ignored by Sigma, so browser tests must use a trusted wheel or a camera change] → The captor animates wheel zoom, so the disable fires on the first animation tick. agent-browser has no wheel action; verify the disable path by driving a camera change through the controller (exercises the exact `updated` classification), and cover the real wheel in Playwright with `page.mouse.wheel` (trusted input).

[Enabled by default changes the settled camera on load, which the projection/selection suites assert in places] → Handle per D7: agent-browser verification first, then targeted expectation updates, keeping every changed assertion tied to a spec scenario.

## Migration Plan

Ship with the checkbox on by default. Rollback is a one-line flip of the default rune to `false` plus removal of the checkbox, with no data or config migration. There is no persisted state: the checkbox resets to the default on every page load.

## Open Questions

None. The only near-unknown is whether a viewport resize while auto-fit is on should refit immediately; the design treats it as ordinary graph/viewport change (mark the loop dirty on the existing resize path), which does not alter the spec, the approach, or the task breakdown.