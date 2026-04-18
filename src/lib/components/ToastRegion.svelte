<script lang="ts">
	import { AlertCircle, CheckCircle2, Info } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import type { ToastVariant } from '$lib/stores/toast';
	import { toasts } from '$lib/stores/toast';

	const shell: Record<
		ToastVariant,
		{ box: string; icon: typeof CheckCircle2; iconClass: string }
	> = {
		success: {
			box: 'border-emerald-500/25 bg-emerald-950/90 text-emerald-100',
			icon: CheckCircle2,
			iconClass: 'text-emerald-400'
		},
		error: {
			box: 'border-red-500/30 bg-red-950/90 text-red-100',
			icon: AlertCircle,
			iconClass: 'text-red-400'
		},
		info: {
			box: 'border-sky-500/25 bg-[#1a2330]/95 text-sky-100',
			icon: Info,
			iconClass: 'text-sky-400'
		}
	};
</script>

<div
	class="pointer-events-none fixed bottom-4 right-4 z-[300] flex max-w-[min(100vw-2rem,22rem)] flex-col gap-2"
	aria-live="polite"
	aria-relevant="additions"
>
	{#each $toasts as t (t.id)}
		{@const v = shell[t.variant]}
		<div
			in:fly={{ y: 10, duration: 220 }}
			out:fly={{ y: 6, duration: 180 }}
			class="pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-snug shadow-lg backdrop-blur-md {v.box}"
		>
			<span class="mt-0.5 shrink-0" aria-hidden="true">
				<v.icon class="size-[18px] {v.iconClass}" strokeWidth={2} />
			</span>
			<span class="min-w-0 flex-1 pt-px">{t.message}</span>
		</div>
	{/each}
</div>
