<script lang="ts">
	import { Plus, ChevronRight, UserPlus, ShieldCheck, User, Search, X } from 'lucide-svelte';
	import Fuse from 'fuse.js';
	import { slide } from 'svelte/transition';
	import { ui, auth, businessStore } from '$lib/stores/store.svelte';

	// Search State
	let searchQuery = $state('');

	const options = {
		keys: ['name'],
		threshold: 0.3
	};
	const fuse = $derived(new Fuse(businessStore?.business, options));

	// This is where you will plug in your Fuse.js logic
	// For now, it defaults to all businesses
	let filteredBusiness = $derived(
		searchQuery
			? (() => {
					return fuse.search(searchQuery).map((result) => result.item);
				})()
			: businessStore.business
	);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(amount);
	};

	const getStatusConfig = (status: string) => {
		const configs: Record<string, { bg: string; text: string; label: string }> = {
			active: { bg: 'bg-success/20', text: 'text-success', label: 'ACTIVE' },
			trialing: { bg: 'bg-primary/20', text: 'text-primary', label: 'TRIAL' },
			inactive: { bg: 'bg-outline/20', text: 'text-text-secondary', label: 'INACTIVE' },
			past_due: { bg: 'bg-error/20', text: 'text-error', label: 'PAST DUE' },
			canceled: { bg: 'bg-error/20', text: 'text-error', label: 'CANCELED' },
			pending: { bg: 'bg-accent/20', text: 'text-primary', label: 'PENDING' }
		};
		return (
			configs[status] || {
				bg: 'bg-outline/10',
				text: 'text-text-secondary',
				label: status.toUpperCase()
			}
		);
	};

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase();
	};
</script>

<div class="min-h-screen bg-background p-4 md:p-8">
	<header class="mb-6 flex items-center justify-between px-2">
		<div class="flex items-center gap-3">
			<button
				onclick={() => (ui.showUniversalSettings = true)}
				class="flex h-10 w-12 items-center justify-center rounded-full bg-surface-high text-primary transition-transform active:scale-90"
			>
				{#if auth.user?.picture}
					<img
						src={auth.user.picture}
						alt={auth.user.name}
						class="h-12 w-12 rounded-full border-2 border-primary/20 object-cover"
					/>
				{:else}
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-black text-background"
					>
						{auth.user ? getInitials(auth.user.name) : 'U'}
					</div>
				{/if}
			</button>
			<h1 class="text-2xl font-black tracking-tight text-text-primary">
				{auth.user?.name ?? 'My Business'}
			</h1>
		</div>
		<a
			href="/addBusiness"
			class="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-surface text-primary shadow-sm transition-transform active:scale-90"
		>
			<Plus size={24} strokeWidth={3} />
		</a>
	</header>
	<div class="mb-8 px-2">
		<div class="group relative flex items-center">
			<Search
				size={18}
				class="absolute left-4 text-text-secondary transition-colors group-focus-within:text-primary"
			/>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search businesses..."
				class="w-full rounded-2xl border-none bg-surface-high py-3.5 pr-12 pl-12 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-hidden transition-all placeholder:font-medium placeholder:text-text-secondary/50 focus:bg-background focus:ring-2 focus:ring-primary"
			/>
			{#if searchQuery}
				<button
					onclick={() => (searchQuery = '')}
					class="absolute right-4 text-text-secondary hover:text-primary"
				>
					<X size={18} />
				</button>
			{/if}
		</div>
	</div>

	<div class="grid gap-6 sm:grid-cols-2">
		{#each filteredBusiness as b (b.id)}
			{@const status = getStatusConfig(b.subscriptions_status)}

			<a
				href={`/${b.id}/transactions`}
				class="flex flex-col overflow-hidden rounded-3xl border border-outline-variant shadow-sm transition-all active:scale-[0.98]"
				transition:slide
			>
				<div class="bg-primary-container p-5 pb-4">
					<div class="flex items-start justify-between">
						<div class="space-y-1">
							<h2 class="text-lg leading-tight font-black text-text-primary">
								{b.name}
							</h2>
							<div class="flex items-center gap-1.5 text-xs font-semibold text-text-secondary/80">
								{#if b.role === 'admin'}
									<ShieldCheck size={14} class="text-primary" />
								{:else if b.role === 'creator'}
									<UserPlus size={14} class="text-primary" />
								{:else}
									<User size={14} />
								{/if}
								<span class="capitalize">{b.role}</span>
							</div>
						</div>

						<div class="flex flex-col items-end gap-3">
							<span
								class={`rounded-md border border-current/10 px-2 py-0.5 text-[10px] font-black tracking-widest ${status.bg} ${status.text}`}
							>
								{status.label}
							</span>
						</div>
					</div>
				</div>

				<div class="bg-surface-high p-5 pt-4">
					<p class="text-[10px] font-bold tracking-widest text-text-secondary/60 uppercase">
						Current Balance
					</p>
					<div class="mt-1 flex items-center justify-between">
						<p class="text-2xl font-black text-text-primary">
							{formatCurrency(b.current_balance)}
						</p>
						<div class="rounded-full bg-background/50 p-1.5 text-text-secondary">
							<ChevronRight size={18} />
						</div>
					</div>
				</div>
			</a>
		{:else}
			<div class="col-span-full py-20 text-center">
				{#if searchQuery}
					<div class="flex flex-col items-center gap-2">
						<Search size={48} class="text-text-disabled mb-2" />
						<p class="text-text-primary font-bold">No results for "{searchQuery}"</p>
						<button onclick={() => (searchQuery = '')} class="text-primary text-sm font-bold">
							Clear search
						</button>
					</div>
				{:else}
					<p class="text-text-secondary font-medium">No businesses found.</p>
					<a
						href="/addBusiness"
						class="mt-2 inline-block text-primary font-bold underline decoration-2 underline-offset-4"
					>
						Register your first business
					</a>
				{/if}
			</div>
		{/each}
	</div>
</div>
