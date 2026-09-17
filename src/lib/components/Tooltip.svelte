<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		content,
		children,
		delay = 300,
		placement = 'top',
		disabled = false,
	}: {
		content: string;
		children: Snippet<[{ describedBy: string | undefined }]>;
		delay?: number;
		placement?: 'top' | 'bottom' | 'left' | 'right';
		disabled?: boolean;
	} = $props();

	const tooltipId = `tooltip-${Math.random().toString(36).slice(2, 9)}`;
	let isOpen = $state(false);
	let showTimeout: ReturnType<typeof setTimeout> | null = null;
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function showTooltip() {
		if (disabled) return;
		if (showTimeout) clearTimeout(showTimeout);
		if (hideTimeout) clearTimeout(hideTimeout);
		showTimeout = setTimeout(() => {
			isOpen = true;
		}, delay);
	}

	function hideTooltip() {
		if (showTimeout) clearTimeout(showTimeout);
		if (hideTimeout) clearTimeout(hideTimeout);
		hideTimeout = setTimeout(() => {
			isOpen = false;
		}, 80);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			hideTooltip();
		}
	}
</script>

<div
	class="relative inline-block"
	onmouseenter={showTooltip}
	onmouseleave={hideTooltip}
	onfocusin={showTooltip}
	onfocusout={hideTooltip}
	onkeydown={handleKeyDown}
>
	{@render children({ describedBy: isOpen ? tooltipId : undefined })}

	{#if isOpen && !disabled}
		<div
			id={tooltipId}
			role="tooltip"
			class={`
				absolute z-50 px-2 py-1 text-[11px] font-mono font-normal leading-[1.5] whitespace-nowrap
				rounded-sm border border-hairline
				bg-surface-dark text-on-dark
				shadow-[0_4px_12px_rgba(15,0,0,0.15)]
				pointer-events-none
				transition-opacity duration-150 ease-out
				opacity-100
				${placement === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-0.5' : ''}
				${placement === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-0.5' : ''}
				${placement === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-0.5' : ''}
				${placement === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-0.5' : ''}
			`}
			aria-hidden="false"
		>
			{content}
		</div>
	{/if}
</div>