## Why

Hovering shows a node's local context only while the pointer remains over it. Users need a stable way to inspect a connected pair and move through the graph without losing the selected context.

## What Changes

- Add primary and secondary node selection states to the graph viewer.
- Make a clicked node the primary node and keep its local neighborhood active.
- Animate the camera to fit the primary node and its direct neighbors.
- Allow a direct neighbor of the primary node to become the secondary node.
- Focus the graph on the selected pair and their connecting edge.
- Define click actions that clear a selection or promote the secondary node.

## Capabilities

### New Capabilities
- `node-selection`: Defines primary and secondary node selection, camera focus, and graph emphasis behavior.

### Modified Capabilities

None.

## Impact

- Affects `src/lib/components/GraphViewer.svelte`.
- Uses Sigma state flags, node and edge click events, and camera viewport controls.
- Does not add a dependency or change a public API.
