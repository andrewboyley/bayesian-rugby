<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Rugby Graph | Wikipedia concept network</title>
	<meta name="description" content="Explore the Wikipedia concept network as an interactive graph." />
	<meta property="og:title" content="Rugby Graph" />
	<meta property="og:description" content="Explore the Wikipedia concept network as an interactive graph." />
	<meta name="theme-color" content="#fdfcfc" />
</svelte:head>

{@render children()}
