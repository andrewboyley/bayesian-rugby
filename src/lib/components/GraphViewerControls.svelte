<script lang="ts">
	import type { ForceAtlas2Settings } from '#lib/graph/force-atlas2-layout.ts';

	let {
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
	let forceAtlasOpen = $state(false);
</script>

<div class="grid w-full gap-md" aria-label="Graph controls">
	<div class="flex flex-wrap items-center gap-sm">
		<button
			type="button"
			class="inline-flex h-9 w-fit cursor-pointer items-center whitespace-nowrap rounded-sm bg-primary px-5 py-1 text-button-md font-medium text-on-primary transition-colors hover:bg-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:bg-surface-card disabled:text-ash"
			onclick={onAddNode}
			disabled={!loaded || !hasMoreNodes || !onAddNode}
		>
			[ add node ]
		</button>
		<button
			type="button"
			class:!bg-primary={repeating}
			class:!text-on-primary={repeating}
			class="inline-flex h-9 w-fit cursor-pointer items-center whitespace-nowrap rounded-sm border border-ink px-5 py-1 text-button-md font-medium text-ink transition-colors hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:border-hairline disabled:text-ash"
			onclick={onToggleRepeating}
			disabled={!loaded || (!hasMoreNodes && !repeating) || !onToggleRepeating}
		>
			{repeating ? '[ stop adding ]' : '[ auto add ]'}
		</button>
		<label class="flex min-h-9 items-center gap-sm text-caption text-body">
			<span>rate {nodesPerSecond} nodes/s</span>
			<input class="h-4 w-32 accent-ink" aria-label="Nodes added per second" type="range" min="1" max="10" step="1" value={nodesPerSecond} oninput={(event) => onNodesPerSecondChange?.(Number(event.currentTarget.value))} disabled={!loaded} />
		</label>
	</div>

	<details class="border-t border-hairline pt-sm" bind:open={forceAtlasOpen}>
		<summary class="flex h-9 cursor-pointer list-none items-center justify-between text-caption text-mute [&::-webkit-details-marker]:hidden">
			<span>[ forceatlas2 settings ]</span>
			<span>{forceAtlasOpen ? '[ collapse ]' : '[ expand ]'}</span>
		</summary>
		<fieldset class="grid grid-cols-1 gap-sm pt-sm sm:grid-cols-2" disabled={!loaded}>
		<label class="grid min-h-9 content-center gap-1 text-caption text-body">
			<span>gravity {settings.gravity.toFixed(1)}</span>
			<input class="h-4 w-full accent-ink" aria-label="Gravity" type="range" min="0" max="5" step="0.1" value={settings.gravity} oninput={(event) => onSettingsChange('gravity', Number(event.currentTarget.value))} />
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
	</details>
</div>
