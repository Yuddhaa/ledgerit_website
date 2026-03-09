<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import { theme } from '$lib/stores/store.svelte';

	let { children } = $props();

	onMount(() => {
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (savedTheme) theme.mode = savedTheme;
		else if (window.matchMedia('(prefers-color-scheme: dark)').matches) theme.mode = 'dark';

		apply();
	});

	$effect(() => {
		apply();
		localStorage.setItem('theme', theme.mode);
	});

	function apply() {
		document.documentElement.classList.toggle('dark', theme.mode === 'dark');
	}
</script>

{@render children()}
