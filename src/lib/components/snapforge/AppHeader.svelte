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
	class="grid h-[52px] shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-white/[0.06] bg-[#151515] px-4"
>
	<div class="flex items-center gap-3">
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

	<div class="flex items-center justify-center gap-4">
		<div class="flex items-center gap-2">
			<div
				class="flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400"
			>
				<Camera class="size-[18px]" strokeWidth={2} />
			</div>
			<span class="text-[15px] font-semibold tracking-tight text-white">SnapForge</span>
		</div>
		<div
			class="flex rounded-lg bg-[#0f0f0f] p-0.5 ring-1 ring-white/[0.07]"
			role="tablist"
		>
			<button
				type="button"
				role="tab"
				aria-selected={$topTab === 'editor'}
				class="rounded-md px-4 py-1.5 text-[13px] font-medium transition {$topTab === 'editor'
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
				class="rounded-md px-3 py-1.5 text-[13px] font-medium transition {$topTab === 'templates'
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
				class="rounded-md px-3 py-1.5 text-[13px] font-medium transition {$topTab === 'creations'
					? 'bg-[#2a2a2a] text-white shadow-sm'
					: 'text-zinc-500 hover:text-zinc-300'}"
				onclick={() => topTab.set('creations')}
			>
				Mis creaciones
			</button>
		</div>
	</div>

	<div class="flex min-w-0 items-center justify-end gap-2">
		{#if $topTab === 'editor'}
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-transparent px-3 py-2 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.04]"
				onclick={runSaveToGallery}
				title="Guardar vista en Mis creaciones"
			>
				<ImagePlus class="size-4 text-zinc-400" strokeWidth={1.75} />
				Guardar
			</button>
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-transparent px-3.5 py-2 text-[13px] font-medium text-zinc-300 transition hover:bg-white/[0.04]"
				onclick={runSnapforgeCopy}
			>
				<Copy class="size-4 text-zinc-400" strokeWidth={1.75} />
				Copy
			</button>
			<button
				type="button"
				class="flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-[#0c0c0c] shadow-sm transition hover:brightness-105"
				style="background: linear-gradient(180deg, #8fd4f0 0%, #7ec8e3 100%);"
				onclick={runSnapforgeExport}
			>
				<Download class="size-4" strokeWidth={2.25} />
				Export
			</button>
		{/if}
	</div>
</header>
