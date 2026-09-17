<script lang="ts">
	interface WorkspaceTab {
		id: string;
		label: string;
		panelId: string;
	}

	let {
		tabs,
		activeId,
		open,
		onTabClick,
		onTabSelect,
	}: {
		tabs: WorkspaceTab[];
		activeId: string;
		open: boolean;
		onTabClick: (id: string) => void;
		onTabSelect: (id: string) => void;
	} = $props();

	let tabButtons: Record<string, HTMLButtonElement | undefined> = {};

	function handleKeydown(event: KeyboardEvent, tab: WorkspaceTab) {
		const currentIndex = tabs.indexOf(tab);
		let nextIndex: number | undefined;
		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = Math.min(tabs.length - 1, currentIndex + 1);
		if (event.key === 'Home') nextIndex = 0;
		if (event.key === 'End') nextIndex = tabs.length - 1;
		if (nextIndex === undefined) return;

		event.preventDefault();
		const nextTab = tabs[nextIndex];
		onTabSelect(nextTab.id);
		tabButtons[nextTab.id]?.focus();
	}
</script>

<div class="relative z-10 flex lg:flex-col pointer-events-none lg:max-h-[300px] lg:overflow-y-auto" role="tablist" aria-label="Graph control categories">
	{#each tabs as tab (tab.id)}
		<button
			bind:this={tabButtons[tab.id]}
			type="button"
			role="tab"
			id={`${tab.id}-tab`}
			aria-controls={tab.panelId}
			aria-selected={activeId === tab.id}
			tabindex={activeId === tab.id ? 0 : -1}
			class:!border-ink={open && activeId === tab.id}
			class:!text-ink={open && activeId === tab.id}
			class="pointer-events-auto h-9 cursor-pointer border-b-2 border-transparent px-sm text-left text-caption text-mute hover:bg-surface-card hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px lg:h-auto lg:w-full lg:border-r-2 lg:border-b-0 lg:[writing-mode:vertical-rl]"
			onclick={() => onTabClick(tab.id)}
			onkeydown={(event) => handleKeydown(event, tab)}
		>
			[ {tab.label} ]
		</button>
	{/each}
</div>
