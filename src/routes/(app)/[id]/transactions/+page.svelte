<script lang="ts">
	import { 
		Search, Filter, ArrowUpRight, ArrowDownLeft, 
		Plus, Calendar, Wallet, User as UserIcon, X 
	} from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import transactionsApi from '$lib/api/transactionsApi';
	import { log } from '$lib/utils/helpers';

	let { data } = $props();

	// --- State ---
	let showFilters = $state(false);
	let transactionsPromise = $state(data.transactionsPromise);

	// Filter Params State
	let filters = $state({
		mode: '',
		direction: '',
		sortBy: 'created_at',
		order: 'desc'
	});

	// --- Actions ---
	async function applyFilters() {
		log("Applying filters:", filters);
		// Re-assigning the promise triggers the #await block
		transactionsPromise = transactionsApi.listAll(data.businessId, filters);
		showFilters = false;
	}

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR'
		}).format(amount);
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	};
</script>

<div class="min-h-screen bg-background p-4 pb-24 md:p-8">
	<header class="mb-6 flex items-center justify-between px-2">
		<div>
			<h1 class="text-2xl font-black text-text-primary">Transactions</h1>
			<p class="text-xs font-bold text-text-secondary uppercase tracking-tight">History & Logs</p>
		</div>
		<div class="flex gap-2">
			<button 
				onclick={() => showFilters = !showFilters}
				class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-text-primary active:scale-90 transition-transform"
			>
				<Filter size={20} />
			</button>
			<a href={`/${data.businessId}/transactions/create`} class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-background shadow-lg active:scale-90 transition-transform">
				<Plus size={24} />
			</a>
		</div>
	</header>

	{#if showFilters}
		<div transition:slide class="mb-6 rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm">
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1">
					<label class="ml-1 text-[10px] font-black uppercase text-text-secondary">Type</label>
					<select bind:value={filters.direction} class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant">
						<option value="">All</option>
						<option value="in">Cash In</option>
						<option value="out">Cash Out</option>
					</select>
				</div>
				<div class="space-y-1">
					<label class="ml-1 text-[10px] font-black uppercase text-text-secondary">Mode</label>
					<select bind:value={filters.mode} class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant">
						<option value="">All</option>
						<option value="cash">Cash</option>
						<option value="online">Online</option>
					</select>
				</div>
			</div>
			<button 
				onclick={applyFilters}
				class="mt-6 w-full rounded-2xl bg-primary py-3 font-black text-background transition-opacity hover:opacity-90"
			>
				Apply Filters
			</button>
		</div>
	{/if}

	{#await transactionsPromise}
		<div class="flex flex-col items-center justify-center py-20 opacity-50">
			<div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
			<p class="mt-4 font-bold text-text-secondary">Fetching ledgers...</p>
		</div>
	{:then res}
		<div class="mb-8 grid grid-cols-2 gap-4 px-2">
			<div class="rounded-3xl bg-success/10 border border-success/20 p-5">
				<p class="text-[10px] font-bold text-success uppercase tracking-widest">Total In</p>
				<p class="mt-1 text-xl font-black text-success">{formatCurrency(res.stats.cash_in)}</p>
			</div>
			<div class="rounded-3xl bg-error/10 border border-error/20 p-5">
				<p class="text-[10px] font-bold text-error uppercase tracking-widest">Total Out</p>
				<p class="mt-1 text-xl font-black text-error">{formatCurrency(res.stats.cash_out)}</p>
			</div>
		</div>

		<div class="space-y-3">
			{#each res.transactions as tx (tx.id)}
				<div 
					transition:fade
					class="group flex items-center gap-4 rounded-3xl border border-outline-variant bg-surface p-4 transition-colors active:bg-surface-high"
				>
					<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl {tx.direction === 'in' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}">
						{#if tx.direction === 'in'}
							<ArrowDownLeft size={24} />
						{:else}
							<ArrowUpRight size={24} />
						{/if}
					</div>

					<div class="flex-1 overflow-hidden">
						<div class="flex items-center justify-between">
							<h3 class="truncate font-black text-text-primary">{tx.party_name || 'Walking Party'}</h3>
							<p class="font-black {tx.direction === 'in' ? 'text-success' : 'text-error'}">
								{tx.direction === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
							</p>
						</div>
						<div class="mt-1 flex items-center justify-between">
							<div class="flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase">
								<span class="rounded bg-surface-high px-1.5 py-0.5">{tx.mode}</span>
								<span>•</span>
								<span>{tx.category_name || 'General'}</span>
							</div>
							<p class="text-[10px] font-bold text-text-secondary/60">
								{formatDate(tx.created_at)}
							</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="py-20 text-center">
					<p class="font-bold text-text-secondary">No transactions found.</p>
				</div>
			{/each}
		</div>
	{:catch error}
		<div class="rounded-3xl bg-error/10 p-8 text-center border border-error/20">
			<p class="font-black text-error">Failed to load transactions</p>
			<p class="text-xs text-error/70 mt-1">{error.message}</p>
			<button onclick={applyFilters} class="mt-4 text-sm font-bold underline decoration-2 underline-offset-4 text-error">Try again</button>
		</div>
	{/await}
</div>
