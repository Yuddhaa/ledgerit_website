<script lang="ts">
	import { goto } from '$app/navigation';
	/**
	 * business nav bar
	 */
	import { page } from '$app/state';
	import Toast from '$lib/components/Toast.svelte';
	import { ui, businessStore, auth } from '$lib/stores/store.svelte';
	import { LayoutDashboard, History, CheckSquare, Settings, ChevronLeft } from 'lucide-svelte';

	let { children } = $props();
	const baseRoute = $derived(`/${businessStore.selected?.id}`);

	// Helper to check if a route is active
	const isActive = (path: string) => {
		const fullPath = path === '' ? baseRoute : `${baseRoute}/${path}`;

		// Remove trailing slashes for a clean comparison
		const currentPath = page.url.pathname.replace(/\/$/, '');
		const targetPath = fullPath.replace(/\/$/, '');

		return currentPath === targetPath;
	};

	const navItems = [
		{ name: 'Transactions', path: 'transactions', icon: History },
		{ name: 'Dashboard', path: '', icon: LayoutDashboard }, // Base business page
		{ name: 'Approvals', path: 'approvals', icon: CheckSquare },
		{ name: 'Settings', path: 'settings', icon: Settings }
	];

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase();
	};

	let isLoading = $state(false);
</script>

<svelte:head>
	<title>{businessStore.selected?.name || 'Business'}</title>
</svelte:head>

<div class="min-h-screen bg-background text-text-primary">
	<nav
		class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-background/80 px-4 backdrop-blur-md md:px-8"
	>
		<div class="flex items-center gap-3">
			<button
				onclick={async () => {
					isLoading = true;
					await goto('/');
					isLoading = false;
				}}
				class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-high text-text-secondary"
			>
				<ChevronLeft size={20} />
			</button>
			<h2 class="text-lg font-black tracking-tight text-text-primary">
				{businessStore.selected?.name || 'Loading...'}
			</h2>
		</div>

		<div class="flex items-center gap-6">
			<div class="hidden items-center gap-2 md:flex">
				{#each navItems as item}
					<a
						href={`/${businessStore.selected?.id}/${item.path}`}
						class="rounded-xl px-4 py-2 text-sm font-bold transition-colors {isActive(item.path)
							? 'bg-primary text-background'
							: 'text-text-secondary hover:bg-surface-high'}"
					>
						{item.name}
					</a>
				{/each}
			</div>

			<button
				onclick={() => (ui.showUniversalSettings = true)}
				class="h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-primary/20 bg-surface-high transition-transform active:scale-90"
			>
				{#if auth.user?.picture}
					<img src={auth.user.picture} alt="Profile" class="h-full w-full object-cover" />
				{:else}
					<span class="flex h-full w-full items-center justify-center font-black text-primary">
						{auth.user ? getInitials(auth.user.name) : 'U'}
					</span>
				{/if}
			</button>
		</div>
	</nav>

	<main class="pb-20 md:pb-0">
		{@render children()}
	</main>

	<nav
		class="pb-safe fixed bottom-0 z-30 flex w-full border-t border-outline-variant bg-background px-2 pt-2 md:hidden"
	>
		{#each navItems as item}
			{@const active = isActive(item.path)}
			<a
				href={`/${businessStore.selected?.id}/${item.path}`}
				class="flex flex-1 flex-col items-center gap-1 py-2 transition-colors {active
					? 'text-primary'
					: 'text-text-secondary'}"
			>
				<div
					class="relative flex h-8 w-14 items-center justify-center rounded-full transition-colors {active
						? 'bg-primary-container'
						: ''}"
				>
					<item.icon size={22} strokeWidth={active ? 2.5 : 2} />
				</div>
				<span class="text-[10px] font-bold tracking-tight">{item.name}</span>
			</a>
		{/each}
	</nav>
</div>

{#if isLoading}
	<Toast toastType="loading" text="loading" />
{/if}

<style>
	/* Ensures content doesn't get cut off by notched phones */
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>
