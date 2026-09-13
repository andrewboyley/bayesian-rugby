<script lang="ts">
	import GraphViewer from '#lib/components/GraphViewer.svelte';
</script>

	<a
		href="#graph-viewer"
		class="sr-only focus:fixed focus:top-md focus:left-md focus:z-10 focus:not-sr-only focus:border focus:border-hairline-strong focus:bg-canvas focus:px-sm focus:py-xs focus:text-caption focus:text-ink focus:outline-2 focus:outline-offset-2 focus:outline-accent"
	>
		[ skip to graph ]
	</a>

<main id="main-content" class="flex h-dvh min-h-0 flex-col bg-canvas p-sm sm:p-md">
	<header class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-sm border-b border-hairline px-xs py-sm sm:gap-md sm:px-md sm:py-xs">
		<span class="shrink-0 whitespace-nowrap text-label-md font-medium">[ rugby-graph ]</span>
		<span class="min-w-0 text-caption leading-5 text-mute sm:leading-normal">wikipedia concept network</span>
	</header>
	<div class="flex min-h-0 flex-1 pt-sm sm:pt-md">
		<GraphViewer />
	</div>
</main>
