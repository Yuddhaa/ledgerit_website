<script lang="ts">
	import { Filter, Plus, Trash2, Wallet, X } from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import transactionsApi from '$lib/api/transactionsApi';
	import {
		transactionStore,
		isClrearFilterActive,
		isApplyFilterActive,
		businessStore,
		partiesStore
	} from '$lib/stores/store.svelte.js';
	import { log } from '$lib/utils/helpers';
	import type { transaction } from '$lib/utils/types.js';

	let { data } = $props();

	let filters = $state({ ...transactionStore.filter });
	let showFilters = $state(false);
	let manualPromise = $state<Promise<any> | null>(null);
	let activePromise = $derived(manualPromise || data.transactionsPromise);

	let canClear = $derived(isClrearFilterActive());
	let canApply = $derived(isApplyFilterActive('tran', filters));

	async function applyFilters() {
		transactionStore.filter = { ...filters };
		manualPromise = transactionsApi.listAll(data.businessId, filters).then((res) => {
			transactionStore.transactions = {
				stats: res.stats,
				transactions: res.transactions ? res.transactions : []
			};
			return res;
		});
		showFilters = false;
	}

	function resetFilters() {
		filters = { direction: '', mode: '', party_id: '', sortBy: 'created_at', order: 'desc' };
		applyFilters();
	}

	function handleDelete(id: string) {
		log('Deleting transaction:', id);
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(amount);
	};

	const formatTime = (dateStr: string) => {
		return new Date(dateStr).toLocaleTimeString('en-IN', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	};

	const formatDateHeader = (dateStr: string) => {
		const date = new Date(dateStr);
		const today = new Date();
		if (date.toDateString() === today.toDateString()) return 'Today';

		// Fixed: Explicitly type the options to avoid LSP "no overload match"
		const options: Intl.DateTimeFormatOptions = {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		};
		return date.toLocaleDateString('en-IN', options).toUpperCase();
	};

	function groupTransactions(transactions: transaction[]) {
		if (!transactions) return [];
		const groups: Record<string, transaction[]> = {};
		transactions.forEach((tx) => {
			const date = tx.created_at.split('T')[0];
			if (!groups[date]) groups[date] = [];
			groups[date].push(tx);
		});
		return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
	}
</script>

<div class="min-h-screen bg-background p-4 pb-32 md:p-8">
	<header class="mb-8 flex items-center justify-between px-2">
		<div>
			<h1 class="text-3xl font-black text-text-primary">Transactions</h1>
			<p class="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">
				History & Logs
			</p>
		</div>
		<div class="flex gap-3">
			<button
				onclick={() => (showFilters = !showFilters)}
				class="relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all hover:cursor-pointer active:scale-90
	{isClrearFilterActive('tran')
					? 'bg-primary text-background shadow-lg shadow-primary/20'
					: 'bg-surface-high text-text-primary'}"
			>
				{#if showFilters}
					<X size={20} />
				{:else}
					<Filter size={20} />
				{/if}

				{#if isClrearFilterActive('tran') && !showFilters}
					<span class="absolute -top-1 -right-1 flex h-3 w-3">
						<span
							class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
						></span>
						<span
							class="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-primary"
						></span>
					</span>
				{/if}
			</button>
			<a
				href={`/${data.businessId}/transactions`}
				class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-background shadow-xl shadow-primary/20 transition-transform hover:cursor-pointer active:scale-90"
			>
				<Plus size={28} strokeWidth={3} />
			</a>
		</div>
	</header>

	{#if showFilters}
		<div
			transition:slide
			class="mb-6 rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm"
		>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label class="ml-1 text-[10px] font-black text-text-secondary uppercase"
							>Direction
							<select
								bind:value={filters.direction}
								class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none hover:cursor-pointer focus:ring-2 focus:ring-primary"
							>
								<option value="">All Types</option>

								<option value="in">Cash In (+)</option>

								<option value="out">Cash Out (-)</option>
							</select>
						</label>
					</div>

					<div class="space-y-1">
						<label class="ml-1 text-[10px] font-black text-text-secondary uppercase"
							>Mode
							<select
								bind:value={filters.mode}
								class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none hover:cursor-pointer focus:ring-2 focus:ring-primary"
							>
								<option value="">All Modes</option>

								<option value="cash">Cash</option>

								<option value="online">Online</option>

								<option value="cheque">Cheque</option>
							</select>
						</label>
					</div>
				</div>

				<div class="space-y-1">
					<label class="ml-1 text-[10px] font-black text-text-secondary uppercase"
						>Filter by Party
						<select
							bind:value={filters.party_id}
							class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none hover:cursor-pointer focus:ring-2 focus:ring-primary"
						>
							<option value="">All Parties</option>

							{#each partiesStore.parties as party}
								<option value={party.id}>{party.name}</option>
							{/each}
						</select>
					</label>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label class="ml-1 text-[10px] font-black text-text-secondary uppercase"
							>From
							<input
								type="date"
								bind:value={filters.from}
								class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none hover:cursor-pointer focus:ring-2 focus:ring-primary"
							/></label
						>
					</div>

					<div class="space-y-1">
						<label class="ml-1 text-[10px] font-black text-text-secondary uppercase"
							>To

							<input
								type="date"
								bind:value={filters.to}
								class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none hover:cursor-pointer focus:ring-2 focus:ring-primary"
							/></label
						>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label class="ml-1 text-[10px] font-black text-text-secondary uppercase"
							>Sort By
							<select
								bind:value={filters.sortBy}
								class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant hover:cursor-pointer"
							>
								<option value="created_at">Date</option>

								<option value="amount">Amount</option>
							</select>
						</label>
					</div>

					<div class="space-y-1">
						<label class="ml-1 text-[10px] font-black text-text-secondary uppercase"
							>Order

							<select
								bind:value={filters.order}
								class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant hover:cursor-pointer"
							>
								<option value="desc">Newest / Highest</option>

								<option value="asc">Oldest / Lowest</option>
							</select>
						</label>
					</div>
				</div>
			</div>

			<div class="mt-6 flex gap-3">
				<button
					onclick={resetFilters}
					disabled={!canClear}
					class="flex-1 rounded-2xl py-3 font-black transition-all active:scale-95
                {canClear
						? 'cursor-pointer bg-surface-high text-text-primary hover:bg-surface-variant'
						: 'cursor-not-allowed bg-disabled text-text-disabled'}"
				>
					Clear
				</button>

				<button
					onclick={applyFilters}
					disabled={!canApply}
					class="flex-2 rounded-2xl py-3 font-black shadow-lg transition-all
    {canApply
						? 'bg-primary text-background shadow-primary/20 hover:cursor-pointer active:scale-95'
						: 'cursor-not-allowed bg-primary/40 text-background/50 shadow-none'}"
				>
					Apply Filters
				</button>
			</div>
		</div>
	{/if}
	{#await activePromise}
		<div class="flex flex-col items-center justify-center py-20 opacity-50">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:then res}
		<div class="mb-10 rounded-4xl border border-outline-variant bg-surface p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
						{isClrearFilterActive('tran') ? 'Filterd' : 'Business'} Net Balance
					</p>
					<h2 class="text-3xl font-black text-text-primary">
						{formatCurrency(res.stats.net_balance)}
					</h2>
				</div>
				<div class="h-12 w-px bg-outline-variant"></div>
				<div class="space-y-2 text-right">
					<p class="text-[10px] font-bold text-success uppercase">
						{isClrearFilterActive('tran') ? '[Filterd]' : '[Total]'} in: {formatCurrency(
							res.stats.cash_in
						)}
					</p>
					<p class="text-[10px] font-bold text-error uppercase">
						{isClrearFilterActive('tran') ? '[Filterd]' : '[Total]'} out: {formatCurrency(
							res.stats.cash_out
						)}
					</p>
				</div>
			</div>
		</div>

		<div class="space-y-8">
			{#each groupTransactions(res.transactions) as [date, txs]}
				<div class="space-y-3">
					<h3
						class="px-2 text-[11px] font-black tracking-widest text-text-secondary uppercase opacity-70"
					>
						{formatDateHeader(date)}
					</h3>
					{#each txs as tx (tx.id)}
						<div
							transition:fade
							class="relative rounded-3xl border border-outline-variant bg-surface p-5 active:bg-surface-high"
						>
							<div class="flex items-start justify-between">
								<div class="space-y-1">
									<h4 class="text-lg font-black text-text-primary">
										{tx.party_name || 'Walking Party'}
									</h4>
									<div
										class="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase"
									>
										<span>{tx.mode}</span>
										<span class="h-1 w-1 rounded-full bg-outline-variant"></span>
										<span>{formatTime(tx.created_at)}</span>
									</div>
								</div>
								<div class="text-right font-black">
									<p class="text-xl {tx.direction === 'in' ? 'text-success' : 'text-error'}">
										{tx.direction === 'in' ? '+' : '-'}
										{formatCurrency(tx.amount)}
									</p>
								</div>
							</div>
							<div
								class="mt-4 flex items-center justify-between border-t border-outline-variant/30 pt-4 text-[10px] font-bold text-text-secondary"
							>
								<span>Entry by: <span class="text-text-primary">{tx.user_name}</span></span>
								{#if businessStore.selected?.role !== 'employee'}
									<button onclick={() => handleDelete(tx.id)} class="text-error/40 hover:text-error"
										><Trash2 size={16} /></button
									>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-20 text-center opacity-40">
					<Wallet size={48} class="mx-auto mb-4" />
					<p class="font-bold">No transactions recorded</p>
				</div>
			{/each}
		</div>
	{/await}
</div>
