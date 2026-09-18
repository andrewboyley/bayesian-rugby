## Why

When nodes are added automatically, the camera stays still and new content falls outside the frame. The user must re-frame the view by hand after every batch. During the force-directed layout, nodes drift even when nothing new arrives. An auto-fit mode, on by default, keeps the whole visible graph in frame so the probe work happens without losing the network.

## What Changes

- Add an `auto fit` checkbox at the bottom of the graph viewer, on the right side where the `nodes N · edges N` count appears.
- The checkbox is checked by default. While it is checked, the camera continuously fits all visible nodes.
- Manual interaction turns the checkbox off and restores today's behavior: a pan, a wheel zoom, or a click on a node.
- A double click on empty canvas turns the checkbox on again and refits the view.
- Camera updates in auto-fit mode are immediate and non-animated, so the view never lags the layout.
- The auto-fit loop is efficient: it does no work while the graph is stable, and it refits at most once per animation frame while the graph changes.
- The test controller (`rugbyGraphSelectionTest`) exposes the auto-fit state so agent-browser and Playwright can verify the behavior.

## Capabilities

### New Capabilities
- `graph-viewer`: continuous auto-fit of the camera to the visible nodes, controlled by a checkbox in the viewer status bar, with defined enable and disable interactions.

### Modified Capabilities
<!-- none: auto-fit is new behavior, and no existing OpenSpec requirement changes -->

## Impact

- `src/lib/components/GraphViewer.svelte`: checkbox in the viewer footer, the auto-fit loop lifecycle, stage event wiring, and the test controller surface.
- `src/lib/graph/graph-camera.ts`: reuse the existing bounds math for an immediate, non-animated camera set.
- Tests: a new `graph-viewer` specification test file. Each interaction is verified with agent-browser before any Playwright test is written.
- No dependency or dataset changes.