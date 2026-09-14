<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'secondary',
		pressed,
		disabled = false,
		onclick,
		children,
	}: {
		variant?: 'primary' | 'secondary';
		pressed?: boolean;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<button
	type="button"
	class={`inline-flex h-9 w-fit cursor-pointer items-center whitespace-nowrap rounded-sm px-5 py-1 text-button-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:bg-surface-card disabled:text-ash ${variant === 'primary' || pressed ? 'bg-primary text-on-primary hover:bg-ink-deep' : 'border border-ink text-ink hover:bg-surface-card disabled:border-hairline'}`}
	aria-pressed={pressed}
	{disabled}
	{onclick}
>
	{@render children()}
</button>
