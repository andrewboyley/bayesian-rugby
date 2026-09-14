## Purpose

Defines a responsive workspace that keeps the interactive graph and its controls available without competing for the same vertical space.

## ADDED Requirements

### Requirement: Responsive graph workspace
The viewer SHALL place the graph before its controls in document order. At desktop widths of 1024 pixels or more, the viewer SHALL place a control sidebar to the right of the graph. Below that width, the viewer SHALL place the controls below the graph.

#### Scenario: Desktop workspace renders
- **WHEN** the viewport width is at least 1024 pixels
- **THEN** the graph renders beside a right-hand control sidebar

#### Scenario: Narrow workspace renders
- **WHEN** the viewport width is below 1024 pixels
- **THEN** the graph renders above the controls

### Requirement: Collapsible desktop sidebar
At desktop widths, the viewer SHALL provide a control that collapses and restores the sidebar. When the sidebar is collapsed, the graph SHALL use the available workspace width. The control SHALL expose the sidebar state to assistive technology.

#### Scenario: User collapses the sidebar
- **WHEN** the user activates the sidebar collapse control at a desktop width
- **THEN** the sidebar is hidden and the graph uses the released workspace width

#### Scenario: User restores the sidebar
- **WHEN** the user activates the sidebar restore control after collapse
- **THEN** the sidebar returns with its selected tab and control values preserved

### Requirement: Tabbed control sidebar
The sidebar SHALL group controls into a Graph tab and a Layout tab. The Graph tab SHALL contain node-addition controls. The Layout tab SHALL contain ForceAtlas2 controls. The active tab SHALL be identified to assistive technology and keyboard users.

#### Scenario: User changes tabs
- **WHEN** the user activates a sidebar tab
- **THEN** the viewer displays that tab's controls and marks it as active

#### Scenario: Keyboard user changes tabs
- **WHEN** a keyboard user moves focus between sidebar tabs and activates one
- **THEN** the viewer displays the associated control panel

### Requirement: Scrollable control panels
Each sidebar tab panel SHALL scroll independently when its controls exceed the available panel height. The sidebar SHALL not increase the workspace height to show overflowing controls.

#### Scenario: Active panel overflows
- **WHEN** the active tab contains more controls than fit in the available height
- **THEN** the tab panel provides vertical scrolling while the graph remains visible
