<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import cookies from '$lib/utils/cookies';
	import api from '$lib/api/api';
	import { PUBLIC_GOOGLE_WEB_CLIENT_ID } from '$env/static/public';
	import Toast from '$lib/components/Toast.svelte';
	import { GoogleSignIn } from '@capawesome/capacitor-google-sign-in';

	import tagIcon from '$lib/assets/tag_icon.png';
	import type { user } from '$lib/utils/types';
	import { Capacitor } from '@capacitor/core';
	import { log } from '$lib/utils/helpers';

	let errorMessage: string = $state('');
	let isLoggingIn: boolean = $state(false);

	/**
	 * handleBackendLogin handles the login after
	 * google returns with id_token
	 * */
	async function handleBackendLogin(idToken: string) {
		interface LoginResponse {
			access_token: string;
			refresh_token: string;
			user: user;
		}
		try {
			isLoggingIn = true;
			const res = await api.Post<LoginResponse>('/auth/google/signin', {
				id_token: idToken
			});

			// 2. Store the JWT (Cookie)
			cookies.set('access_token', res.access_token, '/', 7);
			cookies.set('refresh_token', res.refresh_token, '/', 35);

			log('moving to /');
			await goto('/');
		} catch (err: any) {
			// API helper throws an object with a message, so we catch it here
			errorMessage = err.message || 'Login failed. Please try again.';
			console.error('Login error:', err);
		} finally {
			isLoggingIn = false;
		}
	}

	/**
	 * signin is the func which is called on button click
	 * on native after selection flow continues and this func will call handleBackendLogin
	 * on web, sinse its a redirect, that logic is in onMount
	 */
	async function signin() {
		try {
			const result = await GoogleSignIn.signIn();
			if (result.idToken) await handleBackendLogin(result.idToken);
		} catch (err: any) {
			log('Sign-in error:', err);
			// Check if user cancelled
			if (err.message !== 'Sign in canceled') {
				errorMessage = 'Could not initialize Google Sign-In.' + JSON.stringify(err);
			}
		}
	}

	onMount(async () => {
		try {
			await GoogleSignIn.initialize({
				clientId: PUBLIC_GOOGLE_WEB_CLIENT_ID,
				redirectUrl: 'http://localhost:5173/login/'
			});
			log('signin initialized');

			// this is when in web, redirect happens this below plugin func will return result
			// if result is present then its a redirect and call handleBackendLogin
			if (Capacitor.getPlatform() === 'web') {
				const result = await GoogleSignIn.handleRedirectCallback();
				if (result.idToken) {
					await handleBackendLogin(result.idToken);
				}
			}
		} catch (e: any) {
			console.log('No pending redirect result found.');
		}
	});
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center gap-8 bg-background text-text-primary"
>
	<div class="text-center">
		<img
			class="mx-auto h-32 w-auto object-contain drop-shadow-xl transition-all hover:scale-105"
			src={tagIcon}
			alt="LedgerIt Icon"
		/>
	</div>

	<button
		onclick={signin}
		disabled={isLoggingIn}
		class="flex items-center gap-3 rounded-full border border-outline bg-surface px-8 py-3 font-bold text-text-primary shadow-sm transition-all hover:bg-surface-high active:scale-95 disabled:opacity-50"
	>
		<img
			src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
			alt=""
			class="h-5 w-5"
		/>
		Sign in with Google
	</button>
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
