<script context="module">
	export function clickOutside(node: HTMLElement, callback: () => void) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				callback();
			}
		};
		document.addEventListener('click', handleClick, true);
		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<script lang="ts">
	import { X, Check, RotateCcw, User, Tag, Users, ChevronDown, Search } from 'lucide-svelte';
	import { slide, fly } from 'svelte/transition';
	import {
		partiesStore,
		categoryStore,
		isClrearFilterActive,
		isApplyFilterActive,
		type tranFilter,
		memberStore
	} from '$lib/stores/store.svelte';

	interface Props {
		initialFilters: tranFilter;
		onApply: (filters: tranFilter) => void;
		onReset: () => void;
	}

	let { initialFilters, onApply, onReset }: Props = $props();

	type MultiSelectKeys = 'user_id' | 'category_id' | 'party_id' | 'mode';

	let filters = $state({
		...initialFilters,
		user_id: initialFilters.user_id || [],
		category_id: initialFilters.category_id || [],
		party_id: initialFilters.party_id || [],
		mode: (initialFilters.mode || []) as ('cash' | 'online' | 'cheque')[]
	});

	interface DropdownConfig {
		id: 'parties' | 'categories' | 'users';
		label: string;
		icon: any;
		store: any[];
		key: 'party_id' | 'category_id' | 'user_id';
	}

	let activeDropdown = $state<'parties' | 'categories' | 'users' | null>(null);
	let searchQuery = $state('');

	let canClear = $derived(isClrearFilterActive('tran'));
	let canApply = $derived(isApplyFilterActive('tran', filters));

	// Search logic
	const filteredParties = $derived(
		partiesStore.parties.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);
	const filteredCategories = $derived(
		categoryStore.categories.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
	);
	const filteredUsers = $derived(
		(memberStore.members || []).filter((m) =>
			m.name.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const dropdowns: DropdownConfig[] = $derived([
		{ id: 'parties', label: 'Parties', icon: User, store: filteredParties, key: 'party_id' },
		{
			id: 'categories',
			label: 'Categories',
			icon: Tag,
			store: filteredCategories,
			key: 'category_id'
		},
		{ id: 'users', label: 'Team', icon: Users, store: filteredUsers, key: 'user_id' }
	]);

	function toggleArrayFilter(key: MultiSelectKeys, value: any) {
		const target = (filters[key] || []) as any[];
		if (target.includes(value)) {
			(filters as any)[key] = target.filter((i) => i !== value);
		} else {
			(filters as any)[key] = [...target, value];
		}
	}

	function closeDropdown() {
		activeDropdown = null;
		searchQuery = '';
	}

	// Helper to separate selected items from unselected for better UX
	function getSortedItems(items: any[], selectedIds: string[]) {
		const selected = items.filter((item) => selectedIds.includes(item.id));
		const unselected = items.filter((item) => !selectedIds.includes(item.id));
		return { selected, unselected };
	}
</script>

<div
	transition:slide
	class="mb-6 space-y-6 rounded-3xl border border-outline-variant bg-surface p-6 shadow-xl"
>
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div class="space-y-2">
			<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">Direction</label>
			<div class="flex gap-2">
				{#each [{ v: '', l: 'All' }, { v: 'in', l: 'In' }, { v: 'out', l: 'Out' }] as opt}
					<button
						onclick={() => (filters.direction = opt.v as any)}
						class="flex-1 rounded-xl py-3 text-[10px] font-bold uppercase ring-1 transition-all hover:cursor-pointer
						{filters.direction === opt.v
							? 'bg-primary text-background ring-primary'
							: 'bg-background text-text-secondary ring-outline-variant'}"
					>
						{opt.l}
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-2">
			<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">Payment Modes</label>
			<div class="flex flex-wrap gap-2">
				{#each ['cash', 'online', 'cheque'] as const as m}
					<button
						onclick={() => toggleArrayFilter('mode', m)}
						class="group flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase ring-1 transition-all hover:cursor-pointer
						{filters.mode.includes(m)
							? 'bg-primary text-background ring-primary'
							: 'bg-background text-text-secondary ring-outline-variant'}"
					>
						{m}
						{#if filters.mode.includes(m)}<X size={12} strokeWidth={3} />{/if}
					</button>
				{/each}
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-3">
			{#each dropdowns as dropdown}
				{@const sorted = getSortedItems(dropdown.store, filters[dropdown.key] as string[])}
				<div class="relative">
					<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">
						{dropdown.label}
						{filters[dropdown.key].length ? `(${filters[dropdown.key].length})` : ''}
					</label>
					<button
						onclick={() => (activeDropdown = activeDropdown === dropdown.id ? null : dropdown.id)}
						class="mt-1 flex w-full items-center justify-between rounded-xl bg-background p-3 text-xs font-bold ring-1 ring-outline-variant transition-all hover:ring-primary/50"
					>
						<div class="flex items-center gap-2 truncate">
							<dropdown.icon size={14} class="text-text-secondary" />
							<span class="truncate"
								>{filters[dropdown.key].length
									? `${filters[dropdown.key].length} Selected`
									: `Select ${dropdown.label}`}</span
							>
						</div>
						<ChevronDown
							size={14}
							class="transition-transform {activeDropdown === dropdown.id ? 'rotate-180' : ''}"
						/>
					</button>

					{#if activeDropdown === dropdown.id}
						<div
							use:clickOutside={closeDropdown}
							transition:fly={{ y: 10, duration: 200 }}
							class="absolute right-0 left-0 z-[100] mt-2 flex max-h-80 flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl"
						>
							<div
								class="flex items-center justify-between border-b border-outline-variant bg-surface-high/50 px-4 py-2"
							>
								<span class="text-[10px] font-black text-text-secondary uppercase"
									>Choose {dropdown.label}</span
								>
								<button
									onclick={closeDropdown}
									class="text-text-secondary transition-colors hover:text-error"
								>
									<X size={16} />
								</button>
							</div>

							<div class="border-b border-outline-variant bg-surface-high p-2">
								<div class="relative">
									<Search
										size={14}
										class="absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary"
									/>
									<input
										bind:value={searchQuery}
										placeholder="Search..."
										class="w-full rounded-lg bg-background py-2 pr-9 pl-9 text-xs font-bold ring-1 ring-outline-variant outline-none focus:ring-primary"
									/>
									{#if searchQuery}
										<button
											onclick={() => (searchQuery = '')}
											class="absolute top-1/2 right-3 -translate-y-1/2 text-text-secondary hover:text-text-primary"
										>
											<X size={14} />
										</button>
									{/if}
								</div>
							</div>

							<div class="flex-1 overflow-y-auto p-1">
								{#if sorted.selected.length > 0}
									<div class="mb-2 space-y-1 border-b border-outline-variant/30 pb-2">
										{#each sorted.selected as item}
											<button
												onclick={() => toggleArrayFilter(dropdown.key, item.id)}
												class="flex w-full items-center justify-between rounded-lg bg-primary/5 px-3 py-2 text-left text-xs font-bold text-primary transition-colors hover:bg-primary/10"
											>
												<span class="truncate">{item.name}</span>
												<Check size={14} />
											</button>
										{/each}
									</div>
								{/if}

								{#each sorted.unselected as item}
									<button
										onclick={() => toggleArrayFilter(dropdown.key, item.id)}
										class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors hover:bg-primary/10"
									>
										<span class="truncate">{item.name}</span>
									</button>
								{:else}
									{#if sorted.selected.length === 0}
										<p
											class="p-4 text-center text-[10px] font-black uppercase text-text-secondary/50"
										>
											No results
										</p>
									{/if}
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<div class="grid grid-cols-2 gap-3 md:col-span-2">
			<div class="space-y-1">
				<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">From Date</label>
				<input
					type="date"
					bind:value={filters.from}
					class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
			<div class="space-y-1">
				<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">To Date</label>
				<input
					type="date"
					bind:value={filters.to}
					class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3 md:col-span-2">
			<div class="space-y-1">
				<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">Sort By</label>
				<select
					bind:value={filters.sortBy}
					class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant hover:cursor-pointer"
				>
					<option value="created_at">Date</option>
					<option value="amount">Amount</option>
				</select>
			</div>
			<div class="space-y-1">
				<label class="ml-1 text-[10px] font-black text-text-secondary uppercase">Order</label>
				<select
					bind:value={filters.order}
					class="w-full rounded-xl border-none bg-background p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant hover:cursor-pointer"
				>
					<option value="desc">Descending</option>
					<option value="asc">Ascending</option>
				</select>
			</div>
		</div>
	</div>

	<div class="flex gap-3 pt-4">
		<button
			onclick={onReset}
			disabled={!canClear}
			class="flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase transition-all hover:cursor-pointer active:scale-95
			{canClear ? 'bg-surface-high text-text-primary' : 'bg-disabled text-text-disabled opacity-50'}"
		>
			<RotateCcw size={14} /> Reset
		</button>
		<button
			onclick={() => onApply(filters)}
			disabled={!canApply}
			class="flex flex-[2] items-center justify-center gap-2 rounded-2xl py-4 text-xs font-black uppercase transition-all hover:cursor-pointer active:scale-95
			{canApply
				? 'bg-primary text-background shadow-lg shadow-primary/20'
				: 'bg-primary/40 text-background/50'}"
		>
			<Check size={16} /> Apply Filters
		</button>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
