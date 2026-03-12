<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	interface Props {
		toastType: 'success' | 'error' | 'loading' | 'warning';
		text: string;
		close?: () => void;
		onConfirm?: () => void | Promise<void>; // Renamed for clarity vs the close button
		confirmText?: string;
	}

	let { toastType, text, close, onConfirm, confirmText = 'Confirm' }: Props = $props();

	const isMessage: boolean = $derived(toastType !== 'loading');

	const colors = $derived(
		{
			success: {
				border: 'border-green-500/50',
				bg: 'bg-green-500/20',
				text: 'text-green-400',
				icon: 'M5 13l4 4L19 7'
			},
			error: {
				border: 'border-red-500/50',
				bg: 'bg-red-500/20',
				text: 'text-red-400',
				icon: 'M6 18L18 6M6 6l12 12'
			},
			warning: {
				border: 'border-amber-500/50',
				bg: 'bg-amber-500/20',
				text: 'text-amber-400',
				icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
			},
			loading: { border: 'border-white/20', bg: '', text: '', icon: '' }
		}[toastType]
	);
</script>

<div
	class="fixed inset-0 z-999 flex items-center justify-center bg-black/40 backdrop-blur-sm"
	transition:fade={{ duration: 200 }}
>
	<div
		class="relative flex max-w-[90%] min-w-[320px] flex-col items-center justify-center rounded-2xl border {colors.border} bg-neutral-900/80 p-8 shadow-2xl backdrop-blur-xl"
		transition:fly={{ y: 100, duration: 400 }}
	>
		{#if toastType === 'loading'}
			<div
				class="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-primary"
			></div>
		{:else}
			<div
				class="mb-4 flex h-14 w-14 items-center justify-center rounded-full {colors.bg} {colors.text}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={colors.icon} />
				</svg>
			</div>
		{/if}

		<p class="text-center text-lg font-medium text-white drop-shadow-sm">{text}</p>

		{#if isMessage}
			<div class="mt-8 flex w-full items-center justify-center gap-4">
				{#if close}
					<button
						class="flex-1 rounded-xl bg-white/10 py-3 font-semibold text-white transition-all hover:bg-white/20 active:scale-95"
						onclick={() => close()}
					>
						{onConfirm ? 'Cancel' : 'OK'}
					</button>
				{/if}

				{#if onConfirm}
					<button
						class="flex-1 rounded-xl bg-primary py-3 font-bold text-background shadow-lg shadow-primary/20 transition-all hover:opacity-90 active:scale-95"
						onclick={async () => {
							await onConfirm?.();
						}}
					>
						{confirmText}
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>
