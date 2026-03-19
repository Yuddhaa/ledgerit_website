<script lang="ts">
	import { ArrowLeft, Check, IndianRupee, Tag, User, Receipt, FileText, Plus } from 'lucide-svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import transactionsApi, { type minTran } from '$lib/api/transactionsApi';
	import Toast from '$lib/components/Toast.svelte';
	import { categoryStore, partiesStore, transactionStore } from '$lib/stores/store.svelte';
	import PartyCatManagement from '$lib/components/PartyCatManagement.svelte';

	let { data } = $props();

	// --- Form State ---
	let form = $state<minTran>({
		amount: '',
		direction: 'in',
		category_id: '',
		party_id: '',
		mode: 'online',
		receipt_no: '',
		description: ''
	});

	let loading = $state(false);
	let errMsg = $state('');
	let successMsg = $state('');

	// --- Modal State ---
	let activeManagement = $state<'parties' | 'categories' | null>(null);

	// Helpers to get selected names from the global stores
	const selectedPartyName = $derived(
		partiesStore.parties.find((p) => p.id === form.party_id)?.name || ''
	);
	const selectedCategoryName = $derived(
		categoryStore.categories.find((c) => c.id === form.category_id)?.name || ''
	);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!form.party_id || !form.amount) {
			errMsg = 'Please fill in all required fields';
			return;
		}

		loading = true;
		const payload = {
			...form,
			amount: form.amount.toString()
		};
		try {
			await transactionsApi.create(data.businessId, payload);
			// Invalidate local cache to force fresh fetch on list page
			transactionStore.transactions = {
				stats: { cash_in: 0, cash_out: 0, net_balance: 0 },
				transactions: []
			};
			successMsg = 'Transaction saved successfully!';
		} catch (err: any) {
			errMsg = err.message || 'Failed to save transaction';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-background pb-20">
	<header
		class="sticky top-0 z-30 transition-colors duration-500 {form.direction === 'in'
			? 'bg-success/10'
			: 'bg-error/10'} border-b border-outline-variant p-4 backdrop-blur-md"
	>
		<div class="flex items-center gap-4">
			<button
				onclick={() => history.back()}
				class="rounded-xl p-2 hover:cursor-pointer hover:bg-background/50"
			>
				<ArrowLeft size={20} />
			</button>
			<div>
				<h1 class="text-xl font-black text-text-primary">New Transaction</h1>
				<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
					Recording {form.direction === 'in' ? 'Income' : 'Expense'}
				</p>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-xl p-6">
		<form onsubmit={handleSubmit} class="space-y-8">
			<div class="flex rounded-3xl bg-surface p-1.5 ring-1 ring-outline-variant">
				<button
					type="button"
					onclick={() => (form.direction = 'out')}
					class="flex-1 rounded-2xl py-4 text-xs font-black tracking-widest uppercase transition-all hover:cursor-pointer
					{form.direction === 'out'
						? 'bg-error text-background shadow-lg shadow-error/20'
						: 'text-text-secondary'}"
				>
					Out (Cash Out)
				</button>
				<button
					type="button"
					onclick={() => (form.direction = 'in')}
					class="flex-1 rounded-2xl py-4 text-xs font-black tracking-widest uppercase transition-all hover:cursor-pointer
					{form.direction === 'in'
						? 'bg-success text-background shadow-lg shadow-success/20'
						: 'text-text-secondary'}"
				>
					In (Cash In)
				</button>
			</div>

			<div class="space-y-2 text-center">
				<label
					class="flex items-center justify-center gap-1 text-[10px] font-black tracking-[0.2em] text-text-secondary uppercase"
					>Amount <span class="text-sm text-error">*</span></label
				>
				<div class="relative flex items-center justify-center">
					<span class="mr-2 text-3xl font-black text-text-secondary">₹</span>
					<input
						type="number"
						bind:value={form.amount}
						placeholder="0.00"
						class="w-full rounded-3xl bg-transparent text-center text-5xl font-black text-text-primary outline-none placeholder:text-text-secondary/20"
						required
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div class="relative space-y-2">
					<label
						class="ml-2 flex items-center gap-1 text-[10px] font-black tracking-widest text-text-secondary uppercase"
						>Party <span class="text-sm text-error">*</span></label
					>
					<button
						type="button"
						onclick={() => (activeManagement = 'parties')}
						class="flex w-full items-center gap-3 rounded-3xl border border-outline-variant bg-surface p-4 text-left transition-all hover:cursor-pointer hover:border-primary active:scale-[0.98]"
					>
						<div class="text-primary"><User size={20} /></div>
						<span
							class="flex-1 truncate font-bold {selectedPartyName
								? 'text-text-primary'
								: 'text-text-secondary/40'}"
						>
							{selectedPartyName || 'Select Party'}
						</span>
					</button>
				</div>

				<div class="relative space-y-2">
					<label class="ml-2 text-[10px] font-black tracking-widest text-text-secondary uppercase"
						>Category</label
					>
					<button
						type="button"
						onclick={() => (activeManagement = 'categories')}
						class="flex w-full items-center gap-3 rounded-[24px] border border-outline-variant bg-surface p-4 text-left transition-all hover:cursor-pointer hover:border-primary active:scale-[0.98]"
					>
						<div class="text-primary"><Tag size={20} /></div>
						<span
							class="flex-1 truncate font-bold {selectedCategoryName
								? 'text-text-primary'
								: 'text-text-secondary/40'}"
						>
							{selectedCategoryName || 'Select Category'}
						</span>
					</button>
				</div>
			</div>

			<div class="space-y-2">
				<label class="ml-2 text-[10px] font-black tracking-widest text-text-secondary uppercase"
					>Payment Mode</label
				>
				<div class="grid grid-cols-3 gap-3">
					{#each ['online', 'cash', 'cheque'] as mode}
						<button
							type="button"
							onclick={() => (form.mode = mode as any)}
							class="rounded-2xl border-2 py-4 text-[10px] font-black tracking-widest uppercase transition-all hover:cursor-pointer
							{form.mode === mode
								? 'border-primary bg-primary/10 text-primary shadow-sm'
								: 'border-outline-variant bg-surface text-text-secondary'}"
						>
							{mode}
						</button>
					{/each}
				</div>
			</div>

			<div class="space-y-4">
				<div class="group relative">
					<Receipt
						size={18}
						class="absolute top-5 left-4 text-text-secondary/40 transition-colors group-focus-within:text-primary"
					/>
					<input
						bind:value={form.receipt_no}
						placeholder={form.direction == 'in' ? 'Receipt Number' : 'Voucher Number'}
						class="min-h-[56px] w-full resize-none overflow-hidden rounded-[24px] border-none bg-surface py-4.5 pr-6 pl-14 text-sm font-bold ring-1 ring-outline-variant transition-all placeholder:text-text-secondary/40 focus:ring-2 focus:ring-primary"
						required={form.direction == 'in' ? true : false}
					/>
					{#if form.direction == 'in'}
						<span class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-error">*</span>
					{/if}
				</div>
				<div class="group relative">
					<FileText
						size={18}
						class="absolute top-6 left-4 text-text-secondary/40 transition-colors group-focus-within:text-primary"
					/>
					<textarea
						bind:value={form.description}
						placeholder="Description (Optional)"
						rows="3"
						class="w-full resize-none rounded-[24px] border-none bg-surface py-5 pr-6 pl-14 text-sm font-bold ring-1 ring-outline-variant transition-all placeholder:text-text-secondary/40 focus:ring-2 focus:ring-primary"
					></textarea>
				</div>
			</div>

			<div class="flex gap-4 pt-4">
				<button
					type="button"
					onclick={() => history.back()}
					class="flex-1 rounded-[22px] bg-surface-high py-5 text-[11px] font-black tracking-widest text-text-secondary uppercase transition-transform hover:cursor-pointer active:scale-95"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading}
					class="flex flex-[2] items-center justify-center gap-2 rounded-[22px] bg-primary py-5 text-[11px] font-black tracking-widest text-background uppercase shadow-xl shadow-primary/20 transition-all hover:cursor-pointer active:scale-95 disabled:opacity-50"
				>
					{#if loading}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
						></div>
					{:else}
						<Check size={18} /> Save Transaction
					{/if}
				</button>
			</div>
		</form>
	</main>
</div>
{#if activeManagement}
	<PartyCatManagement
		type={activeManagement}
		promise={activeManagement === 'parties' ? data.partyPromise : data.categoryPromise}
		placesPromise={activeManagement === 'parties' ? data.partyPlacespromise : undefined}
		close={() => (activeManagement = null)}
		onSelect={(id) => {
			if (activeManagement === 'parties') form.party_id = id;
			else form.category_id = id;
			activeManagement = null;
		}}
	/>
{/if}

{#if successMsg}
	<Toast
		toastType="success"
		text={successMsg}
		close={() => {
			successMsg = '';
			goto(`/${data.businessId}/transactions`);
		}}
	/>
{/if}

{#if errMsg}
	<Toast toastType="error" text={errMsg} close={() => (errMsg = '')} />
{/if}

<style>
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
