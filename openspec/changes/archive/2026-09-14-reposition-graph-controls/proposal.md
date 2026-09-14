## Why

The graph and its controls currently use a vertical layout. This separates the controls from the graph on desktop screens and uses more vertical space than needed.

## What Changes

- Place the graph viewer before the controls in document order.
- Show the controls as a scrollable sidebar to the right of the graph on desktop screens.
- Stack the controls below the graph on mobile screens.
- Add a desktop-only control that collapses and restores the sidebar.
- Group the sidebar controls into tabs for graph controls and layout controls.

## Capabilities

### New Capabilities
- `graph-workspace-layout`: Defines the responsive graph workspace, collapsible desktop sidebar, and scrollable control tabs.

### Modified Capabilities
- None.

## Impact

- Affects `src/lib/components/GraphViewer.svelte` and `src/lib/components/GraphViewerControls.svelte`.
- Updates responsive layout, control navigation, and accessible sidebar state.
- Does not change the graph dataset, graph algorithms, or dependencies.
