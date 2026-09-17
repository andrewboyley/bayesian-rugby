// src/lib/config/graph-settings.ts
//
// Centralized typed configuration for the graph viewer.
//
// ARCHITECTURE NOTES
// ──────────────────
// • Outermost layer — imports nothing from inner layers.
// • Pure data — no Svelte $state, no functions in the data layer.
// • All values are serializable (plain JSON-compatible types).
// • Style-string constants (whenState, labelVisibility, depth names,
//   backdropVisibility, etc.) remain inline in GraphViewer.svelte per
//   spec assertions at tests/specifications/node-selection.spec.ts lines
//   157-180. Only numeric/boolean config values live here.
// • Reactivity is a component-level concern (see AGENTS.md:
//   "Use Svelte runes for new component state").
//   Components hold $state<GraphSettings> and merge overrides locally.

// ═══════════════════════════════════════════════════════════════════
//  Domain interfaces — one per reason to change
// ═══════════════════════════════════════════════════════════════════

/** Camera framing and animation parameters. */
export interface CameraSettings {
  /** Pixels at which a node radius equals 1 screen unit. Default: 24 */
  radiusOneScreenPx: number;
  /** Ratio divisor for minimum-span and focus-bounds framing. Default: 1.2 */
  ratioFactor: number;
  /** Default camera center X (fraction of viewport). Default: 0.5 */
  defaultCenterX: number;
  /** Default camera center Y (fraction of viewport). Default: 0.5 */
  defaultCenterY: number;
  /** Minimum zoom ratio clamp for focused views. Default: 0.1 */
  focusRatioMin: number;
  /** Maximum zoom ratio clamp for focused views. Default: 2 */
  focusRatioMax: number;
  /** Ratio multiplier when framing a focused node neighborhood. Default: 1.3 */
  focusRatioFactor: number;
  /** Minimum span fallback when framing a single node. Default: 0.05 */
  minSpan: number;
  /** Camera animate() duration in milliseconds. Default: 600 */
  animationDurationMs: number;
}

/** Visual rendering parameters (Sigma style numeric values). */
export interface RenderingSettings {
  /** Node opacity — inactive, hasActiveSubgraph. Default: 0.12 */
  nodeInactiveOpacity: number;
  /** Node opacity — active non-primary/secondary, hasSelectedPair. Default: 0.3 */
  nodeActiveOpacity: number;
  /** Node opacity — non-active, hasSelectedPair. Default: 0.12 */
  nodePairInactiveOpacity: number;
  /** Inactive edge opacity. Default: 0.05 */
  edgeInactiveOpacity: number;
  /** Edge opacity — baseline performance profile. Default: 0.3 */
  edgeOpacity: number;
  /** Edge opacity — opaque performance profile. Default: 1 */
  edgeOpacityOpaque: number;
  /** Edge opacity — non-active edges when a pair is selected. Default: 0.05 */
  edgePairInactiveOpacity: number;
  /** Node label font size (px). Default: 12 */
  labelFontSize: number;
  /** Label background padding (px). Default: 4 */
  labelBackgroundPadding: number;
  /** Node backdrop padding (px). Default: 8 */
  backdropPadding: number;
  /** Node backdrop corner radius (px). Default: 4 */
  backdropCornerRadius: number;
  /** Node backdrop border width (px). Default: 1 */
  backdropBorderWidth: number;
  /** Node backdrop shadow blur (px). Default: 0 */
  backdropShadowBlur: number;
  /** Picking down-sizing ratio — coarse interactions. Default: 4 */
  pickingDownSizingRatioCoarse: number;
  /** Picking down-sizing ratio — normal interactions. Default: 2 */
  pickingDownSizingRatioNormal: number;
}

/** Layout, animation timing, and behavior cadence. */
export interface LayoutSettings {
  /** Node pop animation duration (ms). Default: 180 */
  popAnimationDurationMs: number;
  /** Golden angle (radians) for Fibonacci-spread placement. Default: 2.399963229728653 */
  goldenAngle: number;
  /** Initial position offset for newly added nodes. Default: 0.001 */
  initialPositionOffset: number;
  /** Initial scale for reveal delta. Default: 0.01 */
  revealInitialScale: number;
  /** Nodes revealed per batch. Default: 32 */
  revealBatchSize: number;
  /** Delay between reveal batches (ms). Default: 28 */
  revealTimeoutMs: number;
  /** Auto-add nodes interval cadence (ms). Default: 100 */
  addNodesCadenceMs: number;
  /** Default nodes-per-second rate. Default: 10 */
  nodesPerSecond: number;
}

export interface GraphSettings {
  readonly camera: CameraSettings;
  readonly rendering: RenderingSettings;
  readonly layout: LayoutSettings;
}

// ═══════════════════════════════════════════════════════════════════
//  Defaults
// ═══════════════════════════════════════════════════════════════════

export const defaultGraphSettings: GraphSettings = {
  camera: {
    radiusOneScreenPx: 24,
    ratioFactor: 1.2,
    defaultCenterX: 0.5,
    defaultCenterY: 0.5,
    focusRatioMin: 0.1,
    focusRatioMax: 2,
    focusRatioFactor: 1.3,
    minSpan: 0.05,
    animationDurationMs: 600,
  },
  rendering: {
    nodeInactiveOpacity: 0.12,
    nodeActiveOpacity: 0.3,
    nodePairInactiveOpacity: 0.12,
    edgeInactiveOpacity: 0.05,
    edgeOpacity: 0.3,
    edgeOpacityOpaque: 1,
    edgePairInactiveOpacity: 0.05,
    labelFontSize: 12,
    labelBackgroundPadding: 4,
    backdropPadding: 8,
    backdropCornerRadius: 4,
    backdropBorderWidth: 1,
    backdropShadowBlur: 0,
    pickingDownSizingRatioCoarse: 4,
    pickingDownSizingRatioNormal: 2,
  },
  layout: {
    popAnimationDurationMs: 180,
    goldenAngle: 2.399963229728653,
    initialPositionOffset: 0.001,
    revealInitialScale: 0.01,
    revealBatchSize: 32,
    revealTimeoutMs: 28,
    addNodesCadenceMs: 100,
    nodesPerSecond: 10,
  },
};

// ═══════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════

/** Merge partial overrides into a fresh GraphSettings (deep merge on domain groups). */
export function mergeSettings(
  base: GraphSettings = defaultGraphSettings,
  partial: Partial<GraphSettings>,
): GraphSettings {
  return {
    camera: { ...base.camera, ...partial.camera },
    rendering: { ...base.rendering, ...partial.rendering },
    layout: { ...base.layout, ...partial.layout },
  };
}
