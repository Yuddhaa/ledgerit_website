<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import subscriptionsApi, {
		type subscriptionBody,
		type subscriptionReturn
	} from '$lib/api/subscriptionsApi.js';
	import Toast from '$lib/components/Toast.svelte';
	import { businessStore } from '$lib/stores/store.svelte';
	import type { basePlan } from '$lib/utils/types.js';

	let { data } = $props();

	// Mapping the data for easier access
	const businessId: string = $derived(data.businessId);
	let plans = $derived(data.plans);
	let activePlan: string | null = $derived(
		plans.current_plan?.status === 'active' ? plans.current_plan?.base_plan : null
	);

	// --- State ---
	let isYearly = $state(false);
	let extraMembers = $derived(data.plans.current_plan ? Number(data.plans.current_plan.add_on) : 0);

	// --- Constants ---
	const currencySymbol = '₹';

	// --- Derived Logic ---
	const activeAddonPrice = $derived(isYearly ? plans.yearly_addon : plans.monthly_addon);

	// ****************************************************************************************************************
	// --- for Toast ---
	// ****************************************************************************************************************
	let toast: boolean = $state(false);
	let toastParams: {
		toastType: 'success' | 'error' | 'loading' | 'warning';
		toastMsg: string;
		/**
		 * close is run to cloase the toast once the close button is clicked on the toast
		 */
		close?: () => void;
		/**
		 * onConfirm is run once the confirm button is clicked on the warning toast
		 */
		onConfirm?: () => void | Promise<void>; // Renamed for clarity vs the close button
		confirmText?: string;
	} = $state({
		toastType: 'success',
		toastMsg: ''
	});

	let close = () => {
		toast = false;
	};

	// ****************************************************************************************************************
	// --- price calc helpers ---
	// ****************************************************************************************************************
	const wholesaleTotal = $derived((b?: basePlan) => {
		const base = b ? b : plans.base_plans.wholesale;
		const basePrice = isYearly ? base.yearly_base_price : base.monthly_base_price;
		return (basePrice + extraMembers * activeAddonPrice) / 100;
	});

	const formatPrice = (paisa: number) => (paisa / 100).toLocaleString('en-IN');

	async function redirect() {
		businessStore.selected = null;
		await goto(`/${businessId}`, { invalidate: [(url: URL) => url.pathname === 'business'] });
	}

	// ****************************************************************************************************************
	// subscriptions
	// ****************************************************************************************************************
	async function handleSelectPlan(planType: 'trial' | 'solo' | 'wholesale' | 'owner') {
		console.log(`Selecting ${planType}, Extra Members: ${extraMembers}, Yearly: ${isYearly}`);
		// --- variables
		let subBody: subscriptionBody = {
			period: planType === 'owner' ? 'permanent' : isYearly ? 'yearly' : 'monthly',
			base_plan: planType === 'trial' ? 'wholesale' : planType,
			add_on: String(extraMembers),
			offer_code: offerCode ? offerCode : undefined
		};

		// check if the selected plan and the current plan is one and the same
		// if so show a error toast.
		if (
			subBody.period === plans.current_plan?.period &&
			subBody.base_plan === plans.current_plan.base_plan &&
			subBody.add_on === plans.current_plan.add_on
		) {
		}
		toastParams = {
			toastType: 'warning',
			toastMsg: '',
			confirmText: 'confirm',
			close // closing of warning+confirm toast
		};

		const update =
			// 1. Must have a Razorpay link (Crucial for the UpdateHandler)
			plans.current_plan?.subscription_id !== null &&
			// 2. Must be a plan type that supports Razorpay updates
			plans.current_plan?.base_plan === 'wholesale' &&
			// 3. Status check (matches your Go 'isAlive' logic)
			plans.current_plan?.status !== 'canceled' &&
			plans.current_plan?.status !== 'expired';

		/**
		 * handleCreateUpdate is an nested function.
		 * since except toast warning message and just the api call function diff, rest all are same,
		 * this funciton combines them and is used to do the call.
		 */
		const handleCreateUpdate = async (
			toastMsg: string,
			apiToCall: (
				businessId: string,
				body: subscriptionBody,
				customFetch?: typeof fetch
			) => Promise<string | subscriptionReturn>
		) => {
			toastParams.toastMsg = toastMsg;
			toastParams.onConfirm = async () => {
				// loding for api call
				close();
				toastParams = {
					toastType: 'loading',
					toastMsg: 'processing'
				};
				toast = true; // for loading toast

				// actual api
				try {
					const sub = await apiToCall(businessId, subBody);
					if (typeof sub === 'string') {
						// UI flow for solo : confirm toast -> processing toast -> success toast / fail toast
						toast = false; // closing loading toast
						toastParams = {
							toastType: 'success',
							toastMsg: sub,
							close: async () => {
								close(); // closing success toast
								await redirect();
							}
						};
						toast = true; // success toast for solo plan
					} else {
						console.log(`sub: ${JSON.stringify(sub)}`);
						await handleRazorpay(sub);
					}
				} catch (err: any) {
					toastParams = {
						toastType: 'error',
						toastMsg: err.message,
						close // close error toast
					};
					toast = true; // error toast
				}
			};
		};

		if (planType === 'trial') {
			toastParams.toastMsg = 'Trial can be opted only once. Are you sure?';
			toastParams.onConfirm = async () => {
				try {
					await subscriptionsApi.trial(businessId, subBody);
					await redirect();
					close();
				} catch (err: any) {
					toastParams = {
						toastType: 'error',
						toastMsg: err.message,
						close // closing error toast
					};
					toast = true; // error toast
				}
			};
		} else if (update) {
			handleCreateUpdate('Are you sure you want to update?', subscriptionsApi.update); // display before and after
		} else {
			// confirm toast
			handleCreateUpdate('Are you sure you want to crate this plan?', subscriptionsApi.create);
		}
		toast = true; // main warning+confirm toast
	}

	async function handleRazorpay(sub: subscriptionReturn) {}

	// ****************************************************************************************************************
	// offers
	// ****************************************************************************************************************
	let offerCode: string = $state('');
	let offerValidated: boolean = $state(false);
	const oldValues = plans.base_plans.wholesale;
	const oldOwnerValue = plans.base_plans.owner.yearly_base_price;
	async function validateOffer() {
		console.log(`Validating promo code: ${offerCode}`);
		try {
			plans = await subscriptionsApi.validate(businessId, offerCode);
			offerValidated = true;
			console.log(`promo code: ${offerCode} validated`);
		} catch (err: any) {
			toastParams = {
				toastType: 'error',
				toastMsg: err.message,
				close
			};
			toast = true;
			console.log('err in validateOffer, of plans, err:', err);
		}
	}
	async function removeOffer() {
		await invalidate((url) => url.pathname === 'plans');
		offerValidated = false;
		offerCode = '';
	}
</script>

<div class="min-h-screen bg-background pb-24 text-text-primary transition-colors duration-300">
	<div class="mx-auto max-w-6xl px-4 py-12 md:px-8">
		<!-- ****************************************************************************************************** -->
		<!-- header section -->
		<!-- ****************************************************************************************************** -->
		<header class="mb-16 text-center">
			<h1 class="text-4xl font-extrabold tracking-tight md:text-6xl">
				{plans.current_plan ? 'Update' : 'Choose'} your <span class="text-primary">Plan</span>
			</h1>
			<p class="mt-4 text-lg text-text-secondary">
				Choose the plan that fits <strong>{businessStore.selected?.name}</strong>
			</p>

			<div class="mt-10 flex items-center justify-center gap-6">
				<span class="text-sm font-medium {!isYearly ? 'text-text-primary' : 'text-text-secondary'}">
					Monthly
				</span>
				<button
					onclick={() => (isYearly = !isYearly)}
					class="flex h-8 w-16 items-center rounded-full bg-surface-high p-1 transition-colors hover:bg-surface-variant"
					aria-label="slider for monthly and yearly"
				>
					<div
						class="h-6 w-6 rounded-full bg-primary shadow-lg transition-transform {isYearly
							? 'translate-x-8'
							: 'translate-x-0'}"
					></div>
				</button>
				<span class="text-sm font-medium {isYearly ? 'text-text-primary' : 'text-text-secondary'}">
					Yearly <span
						class="ml-1 rounded-md bg-success/20 px-2 py-0.5 text-xs font-bold text-success"
						>Save 20%</span
					>
				</span>
			</div>
		</header>

		<!-- ****************************************************************************************************** -->
		<!-- current plan card -->
		<!-- ****************************************************************************************************** -->
		{#if plans.current_plan}
			<div
				class="mb-12 flex flex-col items-center justify-between rounded-3xl border border-outline-variant bg-secondary-container p-6 md:flex-row"
			>
				<div class="flex items-center gap-4">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-background"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div>
						<p class="text-xs font-bold tracking-widest text-text-secondary uppercase">
							Active Subscription : [Status : {plans.current_plan.status}]
						</p>
						<h2 class="text-xl font-bold text-text-primary">
							{plans.current_plan.name}
							{plans.current_plan.base_plan === 'wholesale'
								? `[${3 + Number(plans.current_plan.add_on)} members]`
								: null}
						</h2>
					</div>
				</div>
				<div class="mt-4 text-right md:mt-0">
					<p class="font-mono text-sm text-text-secondary">
						Expires: {new Date(plans.current_plan.subscription_end_period).toLocaleDateString(
							'en-IN'
						)}
					</p>
					<p class="text-lg font-bold text-primary">
						{currencySymbol}{formatPrice(plans.current_plan.amount)} / {plans.current_plan.period}
					</p>
				</div>
			</div>
		{/if}

		<!-- ****************************************************************************************************** -->
		<!-- plans section -->
		<!-- ****************************************************************************************************** -->
		<div class="relative">
			<div
				class="grid grid-cols-1 gap-8 md:grid-cols-3 {activePlan === 'owner'
					? 'pointer-events-none'
					: ''}"
			>
				<!-- ****************************************************************************************************** -->
				<!-- free plan -->
				<!-- ****************************************************************************************************** -->
				<div
					class="flex flex-col rounded-4xl border border-outline-variant bg-surface p-8 transition-all hover:border-outline"
				>
					<h3 class="text-xl font-bold text-text-secondary">Solo</h3>
					<div class="my-4 text-4xl font-black text-text-primary">
						{currencySymbol}0<span class="text-sm font-normal text-text-secondary">/forever</span>
					</div>
					<p class="text-sm text-text-secondary">For single person operations.</p>
					<div class="my-6 border-t border-outline-variant"></div>
					<ul class="mb-8 space-y-4 text-sm">
						<li
							class="flex items-center gap-3 before:font-bold before:text-success before:content-['✓']"
						>
							Max {plans.base_plans.solo.users_limit} User
						</li>
					</ul>
					<button
						onclick={() => {
							if (activePlan === 'solo') {
								toastParams = {
									toastType: 'error',
									toastMsg: 'Solo plan is already active',
									close
								};
								toast = true;
							} else if (!plans.is_free_available) {
								toastParams = {
									toastType: 'error',
									toastMsg: 'Solo plan not available (limit reached)',
									close
								};
								toast = true;
							} else {
								handleSelectPlan('solo');
							}
						}}
						class="mt-auto w-full rounded-xl py-3 font-semibold transition-all {plans.is_free_available
							? 'bg-surface-high text-text-primary hover:bg-surface-variant active:scale-[0.98]'
							: 'cursor-not-allowed bg-disabled text-text-disabled'}"
					>
						{activePlan === 'solo' ? 'Active' : 'Choose Solo'}
					</button>
				</div>

				<!-- ****************************************************************************************************** -->
				<!-- wholesale -->
				<!-- ****************************************************************************************************** -->
				<div
					class="relative flex scale-105 flex-col rounded-4xl border-2 border-primary bg-primary-container p-8 shadow-2xl shadow-primary/20 transition-all"
				>
					<span
						class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold tracking-tighter text-background uppercase"
						>Recommended</span
					>
					<h3 class="text-xl font-bold text-text-primary">Wholesale</h3>
					<div class="my-4 text-4xl font-black text-primary">
						{currencySymbol}
						{#if offerValidated}
							<span
								class="mr-1 text-2xl font-bold text-error/70 line-through decoration-error decoration-2"
							>
								{wholesaleTotal(oldValues)}
							</span>
						{/if}
						<span>{wholesaleTotal()}</span>
						<span class="text-sm font-normal text-text-secondary">
							/{isYearly ? 'year' : 'month'}
						</span>
					</div>
					<div
						class="mb-6 space-y-3 rounded-2xl border border-outline-variant bg-background p-4 shadow-sm"
					>
						<p class="text-center text-[10px] font-bold tracking-wider text-primary uppercase">
							Customize Team Size
						</p>
						<div class="flex items-center justify-between">
							<button
								onclick={() => extraMembers > 0 && extraMembers--}
								class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-xl font-bold text-text-primary transition-all hover:bg-surface-variant active:scale-90"
								>-</button
							>
							<div class="text-center">
								<span class="font-mono text-2xl font-bold text-text-primary"
									>{plans.base_plans.wholesale.users_limit + extraMembers}</span
								>
								<p class="text-[10px] text-text-secondary">Total Users</p>
							</div>
							<button
								onclick={() => extraMembers++}
								class="flex h-10 w-10 items-center justify-center rounded-full bg-surface-high text-xl font-bold text-text-primary transition-all hover:bg-surface-variant active:scale-90"
								>+</button
							>
						</div>
						<p class="text-center text-[10px] text-text-secondary">+{extraMembers} extra members</p>
					</div>

					<ul class="mb-8 space-y-4 text-sm text-text-primary">
						<li
							class="flex items-center gap-3 before:font-bold before:text-success before:content-['✓']"
						>
							Base {plans.base_plans.wholesale.users_limit} Users
						</li>
					</ul>
					{#if plans.is_trial_available}
						<div
							class="mb-4 flex flex-col gap-3 rounded-xl border border-success/20 bg-success/10 p-3"
						>
							<div class="flex items-center gap-2">
								<span class="text-lg">⏳</span>
								<p class="text-xs font-medium text-success">
									<strong>Limited Offer:</strong> You get the first 3 months entirely for free.
								</p>
							</div>

							<div class="flex items-center justify-between border-t border-success/20 pt-2">
								<span class="text-[10px] font-bold text-success/80 uppercase">Trial available</span>
								<button
									onclick={() => handleSelectPlan('trial')}
									class="rounded-lg bg-success px-3 py-1.5 text-[11px] font-bold text-background shadow-sm transition-all hover:bg-success/90 active:scale-95"
								>
									Activate Trial
								</button>
							</div>
						</div>
					{/if}
					<button
						onclick={() => handleSelectPlan('wholesale')}
						class="mt-auto w-full rounded-xl bg-primary py-3 font-bold text-background shadow-lg transition-all hover:opacity-90 active:scale-95"
						>Select Wholesale</button
					>
				</div>

				<!-- ****************************************************************************************************** -->
				<!-- owner plan -->
				<!-- ****************************************************************************************************** -->
				<div
					class="flex flex-col rounded-4xl border border-outline-variant bg-surface p-8 transition-all hover:border-outline"
				>
					<h3 class="text-xl font-bold text-text-secondary">Owner</h3>
					<div class="my-4 text-4xl font-black text-text-primary">
						{currencySymbol}
						{#if offerValidated}
							<span
								class="mr-1 text-2xl font-bold text-error/70 line-through decoration-error decoration-2"
							>
								{formatPrice(oldOwnerValue)}
							</span>
						{/if}
						{isYearly
							? formatPrice(plans.base_plans.owner.yearly_base_price)
							: formatPrice(plans.base_plans.owner.monthly_base_price)}<span
							class="text-sm font-normal text-text-secondary"
						>
							/forever</span
						>
					</div>
					<p class="text-sm text-text-secondary">Unlimited scale for growing empires.</p>
					<div class="my-6 border-t border-outline-variant"></div>
					<ul class="mb-8 space-y-4 text-sm">
						<li
							class="flex items-center gap-3 before:font-bold before:text-success before:content-['✓']"
						>
							Unlimited Users
						</li>
						<li
							class="flex items-center gap-3 before:font-bold before:text-success before:content-['✓']"
						>
							24/7 Support
						</li>
					</ul>

					<!-- {#if plans.is_trial_available} -->
					<!-- 	<div -->
					<!-- 		class="mb-4 flex flex-col gap-3 rounded-xl border border-success/20 bg-success/10 p-3" -->
					<!-- 	> -->
					<!-- 		<div class="flex items-center gap-2"> -->
					<!-- 			<span class="text-lg">⏳</span> -->
					<!-- 			<p class="text-xs font-medium text-success"> -->
					<!-- 				<strong>Limited Offer:</strong> You get the first 3 months entirely for free. -->
					<!-- 			</p> -->
					<!-- 		</div> -->
					<!---->
					<!-- 		<div class="flex items-center justify-between border-t border-success/20 pt-2"> -->
					<!-- 			<span class="text-[10px] font-bold text-success/80 uppercase">Trial available</span> -->
					<!-- 			<button -->
					<!-- 				onclick={() => handleSelectPlan('trial')} -->
					<!-- 				class="rounded-lg bg-success px-3 py-1.5 text-[11px] font-bold text-background shadow-sm transition-all hover:bg-success/90 active:scale-95" -->
					<!-- 			> -->
					<!-- 				Activate Trial -->
					<!-- 			</button> -->
					<!-- 		</div> -->
					<!-- 	</div> -->
					<!-- {/if} -->
					<button
						onclick={() => handleSelectPlan('owner')}
						class="mt-auto w-full rounded-xl bg-surface-high py-3 font-semibold text-text-primary transition-all hover:bg-surface-variant"
						>Go Unlimited</button
					>
				</div>
			</div>

			<!-- ****************************************************************************************************** -->
			<!-- if plan is owner lock the plans section with a toast -->
			<!-- ****************************************************************************************************** -->
			{#if activePlan === 'owner'}
				<div
					class="absolute inset-x-0 -inset-y-5 z-10 mt-4 flex items-start justify-center rounded-4xl bg-background/40 backdrop-blur-sm transition-all duration-500 md:mt-0 md:items-center"
				>
					<div
						class="mx-4 max-w-md rounded-3xl border-2 border-primary bg-surface p-8 text-center shadow-2xl"
					>
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-8 w-8"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								><path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/></svg
							>
						</div>
						<h3 class="text-2xl font-bold text-text-primary">Plan Locked</h3>
						<p class="mt-2 text-sm leading-relaxed text-text-secondary">
							You are currently on the <strong>Owner Plan</strong>. This is our highest permanent
							plan and cannot be downgraded or updated.
						</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- ****************************************************************************************************** -->
		<!-- offer code section -->
		<!-- ****************************************************************************************************** -->
		<!-- add a ! sign behind plans.is_trial_available -->
		{#if plans.is_offer_available}
			<div class="mt-16 flex justify-center">
				<div
					class="w-full max-w-2xl rounded-3xl border p-8 backdrop-blur-md transition-all duration-500
			{offerValidated ? 'border-success/50 bg-success/10' : 'border-primary/30 bg-primary-container/30'}"
				>
					<div class="mb-6 flex items-center justify-between">
						<div class="flex items-center gap-3">
							<span class="text-2xl">{offerValidated ? '✅' : '🎁'}</span>
							<div>
								<h4 class="text-lg font-bold text-text-primary">
									{offerValidated ? 'Promo Applied!' : 'Have a promo code?'}
								</h4>
								<p class="text-sm text-text-secondary">
									{offerValidated
										? 'Your discount has been added to the prices above.'
										: 'Enter your code below to unlock special discounts.'}
								</p>
							</div>
						</div>

						{#if offerValidated}
							<span
								class="hidden rounded-full bg-success px-3 py-1 text-[10px] font-bold tracking-wider text-background uppercase sm:block"
							>
								Offer Active
							</span>
						{/if}
					</div>

					<div class="flex flex-col gap-4 sm:flex-row">
						<div class="relative flex-1">
							<input
								type="text"
								bind:value={offerCode}
								readonly={offerValidated}
								placeholder="Enter code (e.g. WELCOME50)"
								class="w-full rounded-xl border px-4 py-3 text-text-primary transition-all outline-none
						{offerValidated
									? 'cursor-default border-success/30 bg-success/5 font-mono font-bold text-success'
									: 'border-outline bg-background focus:border-primary focus:ring-2 focus:ring-primary/20'}"
								autocomplete="on"
								name="offerCode"
							/>
						</div>

						<button
							onclick={offerValidated ? removeOffer : validateOffer}
							class="rounded-xl px-8 py-3 font-bold shadow-md transition-all active:scale-95
					{offerValidated
								? 'border border-error/20 bg-surface-high text-error hover:bg-error/10'
								: 'bg-primary text-background hover:opacity-90'}"
						>
							{offerValidated ? 'Remove' : 'Validate'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
{#if toast}
	<Toast
		toastType={toastParams.toastType}
		text={toastParams.toastMsg}
		close={toastParams.close}
		onConfirm={toastParams.onConfirm}
		confirmText={toastParams.confirmText}
	/>
{/if}
