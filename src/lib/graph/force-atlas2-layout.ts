import FA2Layout from 'graphology-layout-forceatlas2/worker';

type LayoutGraph = ConstructorParameters<typeof FA2Layout>[0];

export interface LayoutSnapshot {
	running: boolean;
	activeNodes: number;
}

export class ForceAtlas2Layout {
	private readonly layout: FA2Layout;

	constructor(private readonly graph: LayoutGraph) {
		this.layout = new FA2Layout(graph, {
			settings: {
				barnesHutOptimize: true,
				barnesHutTheta: 0.5,
				gravity: 1,
				scalingRatio: 10,
				slowDown: 1,
			},
		});
		this.layout.start();
	}

	snapshot(): LayoutSnapshot {
		return { running: this.layout.isRunning(), activeNodes: this.graph.order };
	}

	destroy() {
		this.layout.kill();
	}
}
