<script lang="ts">
	import { Copy, Download, ImagePlus, Redo2, Undo2 } from 'lucide-svelte';
	import {
		runSaveToGallery,
		runSnapforgeCopy,
		runSnapforgeExport
	} from '$lib/snapforge/clipboard-bridge';
	import { topTab } from '$lib/stores/editor';
</script>

<header
	class="grid min-h-[52px] w-full shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-x-2 gap-y-2 border-b border-white/[0.06] bg-[#151515] px-3 py-2 sm:px-4 lg:min-h-[52px] lg:py-0"
>
	<div class="flex min-w-0 shrink-0 items-center justify-self-start gap-2 sm:gap-3">
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
		class="flex min-w-0 max-w-full justify-center justify-self-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
	>
		<div
			class="flex shrink-0 rounded-lg bg-[#0f0f0f] p-0.5 ring-1 ring-white/[0.07]"
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
			<button
				type="button"
				role="tab"
				aria-selected={$topTab === 'shareTemplates'}
				class="rounded-md px-2 py-1.5 text-[12px] font-medium transition sm:px-3 sm:text-[13px] {$topTab ===
				'shareTemplates'
					? 'bg-[#2a2a2a] text-white shadow-sm'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => topTab.set('shareTemplates')}
			>
				<span class="lg:hidden">Compartir</span>
				<span class="hidden lg:inline">Compartir plantillas</span>
			</button>
		</div>
	</div>

	<div
		class="flex min-w-0 shrink-0 flex-wrap items-center justify-end justify-self-end gap-1 sm:gap-2"
	>
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
