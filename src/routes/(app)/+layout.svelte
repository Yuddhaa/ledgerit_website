<script lang="ts">
	import { PUBLIC_APP_VERSION } from '$env/static/public';
	import { User, Moon, Sun, LogOut, Info, X, ChevronRight } from 'lucide-svelte';
	import { fade, slide, scale } from 'svelte/transition';
	import { ui, auth } from '$lib/stores/store.svelte';
	import { logout } from '$lib/api/auth/auth';
	import { goto } from '$app/navigation';
	import Toast from '$lib/components/Toast.svelte';
	import usersApi from '$lib/api/usersApi';

	let { children } = $props();
	let isLoggingOut = $state(false);
	let isUpdatingUser = $state(false);
	let showEditModal = $state(false);
	let errorMsg = $state('');

	// Temp state for editing
	let editName = $state(auth.user?.name ?? '');
	let editPhone = $state(auth.user?.phone_number ?? '');

	const getInitials = (name: string) => {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase();
	};

	const handleUpdateProfile = async () => {
		if (!editName) {
			errorMsg = 'Please enter username';
			return;
		}
		if (!editPhone) {
			errorMsg = 'Please Enter Phone Number';
			return;
		}
		isUpdatingUser = true;
		const user = await usersApi.update(editName, editPhone);
		auth.user = user.user;
		isUpdatingUser = false;
		showEditModal = false;
	};
</script>

{@render children()}

{#if ui.showUniversalSettings}
	<div
		transition:fade={{ duration: 200 }}
		class="fixed inset-0 z-50 cursor-default bg-black/60 backdrop-blur-sm"
		onclick={() => (ui.showUniversalSettings = false)}
	>
		<div
			transition:slide={{ axis: 'y' }}
			class="absolute bottom-0 max-h-[90vh] w-full cursor-default overflow-y-auto rounded-t-[32px] bg-background p-6 shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-8 flex items-center justify-between">
				<h2 class="text-xl font-black text-text-primary">Settings</h2>
				<button
					onclick={() => (ui.showUniversalSettings = false)}
					class="cursor-pointer p-2 text-text-secondary transition-colors hover:text-primary"
				>
					<X size={24} />
				</button>
			</div>

			<div class="space-y-6">
				<section>
					<p class="mb-3 text-[10px] font-bold tracking-widest text-text-secondary/50 uppercase">
						Account
					</p>
					<button
						onclick={() => {
							editName = auth.user?.name ?? '';
							editPhone = auth.user?.phone_number ?? '';
							showEditModal = true;
						}}
						class="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-outline-variant bg-surface p-4 text-left transition-colors hover:bg-surface-high"
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

						<div class="flex-1">
							<p class="leading-tight font-black text-text-primary">{auth.user?.name ?? 'User'}</p>
							<p class="mt-1 text-[10px] font-bold tracking-tighter text-text-secondary uppercase">
								Edit Profile
							</p>
						</div>
						<ChevronRight size={18} class="text-text-secondary" />
					</button>
				</section>

				<section>
					<p class="mb-3 text-[10px] font-bold tracking-widest text-text-secondary/50 uppercase">
						Appearance
					</p>
					<button
						onclick={() => (ui.theme = ui.theme === 'light' ? 'dark' : 'light')}
						class="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-outline-variant bg-surface p-4 transition-colors hover:bg-surface-high"
					>
						<div class="flex items-center gap-3 font-bold text-text-primary">
							{#if ui.theme === 'dark'}<Moon size={20} />{:else}<Sun size={20} />{/if}
							<span>Dark Mode</span>
						</div>
						<div
							class="relative h-6 w-10 rounded-full bg-outline-variant transition-colors {ui.theme ===
							'dark'
								? 'bg-primary'
								: ''}"
						>
							<div
								class="absolute top-1 left-1 h-4 w-4 rounded-full bg-background transition-transform {ui.theme ===
								'dark'
									? 'translate-x-4'
									: ''}"
							></div>
						</div>
					</button>
				</section>

				<section>
					<button
						class="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-error/20 bg-error/10 p-4 font-black text-error transition-colors hover:bg-error/20"
						onclick={async () => {
							isLoggingOut = true;
							await logout();
							ui.showUniversalSettings = false;
							await goto('/login');
							isLoggingOut = false;
						}}
					>
						<LogOut size={20} />
						<span>Logout</span>
					</button>
				</section>

				<footer class="pt-4 text-center">
					<p
						class="flex items-center justify-center gap-1 text-[10px] font-bold text-text-secondary/40"
					>
						<Info size={10} /> LEDGERIT {PUBLIC_APP_VERSION}
					</p>
				</footer>
			</div>
		</div>
	</div>
{/if}

{#if showEditModal}
	<div
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
	>
		<div
			transition:scale={{ start: 0.95, duration: 200 }}
			class="w-full max-w-sm rounded-3xl border border-outline-variant bg-background p-6 shadow-2xl"
		>
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-xl bg-primary-container p-2 text-primary">
					<User size={24} strokeWidth={2.5} />
				</div>
				<h3 class="text-xl font-black text-text-primary">Edit Profile</h3>
			</div>

			<div class="space-y-4">
				<div class="space-y-1">
					<label
						for="name"
						class="ml-1 text-[10px] font-black tracking-widest text-text-secondary uppercase"
						>Full Name</label
					>
					<input
						id="name"
						type="text"
						bind:value={editName}
						class="w-full rounded-xl border-none bg-surface p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
				<div class="space-y-1">
					<label
						for="phone"
						class="ml-1 text-[10px] font-black tracking-widest text-text-secondary uppercase"
						>Phone Number</label
					>
					<input
						id="phone"
						type="text"
						bind:value={editPhone}
						placeholder="+91 00000 00000"
						class="w-full rounded-xl border-none bg-surface p-3 text-sm font-bold text-text-primary ring-1 ring-outline-variant outline-none focus:ring-2 focus:ring-primary"
					/>
				</div>
			</div>

			<div class="mt-8 flex gap-3">
				<button
					onclick={() => (showEditModal = false)}
					class="flex-1 cursor-pointer rounded-xl bg-surface-high py-3 text-sm font-black text-text-primary transition-transform active:scale-95"
				>
					Cancel
				</button>
				<button
					onclick={handleUpdateProfile}
					class="flex-1 cursor-pointer rounded-xl bg-primary py-3 text-sm font-black text-background shadow-lg shadow-primary/20 transition-transform active:scale-95"
				>
					Update
				</button>
			</div>
		</div>
	</div>
{/if}

{#if isLoggingOut}
	<Toast toastType="loading" text="Logging Out" />
{/if}

{#if isUpdatingUser}
	<Toast toastType="loading" text="Updating User" />
{/if}

{#if errorMsg}
	<Toast
		toastType="error"
		text={errorMsg}
		close={() => {
			errorMsg = '';
		}}
	/>
{/if}
