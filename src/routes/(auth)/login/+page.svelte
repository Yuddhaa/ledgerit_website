<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import cookies from '$lib/utils/cookies';
	import api from '$lib/api/api';
	import { PUBLIC_GOOGLE_WEB_CLIENT_ID } from '$env/static/public';
	import Toast from '$lib/components/Toast.svelte';

	import tagIcon from '$lib/assets/tag_icon.png';

	let errorMessage: string = $state('');
	let isLoggingIn: boolean = $state(false);

	/**
	 * handleCredentialResponse handles the login after
	 * google returns with id_token
	 * */
	async function handleCredentialResponse(response: any) {
		interface LoginResponse {
			access_token: string;
			refresh_token: string;
			user: any; // You can define a proper User interface later
		}
		try {
			isLoggingIn = true;
			const res = await api.Post<LoginResponse>('/auth/google/signin', {
				id_token: response.credential
			});

			// 2. Store the JWT (Cookie)
			cookies.set('access_token', res.access_token, '/', 7);
			cookies.set('refresh_token', res.refresh_token, '/', 35);

			await goto('/');
		} catch (err: any) {
			// API helper throws an object with a message, so we catch it here
			errorMessage = err.message || 'Login failed. Please try again.';
			console.error('Login error:', err);
		} finally {
			isLoggingIn = false;
		}
	}

	onMount(async () => {
		// @ts-ignore - Google GSI is loaded globally
		await google.accounts.id.initialize({
			client_id: PUBLIC_GOOGLE_WEB_CLIENT_ID,
			callback: handleCredentialResponse,
			context: 'signin',
			ux_mode: 'popup',
			allowed_parent_origin: 'http://localhost:5173'
		});

		// Render the standard button
		// @ts-ignore
		google.accounts.id.renderButton(document.getElementById('googleBtn'), {
			type: 'standard',
			shape: 'pill',
			theme: 'filled_blue',
			size: 'large',
			text: 'signing_with',
			logo_alignment: 'left'
		});
	});
</script>

<div class="flex min-h-screen flex-col items-center justify-center gap-6">
	<img
		class="mx-auto h-28 w-auto object-contain drop-shadow-md transition-all hover:scale-110"
		src={tagIcon}
		alt="icon with tagline"
	/>
	<h1 class="text-3xl font-bold">Welcome to LedgerIt</h1>

	<div id="googleBtn"></div>
</div>

{#if isLoggingIn}
	<Toast toastType="loading" text="logging in" />
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
