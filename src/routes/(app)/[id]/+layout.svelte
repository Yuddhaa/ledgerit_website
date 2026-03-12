<script lang="ts">
	import { goto } from '$app/navigation';
	import { logout } from '$lib/api/auth/auth';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Toast from '$lib/components/Toast.svelte';

	let { children, data } = $props();

	let isLoggingOut = $state(false);
</script>

<nav class="mx-16 flex justify-between">
	<ul>
		<h1 class="">My Businesses</h1>
	</ul>
	<ul class="flex gap-12">
		<li>
			<button
				class="rounded-xl bg-blue-400 p-2.5 text-white transition-all hover:scale-110"
				onclick={async () => {
					isLoggingOut = true;
					await logout();
					await goto('/login');
					isLoggingOut = false;
				}}>logout</button
			>
		</li>
		<li class=""><h2>{data.user?.name}</h2></li>
		<li><ThemeToggle /></li>
	</ul>
</nav>

{@render children()}

{#if isLoggingOut}
	<Toast toastType="loading" text="logging out" />
{/if}

<button
	onclick={async () => {
		await goto('/');
	}}>go back</button
>
<br />
<a href="./plans">create or update plans</a>
