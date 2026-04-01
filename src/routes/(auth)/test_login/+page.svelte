<script lang="ts">
	import { goto } from '$app/navigation';
	import cookies from '$lib/utils/cookies';
	import api from '$lib/api/api';
	import Toast from '$lib/components/Toast.svelte';

	import tagIcon from '$lib/assets/tag_icon.png';
	import type { user } from '$lib/utils/types';
	import { log } from '$lib/utils/helpers';
	import { Mail, Lock, ArrowLeft, ShieldCheck, ChevronRight, Eye, EyeClosed } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	let errorMessage: string = $state('');
	let isLoggingIn: boolean = $state(false);

	let email: string = $state('');
	let password: string = $state('');
	let viewPwd: boolean = $state(false);

	async function handleBackendLogin(e: Event) {
		e.preventDefault(); // Added to handle form submission properly
		interface LoginResponse {
			access_token: string;
			refresh_token: string;
			user: user;
		}
		try {
			isLoggingIn = true;
			const res = await api.Post<LoginResponse>('/auth/test/signin', {
				email,
				password
			});

			await cookies.set('access_token', res.access_token, '/', 7);
			await cookies.set('refresh_token', res.refresh_token, '/', 35);

			log('moving to /');
			await goto('/');
		} catch (err: any) {
			errorMessage = err.message || 'Login failed. Please try again.';
			log('Login error:', err);
		} finally {
			isLoggingIn = false;
		}
	}
</script>

<div
	class="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6 text-text-primary"
>
	<div
		class="fixed top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]"
	></div>
	<div
		class="fixed right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[120px]"
	></div>

	<div transition:fly={{ y: 20, duration: 600 }} class="z-10 w-full max-w-md space-y-8">
		<div class="text-center">
			<img
				class="mx-auto mb-6 h-24 w-auto object-contain drop-shadow-2xl transition-transform hover:scale-110"
				src={tagIcon}
				alt="LedgerIt Icon"
			/>
			<div class="space-y-1">
				<h1 class="text-3xl font-black tracking-tight text-text-primary">Reviewer Access</h1>
				<p class="text-[10px] font-bold tracking-[0.2em] text-text-secondary uppercase">
					Authorized Test Credentials Only
				</p>
			</div>
		</div>

		<div class="rounded-[2.5rem] border border-outline-variant bg-surface p-8 shadow-2xl">
			<form onsubmit={handleBackendLogin} class="space-y-6">
				<div class="space-y-2">
					<label for="test-email" class="ml-1 text-[10px] font-black text-text-secondary uppercase">
						Test Email
					</label>
					<div class="group relative">
						<div
							class="absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary"
						>
							<Mail size={18} />
						</div>
						<input
							id="test-email"
							type="email"
							bind:value={email}
							placeholder="reviewer@example.com"
							class="w-full rounded-2xl border-none bg-background py-4 pr-4 pl-12 text-sm font-bold text-text-primary ring-1 ring-outline-variant transition-all outline-none focus:ring-2 focus:ring-primary"
							required
						/>
					</div>
				</div>

				<div class="space-y-2">
					<label
						for="test-password"
						class="ml-1 text-[10px] font-black text-text-secondary uppercase"
					>
						Test Password
					</label>
					<div class="group relative">
						<div
							class="absolute top-1/2 left-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary"
						>
							<Lock size={18} />
						</div>
						<input
							id="test-password"
							type={viewPwd ? 'password' : 'text'}
							bind:value={password}
							placeholder="••••••••"
							class="w-full rounded-2xl border-none bg-background py-4 pr-4 pl-12 text-sm font-bold text-text-primary ring-1 ring-outline-variant transition-all outline-none focus:ring-2 focus:ring-primary"
							required
						/>
						<button
							class="absolute top-1/2 right-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary hover:cursor-pointer"
							type="button"
							onclick={() => {
								viewPwd = viewPwd ? false : true;
							}}
						>
							{#if viewPwd}
								<Eye size={18} />
							{:else}
								<EyeClosed size={18} />
							{/if}
						</button>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoggingIn}
					class="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-xs font-black text-background uppercase shadow-lg shadow-primary/20 transition-all hover:cursor-pointer hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
				>
					{#if isLoggingIn}
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"
						></div>
					{:else}
						Verify & Sign In <ChevronRight size={16} strokeWidth={3} />
					{/if}
				</button>
			</form>
		</div>

		<div class="text-center">
			<a
				href="/login"
				class="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-text-secondary uppercase transition-colors hover:text-primary"
			>
				<ArrowLeft size={12} /> Return to Standard Login
			</a>
		</div>
	</div>
</div>

{#if isLoggingIn}
	<Toast toastType="loading" text="Signing in..." />
{/if}

{#if errorMessage}
	<Toast
		toastType="error"
		text={errorMessage}
		close={() => {
			errorMessage = '';
		}}
	/>
{/if}
