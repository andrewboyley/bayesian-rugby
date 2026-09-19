## ADDED Requirements

### Requirement: Primary node rings
When a primary node is selected, the graph viewer SHALL render two thin concentric rings around the primary node. The rings SHALL remain visible while the primary node is selected, including while a secondary node is also selected, and SHALL be hidden whenever no primary node is selected. Each ring SHALL spin continuously around its center at a constant rate. The rings SHALL be drawn in the primary node's own color. The rings SHALL track the primary node's on-screen position while the camera moves and while the layout moves the node. The rings SHALL be clipped at the edge of the graph area, so the rings never paint over the rest of the page.

#### Scenario: Rings appear on primary selection
- **WHEN** the user clicks a node and the viewer makes it the primary node
- **THEN** two spinning rings appear around that node

#### Scenario: Rings persist with a selected pair
- **WHEN** a primary node and a secondary node are selected
- **THEN** the rings remain visible around the primary node and keep spinning

#### Scenario: Rings clear with the selection
- **WHEN** the user clears the selection by clicking the active primary node without a secondary node, or by clicking empty space
- **THEN** no rings render

#### Scenario: Rings use the primary node's color
- **WHEN** a primary node is selected
- **THEN** both rings render in the same color as the primary node itself

#### Scenario: Rings track the primary node
- **WHEN** the camera animates, pans, or zooms, or the layout moves the primary node
- **THEN** the rings stay centered on the primary node's on-screen position

#### Scenario: Rings do not block graph interaction
- **WHEN** the rings are visible and the user clicks, hovers, or drags on the graph
- **THEN** the interaction targets the node or stage beneath the rings exactly as it would without the rings

#### Scenario: Rings stay inside the graph area
- **WHEN** the rings extend beyond the edges of the graph area, for example while the camera zooms deep into a node
- **THEN** the rings are clipped at the graph area's edge and do not paint over the rest of the page