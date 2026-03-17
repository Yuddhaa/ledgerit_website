<script lang="ts">
	import {
		X,
		CheckCircle2,
		XCircle,
		ArrowRight,
		Info,
		MessageSquare,
		PencilLine,
		Save
	} from 'lucide-svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import { getTransactionDiff, diffLabels } from '$lib/utils/helpers';
	import type { approval, transactionChange, approvalStatus } from '$lib/utils/types';
	import { auth } from '$lib/stores/store.svelte';

	let {
		Approval,
		partyPromise,
		categoryPromise,
		onResolve,
		onClose
	}: {
		Approval: approval;
		partyPromise: any;
		categoryPromise: any;
		onResolve: (
			approvalId: string,
			status: approvalStatus,
			data: transactionChange,
			reason: string
		) => void;
		onClose: () => void;
	} = $props();

	const isReviewer = $derived(Approval.requested_by_id !== auth.user?.id);

	let editedData = $state<transactionChange>({ ...Approval.requested_changes });
	let adminReason = $state('');
	let isRejecting = $state(false);
	let isEditing = $state(false);

	const activeChanges = $derived(getTransactionDiff(Approval.original, editedData));

	const formatCurrency = (amount: string | number) => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(Number(amount));
	};

	function selectParty(e: Event) {
		const target = e.target as HTMLSelectElement;
		const selected = target.options[target.selectedIndex];
		editedData.party_id = target.value;
		editedData.party_name = selected.text;
	}

	function selectCategory(e: Event) {
		const target = e.target as HTMLSelectElement;
		const selected = target.options[target.selectedIndex];
		editedData.category_id = target.value;
		editedData.category_name = selected.text;
	}
</script>

<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm md:items-center"
>
	<div
		transition:fly={{ y: 100, duration: 300 }}
		class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[40px] border border-outline-variant bg-surface shadow-2xl md:rounded-[40px]"
	>
		<header
			class="flex items-center justify-between border-b border-outline-variant/30 bg-surface-high/30 p-6"
		>
			<div>
				<h2 class="text-xl font-black text-text-primary">Review Request</h2>
				<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
					{Approval.type} by {Approval.requested_by_name}
				</p>
			</div>
			<button
				onclick={onClose}
				class=" flex h-10 w-10 items-center justify-center rounded-full bg-background/50 text-text-secondary transition-colors hover:cursor-pointer hover:text-error"
			>
				<X size={20} />
			</button>
		</header>

		<div class="flex-1 space-y-8 overflow-y-auto p-6 pb-12">
			<section
				transition:slide
				class="space-y-3 rounded-3xl border border-outline-variant/30 bg-surface-high/50 p-5"
			>
				<p
					class="flex items-center gap-2 text-[10px] font-black tracking-widest text-text-secondary uppercase"
				>
					<Info size={12} class="text-primary" /> Changes vs Original
				</p>
				<div class="grid grid-cols-1 gap-y-2">
					{#each activeChanges as field}
						<div
							class="flex items-center justify-between border-b border-outline-variant/10 pb-1 text-xs font-bold last:border-none"
						>
							<span class="text-text-secondary">{diffLabels[field] || field}:</span>
							<div class="flex items-center gap-2">
								<span class="text-text-secondary line-through opacity-40">
									{field === 'amount'
										? formatCurrency(Approval.original[field])
										: Approval.original[field] || '—'}
								</span>
								<ArrowRight size={12} class="text-primary" />
								<span class="text-primary">
									{field === 'amount'
										? formatCurrency(editedData[field])
										: editedData[field] || '—'}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</section>

			{#if !isEditing && !isRejecting}
				<button
					onclick={() => (isEditing = true)}
					class=" flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant py-4 text-sm font-bold text-text-secondary transition-all hover:cursor-pointer hover:border-primary/50 hover:text-primary"
				>
					<PencilLine size={18} /> Modify Transaction Details
				</button>
			{/if}

			{#if isEditing}
				<section
					transition:slide
					class="space-y-4 rounded-3xl border border-primary/20 bg-primary/5 p-5"
				>
					<div class="flex items-center justify-between">
						<h3 class="text-[11px] font-black text-primary uppercase">Manual Adjustments</h3>
						<button
							onclick={() => (isEditing = false)}
							class=" text-[10px] font-bold text-text-secondary underline hover:cursor-pointer"
							>Hide Form</button
						>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-1">
							<label class="ml-1 text-[10px] font-bold text-text-secondary uppercase">Amount</label>
							<input
								type="text"
								bind:value={editedData.amount}
								class="w-full rounded-2xl bg-background p-4 text-lg font-black ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
							/>
						</div>

						<div class="space-y-1">
							<label class="ml-1 text-[10px] font-bold text-text-secondary uppercase"
								>Direction</label
							>
							<div class="flex gap-2 rounded-2xl bg-background p-1 ring-1 ring-outline-variant">
								<button
									onclick={() => (editedData.direction = 'in')}
									class="flex-1 rounded-xl py-3 text-xs font-black transition-all hover:cursor-pointer {editedData.direction ===
									'in'
										? 'bg-success text-background'
										: 'text-text-secondary'}">IN</button
								>
								<button
									onclick={() => (editedData.direction = 'out')}
									class="flex-1 rounded-xl py-3 text-xs font-black transition-all hover:cursor-pointer {editedData.direction ===
									'out'
										? 'bg-error text-background'
										: 'text-text-secondary'}">OUT</button
								>
							</div>
						</div>

						<div class="space-y-1">
							<label class="ml-1 text-[10px] font-bold text-text-secondary uppercase">Mode</label>
							<select
								bind:value={editedData.mode}
								class="w-full rounded-2xl bg-background p-4 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="cash">Cash</option>
								<option value="online">Online</option>
								<option value="cheque">Cheque</option>
							</select>
						</div>

						<div class="space-y-1">
							<label class="ml-1 text-[10px] font-bold text-text-secondary uppercase"
								>Receipt No</label
							>
							<input
								type="text"
								bind:value={editedData.receipt_no}
								class="w-full rounded-2xl bg-background p-4 text-sm font-bold ring-1 ring-outline-variant outline-none"
							/>
						</div>

						<div class="space-y-1 md:col-span-2">
							<label class="ml-1 text-[10px] font-bold text-text-secondary uppercase">Party</label>
							<select
								onchange={selectParty}
								class="w-full rounded-2xl bg-background p-4 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="">Select Party</option>
								{#await partyPromise}
									<option>Loading...</option>
								{:then res}
									{#each res.parties as party}
										<option value={party.id} selected={editedData.party_id === party.id}
											>{party.name}</option
										>
									{/each}
								{/await}
							</select>
						</div>

						<div class="space-y-1 md:col-span-2">
							<label class="ml-1 text-[10px] font-bold text-text-secondary uppercase"
								>Category</label
							>
							<select
								onchange={selectCategory}
								class="w-full rounded-2xl bg-background p-4 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
							>
								<option value="">Select Category</option>
								{#await categoryPromise}
									<option>Loading...</option>
								{:then res}
									{#each res.categories as cat}
										<option value={cat.id} selected={editedData.category_id === cat.id}
											>{cat.name}</option
										>
									{/each}
								{/await}
							</select>
						</div>

						<div class="space-y-1 md:col-span-2">
							<label class="ml-1 text-[10px] font-bold text-text-secondary uppercase"
								>Description</label
							>
							<textarea
								bind:value={editedData.description}
								rows="2"
								class="w-full rounded-2xl bg-background p-4 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
							></textarea>
						</div>
					</div>
				</section>
			{/if}

			<section class="space-y-2">
				<label
					class="ml-1 flex items-center gap-2 text-[10px] font-black text-text-secondary uppercase"
				>
					<MessageSquare size={12} />
					{isReviewer ? 'Reviewer Comment' : 'Update Message'}
				</label>
				<textarea
					bind:value={adminReason}
					placeholder={isRejecting
						? 'Reason for rejection (Required)...'
						: 'Add an internal note...'}
					class="w-full rounded-2xl bg-background p-4 text-sm font-medium ring-1 transition-all outline-none {isRejecting
						? 'ring-error'
						: 'ring-outline-variant'}"
				></textarea>
			</section>
		</div>

		<footer class="border-t border-outline-variant/30 bg-surface-high/30 p-6">
			<div class="flex gap-3">
				{#if isReviewer}
					{#if !isRejecting}
						<button
							onclick={() => (isRejecting = true)}
							class="flex-1 rounded-2xl border border-error/20 bg-error/5 py-4 text-sm font-black text-error hover:cursor-pointer"
							>Reject</button
						>
						<button
							onclick={() => onResolve(Approval.id, 'approved', editedData, adminReason)}
							class="flex-[2] rounded-2xl bg-primary py-4 text-sm font-black text-background shadow-lg shadow-primary/20 transition-all hover:cursor-pointer active:scale-95"
						>
							<CheckCircle2 size={18} class="mr-1 inline" /> Approve
						</button>
					{:else}
						<button
							onclick={() => (isRejecting = false)}
							class="flex-1 rounded-2xl bg-surface-high py-4 text-sm font-black text-text-secondary hover:cursor-pointer"
							>Cancel</button
						>
						<button
							disabled={!adminReason}
							onclick={() => onResolve(Approval.id, 'rejected', editedData, adminReason)}
							class="flex-[2] rounded-2xl bg-error py-4 text-sm font-black text-background shadow-lg hover:cursor-pointer disabled:opacity-50"
							>Confirm Reject</button
						>
					{/if}
				{:else}
					<button
						onclick={() => onResolve(Approval.id, 'pending', editedData, adminReason)}
						class="w-full rounded-2xl bg-primary py-4 text-sm font-black text-background shadow-lg hover:cursor-pointer active:scale-95"
					>
						<Save size={18} class="mr-1 inline" /> Update Request
					</button>
				{/if}
			</div>
		</footer>
	</div>
</div>
