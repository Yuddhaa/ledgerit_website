<script lang="ts">
	import businessApi from '$lib/api/businessApi';
	import Toast from './Toast.svelte';
	import { businessStore } from '$lib/stores/store.svelte';
	import { X, Check, Building2 } from 'lucide-svelte';
	import { fade, scale } from 'svelte/transition';

	let {
		businessName,
		businessId,
		close
	}: {
		businessName: string | undefined;
		businessId: string | undefined;
		close: () => void;
	} = $props();

	let loading = $state(false);
	let errorMsg = $state('');
	let success = $state(false);

	// FIX: Use $state instead of $derived so it's editable
	let updatedName = $derived(businessName || '');

	async function onSubmit(e: Event) {
		e.preventDefault(); // Stop page reload

		if (!businessId) return;
		if (updatedName === businessName) {
			errorMsg = 'No changes made';
			return;
		}
		if (!updatedName.trim()) {
			errorMsg = 'Name cannot be empty';
			return;
		}

		loading = true;
		try {
			await businessApi.patchName(businessId, updatedName);

			// Update Global Store
			if (businessStore.selected) {
				businessStore.selected.name = updatedName;
			}
			businessStore.business = businessStore.business.map((bus) =>
				bus.id === businessId ? { ...bus, name: updatedName } : bus
			);

			loading = false;
			success = true;
		} catch (err: any) {
			loading = false;
			errorMsg = err.message || 'Internal error';
		}
	}
</script>

<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 z-150 flex items-center justify-center bg-background/60 p-4 backdrop-blur-md"
>
	<div
		transition:scale={{ start: 0.9, duration: 300 }}
		class="relative w-full max-w-sm overflow-hidden rounded-[40px] border border-outline-variant bg-surface p-8 shadow-2xl"
	>
		<button
			onclick={close}
			class="absolute top-6 right-6 text-text-secondary opacity-40 transition-opacity hover:opacity-100"
		>
			<X size={24} />
		</button>

		<div class="mb-8 flex flex-col items-center text-center">
			<div
				class="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary"
			>
				<Building2 size={32} />
			</div>
			<h2 class="text-xl font-black tracking-tighter text-text-primary uppercase">
				Rename Business
			</h2>
			<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
				Update your identity
			</p>
		</div>

		<form onsubmit={onSubmit} class="space-y-8">
			<div class="space-y-2">
				<label class="ml-2 text-[10px] font-black tracking-widest text-text-secondary/50 uppercase">
					New Business Name
					<input
						type="text"
						bind:value={updatedName}
						class="w-full border-b-2 border-primary/20 bg-transparent pb-2 text-2xl font-black text-text-primary transition-all outline-none placeholder:text-text-secondary/20 focus:border-primary"
						placeholder="Enter name..."
					/>
				</label>
			</div>

			<div class="flex gap-3">
				<button
					type="button"
					onclick={close}
					class="flex-1 rounded-2xl bg-surface-high py-4 text-xs font-black tracking-widest text-text-secondary uppercase transition-transform active:scale-95"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading}
					class="flex flex-2 items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-xs font-black tracking-widest text-background uppercase shadow-lg shadow-primary/20 transition-transform active:scale-95 disabled:opacity-50"
				>
					{#if loading}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
						></div>
					{:else}
						<Check size={18} />
						Save Changes
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>

{#if success}
	<Toast
		toastType="success"
		text="Name updated successfully"
		close={() => {
			success = false;
			close();
		}}
	/>
{/if}

{#if errorMsg}
	<Toast toastType="error" text={errorMsg} close={() => (errorMsg = '')} />
{/if}
