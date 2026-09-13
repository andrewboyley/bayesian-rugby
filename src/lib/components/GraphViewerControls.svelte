<script lang="ts">
	let {
		loaded,
		revealing,
		onReveal,
		onCenter,
	}: {
		loaded: boolean;
		revealing: boolean;
		onReveal: (() => void) | undefined;
		onCenter: (() => void) | undefined;
	} = $props();
</script>

<div class="flex shrink-0 items-center gap-xs">
	<button
		type="button"
		class="inline-flex min-h-9 cursor-pointer items-center whitespace-nowrap border border-hairline-strong px-xs py-0.5 text-caption text-mute transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
		onclick={onReveal}
		disabled={!loaded || revealing || !onReveal}
	>
		<span class="sm:hidden">[ reveal ]</span><span class="hidden sm:inline">[ reveal size ]</span>
	</button>
	<button
		type="button"
		class="inline-flex min-h-9 cursor-pointer items-center whitespace-nowrap border border-hairline-strong px-xs py-0.5 text-caption text-mute transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
		onclick={onCenter}
		disabled={!onCenter}
	>
		<span class="sm:hidden">[ center ]</span><span class="hidden sm:inline">[ center view ]</span>
	</button>
</div>
