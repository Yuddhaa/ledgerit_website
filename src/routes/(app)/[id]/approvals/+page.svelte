<script lang="ts">
	import {
		CheckCircle2,
		XCircle,
		Clock,
		Filter,
		ArrowRight,
		Edit3,
		Trash2,
		X
	} from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';
	import transactionsApi from '$lib/api/transactionsApi';
	import {
		approvalStore,
		isApplyFilterActive,
		isClrearFilterActive
	} from '$lib/stores/store.svelte';
	import { log } from '$lib/utils/helpers';
	import { getTransactionDiff, diffLabels } from '$lib/utils/helpers'; // Ensure these are imported
	import type { approval, approvalStatus, approvalType } from '$lib/utils/types.js';
	import ApprovalPopUp from '$lib/components/ApprovalPopUp.svelte';

	let { data } = $props();

	// --- State ---
	let activeTab = $state<approvalStatus>('pending');
	let showFilters = $state(false);
	let manualPromise = $state<Promise<any> | null>(null);
	let activePromise = $derived(manualPromise || data.approvalPromise);

	// Derived visible list for instant tab switching
	const visibleRequests = $derived(
		approvalStore.approvals.filter((req) => req.status === activeTab)
	);

	// Filter state initialized from store
	let filters = $state({ ...approvalStore.filter });

	// Derived helpers for button states
	let canApply = $derived(isApplyFilterActive('approval', filters));
	let canClear = $derived(isClrearFilterActive('approval'));

	// --- Actions ---
	async function refreshApprovals() {
		approvalStore.filter = { ...filters };

		manualPromise = transactionsApi
			.listApprovals(approvalStore.businessId!, approvalStore.filter)
			.then((res) => {
				approvalStore.approvals = res.requests || [];
				return res;
			});
	}

	function handleTabChange(tab: approvalStatus) {
		activeTab = tab;
	}

	function resetFilters() {
		filters = { from: '', to: '', type: undefined, requested_by: [] };
		refreshApprovals();
	}

	const formatCurrency = (amount: string | number) => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(Number(amount));
	};

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	let selectedApproval: approval | null = $state(null);
</script>

<div class="min-h-screen bg-background p-4 pb-32 md:p-8">
	<header class="mb-6 flex items-center justify-between px-2">
		<div>
			<h1 class="text-3xl font-black text-text-primary">Approvals</h1>
			<p class="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">
				Verification Queue
			</p>
		</div>
		<button
			onclick={() => (showFilters = !showFilters)}
			class="relative flex h-12 w-12 items-center justify-center rounded-2xl transition-transform hover:cursor-pointer active:scale-90
            {isClrearFilterActive('approval')
				? 'bg-primary text-background'
				: 'bg-surface-high text-text-primary'}"
		>
			{#if showFilters}<X size={20} />{:else}<Filter size={20} />{/if}
			{#if isClrearFilterActive('approval') && !showFilters}
				<span class="absolute -top-1 -right-1 flex h-3 w-3">
					<span
						class="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-primary"
					></span>
				</span>
			{/if}
		</button>
	</header>

	<div class="mb-6 flex rounded-2xl border border-outline-variant bg-surface-high p-1">
		{#each ['pending', 'approved', 'rejected'] as tab}
			<button
				onclick={() => handleTabChange(tab as approvalStatus)}
				class="flex-1 rounded-xl py-2 text-xs font-black tracking-wider uppercase transition-all hover:cursor-pointer
				{activeTab === tab
					? 'bg-primary text-background shadow-md'
					: 'text-text-secondary hover:text-text-primary'}"
			>
				{tab}
			</button>
		{/each}
	</div>

	{#if showFilters}
		<div
			transition:slide
			class="mb-6 space-y-5 rounded-3xl border border-outline-variant bg-surface p-6 shadow-sm"
		>
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-1">
					<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">From</label>
					<input
						type="date"
						bind:value={filters.from}
						class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<div class="space-y-1">
					<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">To</label>
					<input
						type="date"
						bind:value={filters.to}
						class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
			</div>

			<div class="space-y-1">
				<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">Type</label>
				<select
					bind:value={filters.type}
					class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
				>
					<option value="">All Types</option>
					<option value="edit">Edits</option>
					<option value="delete">Deletions</option>
				</select>
			</div>

			<div class="space-y-2">
				<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">Requested By</label
				>
				<div
					class="max-h-40 space-y-2 overflow-y-auto rounded-xl bg-background p-3 ring-1 ring-outline-variant"
				>
					{#await data.employeesPromise}
						<p class="animate-pulse text-[10px] font-bold text-text-secondary">
							Loading employees...
						</p>
					{:then res}
						{#each res.members as employee}
							<label class="group flex cursor-pointer items-center gap-3 py-1">
								<div class="relative flex items-center justify-center">
									<input
										type="checkbox"
										value={employee.id}
										bind:group={filters.requested_by}
										class="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-outline-variant bg-surface transition-all checked:border-primary checked:bg-primary focus:outline-none"
									/>
									<div
										class="pointer-events-none absolute scale-0 text-background transition-transform peer-checked:scale-100"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="4"
											stroke-linecap="round"
											stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg
										>
									</div>
								</div>
								<span
									class="text-sm font-bold text-text-primary transition-colors group-hover:text-primary"
									>{employee.name}</span
								>
							</label>
						{/each}
					{/await}
				</div>
			</div>

			<div class="flex gap-3 pt-2">
				<button
					onclick={resetFilters}
					disabled={!canClear}
					class="flex-1 rounded-2xl py-3 font-black transition-all hover:cursor-pointer {canClear
						? 'bg-surface-high text-text-primary active:scale-95'
						: 'cursor-not-allowed bg-disabled text-text-disabled'}">Clear</button
				>
				<button
					onclick={() => {
						refreshApprovals();
						showFilters = false;
					}}
					disabled={!canApply}
					class="flex-[2] rounded-2xl py-3 font-black text-background transition-all hover:cursor-pointer {canApply
						? 'bg-primary shadow-lg shadow-primary active:scale-95'
						: 'cursor-not-allowed bg-primary/40'}">Apply Filters</button
				>
			</div>
		</div>
	{/if}

	{#await activePromise}
		<div class="flex justify-center py-20 opacity-40">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:then res}
		<div class="space-y-6">
			{#each visibleRequests as req (req.id)}
				<div
					transition:fade
					class="overflow-hidden rounded-4xl border border-outline-variant bg-surface"
				>
					<div class="border-b border-outline-variant/30 bg-surface-high/30 p-5">
						<div class="mb-3 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<div
									class="rounded-lg p-2 {req.type === 'edit'
										? 'bg-primary/10 text-primary'
										: 'bg-error/10 text-error'}"
								>
									{#if req.type === 'edit'}<Edit3 size={16} />{:else}<Trash2 size={16} />{/if}
								</div>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-black text-primary uppercase"
								>
									{req.requested_by_name[0]}
								</div>
								<span class="text-[11px] font-black tracking-widest text-text-primary uppercase"
									>By {req.requested_by_name}</span
								>
							</div>
							<span class="text-[10px] font-bold text-text-secondary"
								>{formatDate(req.created_at)}</span
							>
						</div>
					</div>

					<div class="space-y-4 p-5">
						{#if activeTab === 'pending'}
							<div
								class="rounded-2xl border border-outline-variant/50 bg-background/50 p-4 transition-all"
							>
								<div class="mb-2 flex items-center justify-between">
									<p class="text-[9px] font-black tracking-widest text-text-secondary uppercase">
										{req.type === 'edit' ? 'Update Details' : 'Deletion Target'}
									</p>
									<div
										class="flex items-center gap-1 text-[10px] font-black {req.type === 'edit'
											? 'text-primary'
											: 'text-error'} uppercase"
									>
										<Clock size={12} /> Pending
									</div>
								</div>

								<div class="flex items-end justify-between">
									<div>
										<p class="text-2xl font-black text-text-primary">
											{formatCurrency(req.original.amount)}
										</p>
										<div
											class="mt-1 flex items-center gap-2 text-[10px] font-bold text-text-secondary uppercase"
										>
											<span class="text-text-primary"
												>{req.original.party_name || 'Walking Party'}</span
											>
											<span class="h-1 w-1 rounded-full bg-outline-variant"></span>
											<span>{req.original.mode}</span>
										</div>
									</div>

									{#if req.type === 'edit'}
										<div class="text-right">
											<span
												class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[9px] font-black text-primary uppercase"
											>
												Modifying Entry
											</span>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						{#if activeTab !== 'pending'}
							<div class="rounded-2xl border border-outline-variant/30 bg-background/50 p-4">
								<p class="mb-1 text-[9px] font-black tracking-widest text-text-secondary uppercase">
									Transaction Reference
								</p>
								<p class="text-lg font-black text-text-primary">
									{formatCurrency(req.original.amount)}
								</p>
								<p class="text-[10px] font-bold text-text-secondary uppercase">
									{req.original.party_name} • {req.original.mode}
								</p>
							</div>

							<div
								transition:slide
								class="mt-4 overflow-hidden rounded-2xl border {req.status === 'approved'
									? 'border-success/20 bg-success/5'
									: 'border-error/20 bg-error/5'}"
							>
								<div class="flex items-center justify-between p-4">
									<div class="flex items-center gap-3">
										<div
											class="flex h-8 w-8 items-center justify-center rounded-full {req.status ===
											'approved'
												? 'bg-success text-background'
												: 'bg-error text-background'}"
										>
											{#if req.status === 'approved'}<CheckCircle2 size={16} />{:else}<XCircle
													size={16}
												/>{/if}
										</div>
										<div>
											<p
												class="text-[10px] font-black tracking-widest uppercase {req.status ===
												'approved'
													? 'text-success'
													: 'text-error'}"
											>
												Request {req.status}
											</p>
											<p class="text-xs font-bold text-text-primary">
												Audited by <span class="underline decoration-primary/30"
													>{req.reviewed_by_name || 'System'}</span
												>
											</p>
										</div>
									</div>
									<div class="text-right">
										<p class="text-[9px] font-bold text-text-secondary uppercase">Audit Date</p>
										<p class="text-[10px] font-black text-text-primary">
											{formatDate(req.updated_at)}
										</p>
									</div>
								</div>

								{#if req.status === 'rejected'}
									<div class="border-t border-error/10 bg-error/5 p-3">
										<p class="mb-1 text-[9px] font-black text-error uppercase opacity-60">
											Rejection Reason
										</p>
										<p class="text-xs leading-relaxed font-medium text-error">
											{req.reason || 'No specific reason provided.'}
										</p>
									</div>
								{/if}
							</div>
						{/if}

						{#if req.reason && activeTab === 'pending'}
							<div class="mt-2 rounded-xl border-l-4 border-primary/30 bg-surface-high/50 p-3">
								<p class="mb-1 text-[9px] font-black tracking-tight text-text-secondary uppercase">
									Requester's Note
								</p>
								<p class="text-xs leading-relaxed text-text-primary italic">"{req.reason}"</p>
							</div>
						{/if}

						{#if activeTab === 'pending'}
							<button
								onclick={() => {
									selectedApproval = req;
								}}
								class="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-sm font-black text-background shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:cursor-pointer active:scale-95"
							>
								<CheckCircle2 size={18} />
								Review & Take Action
							</button>
						{/if}
					</div>
				</div>
			{:else}
				<div class="py-20 text-center opacity-30">
					<Clock size={48} class="mx-auto mb-4" />
					<p class="font-bold uppercase tracking-widest text-xs">No {activeTab} requests</p>
				</div>
			{/each}
		</div>
	{/await}
</div>

{#if selectedApproval}
	<ApprovalPopUp
		Approval={selectedApproval}
		onClose={() => (selectedApproval = null)}
		categoryPromise={data.categoryPromise}
		partyPromise={data.partyPromise}
		onResolve={async (status, data, reason) => {
			// 1. Call your API here (e.g., transactionsApi.resolveApproval)
			// 2. Refresh the local store/list
			selectedApproval = null;
		}}
	/>
{/if}
