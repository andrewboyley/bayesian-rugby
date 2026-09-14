## Context

See proposal.md for the motivation. `GraphViewer.svelte` owns the graph surface and mounts `GraphViewerControls.svelte` above it in the current vertical layout. The controls already separate node-addition actions from ForceAtlas2 settings in a collapsible details element.

The project uses a terminal-native visual system. It requires monospaced text, hairline borders, ASCII markers, and 4px interactive corners. The graph must remain responsive on desktop and mobile screens.

## Goals / Non-Goals

**Goals:**

- Create a desktop workspace with a graph area and a right-hand sidebar.
- Preserve graph state and control values while a user changes tabs or collapses either panel.
- Keep the existing controls accessible through keyboard and assistive technology.
- Limit control-panel overflow to the panel so the graph remains visible.

**Non-Goals:**

- Change graph data, graph layout algorithms, selection behavior, or node-addition behavior.
- Add dependencies or a new routing structure.
- Add Adobe branding or visual assets.

## Decisions

### Use one responsive workspace container

`GraphViewer.svelte` will render the graph before the controls in source order. A CSS grid will place the graph and sidebar side by side at 1024 pixels and above. Below that breakpoint, the grid will use one column and place controls after the graph.

This preserves a logical reading and focus order on every viewport. A visually reordered flex layout was considered, but it would make the source order differ from the requested graph-first flow.

### Keep panel state in GraphViewer

`GraphViewer.svelte` will own whether the graph and controls panels are open. Each panel name will be its toggle. The name includes `[-]` when open and `[+]` when collapsed. On desktop, a collapsed panel will become a narrow vertical bar with a vertically oriented header. Narrow screens will retain a horizontal header. `GraphViewerControls.svelte` will own the active tab because it owns the tab interface. Existing control state will remain in GraphViewer.

This keeps layout state near the workspace and control-navigation state near the controls. Separate collapse buttons were removed because the panel names provide the direct interaction.

### Split existing controls into two tab panels

The Graph tab will contain separate manual-add and automatic-add sub-sections. The automatic-add sub-section will contain its start/stop button and rate control. The rate starts at 10 nodes per second and supports up to 60. The Graph and Layout tabs will share the controls-panel header bar with its collapse marker. The bar will be vertical with vertically oriented labels on desktop and horizontal on narrow screens. Each tab will use semantic tab, tablist, and tabpanel roles with linked labels and keyboard focus support.

This maps existing control groups to a small, stable tab set. More tabs were considered, but the current controls form only two clear groups.

### Constrain tab-panel overflow

The desktop sidebar will match the graph workspace height and each active panel will use vertical overflow. The narrow layout will keep a bounded, scrollable control area below the graph.

This keeps the graph in view while users inspect longer control sets. Allowing the sidebar to grow with its contents was considered, but it would remove the requested tab-level scrolling.

### Preserve the terminal-native interaction language

The panel names and tab controls will use existing button and border tokens. Bracketed ASCII labels will identify open and collapsed states. No new icon system, shadows, or gradients will be added.

## Risks / Trade-offs

- [A fixed sidebar height can reduce space for controls on short screens] → Use a viewport-aware workspace height and allow each tab panel to scroll.
- [A collapsed panel can hide its contents] → Keep its clickable panel name visible.
- [Tabs add keyboard behavior] → Use native buttons with tab semantics, visible focus treatment, and tested activation behavior.
- [The 1024-pixel breakpoint can feel narrow on some devices] → Use the documented desktop breakpoint and retain the stacked layout below it.

## Migration Plan

1. Replace the current vertical wrapper with the responsive workspace container.
2. Add graph and controls panel state to their headers.
3. Divide existing controls into Graph and Layout tab panels.
4. Add focused browser coverage for desktop, narrow layout, tabs, scrolling, and collapse state.
5. Run `just verify` and focused Playwright tests before release.
