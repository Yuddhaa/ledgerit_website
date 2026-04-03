<script lang="ts">
	import {
		X,
		Search,
		Plus,
		Edit2,
		Trash2,
		Tags,
		Contact,
		MapPin,
		Check,
		Phone
	} from 'lucide-svelte';
	import { fade, slide, fly } from 'svelte/transition';
	import Fuse from 'fuse.js';
	import { businessStore, categoryStore, partiesStore } from '$lib/stores/store.svelte';
	import Toast from './Toast.svelte';
	import partiesApi from '$lib/api/partiesApi';
	import type { category, party } from '$lib/utils/types';
	import categoriesApi from '$lib/api/categoriesApi';
	import { invalidate } from '$app/navigation';

	interface Props {
		type: 'parties' | 'categories';
		promise: Promise<any>;
		placesPromise?: Promise<any>;
		close: () => void;
		onSelect?: (id: string) => void;
	}

	let { type, promise, placesPromise, close, onSelect }: Props = $props();

	const businessId = businessStore.selected!.id;
	const role = businessStore.selected!.role;

	// --- State ---
	let rawItems: party[] | category[] = $derived(
		(type === 'parties' ? partiesStore.parties : categoryStore.categories) as (party | category)[]
	);
	let searchQuery = $state('');
	let isAdding = $state(false);
	let isFiltering = $state(false);
	let actionLoading = $state(false);
	let editingId = $state<string | null>(null);

	let showDeleteConfirm = $state<string | null>(null);
	let errMsg = $state('');
	let successMsg = $state('');

	let selectedPlaces = $state<string[]>([]);

	let form = $state({ name: '', place: '', phone_number: '' });

	function resetForm() {
		form = { name: '', place: '', phone_number: '' };
	}

	// --- Initial Load ---
	$effect(() => {
		promise.then((res) => {
			if (type === 'parties') partiesStore.parties = res.parties;
			else categoryStore.categories = res.categories;
		});

		if (type === 'parties' && placesPromise) {
			placesPromise.then((res) => {
				partiesStore.places = res.places || [];
			});
		}
	});

	// --- Search & Filter ---
	const fuse = $derived(
		new Fuse(rawItems, {
			keys: type === 'parties' ? ['name', 'place', 'phone_number'] : ['name'],
			threshold: 0.3
		})
	);

	const filteredItems = $derived.by(() => {
		let result = rawItems;
		if (type === 'parties' && selectedPlaces.length > 0) {
			result = result.filter((item: any) => selectedPlaces.includes(item.place));
		}
		if (searchQuery.trim() !== '') {
			result = fuse.search(searchQuery).map((res) => res.item);
		}
		return result as (party | category)[];
	});

	function togglePlace(place: string) {
		isFiltering = true;
		if (selectedPlaces.includes(place)) {
			selectedPlaces = selectedPlaces.filter((p) => p !== place);
		} else {
			selectedPlaces = [...selectedPlaces, place];
		}
		setTimeout(() => {
			isFiltering = false;
		}, 200);
	}

	// --- Handlers ---

	async function handleAdd() {
		actionLoading = true;
		try {
			if (type === 'parties') {
				const res = await partiesApi.create(businessId, form);
				partiesStore.parties = [...partiesStore.parties, res.party];
				if (!partiesStore.places.includes(res.party.place)) {
					partiesStore.places = [...partiesStore.places, res.party.place];
				}
			} else {
				const res = await categoriesApi.create(businessId, { name: form.name });
				categoryStore.categories = [...categoryStore.categories, res.category];
			}
			await invalidate('layout:transactions');
			isAdding = false;
			resetForm();
			successMsg = `${type === 'parties' ? 'Party' : 'Category'} added!`;
		} catch (err: any) {
			errMsg = err.message;
		} finally {
			actionLoading = false;
		}
	}

	async function handleUpdate(id: string) {
		actionLoading = true;
		try {
			if (type === 'parties') {
				const res = await partiesApi.update(businessId, id, form);
				partiesStore.parties = partiesStore.parties.map((p) => (p.id === id ? res.party : p));
				const places = await partiesApi.listPlaces(businessId);
				partiesStore.places = places.places;
			} else {
				const res = await categoriesApi.update(businessId, id, { name: form.name });
				categoryStore.categories = categoryStore.categories.map((c) =>
					c.id === id ? res.category : c
				);
			}
			editingId = null;
			await invalidate('layout:transactions');
			resetForm();
			successMsg = 'Updated successfully';
		} catch (err: any) {
			errMsg = err.message;
		} finally {
			actionLoading = false;
		}
	}

	async function confirmDelete() {
		if (!showDeleteConfirm) return;
		const id = showDeleteConfirm;
		actionLoading = true;
		showDeleteConfirm = null;
		try {
			if (type === 'parties') {
				await partiesApi.delete(businessId, id);
				partiesStore.parties = partiesStore.parties.filter((p) => p.id !== id);
				const res = await partiesApi.listPlaces(businessId);
				partiesStore.places = res.places;
			} else {
				await categoriesApi.delete(businessId, id);
				categoryStore.categories = categoryStore.categories.filter((c) => c.id !== id);
			}
			await invalidate('layout:transactions');
		} catch (err: any) {
			errMsg = err.message;
		} finally {
			actionLoading = false;
		}
	}

	function startEdit(item: any) {
		editingId = item.id;
		form.name = item.name;
		if (type === 'parties') {
			form.place = item.place;
			form.phone_number = item.phone_number || '';
		}
	}
</script>

<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 z-[200] flex items-end justify-center bg-background/80 p-4 backdrop-blur-md md:items-center"
>
	<div
		transition:fly={{ y: 100, duration: 300 }}
		class="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[40px] border border-outline-variant bg-surface shadow-2xl md:rounded-[40px]"
	>
		<header
			class="flex items-center justify-between border-b border-outline-variant/30 bg-surface-high/30 p-6"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-background"
				>
					{#if type === 'parties'}<Contact size={20} />{:else}<Tags size={20} />{/if}
				</div>
				<div>
					<h2 class="text-xl font-black text-text-primary capitalize">{type}</h2>
					<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
						Master List
					</p>
				</div>
			</div>
			<button onclick={close} class="text-text-secondary transition-colors hover:text-error">
				<X size={24} />
			</button>
		</header>

		<div class="space-y-4 px-6 pt-6">
			<div class="group relative">
				<Search
					size={18}
					class="absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary/40 transition-colors group-focus-within:text-primary"
				/>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search {type}..."
					class="w-full rounded-2xl bg-background/50 py-4 pr-12 pl-12 text-sm font-bold ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
				/>
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = '')}
						class="absolute top-1/2 right-4 -translate-y-1/2 text-text-secondary hover:text-text-primary"
					>
						<X size={16} />
					</button>
				{/if}
			</div>

			{#if type === 'parties' && partiesStore.places.length > 0}
				<div class="flex flex-col gap-2">
					<p class="ml-1 text-[9px] font-black tracking-widest text-text-secondary/50 uppercase">
						Filter by Place
					</p>
					<div class="no-scrollbar flex gap-2 overflow-x-auto pb-2">
						{#each partiesStore.places as place}
							<button
								onclick={() => togglePlace(place)}
								class="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[10px] font-black uppercase transition-all {selectedPlaces.includes(
									place
								)
									? 'bg-primary text-background'
									: 'bg-surface-high text-text-secondary'}"
							>
								{#if selectedPlaces.includes(place)}<Check size={12} strokeWidth={4} />{/if}
								{place}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div class="relative flex-1 space-y-3 overflow-y-auto p-6">
			{#each filteredItems as item (item.id)}
				<div
					transition:slide
					class="rounded-3xl border border-outline-variant/50 bg-background/30 p-4 transition-all hover:border-primary/30"
				>
					{#if editingId === item.id}
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleUpdate(item.id);
							}}
							class="space-y-3"
							in:fade
						>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								<div class="space-y-1 {type === 'categories' ? 'md:col-span-2' : ''}">
									<label class="ml-1 text-[8px] font-black text-text-secondary uppercase"
										>Name</label
									>
									<input
										bind:value={form.name}
										required
										placeholder="required"
										class="w-full rounded-xl bg-surface-high p-3 text-sm font-bold ring-1 ring-primary outline-none"
									/>
								</div>
								{#if type === 'parties'}
									<div class="space-y-1">
										<label class="ml-1 text-[8px] font-black text-text-secondary uppercase"
											>Place</label
										>
										<input
											bind:value={form.place}
											required
											placeholder="required"
											class="w-full rounded-xl bg-surface-high p-3 text-sm font-bold ring-1 ring-primary outline-none"
										/>
									</div>
									<div class="space-y-1 md:col-span-2">
										<label class="ml-1 text-[8px] font-black text-text-secondary uppercase"
											>Phone</label
										>
										<input
											bind:value={form.phone_number}
											placeholder="optional"
											class="w-full rounded-xl bg-surface-high p-3 text-sm font-bold ring-1 ring-primary outline-none"
										/>
									</div>
								{/if}
							</div>
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => {
										editingId = null;
										resetForm();
									}}
									class="flex-1 rounded-lg bg-surface-high py-2 text-[10px] font-black uppercase"
									>Cancel</button
								>
								<button
									type="submit"
									class="flex-1 rounded-lg bg-primary py-2 text-[10px] font-black text-background uppercase"
									>Update</button
								>
							</div>
						</form>
					{:else}
						<div class="flex items-center justify-between" onclick={() => onSelect?.(item.id)}>
							<div class="flex items-center gap-4 overflow-hidden">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-high text-xs font-black text-text-secondary"
								>
									{item.name.charAt(0).toUpperCase()}
								</div>
								<div class="overflow-hidden">
									<p class="truncate text-sm leading-tight font-black text-text-primary">
										{item.name}
									</p>
									{#if type === 'parties'}
										<div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
											<p
												class="flex items-center gap-1 text-[9px] font-bold text-text-secondary uppercase"
											>
												<MapPin size={10} />{(item as party).place}
											</p>
											{#if (item as party).phone_number}<p
													class="flex items-center gap-1 text-[9px] font-bold text-text-secondary uppercase"
												>
													<Phone size={10} />{(item as party).phone_number}
												</p>{/if}
										</div>
									{/if}
								</div>
							</div>
							{#if role !== 'employee'}
								<div class="flex gap-1" onclick={(e) => e.stopPropagation()}>
									<button
										onclick={() => startEdit(item)}
										class="p-2 text-text-secondary/40 hover:text-primary"
										><Edit2 size={18} /></button
									>
									<button
										onclick={() => (showDeleteConfirm = item.id)}
										class="p-2 text-text-secondary/40 hover:text-error"><Trash2 size={18} /></button
									>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="py-12 text-center opacity-30">
					<p class="text-xs font-bold uppercase tracking-widest">No matching results</p>
				</div>
			{/each}
		</div>

		<footer class="border-t border-outline-variant/30 bg-surface-high/30 p-6">
			{#if role !== 'employee'}
				{#if isAdding}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleAdd();
						}}
						transition:slide
						class="space-y-4 pb-4"
					>
						<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
							<div class="space-y-1 {type === 'categories' ? 'md:col-span-2' : ''}">
								<label class="ml-1 text-[9px] font-black text-text-secondary uppercase">Name</label>
								<input
									bind:value={form.name}
									required
									class="w-full rounded-xl bg-background p-3 text-sm font-bold ring-1 ring-outline-variant outline-none"
									placeholder="Enter name"
								/>
							</div>
							{#if type === 'parties'}
								<div class="space-y-1">
									<label class="ml-1 text-[9px] font-black text-text-secondary uppercase"
										>Place</label
									>
									<input
										bind:value={form.place}
										required
										class="w-full rounded-xl bg-background p-3 text-sm font-bold ring-1 ring-outline-variant outline-none"
										placeholder="City"
									/>
								</div>
								<div class="space-y-1 md:col-span-2">
									<label class="ml-1 text-[9px] font-black text-text-secondary uppercase"
										>Phone</label
									>
									<input
										bind:value={form.phone_number}
										class="w-full rounded-xl bg-background p-3 text-sm font-bold ring-1 ring-outline-variant outline-none"
										placeholder="Optional"
									/>
								</div>
							{/if}
						</div>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={() => {
									isAdding = false;
									resetForm();
								}}
								class="flex-1 rounded-2xl bg-surface p-4 text-xs font-black text-text-secondary uppercase"
								>Cancel</button
							>
							<button
								type="submit"
								class="flex-[2] rounded-2xl bg-primary p-4 text-xs font-black text-background uppercase"
								>Save {type === 'parties' ? 'Party' : 'Category'}</button
							>
						</div>
					</form>
				{:else}
					<button
						onclick={() => {
							isAdding = true;
							resetForm();
						}}
						class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-black text-background"
					>
						<Plus size={20} /> Add New {type}
					</button>
				{/if}
			{:else}
				<p class="text-center text-[10px] font-bold tracking-widest text-text-secondary uppercase">
					Read-only Access
				</p>
			{/if}
		</footer>
	</div>
</div>

{#if actionLoading}
	<Toast toastType="loading" text="Processing..." />
{/if}
{#if errMsg}
	<Toast toastType="error" text={errMsg} close={() => (errMsg = '')} />
{/if}
{#if successMsg}
	<Toast toastType="success" text={successMsg} close={() => (successMsg = '')} />
{/if}
{#if showDeleteConfirm}
	<Toast
		toastType="warning"
		text="Delete this {type === 'parties' ? 'party' : 'category'} permanently? {type === 'parties'
			? 'All transactions related to this party will be deleted. Please be sure!!!'
			: ''}"
		confirmText="Delete"
		onConfirm={confirmDelete}
		close={() => (showDeleteConfirm = null)}
	/>
{/if}

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
