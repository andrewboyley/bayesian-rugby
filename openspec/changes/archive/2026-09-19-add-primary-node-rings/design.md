## Context

See proposal.md for motivation. The feature lives inside the graph viewer and reuses its existing selection and event plumbing.

- Primary selection state is component state in `GraphViewer.svelte` (`primaryNode`, `secondaryNode`), mutated only by `handleNodeClick`, `selectPrimaryNode`, and `clearSelection`. A primary node exists exactly when `primaryNode` is non-null (the renderer's `hasPrimarySelection` graph state is the same condition).
- Every node carries a `color` attribute (its cluster color, see `createGraphModel`), and the renderer fills nodes with that attribute (`color: { attribute: 'color' }`). The primary node always keeps its own color; only inactive items get the dimmed `#424245` treatment.
- Sigma 4 beta 5 node layers ship only `layerFill()`. There is no ring/stroke layer: a WebGL ring marker means writing a custom node `Program` with arc geometry or a dashed-circle SDF plus a time uniform advanced per frame — substantial GLSL work against a beta rendering API.
- The renderer mounts into the `container` div. Sibling overlay precedent exists: `GraphGrid` is a 2D canvas overlay covering the viewer panel, redrawn from a `viewportToGraph` callback plus a `revision` signal.
- The camera emits `updated` on every camera change (drag, wheel, and the `animate()` used by node focus); `GraphViewer` already subscribes to it for grid redraws (`GraphViewer.svelte` camera `updated` handler).
- The FA2 layout runs in a web worker that writes `x`/`y` back through graph attribute events (`eachNodeAttributesUpdated` with `hints.attributes`); these listeners already exist for auto-fit.
- The renderer runs with `itemSizesReference: 'positions'` and `zoomToSizeRatioFunction: (ratio) => ratio`, so a node's on-screen radius in px equals `|graphToViewport({x: node.x + size, y: node.y}).x - graphToViewport(node).x|`.

## Goals / Non-Goals

**Goals:**
- Two thin concentric rings frame the primary node, visible in both the single-primary and the primary-plus-secondary state, hidden otherwise.
- Rings stay centered on the node while the camera animates, pans, zooms, and while the layout moves the node.
- The spin runs on the compositor (CSS animation), costing no JS per frame.
- Rings never capture pointers; graph interaction is byte-for-byte unchanged.
- The selection test controller exposes rings state so agent-browser and Playwright can verify the behavior (per the project's "verify with agent-browser before Playwright" rule).

**Non-Goals:**
- No settings-panel entry: ring count, radii, stroke, and spin speeds are module constants, not user-configurable.
- No custom WebGL program, no new dependencies, no dataset changes.
- No change to node colors, hidden-label logic, or any other selection behavior in the specs.

## Decisions

**D1 — DOM/SVG overlay above the canvas, not a custom Sigma node layer.**
A `<div>` overlay appended inside the sigma `container`, `absolute inset-0`, `pointer-events: none`, containing the two rings. Each ring is an inline SVG `<circle>` with `fill: none`, `stroke: <node color>`, `stroke-width: 1`, and `stroke-dasharray` gaps so rotation is visible; each circle carries a CSS keyframe spin (`ring-spin <duration> linear infinite`) with opposite directions and staggered durations/phases. Rings always draw above every WebGL depth layer, which is the desired look for a selection marker. The overlay has `overflow: hidden`, so rings clip at the exact edge of the graph area even when a ring's pixel radius grows large (for example during deep zoom) or when the primary node sits near the viewport edge. This clipping keeps the rings off the surrounding page and panel bar.
- Alternative rejected: a custom WebGL `Program` ring layer. Way more surface area — GLSL geometry, per-frame time uniform, shader debugging — against a beta API, with no visible benefit over a DOM marker.
- Alternative rejected: a 2D canvas overlay redrawn like `GraphGrid`. Works, but "spinning" would then need manual arc redraws every animation frame; CSS animation runs the spin on the compositor for free.

**D2 — Ring geometry derives from node attributes and the camera, on demand.**
A `getRingState()` reader returns `{ color, center, radiusPx }` for the current primary node: `color` from the node `color` attribute; `center` from `renderer.graphToViewport({x, y})`; `radiusPx` from the projected pixel distance of `x + size * factor` for each ring's factor (two rings around 2.2× and 3.0× the node radius). Reading is a handful of `graphToViewport` calls — free when nothing calls it.

**D3 — Reposition triggers are event-driven and rAF-debounced, matching the grid pattern.**
A `scheduleRingsSync()` rAF-debounced callback (same shape as `scheduleGridRedraw`) is invoked from: (a) the three selection mutators (so rings appear/disappear/retarget exactly when the selection changes), (b) the existing camera `updated` handler, so focus animations, drags, and zooms move the rings, and (c) the existing node-attribute listeners that fire during layout. While the graph is still and the camera is untouched, the callback never runs and the overlay is static (spin is pure CSS).

**D4 — Rings are their own Svelte component mirroring `GraphGrid`'s shape.**
A new `SelectionRings.svelte` mounts inside the `container`, receiving a `getRingState()` callback and a `revision` prop (the same `revision` counter pattern `GraphGrid` uses) plus the resolved deployment detail of visible/hidden state via the same callback (state reads `null` when no primary node exists). The component owns the SVG circles and the spin animations; `GraphViewer.svelte` owns the sync triggers and the geometry reader. This keeps the component file small and the selection code in one place.

**D5 — Rings state exposed through the existing test controller.**
`rugbyGraphSelectionTest.snapshot()` gains `rings: { visible: boolean; color: string | null }` (color is the primary node's `color` when visible). The DOM overlay itself is snapshot-able by agent-browser, so both the controller datum and the visible DOM are verifiable.

**D6 — Styling constants live with the component; settings and DESIGN.md tokens are untouched.**
Ring factors, stroke width (1px hairline), dash pattern, and spin durations are constants in the rings component. No additions to `GraphSettings`, `graph-settings.ts`, or the visual-system spec: the rings use the node's own color and a hairline stroke, consistent with the terminal-native system without introducing tokens.

## Risks / Trade-offs

[The DOM overlay unconditionally renders above every WebGL layer] → That is the intended reading order for a selection marker. If a future feature ever needs a marker occluded by nodes, that is a new design (custom program), not a tweak.

[Repositioning during layout writes DOM transforms each frame] → Only two small elements; writes are compositor transforms (translate on the wrapper, rotate on the circles), rAF-debounced to once per frame, and the existing grid redraw already runs at that cadence during layout. Verify with `just performance` before finishing (AGENTS.md requires it for rendering changes) and confirm no layout thrash in the perf run.

[CSS `border` dashed circles render inconsistently across browsers] → Use SVG circles with `stroke-dasharray`, which is deterministic; avoid CSS dash borders.

[The spin and a concurrent camera animation could visually alias] → Spin is inside the circle (rotate on self), position on the wrapper; both are compositor transforms on separate elements, so nothing re-layouts. Settle with agent-browser visual verification before any Playwright test.

## Migration Plan

Ship with the rings on. There is no persisted state and no config; rollback is a one-commit revert of the overlay component and its sync wiring.

## Open Questions

None. Resize and panel toggle behavior already flows through the shared sync triggers (camera `updated` fires on resize), so no separate handling is needed.