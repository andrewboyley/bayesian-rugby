## Context

`GraphViewer.svelte` currently uses transient hover state to emphasize a node and its direct neighbors. See `proposal.md` for the motivation. The graph renderer supports custom node and edge state flags, click events, declarative style rules, and camera animation.

## Goals / Non-Goals

**Goals:**

- Keep a primary selection after pointer hover ends.
- Support one secondary selection from the primary node's direct neighbors.
- Make selection transitions deterministic and keep the camera focused on a primary neighborhood.
- Preserve the existing hover and unselected graph behavior when no node is selected.

**Non-Goals:**

- Supporting more than two selected nodes.
- Persisting selections across a page reload.
- Adding selection controls outside the graph canvas.

## Decisions

### Store selection identity separately from renderer state

Keep the primary and secondary node keys in component state. Derive renderer node and edge state flags from those keys through one update path. This prevents click, hover, and promotion handlers from leaving stale flags on graph items.

The alternative is to infer selection from renderer flags. That approach makes it difficult to enforce one primary node, one secondary node, and predictable promotion.

### Use a selection state machine

Treat node clicks as transitions between no selection, primary selection, and primary-plus-secondary selection. A click on the primary clears the secondary slot when one exists, otherwise it clears the primary slot. A click on the secondary promotes it and clears the secondary slot. A click on a primary neighbor fills or replaces the secondary slot. A click on a non-neighbor replaces the primary node and clears the secondary slot.

The alternative is separate click handlers that edit flags independently. That approach duplicates transition rules and can leave an invalid selected pair.

### Give persistent selection precedence over hover emphasis

When a primary node exists, pointer hover does not replace the persistent selection emphasis. It still shows the hovered node label and backdrop, even for an inactive node. When no primary node exists, the existing direct-neighbor hover behavior remains unchanged.

The alternative is to combine hover and selection subgraphs. That would make the selected relationship change when the user moves the pointer.

### Fit a primary neighborhood with Sigma viewport utilities

Add the Sigma utility package that matches the installed Sigma version and use its viewport fitting helper with the primary node and its direct neighbors. Use the existing camera limits and boundaries after each fit. This gives the selected neighborhood a consistent animated extent without hand-written coordinate calculations.

The alternative is to calculate a camera state from graph coordinates. That approach duplicates Sigma viewport logic and risks incorrect padding at different aspect ratios.

### Apply style rules by selection level

Use renderer state flags for primary, secondary, selected connecting edges, and primary-neighborhood edges. When both slots are filled, the pair and its edge use the existing full-opacity styles. Other primary-neighborhood items retain their data colors at lower opacity. Graph items outside that neighborhood use the inactive color. When only a primary exists, the primary neighborhood follows the current active-neighborhood treatment.

The alternative is to mutate permanent node and edge attributes. State flags are temporary interaction data and restore cleanly on selection changes.

## Risks / Trade-offs

- [A camera fit hides useful context] → Limit camera fitting to primary-node changes. Secondary selection does not move the camera.
- [Hover styles conflict with persistent selection] → Derive all visual emphasis from one precedence order: selected pair, primary neighborhood, hover neighborhood, unselected graph.
- [The utility package version does not match the installed Sigma beta] → Confirm compatible package versions before adding the dependency and use the renderer camera API only if no compatible utility exists.

## Migration Plan

1. Add the selection states and click transitions behind the current graph interaction layer.
2. Test each selection transition against the existing hover, camera, and opacity behavior.
3. Remove the selection state and click handlers to roll back. The dataset and stored graph attributes remain unchanged.
