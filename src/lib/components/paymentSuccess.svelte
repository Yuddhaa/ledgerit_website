<script lang="ts">
	import { CheckCircle2, ArrowRight, PartyPopper, Sparkles } from 'lucide-svelte';
	import { fade, scale, fly } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import confetti from 'canvas-confetti';

	let { onContinue } = $props();

	// Controls internal staggered entrance
	let mounted = $state(false);
	$effect(() => {
		mounted = true;
	});

	function fireConfetti() {
		confetti({
			particleCount: 150,
			spread: 70,
			origin: { y: 0.6 },
			colors: ['#3399cc', '#FFD700', '#FF4500']
		});
		setTimeout(() => {
			confetti({ particleCount: 100, angle: 60, spread: 55, origin: { x: 0 } });
			confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1 } });
		}, 250);
	}
</script>

{fireConfetti()}
<div
	transition:fade={{ duration: 300 }}
	class="fixed inset-0 z-[100] flex items-center justify-center bg-background p-6"
>
	<div class="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
		<div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl"></div>
		<div class="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-success/20 blur-3xl"></div>
	</div>

	<div class="relative w-full max-w-sm text-center">
		{#if mounted}
			<div
				in:scale={{ duration: 800, start: 0.5, easing: backOut }}
				class="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-success/10 text-success"
			>
				<CheckCircle2 size={64} strokeWidth={2.5} />
				<div in:fade={{ delay: 400 }} class="absolute -top-2 -right-2 text-primary">
					<Sparkles size={24} />
				</div>
			</div>

			<div class="space-y-4">
				<h2
					in:fly={{ y: 20, delay: 200 }}
					class="text-3xl font-black tracking-tight text-text-primary"
				>
					Payment Successful!
				</h2>

				<p
					in:fly={{ y: 20, delay: 400 }}
					class="mx-auto max-w-[280px] text-base leading-relaxed font-medium text-text-secondary"
				>
					Your account has been upgraded. You now have full access to your new features.
				</p>
			</div>

			<div
				in:fly={{ y: 20, delay: 600 }}
				class="mt-10 rounded-3xl border border-outline-variant bg-surface p-4 text-left"
			>
				<div class="flex items-center justify-between px-2">
					<span class="text-xs font-bold tracking-widest text-text-secondary uppercase">Status</span
					>
					<span
						class="rounded-full bg-success/20 px-3 py-1 text-[10px] font-black text-success uppercase"
						>Verified</span
					>
				</div>
			</div>

			<div in:fly={{ y: 20, delay: 800 }} class="mt-12">
				<button
					onclick={onContinue}
					class="group flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-lg font-black text-background shadow-xl shadow-primary/20 transition-all active:scale-95"
				>
					Continue to Dashboard
					<ArrowRight size={20} class="transition-transform group-hover:translate-x-1" />
				</button>
			</div>
		{/if}
	</div>
</div>
