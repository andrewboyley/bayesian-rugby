<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import GraphGrid from '#lib/components/GraphGrid.svelte';
	import GraphViewerControls from '#lib/components/GraphViewerControls.svelte';
	import PanelBar from '#lib/components/PanelBar.svelte';
	import WorkspacePanel from '#lib/components/WorkspacePanel.svelte';
	import { defaultForceAtlas2Settings, ForceAtlas2Layout, type ForceAtlas2Settings } from '#lib/graph/force-atlas2-layout.ts';
	import { createGraphModel } from '#lib/graph/graph-model.ts';
	import { GraphProjection } from '#lib/graph/graph-projection.ts';

	interface Dataset {
		nodes: { key: string; label: string; tag: string; cluster: string; x: number; y: number; score: number }[];
		edges: [string, string][];
		clusters: { key: string; color: string; clusterLabel: string }[];
	}

	interface PerformanceSnapshot {
		profile: string;
		antialiasEdges: boolean;
		edgeOpacity: number;
		enableEdgeEvents: boolean;
		pickingDownSizingRatio: number;
		edgePaths: string[];
		diagnostics: string[];
	}

	interface SelectionSnapshot {
		primaryNode: string | null;
		secondaryNode: string | null;
		activeNodes: string[];
		primaryEdges: string[];
		selectedEdges: string[];
		focusedNode: string | null;
		camera: { x: number; y: number; ratio: number };
	}

	interface SelectionTestController {
		candidates: () => { primary: string; neighbor: string; nonNeighbor: string };
		clickNode: (node: string) => void;
		doubleClickNode: (node: string) => void;
		clickStage: () => void;
		snapshot: () => SelectionSnapshot;
	}

	interface ProjectionSnapshot {
		visibleNodes: number;
		visibleEdges: number;
		layoutRunning: boolean;
		layoutActiveNodes: number;
		camera: { x: number; y: number; ratio: number };
	}

	interface ProjectionTestController {
		reveal: () => void;
		showFirstNode: () => void;
		showEmptyGraph: () => void;
		firstNodeViewport: () => Coordinates;
		firstNodeSize: () => number;
		firstNodeSizePx: () => number;
		firstNodePixelRadius: () => number;
		firstTwoNodeClearance: () => number;
		nodeViewports: () => { rawX: number; rawY: number; size: number; px: number; py: number }[];
		stopLayout: () => void;
		setCamera: (state: { x: number; y: number; ratio: number }) => void;
		addNode: () => void;
		snapshot: () => ProjectionSnapshot;
		lastTrace: () => { phase: string; ms: number }[];
	}

	type Coordinates = { x: number; y: number };

	let container = $state<HTMLDivElement | null>(null);
	let status = $state('loading dataset');
	let loaded = $state(false);
	let nodeCount = $state(0);
	let edgeCount = $state(0);
	let hasMoreNodes = $state(false);
	let addNode = $state<(() => void) | undefined>(undefined);
	let repeatingNodes = $state(false);
	let nodesPerSecond = $state(10);
	let toggleRepeatingNodes = $state<(() => void) | undefined>(undefined);
	let setNodesPerSecond = $state<((value: number) => void) | undefined>(undefined);
	let fa2Settings = $state<ForceAtlas2Settings>(defaultForceAtlas2Settings);
	let updateFa2Settings = $state<(<Key extends keyof ForceAtlas2Settings>(key: Key, value: ForceAtlas2Settings[Key]) => void)>(() => {});
	let statusShort = $derived(status === 'ready' ? 'ready' : status === 'dataset failed to load' ? 'data failed' : 'loading');

	let destroyRenderer: (() => void) | undefined;
	let primaryNode = $state<string | null>(null);
	let secondaryNode = $state<string | null>(null);
	let graphOpen = $state(true);
	let controlsOpen = $state(true);
	let resizeGraph = $state<(() => void) | undefined>(undefined);
	let gridViewportToGraph = $state<((coordinates: Coordinates) => Coordinates) | null>(null);
	let gridRevision = $state(0);
	let workspaceClass = $derived(
		graphOpen
			? controlsOpen
				? 'grid-rows-[minmax(0,1fr)_minmax(10rem,28dvh)] lg:grid-cols-[minmax(0,1fr)_28rem]'
				: 'grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_2.5rem]'
			: controlsOpen
				? 'grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[2.5rem_minmax(0,1fr)]'
				: 'content-start grid-rows-[auto_auto] lg:grid-cols-[2.5rem_2.5rem]'
	);

	function togglePanel(panel: 'graph' | 'controls') {
		if (panel === 'graph') graphOpen = !graphOpen;
		else controlsOpen = !controlsOpen;
		requestAnimationFrame(() => resizeGraph?.());
	}

	onMount(async () => {
		if (!container) return;
		const graphContainer = container;
		const performanceWindow = window as Window & {
			rugbyGraphPerformance?: PerformanceSnapshot;
			rugbyGraphSelectionTest?: SelectionTestController;
			rugbyGraphProjectionTest?: ProjectionTestController;
		};
		const searchParameters = new URLSearchParams(window.location.search);
		const performanceProfile = searchParameters.get('performance') ?? 'baseline';
		const edgeOpacity = performanceProfile === 'opaque' ? 1 : 0.3;
		const edgeColor = performanceProfile === 'opaque' ? '#424245' : '#646262';
		const antialiasEdges = performanceProfile !== 'aliased';
		const enableEdgeEvents = performanceProfile === 'edge-events';
		const pickingDownSizingRatio = performanceProfile === 'coarse-picking' ? 4 : 2;
		const diagnostics = new Set(
			searchParameters.has('perf') ? (searchParameters.get('perf') || 'timers,stats').split(',') : []
		);
		const hasDiagnostic = (name: string) => diagnostics.has('all') || diagnostics.has(name);

		const [{ default: Graph }, { default: Sigma, DEFAULT_STYLES, DEPTHLESS_STYLES }, { layerFill, layerGradient, layerPlain, pathLine }] = await Promise.all([
			import('graphology'),
			import('sigma'),
			import('sigma/rendering')
		]);

		let dataset: Dataset;
		try {
			const response = await fetch('/wikipedia.json');
			if (!response.ok) throw new Error('dataset request failed');
			dataset = await response.json();
			if (!Array.isArray(dataset.nodes) || dataset.nodes.length === 0 || !Array.isArray(dataset.edges) || !Array.isArray(dataset.clusters)) {
				throw new Error('dataset is invalid');
			}
		} catch {
			status = 'dataset failed to load';
			return;
		}

		const { minScore, maxScore } = dataset.nodes.reduce(
			({ minScore, maxScore }, { score }) => ({
				minScore: Math.min(minScore, score),
				maxScore: Math.max(maxScore, score),
			}),
			{ minScore: Infinity, maxScore: -Infinity }
		);

		const model = createGraphModel(dataset);
		const graph = new Graph();
		const projection = new GraphProjection(graph, model);
		if (
			searchParameters.get('test') === 'selection' ||
			(searchParameters.get('test') === 'projection' && !searchParameters.has('empty'))
		) {
			projection.applyDelta({ activate: Array.from({ length: model.nodes.length }, (_value, index) => index) });
			projection.rescaleVisibleSizes();
		}

		const renderer = new Sigma(graph, graphContainer, {
			settings: {
				autoRescale: false,
				itemSizesReference: 'positions',
				nodeLabelEvents: 'extend',
				antialiasEdges,
				enableEdgeEvents,
				pickingDownSizingRatio,
				zoomToSizeRatioFunction: (ratio) => ratio,
			},
			customNodeState: { isActive: false, isPrimary: false, isSecondary: false },
			customEdgeState: { isActive: false, isPrimaryEdge: false, isSelected: false },
			customGraphState: { hasActiveSubgraph: false, hasPrimarySelection: false, hasSelectedPair: false },
			primitives: {
				depthLayers: [
					'edges',
					'nodes',
					'activeEdges',
					'activeNodes',
					'topNodes',
				],
				nodes: {
					layers: [layerFill()],
				},
				edges: {
					variables: {
						sourceColor: { type: 'color', default: edgeColor },
						targetColor: { type: 'color', default: edgeColor },
						useGradient: { type: 'boolean', default: false },
					},
					paths: [pathLine()],
					layers: [
						layerPlain({ color: edgeColor }),
						layerGradient({
							stops: [{ attribute: 'sourceColor' }, { attribute: 'targetColor' }],
							enabled: { attribute: 'useGradient' },
						}),
					],
				},
			},
			styles: {
				nodes: [
					DEFAULT_STYLES.nodes,
					{
						color: {
							attribute: 'color',
						},
						label: { attribute: 'label' },
						labelColor: '#fdfcfc',
						labelFont: 'Berkeley Mono, JetBrains Mono, IBM Plex Mono, ui-monospace, monospace',
						labelSize: 12,
						labelPosition: 'right',
						labelBackgroundColor: '#201d1d',
						labelBackgroundPadding: 4,
						labelDepth: 'topNodes',
						labelVisibility: 'hidden',
						labelCursor: 'pointer',
					},
					{
						when: (_attrs: unknown, state: { isActive: boolean; isHovered: boolean; isLabelHovered: boolean }, graphState: { hasActiveSubgraph: boolean }) => graphState.hasActiveSubgraph && !state.isActive && !state.isHovered && !state.isLabelHovered,
						then: { color: '#424245', label: '', opacity: 0.12 },
					},
					{
						when: (_attrs: unknown, state: { isActive: boolean; isHovered: boolean; isLabelHovered: boolean; isPrimary: boolean; isSecondary: boolean }, graphState: { hasSelectedPair: boolean }) =>
							graphState.hasSelectedPair && state.isActive && !state.isPrimary && !state.isSecondary && !state.isHovered && !state.isLabelHovered,
						then: { label: '', opacity: 0.3 },
					},
					{
						when: (_attrs: unknown, state: { isActive: boolean; isHovered: boolean; isLabelHovered: boolean }, graphState: { hasSelectedPair: boolean }) =>
							graphState.hasSelectedPair && !state.isActive && !state.isHovered && !state.isLabelHovered,
						then: { color: '#424245', label: '', opacity: 0.12 },
					},
					{
						when: (_attrs: unknown, state: { isActive: boolean }, graphState: { hasPrimarySelection: boolean }) =>
							graphState.hasPrimarySelection && state.isActive,
						then: { label: { attribute: 'label' }, labelVisibility: 'auto' },
					},
					{
						whenState: 'isHovered',
						then: {
							backdropVisibility: 'visible',
							labelVisibility: 'visible',
							backdropColor: '#201d1d',
							backdropPadding: 8,
							backdropCornerRadius: 4,
							backdropBorderColor: {
								attribute: 'color',
							},
							backdropBorderWidth: 1,
							backdropShadowColor: 'transparent',
							backdropShadowBlur: 0,
							backdropArea: 'both',
						},
					},
					{
						whenState: 'isLabelHovered',
						then: {
							backdropVisibility: 'visible',
							labelVisibility: 'visible',
							backdropColor: '#201d1d',
							backdropPadding: 8,
							backdropCornerRadius: 4,
							backdropBorderColor: { attribute: 'color' },
							backdropBorderWidth: 1,
							backdropShadowColor: 'transparent',
							backdropShadowBlur: 0,
							backdropArea: 'both',
						},
					},
					{
						whenState: 'isActive',
						then: { depth: 'activeNodes' },
					},
					{
						whenState: 'isPrimary',
						then: { depth: 'topNodes' },
					},
					{
						whenState: 'isSecondary',
						then: { depth: 'topNodes' },
					},
					{
						whenState: 'isHovered',
						then: { depth: 'topNodes' },
					},
					{
						whenState: 'isLabelHovered',
						then: { depth: 'topNodes' },
					},
				],
				edges: [
					DEPTHLESS_STYLES.edges,
					{ color: edgeColor, opacity: edgeOpacity, size: 1, path: 'line' },
					{
						when: (_attrs: unknown, state: { isActive: boolean }, graphState: { hasActiveSubgraph: boolean }) => graphState.hasActiveSubgraph && !state.isActive,
						then: { color: '#424245', opacity: 0.05 },
					},
					{
						whenState: 'isPrimaryEdge',
						then: { opacity: 0.3, depth: 'activeEdges' },
					},
					{
						whenState: 'isActive',
						then: { opacity: 1, depth: 'activeEdges' },
					},
					{
						whenState: 'isSelected',
						then: { opacity: 1, depth: 'activeEdges' },
					},
				],
			},
		});
		let gridFrame: number | undefined;
		let sizeFrame: number | undefined;
		function scheduleGridRedraw() {
			if (gridFrame !== undefined) return;
			gridFrame = requestAnimationFrame(() => {
				gridFrame = undefined;
				gridRevision += 1;
			});
		}
		function scheduleVisibleSizeRescale() {
			if (sizeFrame !== undefined) return;
			sizeFrame = requestAnimationFrame(() => {
				sizeFrame = undefined;
				projection.rescaleVisibleSizes();
			});
		}
		gridViewportToGraph = (coordinates) => {
			return renderer.viewportToGraph(coordinates);
		};
		resizeGraph = () => {
			renderer.resize();
			scheduleGridRedraw();
		};
		renderer.getCamera().on('updated', scheduleGridRedraw);
		scheduleGridRedraw();
		const layout = new ForceAtlas2Layout(graph);
		updateFa2Settings = (key, value) => {
			fa2Settings = { ...fa2Settings, [key]: value };
			layout.setSettings({ [key]: value });
		};
		let revealRun = 0;
		let revealTimer: number | undefined;
		let addNodesInterval: ReturnType<typeof setInterval> | undefined;
		let addNodesAccumulator = 0;
		let lastAddNodesTick = 0;
		let revealTrace: { phase: string; ms: number }[] = [];
		const popFrames: number[] = [];
		let nextNodeOffset = 0;

		let focusedNode: string | null = null;

		const RADIUS_ONE_SCREEN_PX = 24;
		function radiusOneFocusRatio() {
			const { width, height } = renderer.getDimensions();
			return Math.min(width, height) / (Math.max(width, height) * RADIUS_ONE_SCREEN_PX);
		}
		function radiusOneMinimumSpan() {
			return radiusOneFocusRatio() / 1.2;
		}

		function focusGraphBounds(minX: number, maxX: number, minY: number, maxY: number, minimumSpan?: number) {
			const normalize = renderer.getNormalizationFunction();
			const { width, height } = renderer.getDimensions();
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
				ratio: Math.max(spanX, spanY * (width / height), minimumSpan ?? 0) * 1.2,
			};
		}

		function focusNodes(nodes: string[], focused: string | null) {
			focusedNode = focused;
			const bounds = nodes.reduce(
				(bounds, key) => {
					const { x, y, size } = graph.getNodeAttributes(key);
					const radius = size as number;
					return {
						minX: Math.min(bounds.minX, (x as number) - radius),
						maxX: Math.max(bounds.maxX, (x as number) + radius),
						minY: Math.min(bounds.minY, (y as number) - radius),
						maxY: Math.max(bounds.maxY, (y as number) + radius)
					};
				},
				{ minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
			);
			void renderer.getCamera().animate(
				focusGraphBounds(bounds.minX, bounds.maxX, bounds.minY, bounds.maxY, nodes.length === 1 ? radiusOneMinimumSpan() : undefined),
				{ duration: 600 }
			);
		}

		function focusPrimaryNeighborhood(node: string) {
			focusNodes([node, ...graph.neighbors(node)], node);
		}

		function fitVisibleNodes() {
			focusNodes(graph.nodes(), null);
		}

		function updateGraphState(hoveredNode: string | null) {
			const activeNodes = primaryNode
				? new Set([primaryNode, ...graph.neighbors(primaryNode)])
				: hoveredNode
					? new Set([hoveredNode, ...graph.neighbors(hoveredNode)])
					: null;
			const hasSelectedPair = !!primaryNode && !!secondaryNode;

			graph.forEachNode((node) => {
				renderer.setNodeState(node, {
					isActive: activeNodes?.has(node),
					isPrimary: node === primaryNode,
					isSecondary: node === secondaryNode,
				});
			});

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

		function selectPrimaryNode(node: string) {
			primaryNode = node;
			secondaryNode = null;
			updateGraphState(null);
			focusPrimaryNeighborhood(node);
		}

		function setGraphCursor(cursor: string) {
			graphContainer.style.cursor = cursor;
			graphContainer.querySelector<HTMLElement>('.sigma-mouse')?.style.setProperty('cursor', cursor);
		}

		function handleNodeClick(node: string) {
			if (node === primaryNode) {
				if (secondaryNode) {
					secondaryNode = null;
				} else {
					primaryNode = null;
				}
				updateGraphState(null);
				return;
			}

			if (node === secondaryNode) {
				selectPrimaryNode(node);
				return;
			}

			if (primaryNode && graph.areNeighbors(primaryNode, node)) {
				secondaryNode = node;
				updateGraphState(null);
				return;
			}

			selectPrimaryNode(node);
		}

		function clearSelection() {
			primaryNode = null;
			secondaryNode = null;
			focusedNode = null;
			updateGraphState(null);
		}

		function projectionSnapshot(): ProjectionSnapshot {
			const layoutSnapshot = layout.snapshot();
			const { x, y, ratio } = renderer.getCamera().getState();
			return {
				visibleNodes: projection.visibleCount(),
				visibleEdges: graph.size,
				layoutRunning: layoutSnapshot.running,
				layoutActiveNodes: layoutSnapshot.activeNodes,
				camera: { x, y, ratio },
			};
		}

		function animateNodePop(indices: number[]) {
			const startedAt = performance.now();
			const frame = (now: number) => {
				const progress = Math.min(1, (now - startedAt) / 180);
				projection.setPopScale(indices, progress * progress * (3 - 2 * progress));
				if (progress < 1) {
					const nextFrame = requestAnimationFrame(frame);
					popFrames.push(nextFrame);
				}
			};
			const initialFrame = requestAnimationFrame(frame);
			popFrames.push(initialFrame);
		}

		function addNextNodeByDegree() {
			const index = model.nodesByDescendingDegree[nextNodeOffset];
			if (index === undefined) return;
			projection.applyDelta({ activate: [index] }, 1, true);
			const angle = index * 2.399963229728653;
			projection.setPosition(index, Math.cos(angle) * 0.001, Math.sin(angle) * 0.001);
			scheduleVisibleSizeRescale();
			scheduleGridRedraw();
			nextNodeOffset += 1;
			nodeCount = projection.visibleCount();
			edgeCount = graph.size;
			hasMoreNodes = nextNodeOffset < model.nodesByDescendingDegree.length;
			if (!hasMoreNodes && addNodesInterval !== undefined) {
				clearInterval(addNodesInterval);
				addNodesInterval = undefined;
				repeatingNodes = false;
			}
		}

		function stopRepeatingNodes() {
			if (addNodesInterval !== undefined) clearInterval(addNodesInterval);
			addNodesInterval = undefined;
			addNodesAccumulator = 0;
			repeatingNodes = false;
		}

		const ADD_NODES_CADENCE_MS = 100;

		function addNodesBatch() {
			if (!repeatingNodes) return;
			const now = performance.now();
			const elapsedSeconds = (now - lastAddNodesTick) / 1000;
			lastAddNodesTick = now;
			addNodesAccumulator += elapsedSeconds * nodesPerSecond;
			let count = Math.floor(addNodesAccumulator);
			addNodesAccumulator -= count;
			if (count < 0) count = 0;
			for (let i = 0; i < count; i++) {
				if (!hasMoreNodes) return;
				addNextNodeByDegree();
			}
		}

		function startRepeatingNodes() {
			if (!hasMoreNodes) return;
			repeatingNodes = true;
			addNodesAccumulator = 0;
			lastAddNodesTick = performance.now();
			addNextNodeByDegree();
			addNodesInterval = setInterval(addNodesBatch, ADD_NODES_CADENCE_MS);
		}

		function updateNodesPerSecond(value: number) {
			nodesPerSecond = value;
		}

		function revealNodesByScore() {
			const run = ++revealRun;
			let phaseStart = performance.now();
			const markPhase = (label: string) => {
				revealTrace.push({ phase: label, ms: Math.round(performance.now() - phaseStart) });
				phaseStart = performance.now();
			};
			revealTrace = [];
			clearSelection();
			markPhase('clearSelection');
			graph.clear();
			projection.resetVisible();
			markPhase('deactivate');
			markPhase('layoutReset');
			nodeCount = 0;
			edgeCount = 0;
			renderer.refresh();

			let offset = 0;
			const firstBatchStart = performance.now();
			const revealNextBatch = () => {
				if (run !== revealRun) return;
				const batch = Array.from(model.nodesByDescendingScore.slice(offset, offset + 32)) as number[];
			if (!batch.length) {
					scheduleGridRedraw();
					renderer.refresh();
					return;
				}
				projection.applyDelta({ activate: batch }, 0.01);
				scheduleVisibleSizeRescale();
				scheduleGridRedraw();
				animateNodePop(batch);
				nodeCount = projection.visibleCount();
				edgeCount = graph.size;
				offset += batch.length;
				if (offset === batch.length) revealTrace.push({ phase: 'firstBatch', ms: Math.round(performance.now() - firstBatchStart) });
				revealTimer = window.setTimeout(revealNextBatch, 28);
			};
			revealNextBatch();
		}

		function showFirstNode() {
			stopRepeatingNodes();
			clearSelection();
			graph.clear();
			projection.resetVisible();
			nextNodeOffset = 0;
			nodeCount = 0;
			edgeCount = 0;
			addNextNodeByDegree();
		}

		function showEmptyGraph() {
			stopRepeatingNodes();
			clearSelection();
			graph.clear();
			projection.resetVisible();
			nextNodeOffset = 0;
			nodeCount = 0;
			edgeCount = 0;
			centerEmptyGraph(false);
			scheduleGridRedraw();
		}

		function centerEmptyGraph(animate = true) {
			if (projection.visibleCount() !== 0) return;
			const state = { x: 0.5, y: 0.5, ratio: radiusOneFocusRatio() };
			if (animate) void renderer.getCamera().animate(state, { duration: 600 });
			else renderer.getCamera().setState(state);
		}

	function selectionSnapshot(): SelectionSnapshot {
			const { x, y, ratio } = renderer.getCamera().getState();
			const activeNodes = primaryNode ? [primaryNode, ...graph.neighbors(primaryNode)] : [];
			const primaryEdges: string[] = [];
			const selectedEdges: string[] = [];

			graph.forEachEdge((edge) => {
				const [source, target] = graph.extremities(edge);
				if (primaryNode && secondaryNode && (source === primaryNode || target === primaryNode)) primaryEdges.push(edge);
				if (primaryNode && secondaryNode && ((source === primaryNode && target === secondaryNode) || (source === secondaryNode && target === primaryNode))) {
					selectedEdges.push(edge);
				}
			});

			return { primaryNode, secondaryNode, activeNodes, primaryEdges, selectedEdges, focusedNode, camera: { x, y, ratio } };
		}

		function selectionCandidates() {
			const primary = graph.nodes().find((node) => graph.degree(node) > 0);
			if (!primary) throw new Error('selection test requires a connected node');
			const neighbor = graph.neighbors(primary)[0];
			const primaryNeighborhood = new Set([primary, ...graph.neighbors(primary)]);
			const nonNeighbor = graph.nodes().find((node) => !primaryNeighborhood.has(node));
			if (!neighbor || !nonNeighbor) throw new Error('selection test requires a non-neighbor');
			return { primary, neighbor, nonNeighbor };
		}

		renderer.on('enterNode', ({ node }) => {
			setGraphCursor('pointer');
			if (!primaryNode) updateGraphState(node);
		});

		renderer.on('leaveNode', () => {
			setGraphCursor('');
			if (!primaryNode) updateGraphState(null);
		});

	renderer.on('clickNode', ({ node }) => handleNodeClick(node));
		renderer.on('doubleClickNode', ({ node, event }) => {
			event.preventSigmaDefault();
			focusPrimaryNeighborhood(node);
		});
		renderer.on('doubleClickNodeLabel', ({ node, event }) => {
			event.preventSigmaDefault();
			focusPrimaryNeighborhood(node);
		});
		renderer.on('clickStage', () => {
			clearSelection();
		});
		renderer.on('doubleClickStage', ({ event }) => {
			event.preventSigmaDefault();
			if (projection.visibleCount() === 0) centerEmptyGraph();
			else fitVisibleNodes();
		});

		if (hasDiagnostic('timers')) {
			renderer.setSetting('DEBUG_gpuTimerQueries', true);
		}
		if (hasDiagnostic('stats')) {
			renderer.setSetting('DEBUG_logRenderStats', true);
		}
		if (hasDiagnostic('shaders')) renderer.setSetting('DEBUG_logShaders', true);
		if (hasDiagnostic('picking')) renderer.setSetting('DEBUG_displayPickingLayer', true);
		if (searchParameters.has('performance') || searchParameters.has('perf')) {
			performanceWindow.rugbyGraphPerformance = {
				profile: performanceProfile,
				antialiasEdges,
				edgeOpacity,
				enableEdgeEvents,
				pickingDownSizingRatio,
				edgePaths: ['line'],
				diagnostics: [...diagnostics],
			};
		}
		if (searchParameters.get('test') === 'selection') {
		performanceWindow.rugbyGraphSelectionTest = {
			candidates: selectionCandidates,
			clickNode: handleNodeClick,
			doubleClickNode: focusPrimaryNeighborhood,
			clickStage: clearSelection,
				snapshot: selectionSnapshot,
			};
		}
		if (searchParameters.get('test') === 'projection') {
		performanceWindow.rugbyGraphProjectionTest = {
			reveal: revealNodesByScore,
			showFirstNode,
			showEmptyGraph,
			addNode: addNextNodeByDegree,
			firstNodeViewport: () => {
				const [node] = graph.nodes();
				if (!node) throw new Error('first node is unavailable');
				const { x, y } = graph.getNodeAttributes(node);
				return renderer.graphToViewport({ x: x as number, y: y as number });
			},
			firstNodeSize: () => {
				const [node] = graph.nodes();
				if (!node) throw new Error('first node is unavailable');
				return graph.getNodeAttributes(node).size as number;
			},
			firstNodeSizePx: () => {
				const [node] = graph.nodes();
				if (!node) throw new Error('first node is unavailable');
				return graph.getNodeAttributes(node).size as number;
			},
			firstNodePixelRadius: () => {
				const [node] = graph.nodes();
				if (!node) throw new Error('first node is unavailable');
				const { x, y, size } = graph.getNodeAttributes(node);
				const center = renderer.graphToViewport({ x: x as number, y: y as number });
				const edge = renderer.graphToViewport({ x: (x as number) + (size as number), y: y as number });
				return Math.hypot(edge.x - center.x, edge.y - center.y);
			},
			firstTwoNodeClearance: () => {
				const [first, second] = graph.nodes();
				if (!first || !second) throw new Error('two nodes are required');
				const firstNode = graph.getNodeAttributes(first);
				const secondNode = graph.getNodeAttributes(second);
				return (
					Math.hypot((firstNode.x as number) - (secondNode.x as number), (firstNode.y as number) - (secondNode.y as number)) -
					(firstNode.size as number) -
					(secondNode.size as number)
				);
			},
			setCamera: (state) => renderer.getCamera().setState(state),
			stopLayout: () => layout.stop(),
			nodeViewports: () =>
				graph.nodes().map((node) => {
					const { x, y, size } = graph.getNodeAttributes(node);
					const viewport = renderer.graphToViewport({ x: x as number, y: y as number });
					return {
						rawX: x as number,
						rawY: y as number,
						size: size as number,
						px: viewport.x,
						py: viewport.y,
					};
				}),
				snapshot: projectionSnapshot,
				lastTrace: () => revealTrace,
			};
		}
		centerEmptyGraph(false);
		addNode = addNextNodeByDegree;
		toggleRepeatingNodes = () => (repeatingNodes ? stopRepeatingNodes() : startRepeatingNodes());
		setNodesPerSecond = updateNodesPerSecond;
		destroyRenderer = () => {
			resizeGraph = undefined;
				addNode = undefined;
				toggleRepeatingNodes = undefined;
				setNodesPerSecond = undefined;
				stopRepeatingNodes();
				revealRun += 1;
			if (revealTimer !== undefined) window.clearTimeout(revealTimer);
			for (const frame of popFrames) cancelAnimationFrame(frame);
			if (gridFrame !== undefined) cancelAnimationFrame(gridFrame);
			if (sizeFrame !== undefined) cancelAnimationFrame(sizeFrame);
			layout.destroy();
			delete performanceWindow.rugbyGraphSelectionTest;
			delete performanceWindow.rugbyGraphProjectionTest;
			renderer.kill();
		};

		hasMoreNodes = model.nodesByDescendingDegree.length > 0;
		loaded = true;
		status = 'ready';
		performance.mark('rugby-graph:graph-ready');
	});

	onDestroy(() => destroyRenderer?.());
</script>

<div class={`grid min-h-0 flex-1 grid-cols-1 gap-sm ${workspaceClass} lg:grid-rows-1`}>
	<WorkspacePanel as="section" id="graph-viewer" tabIndex={-1} label="Graph viewer" open={graphOpen} panelClass={graphOpen ? 'flex-1' : ''}>
		<PanelBar title="graph" open={graphOpen} controls="graph-viewer-panel" vertical={!graphOpen} onToggle={() => togglePanel('graph')}>
			<span class:hidden={!graphOpen} class="min-w-0 whitespace-nowrap text-caption text-mute" aria-live="polite">
				{#if statusShort === status}
					{status}
				{:else}
					<span class="sm:hidden">{statusShort}</span><span class="hidden sm:inline">{status}</span>
				{/if}
			</span>
		</PanelBar>
		<div id="graph-viewer-panel" class:hidden={!graphOpen} class="relative flex min-h-0 flex-1 bg-surface-dark">
				<GraphGrid viewportToGraph={gridViewportToGraph} revision={gridRevision} />
				<div bind:this={container} class="relative z-10 min-h-0 flex-1"></div>
				{#if !loaded}
					<div class="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-xs p-md text-center" role="status" aria-live="polite">
						<p class="m-0 font-medium text-on-primary">{status === 'dataset failed to load' ? '[ data unavailable ]' : '[ loading graph ]'}</p>
						<p class="m-0 text-on-primary">{status === 'dataset failed to load' ? 'dataset failed to load' : 'building network'}</p>
						<p class="m-0 text-ash">{status === 'dataset failed to load' ? 'refresh to try again' : 'loading nodes and edges'}</p>
					</div>
				{/if}
		</div>
		<footer class:hidden={!graphOpen} class="flex items-center gap-lg border-t border-hairline px-sm py-xs text-caption sm:px-md">
			<span class="font-normal tabular-nums text-mute">nodes {nodeCount} · edges {edgeCount}</span>
		</footer>
	</WorkspacePanel>
	<WorkspacePanel as="aside" label="Graph controls" open={controlsOpen}>
		<GraphViewerControls open={controlsOpen} onToggle={() => togglePanel('controls')} {loaded} {hasMoreNodes} onAddNode={addNode} repeating={repeatingNodes} {nodesPerSecond} onToggleRepeating={toggleRepeatingNodes} onNodesPerSecondChange={setNodesPerSecond} settings={fa2Settings} onSettingsChange={updateFa2Settings} />
	</WorkspacePanel>
</div>
