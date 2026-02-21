<script lang="ts">
	let { data } = $props();
</script>

<a href="/dashboard">go to dashboard</a>

<ul>
	{#each data.business as b (b.id)}
		<li>
			<h2>{b.id} : {b.name}</h2>
		</li>
	{/each}
</ul>
