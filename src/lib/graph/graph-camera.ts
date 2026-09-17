/**
 * Camera and focus logic for the Sigma renderer.
 *
 * These are pure functions of their context (renderer, graph, projection,
 * focused-node accessor) — no Svelte reactive state, no framework imports
 * beyond the renderer itself. Kept in a dedicated module so the graph
 * component stays focused on orchestration.
 */
import type Graph from "graphology";
import type Sigma from "sigma";
import type { GraphProjection } from "./graph-projection";
import type { GraphSettings } from "../config/graph-settings";

export interface CameraContext {
  renderer: Sigma;
  graph: Graph;
  projection: GraphProjection;
  settings: GraphSettings;
  getFocusedNode: () => string | null;
  setFocusedNode: (node: string | null) => void;
}

export function radiusOneFocusRatio(ctx: CameraContext): number {
  const { width, height } = ctx.renderer.getDimensions();
  return (
    Math.min(width, height) / (Math.max(width, height) * ctx.settings.camera.radiusOneScreenPx)
  );
}

export function radiusOneMinimumSpan(ctx: CameraContext): number {
  return radiusOneFocusRatio(ctx) / ctx.settings.camera.ratioFactor;
}

export function focusGraphBounds(
  ctx: CameraContext,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minimumSpan?: number,
) {
  const normalize = ctx.renderer.getNormalizationFunction();
  const { width, height } = ctx.renderer.getDimensions();
  const minimum = normalize({ x: minX, y: minY });
  const maximum = normalize({ x: maxX, y: maxY });
  const minFramedX = Math.min(minimum.x, maximum.x);
  const maxFramedX = Math.max(minimum.x, maximum.x);
  const minFramedY = Math.min(minimum.y, maximum.y);
  const maxFramedY = Math.max(minimum.y, maximum.y);
  const spanX = maxFramedX - minFramedX;
  const spanY = maxFramedY - minFramedY;
  return {
    x: (minFramedX + maxFramedX) / 2,
    y: (minFramedY + maxFramedY) / 2,
    ratio:
      Math.max(spanX, spanY * (width / height), minimumSpan ?? 0) * ctx.settings.camera.ratioFactor,
  };
}

export function focusNodes(ctx: CameraContext, nodes: string[], focused: string | null) {
  ctx.setFocusedNode(focused);
  const bounds = nodes.reduce(
    (bounds, key) => {
      const { x, y, size } = ctx.graph.getNodeAttributes(key);
      const radius = size as number;
      return {
        minX: Math.min(bounds.minX, (x as number) - radius),
        maxX: Math.max(bounds.maxX, (x as number) + radius),
        minY: Math.min(bounds.minY, (y as number) - radius),
        maxY: Math.max(bounds.maxY, (y as number) + radius),
      };
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
  void ctx.renderer
    .getCamera()
    .animate(
      focusGraphBounds(
        ctx,
        bounds.minX,
        bounds.maxX,
        bounds.minY,
        bounds.maxY,
        nodes.length === 1 ? radiusOneMinimumSpan(ctx) : undefined,
      ),
      { duration: ctx.settings.camera.animationDurationMs },
    );
}

export function focusPrimaryNeighborhood(ctx: CameraContext, node: string) {
  focusNodes(ctx, [node, ...ctx.graph.neighbors(node)], node);
}

export function fitVisibleNodes(ctx: CameraContext) {
  focusNodes(ctx, ctx.graph.nodes(), null);
}

export function centerEmptyGraph(ctx: CameraContext, animate = true) {
  if (ctx.projection.visibleCount() !== 0) return;
  const state = {
    x: ctx.settings.camera.defaultCenterX,
    y: ctx.settings.camera.defaultCenterY,
    ratio: radiusOneFocusRatio(ctx),
  };
  if (animate)
    void ctx.renderer
      .getCamera()
      .animate(state, { duration: ctx.settings.camera.animationDurationMs });
  else ctx.renderer.getCamera().setState(state);
}
