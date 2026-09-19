# graph-viewer Specification

## Purpose

Lets the graph viewer keep the whole visible network in frame as nodes are added and the layout rearranges them, without manual re-framing.

## Requirements

### Requirement: The viewer provides a continuous auto-fit mode

The system SHALL show a checkbox in the viewer status bar next to the `nodes N · edges N` count. The checkbox controls continuous camera fitting to the visible active nodes: the primary node and its neighbors when a primary node is selected, and all nodes in the graph otherwise.

#### Scenario: Checkbox checked by default

- **WHEN** the graph viewer loads
- **THEN** the auto-fit checkbox is checked

#### Scenario: Camera fits continuously while enabled

- **WHEN** the auto-fit checkbox is checked and the graph has nodes
- **THEN** the camera animates its position and zoom to fit the visible active nodes, gliding over the animation duration instead of jumping

#### Scenario: Camera animates to each fit

- **WHEN** a fit is due and the target is different from the current view
- **THEN** the camera eases to the fitted view over the animation duration and settles on it

#### Scenario: Graph empty while enabled

- **WHEN** the auto-fit checkbox is checked and the graph has no nodes
- **THEN** the camera keeps its current position and does not change

#### Scenario: Test controller exposes auto-fit state

- **WHEN** the page is loaded with `?test=selection` and the auto-fit checkbox is checked
- **THEN** the test controller's `snapshot()` method returns an `autoFit` property that is `true`
- **WHEN** the auto-fit checkbox is unchecked
- **THEN** the test controller's `snapshot()` method returns an `autoFit` property that is `false`

### Requirement: Manual interaction disables auto-fit

The system SHALL uncheck the auto-fit checkbox and restore today's manual camera behavior when the user pans or zooms. A pan or zoom that starts while the auto-fit camera is still animating SHALL stop the in-flight animation so the gesture controls the camera. Selecting a node SHALL NOT uncheck the checkbox.

#### Scenario: Pan disables auto-fit

- **WHEN** the user drags to pan the view while the auto-fit checkbox is checked
- **THEN** the checkbox is unchecked and the camera keeps its position after the drag

#### Scenario: Pan interrupts an in-flight fit

- **WHEN** the user starts to drag to pan while the auto-fit camera is still animating to a fit
- **THEN** the animation stops, the drag controls the camera, and the checkbox is unchecked

#### Scenario: Wheel zoom disables auto-fit

- **WHEN** the user scrolls the mouse wheel while the auto-fit checkbox is checked
- **THEN** the checkbox is unchecked and the camera keeps the zoom level reached by the scroll

#### Scenario: Node click keeps auto-fit on and frames the active neighborhood

- **WHEN** the user clicks a node while the auto-fit checkbox is checked
- **THEN** the checkbox stays checked and the camera frames the node and its neighbors

### Requirement: Double click on empty canvas enables auto-fit

The system SHALL check the auto-fit checkbox on a double click on empty canvas.

#### Scenario: Double click on empty canvas enables and refits

- **WHEN** the user double clicks on empty canvas
- **THEN** the auto-fit checkbox is checked and the camera fits the visible active nodes

### Requirement: Auto-fit does no unnecessary work

The system SHALL not compute bounds or set the camera when the graph is stable and the checkbox is checked.

#### Scenario: No work while graph stable

- **WHEN** the graph is stable and the auto-fit checkbox is checked
- **THEN** the system does not compute bounds or set the camera

#### Scenario: At most one fit per frame during changes

- **WHEN** the graph changes repeatedly in a single animation frame and the auto-fit checkbox is checked
- **THEN** the system computes bounds and sets the camera at most once in that frame

### Requirement: Clearing the selection restores the whole-graph fit

When the user clears the selection while auto fit is checked, the system SHALL return the continuous fit to all nodes in the graph.

#### Scenario: Empty-space click refits all nodes

- **WHEN** the user clicks empty space while a primary node is selected and the auto-fit checkbox is checked
- **THEN** the checkbox stays checked and the camera frames all nodes in the graph

#### Scenario: Clicking the active primary refits all nodes

- **WHEN** the user clicks the active primary node without a secondary node while the auto-fit checkbox is checked
- **THEN** the checkbox stays checked and the camera frames all nodes in the graph