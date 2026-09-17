<script lang="ts">
	import type { ForceAtlas2Settings } from '#lib/graph/force-atlas2-layout.ts';
	import type { GraphSettings } from '#lib/config/graph-settings.ts';
	import Button from '#lib/components/Button.svelte';
	import CollapsibleSection from '#lib/components/CollapsibleSection.svelte';
	import Tooltip from '#lib/components/Tooltip.svelte';
	import WorkspaceTabs from '#lib/components/WorkspaceTabs.svelte';

	let {
		open,
		onToggle,
		loaded,
		hasMoreNodes,
		onAddNode,
		repeating,
		nodesPerSecond,
		onToggleRepeating,
		onNodesPerSecondChange,
		settings,
		onSettingsChange,
		graphSettings,
		onGraphSettingsChange,
	}: {
		open: boolean;
		onToggle: () => void;
		loaded: boolean;
		hasMoreNodes: boolean;
		onAddNode: (() => void) | undefined;
		repeating: boolean;
		nodesPerSecond: number;
		onToggleRepeating: (() => void) | undefined;
		onNodesPerSecondChange: ((value: number) => void) | undefined;
		settings: ForceAtlas2Settings;
		onSettingsChange: <Key extends keyof ForceAtlas2Settings>(key: Key, value: ForceAtlas2Settings[Key]) => void;
		graphSettings: GraphSettings;
		onGraphSettingsChange: (partial: Partial<GraphSettings>) => void;
	} = $props();

	type Tab = 'graph' | 'layout' | 'settings';
	let activeTab = $state<Tab>('graph');
	const tabs = [
		{ id: 'graph', label: 'graph', panelId: 'graph-panel' },
		{ id: 'layout', label: 'layout', panelId: 'layout-panel' },
		{ id: 'settings', label: 'settings', panelId: 'settings-panel' },
	];

	function selectTab(tab: Tab) {
		activeTab = tab;
		if (!open) onToggle();
	}

	function clickTab(tab: Tab) {
		if (open && activeTab === tab) {
			onToggle();
			return;
		}
		selectTab(tab);
	}

	// ── Settings panel configuration ──────────────────────────────────

	type DomainKey = 'camera' | 'rendering' | 'layout';

	interface SettingField {
		key: `${DomainKey}.${string}`;
		label: string;
		type: 'range' | 'display';
		min?: number;
		max?: number;
		step?: number;
		tooltip: string;
	}

	const settingsSections: { id: DomainKey; label: string; fields: SettingField[] }[] = [
		{
			id: 'camera',
			label: 'camera',
			fields: [
				{ key: 'camera.radiusOneScreenPx', label: 'radius', type: 'range', min: 10, max: 60, step: 1, tooltip: 'Target pixel radius for one screen-width of graph content. Higher = wider view.' },
				{ key: 'camera.ratioFactor', label: 'ratio', type: 'range', min: 1, max: 3, step: 0.1, tooltip: 'Aspect ratio compensation factor. Adjusts vertical scaling relative to horizontal.' },
				{ key: 'camera.defaultCenterX', label: 'center X', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Default horizontal center position (0=left, 1=right) when no node is selected.' },
				{ key: 'camera.defaultCenterY', label: 'center Y', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Default vertical center position (0=top, 1=bottom) when no node is selected.' },
				{ key: 'camera.focusRatioMin', label: 'focus min', type: 'range', min: 0.05, max: 0.5, step: 0.01, tooltip: 'Minimum viewport fraction that a focused node neighborhood must occupy.' },
				{ key: 'camera.focusRatioMax', label: 'focus max', type: 'range', min: 1, max: 5, step: 0.1, tooltip: 'Maximum viewport fraction that a focused node neighborhood may occupy.' },
				{ key: 'camera.focusRatioFactor', label: 'focus factor', type: 'range', min: 1, max: 2, step: 0.05, tooltip: 'Multiplier applied to the calculated focus span. Higher = more padding around selection.' },
				{ key: 'camera.minSpan', label: 'min span', type: 'range', min: 0.01, max: 0.2, step: 0.005, tooltip: 'Minimum camera span in world units. Prevents over-zooming on single nodes.' },
				{ key: 'camera.animationDurationMs', label: 'duration', type: 'range', min: 200, max: 2000, step: 50, tooltip: 'Camera transition animation duration in milliseconds.' },
			],
		},
		{
			id: 'rendering',
			label: 'rendering',
			fields: [
				{ key: 'rendering.edgeOpacity', label: 'edge', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Base opacity for edges in the active neighborhood.' },
				{ key: 'rendering.edgeOpacityOpaque', label: 'edge opaque', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Opacity for fully opaque edges (selected or emphasized connections).' },
				{ key: 'rendering.edgeInactiveOpacity', label: 'edge inactive', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Opacity of edges not connected to the active selection or hover neighborhood.' },
				{ key: 'rendering.nodeInactiveOpacity', label: 'node inactive', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Opacity of nodes not in the active selection or hover neighborhood.' },
				{ key: 'rendering.nodeActiveOpacity', label: 'node active', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Opacity of nodes in the active selection or direct neighbors of hovered node.' },
				{ key: 'rendering.nodePairInactiveOpacity', label: 'node pair', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Opacity for nodes in the inactive pair state during selection interactions.' },
				{ key: 'rendering.edgePairInactiveOpacity', label: 'edge pair', type: 'range', min: 0, max: 1, step: 0.05, tooltip: 'Opacity for edges not in the selected pair when a primary/secondary pair exists.' },
				{ key: 'rendering.labelFontSize', label: 'label font', type: 'range', min: 8, max: 24, step: 1, tooltip: 'Font size in pixels for node labels.' },
				{ key: 'rendering.labelBackgroundPadding', label: 'label pad', type: 'range', min: 0, max: 12, step: 1, tooltip: 'Padding around label text inside the label backdrop box.' },
				{ key: 'rendering.backdropPadding', label: 'backdrop pad', type: 'range', min: 0, max: 20, step: 1, tooltip: 'Padding around the entire label backdrop (text + background).' },
				{ key: 'rendering.backdropCornerRadius', label: 'backdrop radius', type: 'range', min: 0, max: 12, step: 1, tooltip: 'Corner radius in pixels for the label backdrop rectangle.' },
				{ key: 'rendering.backdropBorderWidth', label: 'backdrop border', type: 'range', min: 0, max: 4, step: 1, tooltip: 'Border width in pixels for the label backdrop.' },
				{ key: 'rendering.backdropShadowBlur', label: 'backdrop blur', type: 'range', min: 0, max: 20, step: 1, tooltip: 'Shadow blur radius for the label backdrop (0 = no shadow).' },
				{ key: 'rendering.pickingDownSizingRatioCoarse', label: 'coarse picking', type: 'range', min: 1, max: 8, step: 1, tooltip: 'Downsampling ratio for coarse picking pass (lower = more precise, slower).' },
				{ key: 'rendering.pickingDownSizingRatioNormal', label: 'normal picking', type: 'range', min: 1, max: 8, step: 1, tooltip: 'Downsampling ratio for normal picking pass (lower = more precise, slower).' },
			],
		},
		{
			id: 'layout',
			label: 'layout',
			fields: [
				{ key: 'layout.popAnimationDurationMs', label: 'pop duration', type: 'range', min: 50, max: 500, step: 10, tooltip: 'Animation duration in ms when new nodes pop into view.' },
				{ key: 'layout.goldenAngle', label: 'golden angle', type: 'display', tooltip: 'Golden angle constant (≈137.5°) used for spiral node placement.' },
				{ key: 'layout.initialPositionOffset', label: 'initial offset', type: 'range', min: 0, max: 0.01, step: 0.001, tooltip: 'Initial random offset applied to new node positions to prevent overlap.' },
				{ key: 'layout.revealInitialScale', label: 'reveal scale', type: 'range', min: 0.005, max: 0.1, step: 0.005, tooltip: 'Initial scale factor for newly revealed nodes (animates from this to 1).' },
				{ key: 'layout.revealBatchSize', label: 'reveal batch', type: 'range', min: 4, max: 64, step: 4, tooltip: 'Number of nodes revealed per animation batch.' },
				{ key: 'layout.revealTimeoutMs', label: 'reveal timeout', type: 'range', min: 10, max: 100, step: 5, tooltip: 'Timeout in ms between reveal batches.' },
				{ key: 'layout.addNodesCadenceMs', label: 'cadence', type: 'range', min: 50, max: 500, step: 10, tooltip: 'Interval in ms between automatic node additions.' },
				{ key: 'layout.nodesPerSecond', label: 'nodes/s', type: 'range', min: 1, max: 30, step: 1, tooltip: 'Target rate of automatic node additions per second.' },
			],
		},
	];

	function resolveValue(settings: GraphSettings, path: string): number | boolean {
		const parts = path.split('.');
		let current: unknown = settings;
		for (const part of parts) {
			current = (current as Record<string, unknown>)[part];
		}
		return current as number | boolean;
	}

	function formatValue(value: number, step?: number): string {
		if (step === undefined) return value.toString();
		if (step >= 1) return Math.round(value).toString();
		if (step >= 0.1) return value.toFixed(1);
		return value.toFixed(2);
	}

	function handleFieldChange(domain: DomainKey, key: string, value: number | boolean) {
		const updatedDomain = { ...graphSettings[domain], [key]: value };
		onGraphSettingsChange({ [domain]: updatedDomain } as Partial<GraphSettings>);
	}
</script>

<div id="graph-control-tabs" class={`flex h-full min-h-0 w-full flex-col ${open ? 'lg:flex-row' : ''}`}>
	<div id="graph-control-bar" class={`relative flex border-b border-hairline-strong ${open ? 'lg:h-full lg:w-10 lg:flex-col lg:border-r lg:border-b-0' : 'h-full lg:w-full lg:flex-col lg:justify-start lg:border-b-0'}`}>
		<button id="graph-control-toggle-surface" type="button" class="absolute inset-0 cursor-pointer hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label={open ? 'Collapse controls' : 'Expand controls'} aria-controls="graph-control-tabs" aria-expanded={open} onclick={onToggle}></button>
		<span id="graph-control-marker" class="pointer-events-none relative z-10 grid h-9 grid-cols-[auto_minmax(0,1fr)] items-center gap-sm border-b border-hairline px-sm py-xs text-left text-caption text-mute sm:gap-md sm:px-md lg:h-auto lg:w-full lg:grid-cols-1 lg:content-start lg:[writing-mode:vertical-rl]">
			{open ? '−' : '+'} controls
		</span>
		<WorkspaceTabs {tabs} activeId={activeTab} {open} onTabClick={(tab) => clickTab(tab as Tab)} onTabSelect={(tab) => selectTab(tab as Tab)} />
	</div>

	<div class:hidden={!open} class="min-h-0 flex-1 overflow-y-auto p-sm">
		{#if activeTab === 'graph'}
			<div id="graph-panel" role="tabpanel" aria-labelledby="graph-tab" tabindex="0" class="grid gap-sm pr-xs">
				<CollapsibleSection id="manual-add" title="manual add">
					<div class="p-sm">
						<Tooltip content="Add a single node from the dataset to the graph">
							{#snippet children({ describedBy })}
								<Button variant="primary" onclick={onAddNode} disabled={!loaded || !hasMoreNodes || !onAddNode} ariaDescribedBy={describedBy}>
									Add node
								</Button>
							{/snippet}
						</Tooltip>
					</div>
				</CollapsibleSection>
				<CollapsibleSection id="automatic-add" title="automatic add">
					<div class="grid gap-sm p-sm">
						<Tooltip content={repeating ? 'Stop automatically adding nodes' : 'Start automatically adding nodes at the configured rate'}>
							{#snippet children({ describedBy })}
								<Button pressed={repeating} onclick={onToggleRepeating} disabled={!loaded || (!hasMoreNodes && !repeating) || !onToggleRepeating} ariaDescribedBy={describedBy}>
									{repeating ? 'Stop adding' : 'Auto add'}
								</Button>
							{/snippet}
						</Tooltip>
						<Tooltip content="Nodes added per second when auto-add is enabled">
							{#snippet children({ describedBy })}
								<label class="grid min-h-9 gap-1 text-caption text-body">
									<span>rate {nodesPerSecond} nodes/s</span>
									<input class="h-4 w-full accent-ink" aria-label="Nodes added per second" aria-describedby={describedBy} type="range" min="1" max="60" step="1" value={nodesPerSecond} oninput={(event) => onNodesPerSecondChange?.(Number(event.currentTarget.value))} disabled={!loaded} />
								</label>
							{/snippet}
						</Tooltip>
					</div>
				</CollapsibleSection>
			</div>
		{:else if activeTab === 'layout'}
			<div id="layout-panel" role="tabpanel" aria-labelledby="layout-tab" tabindex="0">
				<CollapsibleSection id="force-atlas2" title="force-atlas2">
					<fieldset class="grid grid-cols-1 gap-sm p-sm pr-xs sm:grid-cols-2" disabled={!loaded}>
						<Tooltip content="Attraction force pulling connected nodes together">
							{#snippet children({ describedBy })}
								<label class="grid min-h-9 content-center gap-1 text-caption text-body">
									<span>gravity {settings.gravity.toFixed(2)}</span>
									<input class="h-4 w-full accent-ink" aria-describedby={describedBy} aria-label="Gravity" type="range" min="0" max="5" step="0.01" value={settings.gravity} oninput={(event) => onSettingsChange('gravity', Number(event.currentTarget.value))} />
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Repulsion force scaling - higher values push nodes apart more strongly">
							{#snippet children({ describedBy })}
								<label class="grid min-h-9 content-center gap-1 text-caption text-body">
									<span>repulsion {settings.scalingRatio}</span>
									<input class="h-4 w-full accent-ink" aria-describedby={describedBy} aria-label="Repulsion" type="range" min="1" max="50" step="1" value={settings.scalingRatio} oninput={(event) => onSettingsChange('scalingRatio', Number(event.currentTarget.value))} />
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Influence of edge weight on attraction force (0 = uniform, 2 = heavily weighted)">
							{#snippet children({ describedBy })}
								<label class="grid min-h-9 content-center gap-1 text-caption text-body">
									<span>edge weight {settings.edgeWeightInfluence.toFixed(1)}</span>
									<input class="h-4 w-full accent-ink" aria-describedby={describedBy} aria-label="Edge weight influence" type="range" min="0" max="2" step="0.1" value={settings.edgeWeightInfluence} oninput={(event) => onSettingsChange('edgeWeightInfluence', Number(event.currentTarget.value))} />
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Global slowdown factor for the simulation (higher = slower, more stable)">
							{#snippet children({ describedBy })}
								<label class="grid min-h-9 content-center gap-1 text-caption text-body">
									<span>slow down {settings.slowDown.toFixed(1)}</span>
									<input class="h-4 w-full accent-ink" aria-describedby={describedBy} aria-label="Slow down" type="range" min="0.1" max="10" step="0.1" value={settings.slowDown} oninput={(event) => onSettingsChange('slowDown', Number(event.currentTarget.value))} />
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Use Barnes-Hut approximation for faster force calculation on large graphs">
							{#snippet children({ describedBy })}
								<label class="flex min-h-9 items-center gap-sm text-caption text-body">
									<input class="size-4 accent-ink" aria-describedby={describedBy} aria-label="Use Barnes-Hut approximation" type="checkbox" checked={settings.barnesHutOptimize} onchange={(event) => onSettingsChange('barnesHutOptimize', event.currentTarget.checked)} />
									<span>barnes-hut</span>
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Barnes-Hut theta parameter (0.1-1.5). Lower = more accurate, slower. Only applies when Barnes-Hut is enabled.">
							{#snippet children({ describedBy })}
								<label class="grid min-h-9 content-center gap-1 text-caption text-body">
									<span>theta {settings.barnesHutTheta.toFixed(1)}</span>
									<input class="h-4 w-full accent-ink" aria-describedby={describedBy} aria-label="Barnes-Hut theta" type="range" min="0.1" max="1.5" step="0.1" value={settings.barnesHutTheta} disabled={!settings.barnesHutOptimize} oninput={(event) => onSettingsChange('barnesHutTheta', Number(event.currentTarget.value))} />
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Adjust node sizes based on degree (connected edges count)">
							{#snippet children({ describedBy })}
								<label class="flex min-h-9 items-center gap-sm text-caption text-body">
									<input class="size-4 accent-ink" aria-describedby={describedBy} aria-label="Adjust node sizes" type="checkbox" checked={settings.adjustSizes} onchange={(event) => onSettingsChange('adjustSizes', event.currentTarget.checked)} />
									<span>adjust sizes</span>
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Use LinLog mode for tighter clustering of highly connected nodes">
							{#snippet children({ describedBy })}
								<label class="flex min-h-9 items-center gap-sm text-caption text-body">
									<input class="size-4 accent-ink" aria-describedby={describedBy} aria-label="Use LinLog mode" type="checkbox" checked={settings.linLogMode} onchange={(event) => onSettingsChange('linLogMode', event.currentTarget.checked)} />
									<span>linlog mode</span>
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Distribute attraction force among outbound edges (prevents hub dominance)">
							{#snippet children({ describedBy })}
								<label class="flex min-h-9 items-center gap-sm text-caption text-body">
									<input class="size-4 accent-ink" aria-describedby={describedBy} aria-label="Distribute outbound attraction" type="checkbox" checked={settings.outboundAttractionDistribution} onchange={(event) => onSettingsChange('outboundAttractionDistribution', event.currentTarget.checked)} />
									<span>outbound attraction</span>
								</label>
							{/snippet}
						</Tooltip>
						<Tooltip content="Apply strong gravity toward center to prevent disconnected components from drifting away">
							{#snippet children({ describedBy })}
								<label class="flex min-h-9 items-center gap-sm text-caption text-body">
									<input class="size-4 accent-ink" aria-describedby={describedBy} aria-label="Use strong gravity" type="checkbox" checked={settings.strongGravityMode} onchange={(event) => onSettingsChange('strongGravityMode', event.currentTarget.checked)} />
									<span>strong gravity</span>
								</label>
							{/snippet}
						</Tooltip>
					</fieldset>
				</CollapsibleSection>
			</div>
		{:else}
			<div id="settings-panel" role="tabpanel" aria-labelledby="settings-tab" tabindex="0" class="grid gap-sm pr-xs">
				{#each settingsSections as section}
					<CollapsibleSection id={section.id} title={section.label}>
						<div class="grid gap-sm p-sm">
							{#each section.fields as field}
								{@const value = resolveValue(graphSettings, field.key)}
								<Tooltip content={field.tooltip}>
									{#snippet children({ describedBy })}
										<label class="grid min-h-9 content-center gap-1 text-caption text-body">
											<span>{field.label}{field.type === 'display' ? ` ${(value as number).toFixed(4)}` : ` ${formatValue(value as number, field.step)}`}</span>
											{#if field.type === 'range'}
												<input class="h-4 w-full accent-ink" aria-describedby={describedBy} aria-label={field.label} type="range" min={field.min} max={field.max} step={field.step} value={value as number} oninput={(event) => handleFieldChange(section.id, field.key.split('.')[1], Number(event.currentTarget.value))} disabled={!loaded} />
											{/if}
										</label>
									{/snippet}
								</Tooltip>
							{/each}
						</div>
					</CollapsibleSection>
				{/each}
			</div>
		{/if}
	</div>
</div>