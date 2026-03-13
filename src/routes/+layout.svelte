<script lang="ts">
	/**
	 * this page just to apply theme
	 */
	import { onMount } from 'svelte';
	import './layout.css';
	import { ui } from '$lib/stores/store.svelte';

	let { children } = $props();

	onMount(() => {
		const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
		if (savedTheme) ui.theme = savedTheme;
		else if (window.matchMedia('(prefers-color-scheme: dark)').matches) ui.theme = 'dark';

		apply();
	});

	$effect(() => {
		apply();
		localStorage.setItem('theme', ui.theme);
	});

	function apply() {
		document.documentElement.classList.toggle('dark', ui.theme === 'dark');
	}
</script>

{@render children()}
