## Why

When auto fit is on (the default), clicking a node turns it off. The user must re-enable auto fit after every selection, and the view then frames the whole graph instead of the active neighborhood. Probe work on a neighborhood loses its frame.

## What Changes

- Selecting a primary node while auto fit is checked keeps the checkmark. The continuous fit now targets the visible active nodes: the primary node and its neighbors.
- With no primary node selected, auto fit keeps framing all visible nodes, exactly as it does today.
- Clearing the selection (clicking the active primary without a secondary, or clicking empty space) returns the fit to all visible nodes.
- With auto fit unchecked, clicking a node keeps today's behavior: the camera animates once to frame the node's neighborhood.
- Pan and wheel zoom still uncheck auto fit, as they do today.

## Capabilities

### New Capabilities
<!-- none: this change modifies the existing auto-fit behavior only -->

### Modified Capabilities
- `graph-viewer`: the auto-fit requirements change. Clicking a node no longer disables auto fit, and the continuous fit frames the visible active nodes instead of always framing all nodes.

## Impact

- `src/lib/components/GraphViewer.svelte`: the selection mutators (`selectPrimaryNode`, `handleNodeClick`, `clearSelection`) and the auto-fit loop choose the fit target from the selection state; the node-click handler no longer unchecks auto fit.
- `src/lib/graph/graph-camera.ts`: the immediate fit gains a node-set parameter so auto fit can frame an explicit neighborhood.
- Tests: `tests/specifications/graph-viewer.spec.ts` rewrites the "clicking a node disables auto-fit" scenario and adds fit-target coverage. The `node-selection` suite keeps passing unchanged.
- No dependency or dataset changes.