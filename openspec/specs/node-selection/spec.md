# node-selection Specification

## Purpose
Lets users keep and inspect a selected graph relationship after pointer hover ends.

## Requirements

### Requirement: Primary node selection
The graph viewer SHALL make a clicked node the primary node. A primary node remains selected until the user clears it or replaces it. When a node becomes primary, the viewer SHALL show the primary node and its direct neighbors as active, keep their labels visible, and animate the camera to their extent.

#### Scenario: User selects an unselected node
- **WHEN** the user clicks a node while no primary node is selected
- **THEN** the viewer makes that node the primary node, activates it and its direct neighbors, keeps their labels visible, and animates the camera to show that neighborhood

#### Scenario: User replaces the primary node
- **WHEN** the user clicks a node that is not a direct neighbor of the current primary node
- **THEN** the viewer clears the previous selection and makes the clicked node the new primary node

### Requirement: Secondary node selection
The graph viewer SHALL allow only a direct neighbor of the primary node to become the secondary node. The viewer SHALL retain one primary node and no more than one secondary node.

#### Scenario: User selects a primary neighbor
- **WHEN** the user clicks a direct neighbor of the primary node
- **THEN** the viewer makes that neighbor the secondary node

#### Scenario: User clicks a non-neighbor with a primary node selected
- **WHEN** the user clicks a node that is not a direct neighbor of the primary node
- **THEN** the viewer replaces the primary node and clears the secondary node

### Requirement: Selected relationship emphasis
When both selection slots contain nodes, the graph viewer SHALL render the primary node, the secondary node, and their connecting edge at full opacity. The viewer SHALL render every other node and edge with reduced opacity. Direct neighbors of the primary node and their connecting edges SHALL retain their original colors at reduced opacity. Other graph items SHALL use the inactive color.

#### Scenario: Viewer displays a selected pair
- **WHEN** a primary node and a secondary node are selected
- **THEN** the two selected nodes and their connecting edge render at full opacity, while other primary-neighborhood items retain their colors at reduced opacity

### Requirement: Selection transitions
The graph viewer SHALL clear or promote selections when the user clicks an active selected node.

#### Scenario: User deselects the primary node
- **WHEN** the user clicks the active primary node while no secondary node is selected
- **THEN** the viewer clears the primary node and restores the unselected graph state

#### Scenario: User deselects the secondary node
- **WHEN** the user clicks the active primary node while a secondary node is selected
- **THEN** the viewer keeps the primary node selected, clears the secondary node, and restores the primary neighborhood

#### Scenario: User clears a selection from empty space
- **WHEN** the user clicks empty graph space while one or both selection slots contain nodes
- **THEN** the viewer clears both selection slots and restores the unselected graph state

#### Scenario: User promotes the secondary node
- **WHEN** the user clicks the active secondary node
- **THEN** the viewer makes it the primary node, clears the secondary node, and shows the new primary node's direct neighborhood

### Requirement: Hover feedback during selection
The graph viewer SHALL show the hovered node's label and backdrop whether or not that node is active in the selected relationship.

#### Scenario: User hovers an inactive node during selection
- **WHEN** a primary node is selected and the user hovers a node outside the active selection
- **THEN** the viewer shows that node's label and backdrop without changing the selection state

#### Scenario: User hovers a visible label
- **WHEN** the user hovers the label of a primary-neighborhood node
- **THEN** the viewer applies the node hover treatment to that node

### Requirement: Label visibility
The graph viewer SHALL hide labels unless a node is hovered or belongs to the selected primary neighborhood.

#### Scenario: Viewer displays the unselected graph
- **WHEN** no node is hovered and no primary node is selected
- **THEN** the viewer hides all node labels

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
