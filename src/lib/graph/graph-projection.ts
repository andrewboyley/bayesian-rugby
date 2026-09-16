import type { GraphModel } from "./graph-model";

interface MutableGraph {
  addNode(key: string, attributes: Record<string, unknown>): void;
  addEdge(source: string, target: string, attributes: Record<string, unknown>): void;
  dropNode(key: string): void;
  hasEdge(source: string, target: string): boolean;
  hasNode(key: string): boolean;
  setNodeAttribute(key: string, name: string, value: unknown): void;
  updateEachNodeAttributes(
    callback: (key: string, attributes: Record<string, unknown>) => Record<string, unknown>,
    hints?: { attributes: string[] },
  ): void;
}

export interface ProjectionDelta {
  activate?: readonly number[];
  deactivate?: readonly number[];
}

export class GraphProjection {
  readonly visible: Uint8Array;

  constructor(
    private readonly graph: MutableGraph,
    private readonly model: GraphModel,
  ) {
    this.visible = new Uint8Array(model.nodes.length);
  }

  resetVisible() {
    this.visible.fill(0);
  }

  applyDelta(delta: ProjectionDelta, startScale = 1, startAtOrigin = false) {
    const changedNodes: string[] = [];
    const changedEdges: string[] = [];

    for (const index of delta.deactivate ?? []) {
      if (!this.visible[index]) continue;
      this.visible[index] = 0;
      const key = this.model.nodes[index].key;
      if (this.graph.hasNode(key)) this.graph.dropNode(key);
      changedNodes.push(key);
    }

    for (const index of delta.activate ?? []) {
      if (this.visible[index]) continue;
      this.visible[index] = 1;
      const node = this.model.nodes[index];
      this.graph.addNode(node.key, {
        label: node.label,
        x: startAtOrigin ? 0 : node.x,
        y: startAtOrigin ? 0 : node.y,
        cluster: node.cluster,
        color: node.color,
        score: node.score,
        displayScore: node.score * startScale,
        size: 1,
      });
      changedNodes.push(node.key);

      for (const edgeIndex of this.model.incidentEdges[index]) {
        const sourceIndex = this.model.edgeSources[edgeIndex];
        const targetIndex = this.model.edgeTargets[edgeIndex];
        if (!this.visible[sourceIndex] || !this.visible[targetIndex]) continue;
        const source = this.model.nodes[sourceIndex];
        const target = this.model.nodes[targetIndex];
        if (this.graph.hasEdge(source.key, target.key)) continue;
        this.graph.addEdge(source.key, target.key, {
          sourceColor: source.color,
          targetColor: target.color,
          useGradient: false,
        });
        changedEdges.push(`${source.key}|${target.key}`);
      }
    }

    return { changedNodes, changedEdges };
  }

  setPopScale(indices: readonly number[], scale: number) {
    for (const index of indices) {
      if (!this.visible[index]) continue;
      const node = this.model.nodes[index];
      this.graph.setNodeAttribute(node.key, "displayScore", node.score * scale);
    }
  }

  rescaleVisibleSizes() {
    const degreeForMaximumSize = 5;
    this.graph.updateEachNodeAttributes(
      (key, attributes) => {
        const index = this.model.nodeIndexByKey.get(key);
        if (index === undefined || !this.visible[index]) return attributes;
        const scale = Math.min(this.visibleDegree(index) / degreeForMaximumSize, 1);
        attributes.size = 1 + scale * 3;
        return attributes;
      },
      { attributes: ["size"] },
    );
  }

  private visibleDegree(index: number) {
    return this.model.incidentEdges[index].reduce((count, edgeIndex) => {
      const neighbor =
        this.model.edgeSources[edgeIndex] === index
          ? this.model.edgeTargets[edgeIndex]
          : this.model.edgeSources[edgeIndex];
      return count + this.visible[neighbor];
    }, 0);
  }

  setPosition(index: number, x: number, y: number) {
    if (!this.visible[index]) return;
    const key = this.model.nodes[index].key;
    this.graph.setNodeAttribute(key, "x", x);
    this.graph.setNodeAttribute(key, "y", y);
  }

  applyPositions(positions: Float32Array) {
    this.graph.updateEachNodeAttributes(
      (key, attributes) => {
        const index = this.model.nodeIndexByKey.get(key);
        if (index === undefined) return attributes;
        attributes.x = positions[index * 2];
        attributes.y = positions[index * 2 + 1];
        return attributes;
      },
      { attributes: ["x", "y"] },
    );
  }

  visibleCount() {
    let count = 0;
    for (const isVisible of this.visible) count += isVisible;
    return count;
  }
}
