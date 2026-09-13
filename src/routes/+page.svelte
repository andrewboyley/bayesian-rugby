<script lang="ts">
	import GraphViewer from '#lib/components/GraphViewer.svelte';
</script>

<main class="flex h-dvh min-h-0 flex-col bg-canvas p-md">
	<header class="flex items-center gap-md border-b border-hairline px-md py-xs">
		<span class="text-label-md font-medium">[ rugby-graph ]</span>
		<span class="text-caption text-mute">wikipedia concept network</span>
	</header>
	<div class="flex min-h-0 flex-1 pt-md">
		<GraphViewer />
	</div>
</main>
