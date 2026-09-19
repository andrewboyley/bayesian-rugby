## Why

When a node becomes the primary node, the selection is communicated only by opacity changes, labels, and a camera move. The selected node itself has no marker that distinguishes it from its neighbors, so the user must infer which node is primary from the dimming around it. Two thin spinning rings around the primary node make the active selection legible at a glance and give the selection a continuously live feel in the terminal-native style.

## What Changes

- The graph viewer shows two thin concentric rings around the primary node.
- The rings are visible whenever a primary node is selected, in both the single-primary state and the primary-plus-secondary state.
- The rings spin continuously (opposite directions) while the primary node is active.
- The rings use the primary node's own color (the node's `color` attribute, its cluster color), so the marker matches the node it frames.
- The rings track the primary node as it moves: during camera animations, pans and zooms, and during the force-directed layout.
- The rings never receive pointer input; graph interactions behave exactly as today.
- The selection test controller (`rugbyGraphSelectionTest`) exposes the rings state so agent-browser and Playwright can verify the behavior.

## Capabilities

### New Capabilities
<!-- none: the rings extend the existing primary node selection behavior -->

### Modified Capabilities
- `node-selection`: primary node selection gains a persistent spinning-rings marker around the primary node, colored by the node's own color, that appears and disappears with the selection.

## Impact

- `src/lib/components/GraphViewer.svelte`: ring overlay lifecycle, position/color sync with the camera and node attribute updates, and the selection test controller surface.
- `src/lib/graph/graph-selection-controller.ts`: mirrors the same selection controller used by tests; the rings read primary node identity and color from it or from the equivalent in-component state.
- A small ring overlay component or module is added alongside the existing overlay patterns (for example `GraphGrid`).
- Tests: extend `tests/specifications/node-selection.spec.ts` with rings scenarios. Each interaction is verified with agent-browser before any Playwright test is written.
- No dependency changes, no dataset changes.