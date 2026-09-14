## 1. Responsive Workspace

- [x] 1.1 Render the graph before the control panel and add the responsive desktop sidebar layout.
- [x] 1.2 Add desktop sidebar collapse and restore controls that preserve graph and control state.
- [x] 1.3 Make the graph use the available workspace width after sidebar state changes.
- [x] 1.4 Replace dedicated collapse buttons with collapsible graph and controls panel headers.

## 2. Tabbed Controls

- [x] 2.1 Split node-addition controls and ForceAtlas2 controls into Graph and Layout tabs.
- [x] 2.2 Add accessible tab, tablist, and tabpanel semantics with keyboard activation support.
- [x] 2.3 Constrain each active control panel and enable independent vertical scrolling.
- [x] 2.4 Preserve the terminal-native visual tokens for tabs and sidebar controls.
- [x] 2.5 Merge Graph and Layout tabs with the controls-panel collapse bar and group the automatic-add rate control.

## 3. Verification

- [x] 3.1 Add focused browser coverage for desktop, narrow layout, sidebar collapse, tab changes, and overflow scrolling.
- [x] 3.2 Run `just verify` and the focused Playwright specifications.
