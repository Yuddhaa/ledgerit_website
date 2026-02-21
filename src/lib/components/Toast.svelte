<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	interface Props {
		toastType: 'success' | 'error' | 'loading';
		text: string;
		close?: () => void;
	}

	let { toastType, text, close }: Props = $props();

	const isMessage: boolean = $derived(toastType === 'success' || toastType === 'error');
	const borderColor = $derived(
		toastType === 'success'
			? 'border-green-500/50'
			: toastType === 'error'
				? 'border-red-500/50'
				: 'border-white/20'
	);
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
	transition:fade={{ duration: 200 }}
>
	<div
		class="relative flex min-w-[300px] flex-col items-center justify-center rounded-2xl border {borderColor} bg-white/10 p-8 shadow-2xl backdrop-blur-xl"
		transition:fly={{ y: 500, duration: 600 }}
	>
		{#if toastType === 'loading'}
			<div
				class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-blue-600 bg-white/20"
			></div>
		{:else if toastType === 'success'}
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			</div>
		{:else if toastType === 'error'}
			<div
				class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-700"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</div>
		{/if}
		<p class="text-center text-lg font-medium text-white drop-shadow-sm">{text}</p>
		{#if isMessage && close}
			<button
				class="mt-6 rounded-lg bg-white/20 px-6 py-2 font-semibold text-white transition-all hover:bg-white/30 active:scale-95"
				onclick={close}>OK</button
			>
		{/if}
	</div>
</div>
