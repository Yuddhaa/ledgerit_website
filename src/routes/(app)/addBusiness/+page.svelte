<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, Building2, Sparkles, ArrowRight } from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import businessApi from '$lib/api/businessApi';
	import Toast from '$lib/components/Toast.svelte';
	import { businessStore } from '$lib/stores/store.svelte';
	import confetti from 'canvas-confetti';

	let loading: boolean = $state(false);
	let created: boolean = $state(false);
	let errorMessage: string = $state('');

	let name: string = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;

		loading = true;
		try {
			await businessApi.create(name);
			loading = false;
			created = true;
			fireConfetti();
		} catch (err: any) {
			loading = false;
			errorMessage = err.message || 'Failed to create business';
		}
	}

	function fireConfetti() {
		confetti({
			particleCount: 150,
			spread: 70,
			origin: { y: 0.6 },
			colors: ['#3399cc', '#FFD700', '#FF4500']
		});
		setTimeout(() => {
			confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
			confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
		}, 250);
	}
</script>

<div class="flex min-h-screen flex-col bg-background p-6 md:p-12">
	<header class="mb-12 flex items-center justify-between">
		<a
			href="/"
			class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-text-secondary transition-all active:scale-90"
		>
			<ChevronLeft size={20} />
		</a>
		<p class="text-[10px] font-black tracking-[0.3em] text-text-secondary uppercase opacity-50">
			LedgerIt Setup
		</p>
	</header>

	<main class="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
		<div class="mb-10 text-center" in:fly={{ y: -20, duration: 600 }}>
			<div
				class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[32px] bg-primary/10 text-primary shadow-inner"
			>
				<Building2 size={40} strokeWidth={2.5} />
			</div>
			<h1 class="text-4xl font-black tracking-tighter text-text-primary">New Business</h1>
			<p class="mt-2 text-sm font-bold text-text-secondary">
				Start tracking expenses for a new entity.
			</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-8" in:fade={{ delay: 200, duration: 400 }}>
			<div class="space-y-2">
				<label
					for="biz-name"
					class="ml-2 text-[10px] font-black tracking-widest text-text-secondary uppercase"
				>
					Registered Business Name
				</label>
				<div class="group relative">
					<input
						id="biz-name"
						bind:value={name}
						type="text"
						required
						placeholder="e.g. Varada Spices Pvt Ltd"
						class="w-full rounded-[28px] border-none bg-surface p-6 text-lg font-black text-text-primary shadow-sm ring-1 ring-outline-variant transition-all outline-none placeholder:text-text-secondary/30 focus:ring-4 focus:ring-primary/20"
					/>
					<div
						class="absolute top-1/2 right-6 -translate-y-1/2 text-primary opacity-0 transition-opacity group-focus-within:opacity-100"
					>
						<Sparkles size={20} />
					</div>
				</div>
			</div>

			<button
				type="submit"
				disabled={loading || !name.trim()}
				class="group relative flex w-full items-center justify-center gap-3 rounded-[28px] bg-primary py-6 text-lg font-black text-background shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale"
			>
				{#if loading}
					<div
						class="h-6 w-6 animate-spin rounded-full border-4 border-background border-t-transparent"
					></div>
					<span>Registering...</span>
				{:else}
					<span>Create Business</span>
					<ArrowRight size={20} class="transition-transform group-hover:translate-x-1" />
				{/if}
			</button>
		</form>
	</main>

	<footer class="mt-12 text-center">
		<p class="text-[10px] font-bold tracking-widest text-text-secondary/40 uppercase">
			You can add members and categories later
		</p>
	</footer>
</div>

{#if loading}
	<Toast toastType="loading" text="Finalizing details..." />
{/if}

{#if created}
	<Toast
		toastType="success"
		text="'{name}' is ready!"
		close={async () => {
			created = false;
			businessStore.business = []; // Invalidate cache
			fireConfetti();
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
