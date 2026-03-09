<script lang="ts">
	let { data, children } = $props();

	let businessId = $derived(data.business.id);
</script>

<nav>
	<h1>business name:{data.business?.name}</h1>
	<ul><a href="/">go back</a></ul>
</nav>

{@render children()}

<h2><a href={`/${businessId}/plans`}>update/choose plans</a></h2>
