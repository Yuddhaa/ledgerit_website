<script lang="ts">
	import {
		ArrowLeft,
		Building,
		Users,
		FileBarChart,
		CreditCard,
		CheckSquare,
		ChevronRight
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	let { data } = $props();
</script>

<div class="min-h-screen bg-background p-6">
	<header class="mb-8 flex items-center gap-4">
		<button onclick={() => history.back()} class="rounded-full bg-surface p-2">
			<ArrowLeft size={20} />
		</button>
		<h1 class="text-xl font-black text-text-primary">Business Settings</h1>
	</header>

	<div class="space-y-3">
		<button
			onclick={() => goto('/')}
			class="flex w-full items-center justify-between rounded-3xl border border-primary/20 bg-primary/10 p-5 text-primary"
		>
			<div class="flex items-center gap-4 font-black">
				<Building size={20} />
				<span>Switch Business</span>
			</div>
			<ChevronRight size={18} />
		</button>

		<div class="grid gap-3">
			<a href={`/${data.businessId}/approvals`} class="settings-card">
				<div class="flex items-center gap-4">
					<CheckSquare size={20} />
					<span class="font-bold">View Approvals</span>
				</div>
				<ChevronRight size={18} />
			</a>

			<a href={`/${data.businessId}/plans`} class="settings-card">
				<div class="flex items-center gap-4">
					<CreditCard size={20} />
					<span class="font-bold">Subscriptions & Plans</span>
				</div>
				<ChevronRight size={18} />
			</a>

			<button class="settings-card">
				<div class="flex items-center gap-4">
					<Users size={20} />
					<span class="font-bold">Manage Members</span>
				</div>
				<ChevronRight size={18} />
			</button>

			<button class="settings-card">
				<div class="flex items-center gap-4">
					<FileBarChart size={20} />
					<span class="font-bold">Export Report</span>
				</div>
				<ChevronRight size={18} />
			</button>
		</div>
	</div>
</div>

<style>
	.settings-card {
		@apply flex items-center justify-between rounded-3xl border border-outline-variant bg-surface p-5 text-text-primary transition-colors active:bg-surface-high;
	}
</style>
