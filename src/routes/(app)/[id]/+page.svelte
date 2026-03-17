<script lang="ts">
	import {
		Users,
		UserPlus,
		ShieldCheck,
		UserCircle,
		Search,
		Edit,
		X,
		Crown,
		CreditCard,
		ChevronRight,
		Trash2,
		RefreshCw
	} from 'lucide-svelte';
	import { fade } from 'svelte/transition';
	import { businessStore, auth, memberStore } from '$lib/stores/store.svelte';
	import { log } from '$lib/utils/helpers';
	import Fuse from 'fuse.js';
	import UpdateBusinessName from '$lib/components/UpdateBusinessName.svelte';
	import AddMember from '$lib/components/AddMember.svelte';
	import Toast from '$lib/components/Toast.svelte';
	import businessApi from '$lib/api/businessApi.js';
	import { invalidate } from '$app/navigation';

	let { data } = $props();

	const business = $derived(businessStore.selected);
	const status = $derived(business?.subscriptions_status);

	let loading = $state(false);
	let errMsg = $state('');
	let successMsg = $state('');
	let warnMsg = $state('');
	let warnOnConfirm: () => void | Promise<void> = $state(() => {});

	// Parse Plan ID: "yearly-wholesale-2" -> { period: "yearly", type: "wholesale", limit: 5 }
	const planInfo = $derived.by(() => {
		if (!business?.current_plan_id) return { period: 'trial', type: 'trial', limit: 3 };
		const parts = business.current_plan_id.split('-');
		const baseLimit = parts[1] === 'solo' ? 1 : parts[1] === 'owner' ? 1000 : 3;
		const addons = parseInt(parts[2] || '0');
		return {
			period: parts[0],
			type: parts[1],
			limit: baseLimit + addons
		};
	});

	// Find my role silently using a derived state
	const myRole = $derived(
		memberStore.members.find((m) => m.email === auth.user?.email)?.role || 'employee'
	);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-IN', {
			style: 'currency',
			currency: 'INR',
			maximumFractionDigits: 0
		}).format(amount);
	};

	async function updateMemberRole(memberId: string, newRole: 'admin' | 'employee') {
		loading = true;
		try {
			if (!business) {
				errMsg = 'Someting Went Wrong:no business object';
				return;
			}
			await businessApi.updateRole(business.id, { user_id: memberId, role: newRole });
			// update the store.
			// while adding we do invalidate, cause the api's response is not compatible with members[]
			// while updating, its easier to just update the array than invalidate
			memberStore.members.map((member) => {
				if (member.id == memberId) {
					member.role = newRole;
					return;
				}
			});
			loading = false;
			successMsg = 'Updated the user role to ' + newRole;
		} catch (err: any) {
			loading = false;
			errMsg = err.message || 'Someting went wront while updating the role';
		}
	}

	// *************************************************************************************8
	// delete member logic
	// *************************************************************************************8
	async function removeMember(memberId: string) {
		loading = true;
		try {
			if (!business) {
				errMsg = 'Someting Went Wrong:no business object';
				return;
			}
			await businessApi.delMember(business.id, memberId);
			// remove from store.
			// while adding we do invalidate, cause the api's response is not compatible with members[]
			// while removing, its easier to just remove from the array than invalidate
			memberStore.members = memberStore.members.filter((member) => {
				if (member.id != memberId) return member;
			});
			loading = false;
			successMsg = 'Removed The User From The Business';
		} catch (err: any) {
			loading = false;
			errMsg = err.message || 'Someting went wront while removing the member';
		}
	}

	// *************************************************************************************8
	// add member logic
	// *************************************************************************************8
	let addingMember = $state(false);

	// *************************************************************************************8
	//update business name
	// *************************************************************************************8
	let updatingBusName = $state(false);

	// *************************************************************************************8
	// --- Search Logic ---
	// *************************************************************************************8
	let searchQuery = $state('');

	const fuse = $derived(
		new Fuse(memberStore.members, {
			keys: ['name', 'email', 'phone_number'],
			threshold: 0.3
		})
	);

	// This is what the {#each} loop should use
	const filteredMembers = $derived.by(() => {
		if (!searchQuery) return memberStore.members;
		return fuse.search(searchQuery).map((result) => result.item);
	});
</script>

<div class="min-h-screen bg-background p-4 pb-24 md:p-8">
	{#if business}
		<section
			class="mb-8 overflow-hidden rounded-4xl border border-outline-variant bg-surface shadow-sm"
		>
			<div class="bg-primary-container p-6">
				<div class="flex items-start justify-between">
					<div class="w-full space-y-1">
						<div class="flex items-center gap-2">
							<p class="text-[10px] font-bold tracking-widest text-primary uppercase">
								Business Profile
							</p>
						</div>

						<div class="flex items-center gap-2">
							<h1 class="text-3xl font-black text-text-primary">{business.name}</h1>
							{#if myRole !== 'employee'}
								<button
									onclick={() => {
										updatingBusName = true;
									}}
									class="group flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary/40 transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
									aria-label="Edit Business Name"
								>
									<Edit size={18} class="transition-transform group-hover:rotate-12" />
								</button>
							{/if}
						</div>

						<div class="flex flex-wrap items-center justify-between gap-2 pt-2">
							<div class="flex flex-wrap items-center gap-2">
								<span
									class="rounded-lg bg-primary px-2 py-1 text-[10px] font-black text-background uppercase"
								>
									{planInfo.type}
								</span>
								<span
									class="rounded-lg bg-background/50 px-2 py-1 text-[10px] font-bold text-text-secondary uppercase"
								>
									{planInfo.period}
								</span>
								<span
									class="ml-2 text-[10px] font-bold tracking-widest text-text-secondary uppercase"
								>
									Status: <span class={status === 'active' ? 'text-success' : 'text-error'}
										>{status}</span
									>
								</span>
							</div>

							<span
								class="rounded-xl bg-primary/10 px-3 py-1.5 text-[10px] font-black text-primary uppercase shadow-sm ring-2 ring-primary/20"
							>
								{myRole}
							</span>
						</div>
					</div>

					<div
						class="ml-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-background/40 text-primary shadow-inner"
					>
						<Crown size={32} />
					</div>
				</div>
			</div>

			{#if planInfo.type !== 'owner'}
				<div class="flex items-center justify-between border-t border-outline-variant p-4 px-6">
					<div class="flex items-center gap-4 text-text-secondary">
						<div class="flex items-center gap-1.5">
							<Users size={14} />
							<span class="text-[10px] font-bold uppercase">
								{memberStore.members.length} / {planInfo.limit} Members
							</span>
						</div>
						<div class="flex items-center gap-1.5">
							<CreditCard size={14} />
							<span class="text-[10px] font-bold uppercase">
								Ends: {new Date(business.subscription_end_period).toLocaleDateString('en-IN')}
							</span>
						</div>
					</div>
					<a
						href={`/${business.id}/plans`}
						class="rounded-xl bg-surface-high p-2 text-primary transition-colors hover:bg-primary/10"
					>
						<ChevronRight size={20} />
					</a>
				</div>
			{/if}
		</section>
	{/if}
	<div class="mb-6 space-y-4 px-2">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-black text-text-primary">Team Members</h2>
				<p class="text-[10px] font-bold tracking-widest text-text-secondary uppercase">
					Manage access & roles
				</p>
			</div>

			<div class="flex gap-3">
				<button
					class="group flex h-12 w-12 items-center justify-center rounded-2xl border border-outline-variant bg-surface-high text-text-secondary transition-all hover:border-primary/30 hover:text-primary active:scale-90 disabled:opacity-50"
					disabled={loading}
					onclick={async () => {
						loading = true;
						memberStore.members = [];
						await invalidate('data:members');
						loading = false;
					}}
				>
					<div
						class={loading
							? 'animate-spin'
							: 'transition-transform duration-500 group-hover:rotate-180'}
					>
						<RefreshCw size={20} />
					</div>
				</button>

				{#if myRole !== 'employee'}
					<button
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-background shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-90"
						onclick={() => {
							addingMember = true;
						}}
					>
						<UserPlus size={24} strokeWidth={2.5} />
					</button>
				{/if}
			</div>
		</div>
		<div class="group relative">
			<div
				class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-secondary transition-colors group-focus-within:text-primary"
			>
				<Search size={18} />
			</div>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search by name / email / phone number"
				class="w-full rounded-2xl border border-outline-variant bg-surface py-4 pr-12 pl-12 text-sm font-bold text-text-primary shadow-sm transition-all outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
			/>
			{#if searchQuery}
				<button
					onclick={() => (searchQuery = '')}
					class="absolute inset-y-0 right-4 flex items-center text-text-secondary hover:text-error"
				>
					<X size={18} />
				</button>
			{/if}
		</div>
	</div>

	{#await data.membersPromise}
		<div class="flex justify-center py-20 opacity-40">
			<div
				class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
		</div>
	{:then}
		<div class="space-y-4">
			{#each filteredMembers as member (member.id)}
				{@const isMe = member.email === auth.user?.email}

				<div
					transition:fade
					class="group relative rounded-[28px] border border-outline-variant bg-surface p-5 transition-all active:bg-surface-high"
				>
					<div class="flex items-start justify-between">
						<div class="flex gap-4">
							<div
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-surface-high font-black text-primary uppercase shadow-sm"
							>
								{member.name[0]}
							</div>

							<div class="space-y-1">
								<h3 class="leading-tight font-black text-text-primary">
									{member.name}
									{isMe ? '(You)' : ''}
								</h3>
								<div
									class="flex items-center gap-2 text-[9px] font-bold tracking-wider text-text-secondary uppercase"
								>
									{#if member.role === 'creator'}
										<Crown size={10} class="text-primary" />
									{:else if member.role === 'admin'}
										<ShieldCheck size={10} class="text-success" />
									{:else}
										<UserCircle size={10} />
									{/if}
									<span>{member.role}</span>
								</div>
								<p class="text-[10px] text-text-secondary/60">{member.email}</p>
								<p class="text-[10px] text-text-secondary/60">{member.phone_number}</p>
							</div>
						</div>

						<div class="text-right">
							<p class="text-lg font-black text-text-primary">
								{formatCurrency(member.current_balance)}
							</p>
							<p class="text-[10px] font-bold text-text-secondary uppercase opacity-50">Balance</p>
						</div>
					</div>

					{#if !isMe && (myRole === 'creator' || (myRole === 'admin' && member.role === 'employee'))}
						<div
							class="mt-5 flex items-center justify-end gap-2 border-t border-outline-variant/30 pt-4"
						>
							{#if myRole === 'creator'}
								<button
									onclick={() => {
										warnMsg =
											'Are you sure you want to ' +
											(member.role === 'admin' ? 'demote to Employee' : 'promote to Admin');
										warnOnConfirm = async () => {
											warnMsg = '';
											await updateMemberRole(
												member.id,
												member.role === 'admin' ? 'employee' : 'admin'
											);
										};
									}}
									class="rounded-xl bg-surface-high px-4 py-2 text-[10px] font-black text-text-primary transition-colors hover:bg-primary/10 hover:text-primary"
								>
									{member.role === 'admin' ? 'Demote to Employee' : 'Promote to Admin'}
								</button>
							{/if}

							{#if myRole === 'admin' && member.role === 'employee'}
								<button
									onclick={() => updateMemberRole(member.id, 'admin')}
									class="rounded-xl bg-surface-high px-4 py-2 text-[10px] font-black text-success hover:bg-success/10"
								>
									Promote to Admin
								</button>
							{/if}

							{#if myRole === 'creator' || (myRole === 'admin' && member.role === 'employee')}
								<button
									onclick={() => {
										warnOnConfirm = async () => {
											warnMsg = '';
											await removeMember(member.id);
										};
										warnMsg = `Are you sure you want to remove '${member.name}'?`;
									}}
									class="flex h-10 w-10 items-center justify-center text-error/30 transition-colors hover:text-error"
								>
									<Trash2 size={18} />
								</button>
							{/if}
						</div>
					{/if}
				</div>
			{:else}
				<div class="py-20 text-center opacity-40">
					<Users size={48} class="mx-auto mb-4" />
					<p class="font-bold uppercase tracking-widest text-xs">No members found</p>
				</div>
			{/each}
		</div>
	{/await}
</div>

{#if loading}
	<Toast toastType="loading" text="Please Wait..." />
{/if}

{#if errMsg}
	<Toast toastType="error" text={errMsg} close={() => (errMsg = '')} />
{/if}

{#if successMsg}
	<Toast toastType="success" text={successMsg} close={() => (successMsg = '')} />
{/if}

{#if warnMsg}
	<Toast
		toastType="warning"
		text={warnMsg}
		close={() => {
			warnMsg = '';
		}}
		onConfirm={warnOnConfirm}
	/>
{/if}

{#if updatingBusName}
	<UpdateBusinessName
		businessId={business?.id}
		businessName={business?.name}
		close={() => {
			updatingBusName = false;
		}}
	/>
{/if}

{#if addingMember}
	<AddMember
		businessId={business?.id}
		close={() => {
			addingMember = false;
		}}
	/>
{/if}
