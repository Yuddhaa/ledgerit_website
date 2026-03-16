<script lang="ts">
	import {
		Building2,
		ArrowLeftRight,
		History,
		CheckSquare,
		Users,
		CreditCard,
		Trash2,
		ChevronRight,
		Info
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { businessStore } from '$lib/stores/store.svelte';
	import { log } from '$lib/utils/helpers';
	import Toast from '$lib/components/Toast.svelte';

	const business = $derived(businessStore.selected);

	// Navigation Handlers
	const navigate = async (path: string) => {
		isLoading = true;
		if (!business?.id) return;
		await goto(`/${business.id}/${path}`);
		isLoading = false;
	};

	const handleDeleteBusiness = () => {
		log('Delete business initiated for:', business?.id);
		// Later: add a "Type business name to confirm" modal
	};

	let isLoading = $state(false);

	const version = '1.0.4-stable';
</script>

<div class="min-h-screen bg-background p-4 pb-32 md:p-8">
	<header class="mb-8 px-2">
		<h1 class="text-3xl font-black text-text-primary">Settings</h1>
		<p class="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">
			Preference & Control
		</p>
	</header>

	<div class="mx-auto space-y-6">
		<div class="space-y-3">
			<p class="px-4 text-[10px] font-black tracking-widest text-text-secondary uppercase">
				General
			</p>
			<div class="overflow-hidden rounded-3xl border border-outline-variant bg-surface">
				<button
					onclick={() => log('Update Business Name Modal trigger')}
					class="flex w-full items-center justify-between p-5 transition-colors hover:cursor-pointer active:bg-surface-high"
				>
					<div class="flex items-center gap-4">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
						>
							<Building2 size={20} />
						</div>
						<div class="text-left">
							<p class="text-sm font-black text-text-primary">Rename Business</p>
							<p class="text-[10px] font-bold text-text-secondary uppercase">
								{business?.name || 'Business Name'}
							</p>
						</div>
					</div>
					<ChevronRight size={18} class="text-text-secondary/40" />
				</button>

				<div class="mx-5 h-px bg-outline-variant"></div>

				<button
					onclick={() => goto('/')}
					class="flex w-full items-center justify-between p-5 transition-colors hover:cursor-pointer active:bg-surface-high"
				>
					<div class="flex items-center gap-4">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-high text-text-primary"
						>
							<ArrowLeftRight size={20} />
						</div>
						<div class="text-left">
							<p class="text-sm font-black text-text-primary">Switch Business</p>
							<p class="text-[10px] font-bold text-text-secondary uppercase">Back to selection</p>
						</div>
					</div>
					<ChevronRight size={18} class="text-text-secondary/40" />
				</button>
			</div>
		</div>

		<div class="space-y-3">
			<p class="px-4 text-[10px] font-black tracking-widest text-text-secondary uppercase">
				Organization
			</p>
			<div class="overflow-hidden rounded-3xl border border-outline-variant bg-surface">
				<button
					onclick={() => navigate('transactions')}
					class="flex w-full items-center justify-between p-5 transition-colors hover:cursor-pointer active:bg-surface-high"
				>
					<div class="flex items-center gap-4">
						<History size={20} class="text-text-secondary" />
						<span class="text-sm font-bold text-text-primary">View Transactions</span>
					</div>
					<ChevronRight size={18} class="text-text-secondary/40" />
				</button>

				<div class="mx-5 h-px bg-outline-variant"></div>

				<button
					onclick={() => navigate('approvals')}
					class="flex w-full items-center justify-between p-5 transition-colors hover:cursor-pointer active:bg-surface-high"
				>
					<div class="flex items-center gap-4">
						<CheckSquare size={20} class="text-text-secondary" />
						<span class="text-sm font-bold text-text-primary">Approvals Queue</span>
					</div>
					<ChevronRight size={18} class="text-text-secondary/40" />
				</button>

				<div class="mx-5 h-px bg-outline-variant"></div>

				<button
					onclick={async () => await goto(`/${business?.id}`)}
					class="flex w-full items-center justify-between p-5 transition-colors hover:cursor-pointer active:bg-surface-high"
				>
					<div class="flex items-center gap-4">
						<Users size={20} class="text-text-secondary" />
						<span class="text-sm font-bold text-text-primary">Manage Members</span>
					</div>
					<ChevronRight size={18} class="text-text-secondary/40" />
				</button>

				<div class="mx-5 h-px bg-outline-variant"></div>

				<button
					onclick={() => navigate('plans')}
					class="flex w-full items-center justify-between p-5 transition-colors hover:cursor-pointer active:bg-surface-high"
				>
					<div class="flex items-center gap-4">
						<CreditCard size={20} class="text-text-secondary" />
						<span class="text-sm font-bold text-text-primary">Manage Subscription</span>
					</div>
					<ChevronRight size={18} class="text-text-secondary/40" />
				</button>
			</div>
		</div>

		<div class="space-y-3 pt-4">
			<p class="px-4 text-[10px] font-black tracking-widest text-error uppercase">Danger Zone</p>
			<div class="overflow-hidden rounded-3xl border border-error/20 bg-error/5">
				<button
					onclick={handleDeleteBusiness}
					class="flex w-full items-center justify-between p-5 transition-colors hover:cursor-pointer active:bg-error/10"
				>
					<div class="flex items-center gap-4 text-error">
						<Trash2 size={20} />
						<div class="text-left">
							<p class="text-sm font-black">Delete Business</p>
							<p class="text-[9px] font-bold uppercase opacity-60">This action is irreversible</p>
						</div>
					</div>
					<ChevronRight size={18} class="opacity-40" />
				</button>
			</div>
		</div>

		<footer class="space-y-2 pt-12 pb-8 text-center">
			<div class="flex items-center justify-center gap-2 text-text-secondary opacity-30">
				<Info size={14} />
				<span class="text-[10px] font-bold tracking-[0.3em] uppercase">LedgerIt</span>
			</div>
			<p class="text-[10px] font-black tracking-widest text-text-secondary uppercase opacity-20">
				Version {version}
			</p>
		</footer>
	</div>
</div>

{#if isLoading}
	<Toast toastType="loading" text="loading" />
{/if}
