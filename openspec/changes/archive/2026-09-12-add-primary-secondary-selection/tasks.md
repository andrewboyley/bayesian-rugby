## 1. Selection State

- [x] 1.1 Add primary and secondary node state flags and component selection state.
- [x] 1.2 Implement deterministic click transitions for primary selection, secondary selection, empty-space deselection, promotion, and non-neighbor replacement.
- [x] 1.3 Preserve the current direct-neighbor hover behavior only when no primary node is selected, including visible-label hover targets.

## 2. Camera Focus

- [x] 2.1 Add a Sigma-compatible viewport utility dependency, if a compatible version is available.
- [x] 2.2 Animate the camera to fit a newly selected primary node and its direct neighbors.
- [x] 2.3 Retain the current camera boundaries and zoom limits during selection camera updates.

## 3. Selection Rendering

- [x] 3.1 Add declarative node and edge styles for primary, secondary, and selected connecting-edge state flags.
- [x] 3.2 Render a primary neighborhood with visible labels and hide labels outside selection or hover.
- [x] 3.3 Render only a selected primary-secondary pair and their connecting edge at full opacity.

## 4. Verification

- [x] 4.1 Run `just check` and `just lint`.
- [x] 4.2 Verify each selection transition in the browser, including primary clear, secondary promotion, and non-neighbor replacement.
- [x] 4.3 Verify camera focus, hover precedence, opacity states, and browser console output.
