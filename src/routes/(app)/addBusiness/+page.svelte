<script lang="ts">
	import { goto } from '$app/navigation';
	import businessApi from '$lib/api/businessApi';
	import Toast from '$lib/components/Toast.svelte';
	import { businessStore } from '$lib/stores/store.svelte';

	let loading: boolean = $state(false);
	let created: boolean = $state(false);
	let errorMessage: string = $state('');

	let name: string = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		try {
			console.log('add business handleSubmit started');
			await businessApi.create(name);
			loading = false;
			created = true;
		} catch (err: any) {
			loading = false;
			errorMessage = err.message;
			console.log('error in add business handleSubmit,err: ' + err);
		} finally {
			console.log('add business handleSubmit ended');
		}
	}
</script>

<h1 class="mb-4 text-2xl font-bold">Add Business</h1>

<form onsubmit={handleSubmit} class="">
	<label class="">
		Enter Business Name:
		<input bind:value={name} type="text" required class="" />
	</label>

	<button
		type="submit"
		disabled={loading}
		class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
	>
		{loading ? 'Adding...' : 'Add Business'}
	</button>
</form>

<a href="/" class="mt-4 inline-block text-blue-400 hover:underline">Go Back</a>

{#if loading}
	<Toast toastType="loading" text="Adding Business" />
{/if}

{#if created}
	<Toast
		toastType="success"
		text="New Business '{name}' Added"
		close={async () => {
			created = false;
			businessStore.business = [];
			await goto('/');
		}}
	/>
{/if}

{#if errorMessage}
	<Toast
		toastType="error"
		text={errorMessage}
		close={() => {
			errorMessage = '';
		}}
	/>
{/if}
