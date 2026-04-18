<script lang="ts">
	import { Camera, Copy, Download, ImagePlus, Redo2, Undo2 } from 'lucide-svelte';
	import {
		runSaveToGallery,
		runSnapforgeCopy,
		runSnapforgeExport
	} from '$lib/snapforge/clipboard-bridge';
	import { topTab } from '$lib/stores/editor';
</script>

<header
	class="flex min-h-[52px] shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-white/[0.06] bg-[#151515] px-3 py-2 sm:px-4 lg:min-h-[52px] lg:py-0"
>
	<div class="flex shrink-0 items-center gap-2 sm:gap-3">
		<button
			type="button"
			class="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
			aria-label="Undo"
		>
			<Undo2 class="size-[18px]" strokeWidth={1.75} />
		</button>
		<button
			type="button"
			class="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300"
			aria-label="Redo"
		>
			<Redo2 class="size-[18px]" strokeWidth={1.75} />
		</button>
	</div>

	<div
		class="flex min-w-0 flex-[1_1_280px] flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:flex-[1_1_320px] lg:flex-[1_1_400px] xl:gap-4"
	>
		<div class="flex items-center gap-2">
			<div
				class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
			>
				<Camera class="size-[18px]" strokeWidth={2} />
			</div>
			<span class="hidden text-[15px] font-semibold tracking-tight text-white sm:inline"
				>SnapForge</span
			>
		</div>
		<div
			class="flex max-w-full rounded-lg bg-[#0f0f0f] p-0.5 ring-1 ring-white/[0.07]"
			role="tablist"
		>
			<button
				type="button"
				role="tab"
				aria-selected={$topTab === 'editor'}
				class="rounded-md px-2.5 py-1.5 text-[12px] font-medium transition sm:px-4 sm:text-[13px] {$topTab ===
				'editor'
					? 'bg-[#2a2a2a] text-white shadow-sm'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => topTab.set('editor')}
			>
				Editor
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={$topTab === 'templates'}
				class="rounded-md px-2 py-1.5 text-[12px] font-medium transition sm:px-3 sm:text-[13px] {$topTab ===
				'templates'
					? 'bg-[#2a2a2a] text-white shadow-sm'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => topTab.set('templates')}
			>
				Templates
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={$topTab === 'creations'}
				class="rounded-md px-2 py-1.5 text-[12px] font-medium transition sm:px-3 sm:text-[13px] {$topTab ===
				'creations'
					? 'bg-[#2a2a2a] text-white shadow-sm'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => topTab.set('creations')}
			>
				<span class="lg:hidden">Creaciones</span>
				<span class="hidden lg:inline">Mis creaciones</span>
			</button>
		</div>
	</div>

	<div class="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
		{#if $topTab === 'editor'}
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-transparent px-2 py-2 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.04] sm:gap-2 sm:px-3"
				onclick={runSaveToGallery}
				title="Guardar vista en Mis creaciones"
			>
				<ImagePlus class="size-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
				<span class="hidden xl:inline">Guardar</span>
			</button>
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-transparent px-2 py-2 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.04] sm:gap-2 sm:px-3.5"
				onclick={runSnapforgeCopy}
			>
				<Copy class="size-4 shrink-0 text-zinc-400" strokeWidth={1.75} />
				<span class="hidden xl:inline">Copy</span>
			</button>
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-[#0c0c0c] shadow-sm transition hover:brightness-105 sm:gap-2 sm:px-4"
				style="background: linear-gradient(180deg, #8fd4f0 0%, #7ec8e3 100%);"
				onclick={runSnapforgeExport}
			>
				<Download class="size-4 shrink-0" strokeWidth={2.25} />
				<span class="hidden xl:inline">Export</span>
			</button>
		{/if}
	</div>
</header>
