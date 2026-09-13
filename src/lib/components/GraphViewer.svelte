<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

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
	}

	interface SelectionTestController {
		candidates: () => { primary: string; neighbor: string; nonNeighbor: string };
		clickNode: (node: string) => void;
		clickStage: () => void;
		snapshot: () => SelectionSnapshot;
	}

	let container = $state<HTMLDivElement | null>(null);
	let status = $state('loading dataset');
	let loaded = $state(false);
	let nodeCount = $state(0);
	let edgeCount = $state(0);

	let destroyRenderer: (() => void) | undefined;
	let centerView = $state<(() => void) | undefined>(undefined);
	let primaryNode = $state<string | null>(null);
	let secondaryNode = $state<string | null>(null);

	onMount(async () => {
		if (!container) return;
		const graphContainer = container;
		const performanceWindow = window as Window & {
			rugbyGraphPerformance?: PerformanceSnapshot;
			rugbyGraphSelectionTest?: SelectionTestController;
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

		const { minScore, maxScore, minX, maxX, minY, maxY } = dataset.nodes.reduce(
			({ minScore, maxScore, minX, maxX, minY, maxY }, { score, x, y }) => ({
				minScore: Math.min(minScore, score),
				maxScore: Math.max(maxScore, score),
				minX: Math.min(minX, x),
				maxX: Math.max(maxX, x),
				minY: Math.min(minY, y),
				maxY: Math.max(maxY, y),
			}),
			{ minScore: Infinity, maxScore: -Infinity, minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
		);

		const clusterColors = Object.fromEntries(dataset.clusters.map((cluster) => [cluster.key, cluster.color]));
		const cameraMargin = Math.max(maxX - minX, maxY - minY) * 0.2;
		const graph = new Graph();

		for (const node of dataset.nodes) {
			graph.addNode(node.key, {
				label: node.label,
				x: node.x,
				y: node.y,
				cluster: node.cluster,
				color: clusterColors[node.cluster] ?? '#fdfcfc',
				score: node.score,
			});
		}

		for (const [source, target] of dataset.edges) {
			if (graph.hasNode(source) && graph.hasNode(target) && !graph.hasEdge(source, target)) {
				graph.addEdge(source, target, {
					sourceColor: graph.getNodeAttribute(source, 'color'),
					targetColor: graph.getNodeAttribute(target, 'color'),
					useGradient: false,
				});
			}
		}

		const renderer = new Sigma(graph, graphContainer, {
			settings: {
				// Keep room around every outer edge for nodes and their labels.
				cameraPanBoundaries: {
					boundaries: {
						x: [minX - cameraMargin, maxX + cameraMargin],
						y: [minY - cameraMargin, maxY + cameraMargin],
					},
					tolerance: 0,
				},
				minCameraRatio: 0.05,
				maxCameraRatio: 2,
				nodeLabelEvents: "extend",
				antialiasEdges,
				enableEdgeEvents,
				pickingDownSizingRatio,
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
						size: { attribute: 'score', min: 10, max: 50, minValue: minScore, maxValue: maxScore },
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
						then: { label: { attribute: 'label' }, labelVisibility: 'visible' },
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

		let focusedNode: string | null = null;

		function focusPrimaryNeighborhood(node: string) {
			focusedNode = node;
			const nodes = [node, ...graph.neighbors(node)];
			const coordinates = nodes.map((key) => graph.getNodeAttributes(key));
			const neighborhoodMinX = Math.min(...coordinates.map(({ x }) => x as number));
			const neighborhoodMaxX = Math.max(...coordinates.map(({ x }) => x as number));
			const neighborhoodMinY = Math.min(...coordinates.map(({ y }) => y as number));
			const neighborhoodMaxY = Math.max(...coordinates.map(({ y }) => y as number));
			const width = Math.max(neighborhoodMaxX - neighborhoodMinX, (maxX - minX) * 0.05);
			const height = Math.max(neighborhoodMaxY - neighborhoodMinY, (maxY - minY) * 0.05);
			const padding = 1.3;

			void renderer.getCamera().animate(
				{
					x: (neighborhoodMinX + neighborhoodMaxX - minX * 2) / (maxX - minX) / 2,
					y: (neighborhoodMinY + neighborhoodMaxY - minY * 2) / (maxY - minY) / 2,
					ratio: Math.min(2, Math.max(0.1, Math.max(width / (maxX - minX), height / (maxY - minY)) * padding)),
				},
				{ duration: 600 }
			);
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

		function selectionSnapshot(): SelectionSnapshot {
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

			return { primaryNode, secondaryNode, activeNodes, primaryEdges, selectedEdges, focusedNode };
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
		renderer.on('clickStage', () => {
			clearSelection();
		});

		renderer.on('doubleClickStage', ({ event }) => {
			event.preventSigmaDefault();
			centerView?.();
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
				clickStage: clearSelection,
				snapshot: selectionSnapshot,
			};
		}
		centerView = () => {
			void renderer.getCamera().reset({ duration: 600 });
		};
		destroyRenderer = () => {
			centerView = undefined;
			delete performanceWindow.rugbyGraphSelectionTest;
			renderer.kill();
		};

		nodeCount = graph.order;
		edgeCount = graph.size;
		loaded = true;
		status = 'ready';
		performance.mark('rugby-graph:graph-ready');
	});

	onDestroy(() => destroyRenderer?.());
</script>

<section id="graph-viewer" tabindex="-1" class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border border-hairline-strong bg-canvas" aria-label="Graph viewer">
	<header class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-sm border-b border-hairline px-sm py-xs sm:gap-md sm:px-md">
		<span class="whitespace-nowrap text-label-md font-medium">[ graph ]</span>
		<span class="min-w-0 whitespace-nowrap text-caption text-mute" aria-live="polite">
			<span class="sm:hidden">{status === 'wikipedia concept network' ? 'ready' : status === 'dataset failed to load' ? 'data failed' : 'loading'}</span>
			<span class="hidden sm:inline">{status}</span>
		</span>
		<button
			type="button"
			class="inline-flex min-h-9 shrink-0 cursor-pointer items-center whitespace-nowrap border border-hairline-strong px-xs py-0.5 text-caption text-mute transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
			onclick={() => centerView?.()}
			disabled={!centerView}
		>
			[ center view ]
		</button>
	</header>
	<div class="relative flex min-h-0 flex-1">
		<div bind:this={container} class="min-h-0 flex-1 bg-surface-dark"></div>
		{#if !loaded}
			<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-xs p-md text-center" role="status" aria-live="polite">
				<p class="m-0 font-medium text-on-primary">{status === 'dataset failed to load' ? '[ data unavailable ]' : '[ loading graph ]'}</p>
				<p class="m-0 text-on-primary">{status === 'dataset failed to load' ? 'dataset failed to load' : 'building network'}</p>
				<p class="m-0 text-ash">{status === 'dataset failed to load' ? 'refresh to try again' : 'loading nodes and edges'}</p>
			</div>
		{/if}
	</div>
	<footer class="flex items-center gap-lg border-t border-hairline px-sm py-xs text-caption sm:px-md">
		<span class="font-normal tabular-nums text-mute">nodes {nodeCount} · edges {edgeCount}</span>
	</footer>
</section>
