<script lang="ts">
	import type { user } from '$lib/utils/types';
	import { Check, X, UserPlus, Phone, ShieldCheck, Briefcase, Search } from 'lucide-svelte';
	import { fade, scale, slide } from 'svelte/transition';
	import Toast from './Toast.svelte';
	import usersApi from '$lib/api/usersApi';
	import businessApi from '$lib/api/businessApi';
	import { memberStore } from '$lib/stores/store.svelte';
	import { invalidate } from '$app/navigation';
	import { log } from '$lib/utils/helpers';

	let { businessId, close }: { businessId: string | undefined; close: () => void } = $props();

	let phNo = $state('');
	let loading = $state(false);
	let errMsg = $state('');

	let newUser: user | null = $state(null);
	let newUserRole: 'admin' | 'employee' | null = $state(null);

	async function verifyNewUser() {
		if (phNo.trim() == '') {
			errMsg = 'Please enter a phone number';
			return;
		}
		try {
			loading = true;
			newUser = (await usersApi.listByPhNo(phNo)).user;
			loading = false;
		} catch (err: any) {
			errMsg = err.message || 'Could not find a user with that phone number.';
			loading = false;
		}
	}

	async function onSubmit(e: Event) {
		e.preventDefault();
		log('inside onsubmit');
		if (!newUser) {
			errMsg = 'Please verify the user first';
			return;
		}
		if (!businessId) return;
		if (!newUserRole) {
			errMsg = 'Please select a role';
			return;
		}
		try {
			loading = true;
			await businessApi.addMember(businessId, { user_id: newUser.id, role: newUserRole });
			memberStore.members = [];
			await invalidate('data:members');
			loading = false;
			close();
		} catch (err: any) {
			errMsg = err.message || 'Error adding member.';
			loading = false;
		}
	}
</script>

<div
	transition:fade={{ duration: 200 }}
	class="fixed inset-0 z-[150] flex items-center justify-center bg-background/80 p-4 backdrop-blur-md md:p-8"
>
	<div
		transition:scale={{ start: 0.95, duration: 300 }}
		class="relative w-full max-w-lg overflow-hidden rounded-[40px] border border-outline-variant bg-surface p-8 shadow-2xl md:p-10"
	>
		<button
			onclick={close}
			class="absolute top-8 right-8 text-text-secondary opacity-40 transition-opacity hover:opacity-100"
		>
			<X size={24} />
		</button>

		<div class="mb-10 flex flex-col items-center text-center">
			<div
				class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
			>
				<UserPlus size={28} />
			</div>
			<h2 class="text-2xl font-black tracking-tighter text-text-primary uppercase">
				Add New Member
			</h2>
			<p class="text-[10px] font-black tracking-[0.2em] text-text-secondary uppercase">
				Expand your business team
			</p>
		</div>

		<form onsubmit={onSubmit} class="space-y-8">
			<div class="space-y-3">
				<label class="ml-2 text-[10px] font-black tracking-widest text-text-secondary/50 uppercase">
					Search by Phone Number
				</label>
				<div class="group relative">
					<div
						class="absolute top-1/2 left-6 -translate-y-1/2 text-text-secondary/40 transition-colors group-focus-within:text-primary"
					>
						<Phone size={20} />
					</div>
					<input
						disabled={!!newUser}
						type="text"
						bind:value={phNo}
						class="w-full rounded-[24px] border-none bg-background/50 py-5 pr-6 pl-14 text-xl font-black text-text-primary ring-1 ring-outline-variant transition-all focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="9876543210"
					/>
				</div>
			</div>

			{#if newUser}
				<div transition:slide class="space-y-6">
					<div class="relative rounded-[32px] border border-primary/20 bg-primary/5 p-6 shadow-sm">
						<button
							type="button"
							onclick={() => {
								newUserRole = null;
								newUser = null;
							}}
							class="absolute top-4 right-4 rounded-full bg-background p-1.5 text-text-secondary shadow-sm transition-colors hover:text-error"
						>
							<X size={14} />
						</button>

						<div class="flex items-center gap-5">
							<div
								class="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background shadow-md"
							>
								<img src={newUser.picture} alt={newUser.name} class="h-full w-full object-cover" />
							</div>
							<div class="overflow-hidden">
								<h3 class="truncate text-lg leading-tight font-black text-text-primary">
									{newUser.name}
								</h3>
								<p class="truncate text-xs font-bold text-text-secondary opacity-70">
									{newUser.email}
								</p>
								<div
									class="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-black text-primary uppercase"
								>
									<Check size={10} /> Verified User
								</div>
							</div>
						</div>
					</div>

					<div class="space-y-3">
						<label
							class="ml-2 text-[10px] font-black tracking-widest text-text-secondary/50 uppercase"
							>Assign Role</label
						>
						<div class="grid grid-cols-2 gap-4">
							<button
								type="button"
								onclick={() => (newUserRole = 'admin')}
								class="relative flex flex-col items-center gap-3 rounded-[24px] border-2 p-5 transition-all {newUserRole ===
								'admin'
									? 'border-primary bg-primary text-background shadow-lg shadow-primary/20'
									: 'border-outline-variant bg-background text-text-secondary'}"
							>
								<ShieldCheck size={24} />
								<span class="text-xs font-black tracking-widest uppercase">Admin</span>
								{#if newUserRole === 'admin'}
									<div
										class="absolute -top-2 -right-2 rounded-full bg-background p-1 text-primary shadow-sm"
										transition:scale
									>
										<Check size={12} strokeWidth={4} />
									</div>
								{/if}
							</button>

							<button
								type="button"
								onclick={() => (newUserRole = 'employee')}
								class="relative flex flex-col items-center gap-3 rounded-[24px] border-2 p-5 transition-all {newUserRole ===
								'employee'
									? 'border-primary bg-primary text-background shadow-lg shadow-primary/20'
									: 'border-outline-variant bg-background text-text-secondary'}"
							>
								<Briefcase size={24} />
								<span class="text-xs font-black tracking-widest uppercase">Employee</span>
								{#if newUserRole === 'employee'}
									<div
										class="absolute -top-2 -right-2 rounded-full bg-background p-1 text-primary shadow-sm"
										transition:scale
									>
										<Check size={12} strokeWidth={4} />
									</div>
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}

			<div class="flex gap-4 pt-4">
				<button
					type="button"
					onclick={close}
					class="flex-1 rounded-[22px] bg-surface-high py-5 text-[11px] font-black tracking-widest text-text-secondary uppercase transition-all active:scale-95"
				>
					Cancel
				</button>

				{#if newUser}
					<button
						type="submit"
						disabled={loading || !newUserRole}
						class="flex flex-[2] items-center justify-center gap-2 rounded-[22px] bg-primary py-5 text-[11px] font-black tracking-widest text-background uppercase shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
					>
						{#if loading}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
							></div>
						{:else}
							<Check size={18} />
							Add To Team
						{/if}
					</button>
				{:else}
					<button
						type="button"
						disabled={loading}
						class="flex flex-[2] items-center justify-center gap-2 rounded-[22px] bg-primary py-5 text-[11px] font-black tracking-widest text-background uppercase shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
						onclick={verifyNewUser}
					>
						{#if loading}
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
							></div>
						{:else}
							<Search size={18} />
							Verify User
						{/if}
					</button>
				{/if}
			</div>
		</form>
	</div>
</div>

{#if errMsg}
	<Toast toastType="error" text={errMsg} close={() => (errMsg = '')} />
{/if}
