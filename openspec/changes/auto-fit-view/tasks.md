## 1. Camera helper

- [x] 1.1 In `src/lib/graph/graph-camera.ts`, refactor `focusNodes` so the bounds-to-state computation is a single pure function shared by the animated path (existing focus interactions) and a new immediate path.
- [x] 1.2 Add an immediate fit (`camera.setState`, no animation) that reuses the shared bounds function, with the same `ratioFactor` padding and the `radiusOneMinimumSpan` fallback for a single node.
- [x] 1.3 Guard the immediate fit: zero nodes in the graph produces no camera change.

## 2. Viewer wiring

- [x] 2.1 Add `let autoFit = $state(true)` next to `nodeCount`/`edgeCount` in `GraphViewer.svelte`.
- [x] 2.2 Add the `auto fit` checkbox to the viewer footer, left of the `nodes N · edges N` count, styled like the settings checkboxes (`size-4 accent-ink`, `text-caption` label), toggling `autoFit`.
- [x] 2.3 Track a `dirty` flag from graph events (`nodeAdded`, `nodeDropped`, `edgeAdded`, `edgeDropped`, `nodeAttributesUpdated`, `edgeAttributesUpdated`, `eachNodeAttributesUpdated`, `eachEdgeAttributesUpdated`), waking on position (`x`/`y`) or structural changes.
- [x] 2.4 Implement the auto-fit loop: while `autoFit`, a `requestAnimationFrame` loop refits at most once per frame when `dirty`, suspends when the flag stays clear, and is woken by graph events.
- [x] 2.5 Wire the loop: mark the camera update self-caused around each `setState`, and in the camera `updated` handler switch `autoFit` off for any update that is not self-caused (covers pan and wheel zoom). An unchanged `setState` emits no event, so re-applying the same fit is quiet.
- [x] 2.6 Disable `autoFit` explicitly in the `clickNode` handler, before the existing selection logic.
- [x] 2.7 Change the `doubleClickStage` handler: check `autoFit`, keep the `centerEmptyGraph` path when the graph is empty, and perform one immediate fit so the change is visible at once.
- [x] 2.8 Mark the loop dirty on the existing viewport-resize path so a panel resize refits when `autoFit` is on.

## 3. Test controller

- [x] 3.1 Add `autoFit: boolean` and `fitCount` to `SelectionSnapshot` and to the `snapshot()` output.
- [x] 3.2 Add `setAutoFit(value)` and a fit-counter reset to `rugbyGraphSelectionTest`.
- [x] 3.3 Expose `autoFit` and `setAutoFit` on `rugbyGraphProjectionTest` so the projection suite can pin manual-camera state.

## 4. Verify with agent-browser

- [x] 4.1 Load `/?test=selection` and confirm the checkbox is checked by default and `snapshot().autoFit` is `true`.
- [x] 4.2 Add nodes (auto-add and `clickNode`) and confirm the camera keeps fitting to the growing bounds and `fitCount` increments.
- [x] 4.3 Verify every disable path with agent-browser: drag-pan via `agent-browser drag .sigma-mouse <ref>` unchecks the box, a controller-driven camera change (the `updated` classification) unchecks it, `clickNode` unchecks it, and in each case the camera stays where the user left it.
- [x] 4.4 `agent-browser dblclick .sigma-mouse` on empty space checks the box and refits.
- [x] 4.5 Verify efficiency: with the layout stopped, `fitCount` stops changing (no work while stable), and during layout it advances at most once per frame.
- [x] 4.6 Re-verify the affected `graph-projection` double-click-canvas scenarios in agent-browser and record which settled-camera assertions shift.

## 5. Playwright specifications

- [x] 5.1 Write `tests/specifications/graph-viewer.spec.ts` mapping the four spec requirements: default-on, continuous fit, disable on pan / wheel / node click (`page.mouse.wheel` for the trusted wheel), enable on double-click of empty canvas, and the no-unnecessary-work and once-per-frame scenarios via `fitCount`.
- [x] 5.2 Update the `graph-projection.spec.ts` double-click-canvas tests whose settled-camera assertions shift (per 4.6), either pinning `setAutoFit(false)` when the test targets the manual one-shot fit or asserting the new persistent fit.
- [x] 5.3 Confirm the full specification suite still passes after the expectation updates.

## 6. Checks

- [x] 6.1 Run `just verify` (type checks, Oxlint, Oxfmt, production build).
- [x] 6.2 Run the specification and performance suites serially and confirm all pass.
- [x] 6.3 Run `just performance` and confirm the auto-fit loop does not regress graph rendering metrics.