import FA2Layout from "graphology-layout-forceatlas2/worker";

type LayoutGraph = ConstructorParameters<typeof FA2Layout>[0];

export interface LayoutSnapshot {
  running: boolean;
  activeNodes: number;
}

export interface ForceAtlas2Settings {
  adjustSizes: boolean;
  barnesHutOptimize: boolean;
  barnesHutTheta: number;
  edgeWeightInfluence: number;
  gravity: number;
  linLogMode: boolean;
  outboundAttractionDistribution: boolean;
  scalingRatio: number;
  slowDown: number;
  strongGravityMode: boolean;
}

export const defaultForceAtlas2Settings: ForceAtlas2Settings = {
  adjustSizes: true,
  barnesHutOptimize: true,
  barnesHutTheta: 0.5,
  edgeWeightInfluence: 1,
  gravity: 0.05,
  linLogMode: false,
  outboundAttractionDistribution: true,
  scalingRatio: 10,
  slowDown: 10,
  strongGravityMode: true,
};

export class ForceAtlas2Layout {
  private layout: FA2Layout;
  private settings = defaultForceAtlas2Settings;

  constructor(private readonly graph: LayoutGraph) {
    this.layout = this.createLayout();
    this.layout.start();
  }

  private createLayout() {
    this.layout = new FA2Layout(this.graph, {
      settings: this.settings,
    });
    return this.layout;
  }

  setSettings(settings: Partial<ForceAtlas2Settings>) {
    this.settings = { ...this.settings, ...settings };
    this.restart();
  }

  restart() {
    this.layout.kill();
    this.layout = this.createLayout();
    this.layout.start();
  }

  snapshot(): LayoutSnapshot {
    return { running: this.layout.isRunning(), activeNodes: this.graph.order };
  }

  destroy() {
    this.layout.kill();
  }
}
