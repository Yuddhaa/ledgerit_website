<script lang="ts">
	import { theme } from '$lib/stores/store.svelte';

	function toggle() {
		theme.mode = theme.mode === 'dark' ? 'light' : 'dark';
	}
</script>

<button
	onclick={toggle}
	class="rounded-lg border bg-white px-3 py-2
         text-sm text-gray-800
         dark:bg-gray-800 dark:text-gray-100"
>
	{theme.mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
</button>
