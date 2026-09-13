export interface GraphDataset {
	nodes: { key: string; label: string; tag: string; cluster: string; x: number; y: number; score: number }[];
	edges: [string, string][];
	clusters: { key: string; color: string; clusterLabel: string }[];
}

export interface GraphNode {
	key: string;
	label: string;
	cluster: string;
	color: string;
	score: number;
	x: number;
	y: number;
}

export interface GraphModel {
	nodes: GraphNode[];
	nodeIndexByKey: Map<string, number>;
	edgeSources: Uint32Array;
	edgeTargets: Uint32Array;
	incidentEdges: Uint32Array[];
	nodesByDescendingScore: Uint32Array;
	nodesByDescendingDegree: Uint32Array;
}

export function createGraphModel(dataset: GraphDataset): GraphModel {
	const clusterColors = new Map(dataset.clusters.map((cluster) => [cluster.key, cluster.color]));
	const nodes = dataset.nodes.map((node) => ({
		key: node.key,
		label: node.label,
		cluster: node.cluster,
		color: clusterColors.get(node.cluster) ?? '#fdfcfc',
		score: node.score,
		x: node.x,
		y: node.y,
	}));
	const nodeIndexByKey = new Map(nodes.map((node, index) => [node.key, index]));
	const edgeSources: number[] = [];
	const edgeTargets: number[] = [];
	const seenEdges = new Set<number>();

	for (const [sourceKey, targetKey] of dataset.edges) {
		const source = nodeIndexByKey.get(sourceKey);
		const target = nodeIndexByKey.get(targetKey);
		if (source === undefined || target === undefined || source === target) continue;
		const lower = Math.min(source, target);
		const upper = Math.max(source, target);
		const edgeKey = lower * nodes.length + upper;
		if (seenEdges.has(edgeKey)) continue;
		seenEdges.add(edgeKey);
		edgeSources.push(lower);
		edgeTargets.push(upper);
	}

	const incidentEdges = Array.from({ length: nodes.length }, () => [] as number[]);
	for (let edge = 0; edge < edgeSources.length; edge += 1) {
		incidentEdges[edgeSources[edge]].push(edge);
		incidentEdges[edgeTargets[edge]].push(edge);
	}

	return {
		nodes,
		nodeIndexByKey,
		edgeSources: Uint32Array.from(edgeSources),
		edgeTargets: Uint32Array.from(edgeTargets),
		incidentEdges: incidentEdges.map((edges) => Uint32Array.from(edges)),
		nodesByDescendingScore: Uint32Array.from(nodes.map((_node, index) => index).sort((left, right) => nodes[right].score - nodes[left].score)),
		nodesByDescendingDegree: Uint32Array.from(
			nodes.map((_node, index) => index).sort((left, right) => incidentEdges[right].length - incidentEdges[left].length)
		),
	};
}
