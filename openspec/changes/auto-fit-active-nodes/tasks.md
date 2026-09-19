## 1. Fit target plumbing

- [x] 1.1 Add `fitNodes(ctx, nodes)` to `graph-camera.ts`: compute the focus state over the given node set and animate the camera with `camera.animate` over `animationDurationMs`, returning the promise. Keep `fitNodesImmediate`/`fitVisibleNodesImmediate` as immediate variants so existing call sites keep their meaning.
- [x] 1.2 In `GraphViewer.svelte`, compute the auto-fit target from the selection state in `immediateAutoFit()`: `[primaryNode, ...graph.neighbors(primaryNode)]` when a primary node is selected, otherwise `graph.nodes()`.

## 2. Selection keeps auto-fit on

- [x] 2.1 Remove `autoFit = false` from the `clickNode` renderer handler.
- [x] 2.2 Branch `selectPrimaryNode`: with auto fit checked, set `focusedNode` and call `wakeAutoFit()`; with auto fit unchecked, keep the animated `focusPrimaryNeighborhood`.
- [x] 2.3 Wake auto fit from the clear paths (`clearSelection` and the active-primary clear path in `handleNodeClick`) so the fit returns to all nodes.

## 3. Animated fits

- [x] 3.1 `immediateAutoFit` animates: set `isAutoFitCameraUpdate = true`, call `fitNodes`, and clear the flag when the promise of the newest animation settles (completion or interruption). The loop restarts the animation per tick, so only the newest animation may clear the flag.
- [x] 3.2 Cancel in-flight auto-fit animations on `pointerdown` and `wheel` gestures on the graph container, so a pan or zoom that starts mid-animation owns the camera and its first camera update unchecks auto fit.

## 4. Verification

- [x] 4.1 Verify with agent-browser (`/?test=selection`): with auto fit on, selecting a primary keeps the checkbox and animates the camera to the neighborhood; clearing the selection animates back to all nodes; pan still unchecks auto fit, including a drag that starts mid-animation; with auto fit off, a node click still animates the neighborhood focus once.
- [x] 4.2 Rewrite the "clicking a node disables auto-fit" test in `tests/specifications/graph-viewer.spec.ts` to assert the checkbox stays checked and the camera frames the neighborhood; add a fit-target test covering the neighborhood vs all-nodes cases; extend settled-camera waits past the 600 ms animation (800 ms).
- [ ] 4.3 Run `just verify` and `just performance`; confirm the animated loop does not cause per-frame layout thrash.
- [x] 4.4 Refresh the `ccc`/code search index after the code change, per the project's code-intelligence workflow.