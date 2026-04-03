<script lang="ts">
	import { Check, RotateCcw, ChevronDown, Search, Calendar, ArrowUpDown, X } from 'lucide-svelte';
	import { slide, fade, fly } from 'svelte/transition';
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

	type ArrayFilterKeys = 'user_id' | 'category_id' | 'party_id' | 'mode';

	let filters = $state({
		...initialFilters,
		user_id: initialFilters.user_id || [],
		category_id: initialFilters.category_id || [],
		party_id: initialFilters.party_id || [],
		mode: (initialFilters.mode || []) as ('cash' | 'online' | 'cheque')[],
		dateRange: 'all' as 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'
	});

	$effect(() => {
		filters.user_id = initialFilters.user_id || [];
		filters.category_id = initialFilters.category_id || [];
		filters.party_id = initialFilters.party_id || [];
		filters.mode = (initialFilters.mode || []) as ('cash' | 'online' | 'cheque')[];
		filters.direction = initialFilters.direction || '';
		filters.from = initialFilters.from || '';
		filters.to = initialFilters.to || '';
		filters.sortBy = initialFilters.sortBy || 'created_at';
		filters.order = initialFilters.order || 'desc';

		if (!initialFilters.from && !initialFilters.to) {
			filters.dateRange = 'all';
		}
	});

	let activeDropdown = $state<string | null>(null);
	let searchQuery = $state('');

	let canClear = $derived(isClrearFilterActive('tran'));
	let canApply = $derived(isApplyFilterActive('tran', filters));

	const dateOptions = [
		{ id: 'all', label: 'All Time' },
		{ id: 'today', label: 'Today' },
		{ id: 'yesterday', label: 'Yesterday' },
		{ id: 'week', label: 'This Week' },
		{ id: 'month', label: 'This Month' },
		{ id: 'year', label: 'This Year' },
		{ id: 'custom', label: 'Custom Range' }
	];

	const sortOptions = [
		{ label: 'Newest First', key: 'created_at' as const, order: 'desc' as const },
		{ label: 'Oldest First', key: 'created_at' as const, order: 'asc' as const },
		{ label: 'Highest Amount', key: 'amount' as const, order: 'desc' as const },
		{ label: 'Lowest Amount', key: 'amount' as const, order: 'asc' as const }
	];

	function toggleArrayFilter(key: ArrayFilterKeys, value: string) {
		const target = filters[key] as string[];
		if (target.includes(value)) {
			(filters[key] as string[]) = target.filter((i) => i !== value);
		} else {
			(filters[key] as string[]) = [...target, value];
		}
	}

	function handleDatePreset(preset: typeof filters.dateRange) {
		filters.dateRange = preset;
		const now = new Date();
		const formatDate = (d: Date) => d.toISOString().split('T')[0];
		if (preset === 'today') {
			filters.from = formatDate(now);
			filters.to = formatDate(now);
		} else if (preset === 'yesterday') {
			const d = new Date(now);
			d.setDate(d.getDate() - 1);
			filters.from = formatDate(d);
			filters.to = formatDate(d);
		} else if (preset === 'week') {
			const d = new Date(now);
			d.setDate(d.getDate() - 7);
			filters.from = formatDate(d);
			filters.to = formatDate(now);
		} else if (preset === 'month') {
			filters.from = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
			filters.to = formatDate(now);
		} else if (preset === 'year') {
			filters.from = formatDate(new Date(now.getFullYear(), 0, 1));
			filters.to = formatDate(now);
		}
		if (preset !== 'custom') activeDropdown = null;
	}

	function getSortedItems(items: any[], selectedIds: string[]) {
		return {
			selected: items.filter((i) => selectedIds.includes(i.id)),
			unselected: items.filter((i) => !selectedIds.includes(i.id))
		};
	}

	// Shared Tailwind classes for the dropdowns
	const dropdownBase =
		'z-[100] mt-2 rounded-2xl border border-outline-variant bg-surface shadow-2xl';
	const adaptiveDropdown =
		'fixed inset-x-4 top-[25%] md:absolute md:inset-auto md:top-full md:mt-2';
</script>

{#if activeDropdown}
	<div
		transition:fade={{ duration: 150 }}
		onclick={() => {
			activeDropdown = null;
			searchQuery = '';
		}}
		class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]"
		aria-hidden="true"
	></div>
{/if}

<div
	transition:slide
	class="mb-6 rounded-[2rem] border border-outline-variant/50 bg-surface/50 p-2 shadow-sm"
>
	<div class="space-y-3 p-2">
		<div class="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
			<div class="relative">
				<button
					onclick={() => (activeDropdown = activeDropdown === 'dir' ? null : 'dir')}
					class="flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-black whitespace-nowrap uppercase transition-all
					{filters.direction
						? 'bg-primary text-background'
						: 'bg-background text-text-secondary hover:bg-surface-high'} 
					{activeDropdown === 'dir' ? 'relative z-[100] ring-2 ring-primary/20' : ''}"
				>
					{filters.direction || 'Direction'}
					<ChevronDown size={12} class={activeDropdown === 'dir' ? 'rotate-180' : ''} />
				</button>
				{#if activeDropdown === 'dir'}
					<div
						transition:fly={{ y: 5, duration: 150 }}
						class="{dropdownBase} {adaptiveDropdown} p-1 md:left-0 md:w-32"
					>
						{#each [{ v: '', l: 'All' }, { v: 'in', l: 'In' }, { v: 'out', l: 'Out' }] as opt}
							<button
								onclick={() => {
									filters.direction = opt.v as any;
									activeDropdown = null;
								}}
								class="w-full rounded-xl p-2 text-left text-[10px] font-bold uppercase hover:bg-primary/5 {filters.direction ===
								opt.v
									? 'text-primary'
									: ''}"
							>
								{opt.l}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="relative">
				<button
					onclick={() => (activeDropdown = activeDropdown === 'date' ? null : 'date')}
					class="flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-black whitespace-nowrap uppercase transition-all
					{filters.dateRange !== 'all'
						? 'bg-primary text-background'
						: 'bg-background text-text-secondary hover:bg-surface-high'} 
					{activeDropdown === 'date' ? 'relative z-[100] ring-2 ring-primary/20' : ''}"
				>
					<Calendar size={12} />
					{dateOptions.find((o) => o.id === filters.dateRange)?.label}
					<ChevronDown size={12} class={activeDropdown === 'date' ? 'rotate-180' : ''} />
				</button>
				{#if activeDropdown === 'date'}
					<div
						transition:fly={{ y: 5, duration: 150 }}
						class="{dropdownBase} {adaptiveDropdown} p-1 md:left-0 md:w-48"
					>
						{#each dateOptions as opt}
							<button
								onclick={() => handleDatePreset(opt.id as any)}
								class="w-full rounded-xl p-2 text-left text-[10px] font-bold uppercase hover:bg-primary/5 {filters.dateRange ===
								opt.id
									? 'text-primary'
									: ''}">{opt.label}</button
							>
						{/each}
					</div>
				{/if}
			</div>

			<div class="relative">
				<button
					onclick={() => (activeDropdown = activeDropdown === 'mode' ? null : 'mode')}
					class="flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-black whitespace-nowrap uppercase transition-all
					{filters.mode.length
						? 'bg-primary text-background'
						: 'bg-background text-text-secondary hover:bg-surface-high'} 
					{activeDropdown === 'mode' ? 'relative z-[100] ring-2 ring-primary/20' : ''}"
				>
					Mode {filters.mode.length ? `(${filters.mode.length})` : ''}
					<ChevronDown size={12} class={activeDropdown === 'mode' ? 'rotate-180' : ''} />
				</button>
				{#if activeDropdown === 'mode'}
					<div
						transition:fly={{ y: 5, duration: 150 }}
						class="{dropdownBase} {adaptiveDropdown} p-1 md:left-0 md:w-40"
					>
						{#each ['cash', 'online', 'cheque'] as m}
							<button
								onclick={() => toggleArrayFilter('mode', m)}
								class="flex w-full items-center gap-3 rounded-xl p-2 text-left text-[10px] font-bold uppercase hover:bg-primary/5"
							>
								<div
									class="flex h-4 w-4 items-center justify-center rounded border border-outline-variant {filters.mode.includes(
										m as any
									)
										? 'border-primary bg-primary'
										: ''}"
								>
									{#if filters.mode.includes(m as any)}<Check
											size={10}
											class="text-background"
											strokeWidth={4}
										/>{/if}
								</div>
								{m}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="relative">
				<button
					onclick={() => (activeDropdown = activeDropdown === 'sort' ? null : 'sort')}
					class="flex items-center gap-2 rounded-2xl bg-background px-4 py-2 text-[10px] font-black whitespace-nowrap text-text-secondary uppercase transition-all hover:bg-surface-high
					{activeDropdown === 'sort' ? 'relative z-[100] ring-2 ring-primary/20' : ''}"
				>
					<ArrowUpDown size={12} /> Sort
					<ChevronDown size={12} class={activeDropdown === 'sort' ? 'rotate-180' : ''} />
				</button>
				{#if activeDropdown === 'sort'}
					<div
						transition:fly={{ y: 5, duration: 150 }}
						class="{dropdownBase} {adaptiveDropdown} p-1 md:left-0 md:w-48"
					>
						{#each sortOptions as opt}
							<button
								onclick={() => {
									filters.sortBy = opt.key;
									filters.order = opt.order;
									activeDropdown = null;
								}}
								class="w-full rounded-xl p-2 text-left text-[10px] font-bold uppercase hover:bg-primary/5 {filters.sortBy ===
									opt.key && filters.order === opt.order
									? 'text-primary'
									: ''}">{opt.label}</button
							>
						{/each}
					</div>
				{/if}
			</div>

			{#each [{ id: 'parties', label: 'Parties', key: 'party_id', store: partiesStore.parties }, { id: 'categories', label: 'Categories', key: 'category_id', store: categoryStore.categories }, { id: 'team', label: 'Members', key: 'user_id', store: memberStore.members || [] }] as entity}
				{@const sorted = getSortedItems(
					entity.store,
					filters[entity.key as ArrayFilterKeys] as string[]
				)}
				<div class="relative">
					<button
						onclick={() => (activeDropdown = activeDropdown === entity.id ? null : entity.id)}
						class="flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-black whitespace-nowrap uppercase transition-all
						{filters[entity.key as ArrayFilterKeys].length
							? 'bg-primary text-background'
							: 'bg-background text-text-secondary hover:bg-surface-high'} 
						{activeDropdown === entity.id ? 'relative z-[100] ring-2 ring-primary/20' : ''}"
					>
						{entity.label}
						{filters[entity.key as ArrayFilterKeys].length
							? `(${filters[entity.key as ArrayFilterKeys].length})`
							: ''}
						<ChevronDown size={12} class={activeDropdown === entity.id ? 'rotate-180' : ''} />
					</button>
					{#if activeDropdown === entity.id}
						<div
							transition:fly={{ y: 5, duration: 150 }}
							class="{dropdownBase} {adaptiveDropdown} p-2 md:right-0 md:w-64"
						>
							<div class="relative mb-2">
								<Search
									size={12}
									class="absolute top-1/2 left-2 -translate-y-1/2 text-text-secondary"
								/>
								<input
									bind:value={searchQuery}
									placeholder="Search..."
									class="w-full rounded-lg bg-background py-2 pr-2 pl-8 text-[10px] font-bold uppercase ring-1 ring-outline-variant outline-none focus:ring-primary"
								/>
							</div>
							<div class="max-h-60 space-y-1 overflow-y-auto">
								{#each sorted.selected as item}
									<button
										onclick={() => toggleArrayFilter(entity.key as ArrayFilterKeys, item.id)}
										class="flex w-full items-center gap-3 rounded-lg bg-primary/5 p-2 text-left text-[10px] font-bold text-primary uppercase"
									>
										<div
											class="flex h-4 w-4 items-center justify-center rounded border border-primary bg-primary"
										>
											<Check size={10} class="text-background" strokeWidth={4} />
										</div>
										<span class="truncate">{item.name}</span>
									</button>
								{/each}
								{#each sorted.unselected.filter((i) => i.name
										.toLowerCase()
										.includes(searchQuery.toLowerCase())) as item}
									<button
										onclick={() => toggleArrayFilter(entity.key as ArrayFilterKeys, item.id)}
										class="flex w-full items-center gap-3 rounded-lg p-2 text-left text-[10px] font-bold uppercase hover:bg-primary/5"
									>
										<div
											class="flex h-4 w-4 items-center justify-center rounded border border-outline-variant"
										></div>
										<span class="truncate text-text-secondary">{item.name}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		{#if filters.dateRange === 'custom'}
			<div
				transition:slide={{ duration: 200 }}
				class="grid grid-cols-2 gap-2 border-t border-outline-variant/30 pt-2"
			>
				<div class="space-y-1">
					<p class="pl-1 text-[8px] font-black text-text-secondary uppercase">From</p>
					<input
						type="date"
						bind:value={filters.from}
						class="w-full rounded-xl bg-background p-2 text-[10px] font-bold uppercase ring-1 ring-outline-variant outline-none focus:ring-primary"
					/>
				</div>
				<div class="space-y-1">
					<p class="pl-1 text-[8px] font-black text-text-secondary uppercase">To</p>
					<input
						type="date"
						bind:value={filters.to}
						class="w-full rounded-xl bg-background p-2 text-[10px] font-bold uppercase ring-1 ring-outline-variant outline-none focus:ring-primary"
					/>
				</div>
			</div>
		{/if}

		<div class="flex items-center justify-between gap-4 pt-1">
			<button
				onclick={onReset}
				disabled={!canClear}
				class="group flex items-center gap-2 px-4 py-2 text-[10px] font-black text-text-secondary uppercase transition-all hover:text-text-primary disabled:opacity-30"
			>
				<RotateCcw size={12} class="transition-transform group-hover:-rotate-45" /> Reset Filters
			</button>
			<button
				onclick={() => onApply(filters)}
				disabled={!canApply}
				class="flex items-center gap-2 rounded-2xl px-8 py-3 text-[10px] font-black uppercase transition-all active:scale-95 {canApply
					? 'bg-primary text-background shadow-lg shadow-primary/25 hover:brightness-110'
					: 'bg-surface-high text-text-disabled opacity-50'}"
			>
				{#if canApply}<Check size={14} strokeWidth={3} />{/if} Apply
			</button>
		</div>
	</div>
</div>

<style>
	.no-scrollbar::-webkit-scrollbar {
		display: none;
	}
	.no-scrollbar {
		-ms-overflow-style: none;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
</style>
