<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		title,
		open,
		controls,
		vertical = false,
		onToggle,
		children,
	}: {
		id?: string;
		title: string;
		open: boolean;
		controls: string;
		vertical?: boolean;
		onToggle: () => void;
		children?: Snippet;
	} = $props();
</script>

<button
	{id}
	type="button"
	class={`relative z-10 grid h-9 cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-sm border-b border-hairline px-sm py-xs text-left text-caption text-mute hover:bg-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-md sm:px-md ${vertical ? 'lg:h-auto lg:w-full lg:grid-cols-1 lg:content-start lg:[writing-mode:vertical-rl]' : ''}`}
	aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
	aria-controls={controls}
	aria-expanded={open}
	onclick={onToggle}
>
	<span class="whitespace-nowrap">{open ? '−' : '+'} {title}</span>
	{#if children}
		{@render children()}
	{/if}
</button>
