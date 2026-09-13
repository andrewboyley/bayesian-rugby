interface GraphLike {
	neighbors(node: string): string[];
	areNeighbors(source: string, target: string): boolean;
	nodes(): string[];
	degree(node: string): number;
	forEachNode(callback: (node: string) => void): void;
	forEachEdge(callback: (edge: string) => void): void;
	extremities(edge: string): [string, string];
	getNodeAttributes(node: string): { x?: unknown; y?: unknown };
	setEdgeAttribute(edge: string, name: string, value: unknown): void;
}

interface RendererLike {
	getNormalizationFunction(): (position: { x: number; y: number }) => { x: number; y: number };
	getCamera(): { animate(state: { x: number; y: number; ratio: number }, options: { duration: number }): Promise<void>; getState(): { x: number; y: number; ratio: number } };
	setNodeState(node: string, state: Record<string, boolean | undefined>): void;
	setEdgeState(edge: string, state: Record<string, boolean>): void;
	setGraphState(state: Record<string, boolean>): void;
	refresh(): void;
}

export interface SelectionSnapshot {
	primaryNode: string | null;
	secondaryNode: string | null;
	activeNodes: string[];
	primaryEdges: string[];
	selectedEdges: string[];
	focusedNode: string | null;
	camera: { x: number; y: number; ratio: number };
}

export function createGraphSelectionController(graph: GraphLike, renderer: RendererLike) {
	let primaryNode: string | null = null;
	let secondaryNode: string | null = null;
	let focusedNode: string | null = null;

	function updateState(hoveredNode: string | null) {
		const activeNodes = primaryNode ? new Set([primaryNode, ...graph.neighbors(primaryNode)]) : hoveredNode ? new Set([hoveredNode, ...graph.neighbors(hoveredNode)]) : null;
		const hasSelectedPair = !!primaryNode && !!secondaryNode;
		graph.forEachNode((node) => renderer.setNodeState(node, { isActive: activeNodes?.has(node), isPrimary: node === primaryNode, isSecondary: node === secondaryNode }));
		graph.forEachEdge((edge) => {
			const [source, target] = graph.extremities(edge);
			const isSelected = hasSelectedPair && ((source === primaryNode && target === secondaryNode) || (source === secondaryNode && target === primaryNode));
			const isPrimaryEdge = hasSelectedPair && (source === primaryNode || target === primaryNode);
			const isActive = hasSelectedPair ? isSelected : source === (primaryNode ?? hoveredNode) || target === (primaryNode ?? hoveredNode);
			renderer.setEdgeState(edge, { isActive, isPrimaryEdge, isSelected });
			graph.setEdgeAttribute(edge, 'useGradient', hasSelectedPair ? isPrimaryEdge : isActive);
		});
		renderer.setGraphState({ hasActiveSubgraph: !!activeNodes, hasPrimarySelection: !!primaryNode, hasSelectedPair });
		renderer.refresh();
	}

	function focusPrimary(node: string) {
		focusedNode = node;
		const normalize = renderer.getNormalizationFunction();
		const coordinates = [node, ...graph.neighbors(node)].map((key) => {
			const { x, y } = graph.getNodeAttributes(key);
			return normalize({ x: x as number, y: y as number });
		});
		const minX = Math.min(...coordinates.map(({ x }) => x));
		const maxX = Math.max(...coordinates.map(({ x }) => x));
		const minY = Math.min(...coordinates.map(({ y }) => y));
		const maxY = Math.max(...coordinates.map(({ y }) => y));
		void renderer.getCamera().animate({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, ratio: Math.min(2, Math.max(0.1, Math.max(maxX - minX, maxY - minY, 0.05) * 1.3)) }, { duration: 600 });
	}

	function selectPrimary(node: string) {
		primaryNode = node;
		secondaryNode = null;
		updateState(null);
		focusPrimary(node);
	}

	function clickNode(node: string) {
		if (node === primaryNode) {
			if (secondaryNode) secondaryNode = null;
			else primaryNode = null;
			updateState(null);
			return;
		}
		if (node === secondaryNode) return selectPrimary(node);
		if (primaryNode && graph.areNeighbors(primaryNode, node)) {
			secondaryNode = node;
			updateState(null);
			return;
		}
		selectPrimary(node);
	}

	function clear() {
		primaryNode = null;
		secondaryNode = null;
		focusedNode = null;
		updateState(null);
	}

	function candidates() {
		const primary = graph.nodes().find((node) => graph.degree(node) > 0);
		if (!primary) throw new Error('selection test requires a connected node');
		const neighbor = graph.neighbors(primary)[0];
		const neighborhood = new Set([primary, ...graph.neighbors(primary)]);
		const nonNeighbor = graph.nodes().find((node) => !neighborhood.has(node));
		if (!neighbor || !nonNeighbor) throw new Error('selection test requires a non-neighbor');
		return { primary, neighbor, nonNeighbor };
	}

	function snapshot(): SelectionSnapshot {
		const camera = renderer.getCamera().getState();
		const activeNodes = primaryNode ? [primaryNode, ...graph.neighbors(primaryNode)] : [];
		const primaryEdges: string[] = [];
		const selectedEdges: string[] = [];
		graph.forEachEdge((edge) => {
			const [source, target] = graph.extremities(edge);
			if (primaryNode && secondaryNode && (source === primaryNode || target === primaryNode)) primaryEdges.push(edge);
			if (primaryNode && secondaryNode && ((source === primaryNode && target === secondaryNode) || (source === secondaryNode && target === primaryNode))) selectedEdges.push(edge);
		});
		return { primaryNode, secondaryNode, activeNodes, primaryEdges, selectedEdges, focusedNode, camera };
	}

	return { clickNode, clear, updateState, candidates, snapshot };
}
