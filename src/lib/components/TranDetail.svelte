<script lang="ts">
	import { X, Share2, Edit3, User, Calendar, Tag, Wallet, MessageSquare } from 'lucide-svelte';
	import { fly, fade, slide } from 'svelte/transition';
	import type { transaction, user } from '$lib/utils/types';
	import { auth, businessStore } from '$lib/stores/store.svelte';

	interface Props {
		tran: transaction | null;
		onClose: () => void;
		onEdit: (tran: transaction) => void;
		// onShare: (tran: transaction) => void;
	}

	// let { tran, onClose, onEdit, onShare }: Props = $props();
	let { tran, onClose, onEdit }: Props = $props();

	// Role-based logic
	const canEditDirectly = $derived(
		businessStore.selected?.role === 'admin' || businessStore.selected?.role === 'creator'
	);
	const editButtonText = $derived(canEditDirectly ? 'Edit Transaction' : 'Request Edit');

	// Formatting helpers
	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};
	import { domToPng } from 'modern-screenshot';
	import { Share } from '@capacitor/share';
	import { Filesystem, Directory } from '@capacitor/filesystem';
	import { Capacitor } from '@capacitor/core';
	import { log } from '$lib/utils/helpers';
	async function handleShare(tran: transaction) {
		try {
			log('Starting share for:', tran.id);

			const element = document.getElementById('receipt-template');
			if (!element) return;

			// 1. Generate PNG with explicit dimensions to avoid blank results
			const dataUrl = await domToPng(element, {
				scale: 2,
				backgroundColor: '#ffffff',
				width: 375,
				height: element.offsetHeight
			});

			// 2. Convert DataURL to Base64
			const base64Data = dataUrl.split(',')[1];
			const fileName = `LedgerIt_Receipt_${tran.id}.png`;

			if (Capacitor.isNativePlatform()) {
				const savedFile = await Filesystem.writeFile({
					path: fileName,
					data: base64Data,
					directory: Directory.Cache
				});

				await Share.share({
					title: 'Transaction Receipt',
					text: `Receipt for ₹${tran.amount} for ${tran.party_name}`,
					url: savedFile.uri,
					dialogTitle: 'Share Receipt'
				});
			} else {
				const link = document.createElement('a');
				link.download = fileName;
				link.href = dataUrl;
				link.click();
			}
		} catch (err) {
			log('Modern Share failed:', err);
		}
	}
</script>

{#if tran}
	<div
		transition:fade={{ duration: 200 }}
		onclick={onClose}
		class="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
	></div>

	<div
		transition:fly={{ y: 400, duration: 300 }}
		class="fixed inset-x-0 bottom-0 z-[101] flex max-h-[90vh] flex-col rounded-t-[2.5rem] border-t border-outline-variant/30 bg-surface p-6 shadow-2xl"
	>
		<div class="mx-auto mb-6 h-1.5 w-12 rounded-full bg-outline-variant/50"></div>

		<div class="mb-8 flex items-center justify-between">
			<div>
				<p class="text-[10px] font-black tracking-widest text-text-secondary uppercase">
					Transaction Details
				</p>
				<h2 class="text-xl font-black text-text-primary">
					{tran.direction === 'in' ? 'Money Received' : 'Money Sent'}
				</h2>
			</div>
			<button
				onclick={onClose}
				class="rounded-full bg-surface-high p-2 text-text-secondary hover:text-error"
			>
				<X size={20} />
			</button>
		</div>

		<div class="mb-8 rounded-3xl bg-background p-8 text-center ring-1 ring-outline-variant/50">
			<p class="mb-1 text-[10px] font-black text-text-secondary uppercase">Amount</p>
			<h1 class="text-4xl font-black {tran.direction === 'in' ? 'text-primary' : 'text-error'}">
				{tran.direction === 'in' ? '+' : '-'} ₹{tran.amount.toLocaleString('en-IN')}
			</h1>
		</div>

		<div class="no-scrollbar flex-1 space-y-6 overflow-y-auto pb-6">
			{@render infoItem(User, 'Party / Contact', tran.party_name || 'Self')}
			{@render infoItem(Calendar, 'Date & Time', formatDate(tran.created_at))}
			{@render infoItem(Tag, 'Category', tran.category_name || 'Uncategorized')}
			{@render infoItem(Wallet, 'Payment Mode', tran.mode, 'uppercase')}

			{#if tran.description}
				{@render infoItem(MessageSquare, 'Note', tran.description)}
			{/if}

			<div class="border-t border-outline-variant/20 pt-4">
				<p class="mb-2 text-[10px] font-black text-text-secondary uppercase">Recorded By</p>
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
					>
						{tran.user_name.charAt(0)}
					</div>
					<span class="text-sm font-bold text-text-primary">{tran.user_name}</span>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4 border-t border-outline-variant/20 pt-4">
			<button
				onclick={async () => await handleShare(tran)}
				class="flex items-center justify-center gap-3 rounded-2xl bg-surface-high py-4 text-xs font-black text-text-primary uppercase transition-all hover:cursor-pointer active:scale-95"
			>
				<Share2 size={16} /> Share
			</button>

			<button
				onclick={() => onEdit(tran)}
				class="flex items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-xs font-black text-background uppercase shadow-lg shadow-primary/20 transition-all active:scale-95"
			>
				<Edit3 size={16} />
				{editButtonText}
			</button>
		</div>
	</div>
{/if}

{#snippet infoItem(icon: any, label: string, value: string, extraClass = '')}
	<div class="flex items-start gap-4">
		<div class="mt-1 text-text-secondary"><svelte:component this={icon} size={16} /></div>
		<div>
			<p class="text-[10px] font-black text-text-secondary uppercase">{label}</p>
			<p class="text-sm font-bold text-text-primary {extraClass}">{value}</p>
		</div>
	</div>
{/snippet}

<!-- ********************************************************************************************************* -->
<!-- transactio receipt -->
<!-- ********************************************************************************************************* -->
<div class="pointer-events-none fixed inset-0 overflow-hidden opacity-0" aria-hidden="true">
	<div
		id="receipt-template"
		class="w-[400px] bg-white p-10 text-black shadow-none"
		style="font-family: 'Inter', system-ui, sans-serif;"
	>
		<div class="mb-10 flex flex-col items-center border-b-2 border-gray-50 pb-6 text-center">
			<div
				class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-black text-xl font-black text-white"
			>
				L
			</div>
			<h1 class="text-sm font-black tracking-[0.2em] text-black uppercase">LedgerIt Digital</h1>
			<div
				class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-600 uppercase"
			>
				<div class="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
				Transaction Successful
			</div>
		</div>

		<div class="mb-10 text-center">
			<p class="mb-1 text-[10px] font-black tracking-widest text-gray-400 uppercase">
				Total Amount
			</p>
			<h2 class="text-5xl font-black text-black">
				<span class="text-3xl">₹</span>{tran?.amount.toLocaleString('en-IN')}
			</h2>
			<div class="mt-4 flex flex-col items-center">
				<p class="text-[10px] font-black text-gray-400 uppercase">
					{tran?.direction === 'in' ? 'Received From' : 'Paid To'}
				</p>
				<p class="text-lg font-black text-black">{tran?.party_name || 'Self'}</p>
			</div>
		</div>

		<div class="space-y-4 border-y border-dashed border-gray-200 py-8">
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Receipt No</span>
				<span class="text-xs font-black text-black">#{tran?.receipt_no || 'N/A'}</span>
			</div>

			<div class="flex items-center justify-between text-sm">
				<span class="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Date</span>
				<span class="text-xs font-black text-black">
					{new Date(tran?.created_at || '').toLocaleDateString('en-IN', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
					})}
				</span>
			</div>

			<div class="flex items-center justify-between text-sm">
				<span class="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Category</span>
				<span class="text-xs font-black text-black">{tran?.category_name || 'General'}</span>
			</div>

			<div class="flex items-center justify-between text-sm">
				<span class="text-[10px] font-bold tracking-wider text-gray-400 uppercase">Mode</span>
				<span class="rounded bg-gray-100 px-2 py-0.5 text-[9px] font-black text-black uppercase"
					>{tran?.mode}</span
				>
			</div>

			{#if tran?.description}
				<div class="mt-2 border-t border-gray-50 pt-4">
					<span class="mb-1 block text-[10px] font-bold tracking-wider text-gray-400 uppercase"
						>Notes</span
					>
					<p class="text-[11px] leading-relaxed font-medium text-gray-600">{tran.description}</p>
				</div>
			{/if}
		</div>

		<div class="mt-10 text-center">
			<div class="mb-4 flex flex-col items-center">
				<p class="text-[10px] font-bold text-gray-400 uppercase">Recorded By</p>
				<p class="text-xs font-black text-black">{tran?.user_name}</p>
			</div>

			<p class="text-[8px] font-medium tracking-tighter text-gray-300 uppercase">
				Ref ID: {tran?.id}
			</p>

			<div class="mt-6 border-t border-gray-50 pt-4">
				<p class="text-[9px] font-bold tracking-[0.3em] text-gray-400 uppercase">
					Thank you for using LedgerIt
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
</style>
