<script lang="ts">
	let { data } = $props();
</script>

<a href="/addBusiness">Add new business</a>

<ul>
	{#each data.business as b (b.id)}
		<li>
			<a href={`/${b.id}`}>{b.id} : {b.name}</a>
		</li>
	{/each}
</ul>
