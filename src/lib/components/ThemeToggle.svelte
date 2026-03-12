<script lang="ts">
	import { ui } from '$lib/stores/store.svelte';

	function toggle() {
		ui.theme = ui.theme === 'dark' ? 'light' : 'dark';
	}
</script>

<button
	onclick={toggle}
	class="rounded-lg border bg-white px-3 py-2
         text-sm text-gray-800
         dark:bg-gray-800 dark:text-gray-100"
>
	{ui.theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
</button>
