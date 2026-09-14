<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		as = 'section',
		id,
		label,
		open,
		panelClass = '',
		tabIndex,
		children,
	}: {
		as?: 'section' | 'aside';
		id?: string;
		label: string;
		open: boolean;
		panelClass?: string;
		tabIndex?: number;
		children: Snippet;
	} = $props();
</script>

<svelte:element this={as} {id} tabindex={tabIndex} aria-label={label} class={`flex min-h-0 flex-col overflow-hidden rounded-sm border border-hairline-strong bg-canvas ${open ? '' : 'self-start lg:self-stretch'} ${panelClass}`}>
	{@render children()}
</svelte:element>
