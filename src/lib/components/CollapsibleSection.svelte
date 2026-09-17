<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		title,
		expanded: initialExpanded = true,
		onToggle,
		children,
	}: {
		id?: string;
		title: string;
		expanded?: boolean;
		onToggle?: () => void;
		children: Snippet;
	} = $props();

	// Default-only: prop is used as initial value, state is local
	// eslint-disable-next-line svelte/state-referenced-locally
	let expanded = $state(initialExpanded);

	function handleToggle() {
		expanded = !expanded;
		onToggle?.();
	}
</script>

<section class="border border-hairline" aria-labelledby={id ? `${id}-heading` : undefined}>
	<h3
		id={id ? `${id}-heading` : undefined}
		class="m-0 flex cursor-pointer select-none items-center justify-between border-b border-hairline px-sm py-xs text-caption font-medium text-mute hover:bg-surface-card"
	>
		<button
			type="button"
			class="flex flex-1 items-center justify-between gap-sm bg-transparent px-0 py-0 text-left text-caption font-medium text-mute cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px"
			onclick={handleToggle}
			aria-expanded={expanded}
		>
			<span>[ {title} ]</span>
			<span class="text-caption text-ink">{expanded ? '−' : '+'}</span>
		</button>
	</h3>
	{#if expanded}
		{@render children()}
	{/if}
</section>
