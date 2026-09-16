<script lang="ts">
	import type { ForceAtlas2Settings } from '#lib/graph/force-atlas2-layout.ts';
	import Button from '#lib/components/Button.svelte';
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
		} = $props();
	type Tab = 'graph' | 'layout';

	let activeTab = $state<Tab>('graph');
	const tabs = [
		{ id: 'graph', label: 'graph', panelId: 'graph-panel' },
		{ id: 'layout', label: 'layout', panelId: 'layout-panel' },
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
					<section class="border border-hairline" aria-labelledby="manual-add-heading">
						<h3 id="manual-add-heading" class="m-0 border-b border-hairline px-sm py-xs text-caption font-medium text-mute">[ manual add ]</h3>
						<div class="p-sm">
							<Button variant="primary" onclick={onAddNode} disabled={!loaded || !hasMoreNodes || !onAddNode}>
								Add node
							</Button>
						</div>
					</section>
					<section class="border border-hairline" aria-labelledby="automatic-add-heading">
						<h3 id="automatic-add-heading" class="m-0 border-b border-hairline px-sm py-xs text-caption font-medium text-mute">[ automatic add ]</h3>
						<div class="grid gap-sm p-sm">
						<Button pressed={repeating} onclick={onToggleRepeating} disabled={!loaded || (!hasMoreNodes && !repeating) || !onToggleRepeating}>
							{repeating ? 'Stop adding' : 'Auto add'}
						</Button>
						<label class="grid min-h-9 gap-1 text-caption text-body">
							<span>rate {nodesPerSecond} nodes/s</span>
							<input class="h-4 w-full accent-ink" aria-label="Nodes added per second" type="range" min="1" max="60" step="1" value={nodesPerSecond} oninput={(event) => onNodesPerSecondChange?.(Number(event.currentTarget.value))} disabled={!loaded} />
						</label>
					</div>
					</section>
				</div>
			{:else}
				<div id="layout-panel" role="tabpanel" aria-labelledby="layout-tab" tabindex="0">
					<fieldset class="grid grid-cols-1 gap-sm pr-xs sm:grid-cols-2" disabled={!loaded}>
			<label class="grid min-h-9 content-center gap-1 text-caption text-body">
					<span>gravity {settings.gravity.toFixed(2)}</span>
				<input class="h-4 w-full accent-ink" aria-label="Gravity" type="range" min="0" max="5" step="0.01" value={settings.gravity} oninput={(event) => onSettingsChange('gravity', Number(event.currentTarget.value))} />
		</label>
		<label class="grid min-h-9 content-center gap-1 text-caption text-body">
			<span>repulsion {settings.scalingRatio}</span>
			<input class="h-4 w-full accent-ink" aria-label="Repulsion" type="range" min="1" max="50" step="1" value={settings.scalingRatio} oninput={(event) => onSettingsChange('scalingRatio', Number(event.currentTarget.value))} />
		</label>
		<label class="grid min-h-9 content-center gap-1 text-caption text-body">
			<span>edge weight {settings.edgeWeightInfluence.toFixed(1)}</span>
			<input class="h-4 w-full accent-ink" aria-label="Edge weight influence" type="range" min="0" max="2" step="0.1" value={settings.edgeWeightInfluence} oninput={(event) => onSettingsChange('edgeWeightInfluence', Number(event.currentTarget.value))} />
		</label>
		<label class="grid min-h-9 content-center gap-1 text-caption text-body">
			<span>slow down {settings.slowDown.toFixed(1)}</span>
			<input class="h-4 w-full accent-ink" aria-label="Slow down" type="range" min="0.1" max="10" step="0.1" value={settings.slowDown} oninput={(event) => onSettingsChange('slowDown', Number(event.currentTarget.value))} />
		</label>
		<label class="flex min-h-9 items-center gap-sm text-caption text-body">
			<input class="size-4 accent-ink" aria-label="Use Barnes-Hut approximation" type="checkbox" checked={settings.barnesHutOptimize} onchange={(event) => onSettingsChange('barnesHutOptimize', event.currentTarget.checked)} />
			<span>barnes-hut</span>
		</label>
		<label class="grid min-h-9 content-center gap-1 text-caption text-body">
			<span>theta {settings.barnesHutTheta.toFixed(1)}</span>
			<input class="h-4 w-full accent-ink" aria-label="Barnes-Hut theta" type="range" min="0.1" max="1.5" step="0.1" value={settings.barnesHutTheta} disabled={!settings.barnesHutOptimize} oninput={(event) => onSettingsChange('barnesHutTheta', Number(event.currentTarget.value))} />
		</label>
		<label class="flex min-h-9 items-center gap-sm text-caption text-body">
			<input class="size-4 accent-ink" aria-label="Adjust node sizes" type="checkbox" checked={settings.adjustSizes} onchange={(event) => onSettingsChange('adjustSizes', event.currentTarget.checked)} />
			<span>adjust sizes</span>
		</label>
		<label class="flex min-h-9 items-center gap-sm text-caption text-body">
			<input class="size-4 accent-ink" aria-label="Use LinLog mode" type="checkbox" checked={settings.linLogMode} onchange={(event) => onSettingsChange('linLogMode', event.currentTarget.checked)} />
			<span>linlog mode</span>
		</label>
		<label class="flex min-h-9 items-center gap-sm text-caption text-body">
			<input class="size-4 accent-ink" aria-label="Distribute outbound attraction" type="checkbox" checked={settings.outboundAttractionDistribution} onchange={(event) => onSettingsChange('outboundAttractionDistribution', event.currentTarget.checked)} />
			<span>outbound attraction</span>
		</label>
		<label class="flex min-h-9 items-center gap-sm text-caption text-body">
				<input class="size-4 accent-ink" aria-label="Use strong gravity" type="checkbox" checked={settings.strongGravityMode} onchange={(event) => onSettingsChange('strongGravityMode', event.currentTarget.checked)} />
				<span>strong gravity</span>
			</label>
					</fieldset>
				</div>
			{/if}
		</div>
	</div>
