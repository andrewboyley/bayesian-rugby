## Context

See proposal.md - Why. This change builds on the auto-fit-view change (`openspec/changes/auto-fit-view`), which is implemented and committed but not archived. Today:

- `immediateAutoFit()` in `GraphViewer.svelte` calls `fitVisibleNodesImmediate(cameraCtx)`, which frames `graph.nodes()` with a single synchronous `camera.setState` (`graph-camera.ts:97`). The camera only animates on explicit gestures (`focusPrimaryNeighborhood`, `fitVisibleNodes`).
- The `clickNode` renderer handler sets `autoFit = false` before it calls `handleNodeClick`.
- `selectPrimaryNode` frames the neighborhood with an animated `focusPrimaryNeighborhood`.
- The camera `updated` handler unchecks auto fit on any update that is not self-caused (`isAutoFitCameraUpdate`). That flags pan and wheel zoom as manual gestures.
- The test controller exposes `setAutoFit`, `fitCount`, and `autoFit` in `snapshot()`.

## Goals / Non-Goals

**Goals:**
- While auto fit is checked, the fit always frames the visible active nodes: `[primaryNode, ...neighbors]` when a primary node is selected, all nodes otherwise.
- The camera animates to each fitted view (600 ms) instead of jumping. This includes the fit that follows a node selection and the refit that follows a cleared selection.
- Selecting a node keeps auto fit checked. Clearing the selection returns the fit to all nodes.
- Keep pan and wheel zoom unchecked auto fit. A gesture that starts mid-animation stops the in-flight fit and owns the camera.
- Keep auto fit off exactly as today: a node click still animates a neighborhood focus once.

**Non-Goals:**
- No change to the pan and wheel disable behavior and its gesture classification.
- No change to the double-click-node explicit focus gesture.
- No new settings-panel entry.

## Decisions

**D1 — A parameterized animated fit.**
Add `fitNodes(ctx, nodes)` to `graph-camera.ts`. It runs the existing `computeFocusState` over the given node set and animates the camera with `camera.animate(state, { duration: animationDurationMs })`, returning the promise. `fitNodesImmediate`/`fitVisibleNodesImmediate` stay as the immediate variants (one-line setState over the same bounds math), so their existing call sites keep their meaning.
- Alternative rejected: branching inside the fit on a selection accessor. The camera module stays pure; the component owns the selection state.

**D2 — The fit target comes from the selection state.**
`immediateAutoFit()` in the component computes the target: `primaryNode ? [primaryNode, ...graph.neighbors(primaryNode)] : graph.nodes()`. `primaryNode` is `$state` in the same closure as the auto-fit loop, so every tick reads the current selection.
- Alternative rejected: caching the target at click time. The layout moves nodes every frame; the target set must be re-read per tick.

**D3 — Node click no longer unchecks auto fit; the animation hides its own frames.**
Remove `autoFit = false` from the `clickNode` renderer handler. `immediateAutoFit()` sets `isAutoFitCameraUpdate = true` when it issues the animated fit and clears it when the promise of the newest animation settles. `animate` resolves on completion or when a newer fit (or `cancelAnimation`) interrupts it, and the loop restarts the animation every tick while nodes move, so only the newest animation may clear the flag. The pan and wheel gestures still produce un-suppressed camera updates and uncheck auto fit.
- Alternative rejected: adding a second suppression flag for selection. The selection uses the auto-fit path itself (D4), so one flag stays correct.

**D4 — `selectPrimaryNode` branches on auto fit.**
- Auto fit checked: set `focusedNode = node` (the `focusNodes` bookkeeping) and call `wakeAutoFit()`; the next tick animates the camera to frame `[node, ...neighbors]`.
- Auto fit unchecked: keep today's animated `focusPrimaryNeighborhood(cameraCtx, node)`.
Both paths keep `focusedNode` set, so `snapshot().focusedNode` and the label visibility rules behave as today.

**D5 — Selection clears wake the loop.**
`clearSelection` and the active-primary clear path in `handleNodeClick` call `wakeAutoFit()` when auto fit is checked, so the fit returns to all nodes without waiting for a layout event. `wakeAutoFit` already no-ops on an empty graph.

**D6 — doubleClickStage keeps enabling auto fit; its immediate fit now targets active nodes.**
The handler already calls `immediateAutoFit()`, which now uses D2's rule. With a primary node selected, the double click frames the neighborhood. This matches the rule that auto fit always frames the visible active nodes.

**D7 — Gestures cancel an in-flight auto-fit animation.**
`pointerdown` and `wheel` listeners on the graph container call `camera.cancelAnimation()` while auto fit is checked and an animation is active. The cancel resolves the fit promise (clearing the suppression flag via D3), and the gesture's own camera updates then uncheck auto fit as usual. Without this, the animation would fight the gesture every frame: Sigma's drag and wheel handlers move the camera with `camera.setState` and do not cancel a running animation by themselves.

## Risks / Trade-offs

[The node-selection suite runs with auto fit on by default, so click tests now exercise the animated neighborhood fit instead of the immediate one] → The camera still arrives at the same fitted state; only the arrival takes 600 ms. Tests that read the camera after a fit must wait past the animation: the settle waits in `graph-viewer.spec.ts` were extended to 800 ms. Verify every interaction with agent-browser before any Playwright run, per AGENTS.md. The one assertion that assumed the click unchecks auto fit lives in `graph-viewer.spec.ts` and is rewritten.

[Test calls to `setCamera` uncheck auto fit through the `updated` classifier] → That is the existing, intended gesture classification. Tests call `setCamera` only after fits settle, so no animation is in flight and the classifier sees an un-suppressed update.

[Repetitive animation restarts while the layout converges] → Each restart re-bases the easing on the current camera state, so the chase is smooth; once nodes stop, the last animation completes exactly at the fitted target. `fitCount` still counts one fit per tick, so the "at most one fit per frame" guarantee is unchanged.

## Migration Plan

Ship with the new fit rule behind the existing checkbox, which stays on by default. Rollback is restoring the selection-free target, the `autoFit = false` click handler, and `fitNodesImmediate`. There is no persisted state.

## Open Questions

None.