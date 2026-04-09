<script lang="ts">
	import { Plus, RefreshCw, Trash2, Wallet, X, Filter, Check } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { invalidate } from '$app/navigation';
	import transactionsApi from '$lib/api/transactionsApi';
	import {
		transactionStore,
		isClrearFilterActive,
		businessStore
	} from '$lib/stores/store.svelte.js';
	import type { transaction, tranStats } from '$lib/utils/types.js';
	import Toast from '$lib/components/Toast.svelte';
	import TranFilter from '$lib/components/TranFilter.svelte';
	import TranDetail from '$lib/components/TranDetail.svelte';
	import ExportPdfButton from '$lib/components/ExportPdfButton.svelte'; // [NEW IMPORT]

	let { data } = $props();

	// --- State Management ---
	let manualPromise = $state<Promise<any> | null>(null);
	let refreshing = $state(false);

	// Derived promise ensures UI stays in sync with either initial load or filter changes
	let activePromise = $derived(manualPromise || data.transactionsPromise);

	let selectedTran: transaction | null = $state(null);

	// --- Handlers ---
	async function handleApplyFilters(newFilters: any) {
		transactionStore.filter = { ...newFilters };
		manualPromise = transactionsApi.listAll(data.businessId, newFilters).then((res) => {
			transactionStore.transactions = {
				stats: res.stats,
				transactions: res.transactions ? res.transactions : []
			};
			return res;
		});
	}

	function handleReset() {
		const defaults = {
			user_id: [],
			category_id: [],
			party_id: [],
			mode: [],
			direction: '',
			sortBy: 'created_at',
			order: 'desc'
		};
		handleApplyFilters(defaults);
	}

	function onRefresh() {
		refreshing = true;
		transactionStore.businessId = null;
		invalidate('layout:transactions');
		refreshing = false;
	}

	let isLoading = $state(false);
	let warnMsg = $state('');
	let errMsg = $state('');
	let successMsg = $state('');
	let warnOnConfirm = $state(() => {});
	async function handleDelete(id: string) {
		isLoading = true;
		try {
			await transactionsApi.delete(data.businessId, id);
			transactionStore.businessId = null;
			await invalidate('layout:transactions');
			isLoading = false;
			successMsg = 'Transaction Deleted';
		} catch (err: any) {
			isLoading = false;
			errMsg = err.message || `something went wront while deleting transaction!!!`;
		}
	}

	// --- Formatting Helpers ---
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
			{#await activePromise then res}
				<ExportPdfButton
					transactions={res.transactions || []}
					stats={res.stats}
					businessName={businessStore.selected?.name || 'My Business'}
				/>

				<button
					disabled={refreshing}
					onclick={onRefresh}
					class="group flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant bg-surface-high text-text-secondary transition-all hover:cursor-pointer hover:border-primary/30 hover:text-primary active:scale-90 disabled:opacity-50"
				>
					<div
						class={refreshing
							? 'animate-spin'
							: 'transition-transform duration-500 group-hover:rotate-180'}
					>
						<RefreshCw size={20} />
					</div>
				</button>

				<a
					data-sveltekit-preload-code="false"
					data-sveltekit-preload-data="false"
					href={`/${data.businessId}/transactions/addTransaction`}
					class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-background shadow-xl shadow-primary/20 transition-transform hover:cursor-pointer active:scale-90"
				>
					<Plus size={28} strokeWidth={3} />
				</a>
			{/await}
		</div>
	</header>

	<TranFilter
		initialFilters={transactionStore.filter}
		onApply={handleApplyFilters}
		onReset={handleReset}
	/>

	{#await activePromise}
		<div class="flex flex-col items-center justify-center py-20 opacity-50">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:then res: {
        stats: tranStats;
        transactions: transaction[];
    }}
		<div class="mb-10 rounded-4xl border border-outline-variant bg-surface p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<div class="space-y-1">
					<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
						{isClrearFilterActive('tran') ? 'Filtered' : 'Business'} Net Balance
					</p>
					<h2 class="text-3xl font-black text-text-primary">
						{formatCurrency(res.stats.net_balance)}
					</h2>
				</div>
				<div class="h-12 w-px bg-outline-variant"></div>
				<div class="space-y-2 text-right">
					<p class="text-[10px] font-bold text-success uppercase">
						IN: {formatCurrency(res.stats.cash_in)}
					</p>
					<p class="text-[10px] font-bold text-error uppercase">
						OUT: {formatCurrency(res.stats.cash_out)}
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
							class="group relative overflow-hidden rounded-3xl border border-outline-variant bg-surface p-4 transition-all hover:cursor-pointer hover:border-primary/30 active:scale-[0.98] active:bg-surface-high"
							onclick={(e: Event) => {
								e.stopPropagation();
								selectedTran = tx;
							}}
						>
							<div
								class="absolute top-0 left-0 h-full w-1.5 {tx.direction === 'in'
									? 'bg-success/40'
									: 'bg-error/40'}"
							></div>

							<div class="flex items-center justify-between gap-4">
								<div class="flex items-center gap-4">
									<div
										class="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-text-secondary ring-1 ring-outline-variant/50"
									>
										{#if tx.mode === 'cash'}
											<Wallet size={20} />
										{:else if tx.mode === 'online'}
											<RefreshCw size={20} />
										{:else}
											<Check size={20} />
										{/if}
									</div>

									<div class="space-y-0.5">
										<div class="flex items-center gap-2">
											<h4 class="max-w-[150px] truncate text-base font-black text-text-primary">
												{tx.party_name || 'Walking Party'}
											</h4>
											{#if tx.category_name}
												<span
													class="rounded-lg bg-surface-high px-2 py-0.5 text-[8px] font-black tracking-tighter text-text-secondary uppercase ring-1 ring-outline-variant/30"
												>
													{tx.category_name}
												</span>
											{/if}
										</div>
										<div
											class="flex items-center gap-2 text-[9px] font-bold tracking-tight text-text-secondary uppercase"
										>
											<span class="text-primary">{tx.mode}</span>
											<span class="h-1 w-1 rounded-full bg-outline-variant"></span>
											<span>{formatTime(tx.created_at)}</span>
											{#if tx.receipt_no}
												<span class="h-1 w-1 rounded-full bg-outline-variant"></span>
												<span class="text-text-primary/60">#{tx.receipt_no}</span>
											{/if}
										</div>
									</div>
								</div>

								<div class="flex flex-col items-end gap-1">
									<p
										class="text-lg font-black tracking-tight {tx.direction === 'in'
											? 'text-success'
											: 'text-error'}"
									>
										{tx.direction === 'in' ? '+' : '-'}
										{formatCurrency(tx.amount)}
									</p>

									{#if businessStore.selected?.role !== 'employee'}
										<button
											onclick={(e) => {
												e.stopPropagation();
												warnMsg =
													'Are you sure you want to delete this transaction, its irreversible.';
												warnOnConfirm = async () => {
													warnMsg = '';
													await handleDelete(tx.id);
												};
											}}
											class="rounded-lg p-1 text-text-secondary/20 transition-colors hover:cursor-pointer hover:bg-error/10 hover:text-error"
										>
											<Trash2 size={14} />
										</button>
									{/if}
								</div>
							</div>

							{#if tx.description}
								<p
									class="mt-3 line-clamp-1 border-t border-outline-variant/20 pt-3 text-[10px] font-medium text-text-secondary italic"
								>
									"{tx.description}"
								</p>
							{/if}

							<div
								class="mt-3 flex items-center justify-between text-[8px] font-black tracking-widest text-text-secondary/50 uppercase"
							>
								<span>Record ID: {tx.id.slice(0, 8)}...</span>
								<span>By {tx.user_name}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-20 text-center opacity-40">
					<Wallet size={48} class="mx-auto mb-4" />
					<p class="font-bold uppercase tracking-widest text-xs">No transactions found</p>
				</div>
			{/each}
		</div>
	{/await}
</div>

{#if isLoading}
	<Toast toastType="loading" text="Please Wait..." />
{/if}

{#if errMsg}
	<Toast toastType="error" text={errMsg} close={() => (errMsg = '')} />
{/if}

{#if successMsg}
	<Toast toastType="success" text={successMsg} close={() => (successMsg = '')} />
{/if}

{#if warnMsg}
	<Toast
		toastType="warning"
		text={warnMsg}
		close={() => {
			warnMsg = '';
		}}
		onConfirm={warnOnConfirm}
	/>
{/if}

{#if selectedTran}
	<TranDetail
		tran={selectedTran}
		onClose={() => {
			selectedTran = null;
		}}
	/>
{/if}
