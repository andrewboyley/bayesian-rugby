## Purpose

Lets the graph viewer keep the whole visible network in frame as nodes are added and the layout rearranges them, without manual re-framing.

## ADDED Requirements

### Requirement: The viewer provides a continuous auto-fit mode

The system SHALL show a checkbox in the viewer status bar next to the `nodes N · edges N` count. The checkbox controls continuous camera fitting to all nodes currently in the graph.

#### Scenario: Checkbox checked by default

- **WHEN** the graph viewer loads
- **THEN** the auto-fit checkbox is checked

#### Scenario: Camera fits continuously while enabled

- **WHEN** the auto-fit checkbox is checked and the graph has nodes
- **THEN** the camera immediately sets its position and zoom to fit all nodes in the graph

#### Scenario: Graph empty while enabled

- **WHEN** the auto-fit checkbox is checked and the graph has no nodes
- **THEN** the camera keeps its current position and does not change

#### Scenario: Test controller exposes auto-fit state

- **WHEN** the page is loaded with `?test=selection` and the auto-fit checkbox is checked
- **THEN** the test controller's `snapshot()` method returns an `autoFit` property that is `true`
- **WHEN** the auto-fit checkbox is unchecked
- **THEN** the test controller's `snapshot()` method returns an `autoFit` property that is `false`

### Requirement: Manual interaction disables auto-fit

The system SHALL uncheck the auto-fit checkbox and restore today's manual camera behavior when the user pans, zooms, or clicks a node.

#### Scenario: Pan disables auto-fit

- **WHEN** the user drags to pan the view while the auto-fit checkbox is checked
- **THEN** the checkbox is unchecked and the camera keeps its position after the drag

#### Scenario: Wheel zoom disables auto-fit

- **WHEN** the user scrolls the mouse wheel while the auto-fit checkbox is checked
- **THEN** the checkbox is unchecked and the camera keeps the zoom level reached by the scroll

#### Scenario: Node click disables auto-fit

- **WHEN** the user clicks a node while the auto-fit checkbox is checked
- **THEN** the checkbox is unchecked and the camera focuses the node as it does today

### Requirement: Double click on empty canvas enables auto-fit

The system SHALL check the auto-fit checkbox on a double click on empty canvas.

#### Scenario: Double click on empty canvas enables and refits

- **WHEN** the user double clicks on empty canvas
- **THEN** the auto-fit checkbox is checked and the camera fits all nodes

### Requirement: Auto-fit does no unnecessary work

The system SHALL not compute bounds or set the camera when the graph is stable and the checkbox is checked.

#### Scenario: No work while graph stable

- **WHEN** the graph is stable and the auto-fit checkbox is checked
- **THEN** the system does not compute bounds or set the camera

#### Scenario: At most one fit per frame during changes

- **WHEN** the graph changes repeatedly in a single animation frame and the auto-fit checkbox is checked
- **THEN** the system computes bounds and sets the camera at most once in that frame
