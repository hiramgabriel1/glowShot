<script lang="ts">
	import { ChevronRight, SlidersHorizontal } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import {
		applyAspect,
		aspectRatio,
		backgroundEnabled,
		backgroundTab,
		frameHeight,
		frameWidth,
		gradientIndex,
		importedImageDataUrl,
		mockupBorderRadius,
		mockupEnabled,
		mockupPlatform,
		mockupTheme,
		outerRadius,
		padding,
		rightSidebarExpanded,
		GRADIENT_PRESETS,
		shadowEnabled,
		shadowIntensity
	} from '$lib/stores/editor';
	import type { AspectKey, BgTab, MockupPlatform } from '$lib/stores/editor';

	function segAspect(key: AspectKey) {
		aspectRatio.set(key);
		applyAspect(key);
	}
</script>

{#if $rightSidebarExpanded}
	<aside
		class="flex h-full min-w-[300px] w-[320px] max-w-[min(100vw,360px)] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-l border-white/[0.06] bg-[#151515]"
		transition:fly={{ x: 20, duration: 200 }}
	>
		<div
			class="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] bg-[#151515] px-3 py-2.5"
		>
			<span class="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
				Propiedades
			</span>
			<button
				type="button"
				class="shrink-0 rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
				title="Ocultar panel"
				aria-label="Ocultar panel de propiedades"
				onclick={() => rightSidebarExpanded.set(false)}
			>
				<ChevronRight class="size-[18px]" strokeWidth={2} />
			</button>
		</div>

	<!-- Frame & Layout -->
	<section class="border-b border-white/[0.06] p-4">
		<h3
			class="mb-3 text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-zinc-500 break-words"
		>
			Frame & Layout
		</h3>
		<p class="mb-3 font-mono text-[13px] text-zinc-300">
			{$frameWidth}
			<span class="text-zinc-600">×</span>
			{$frameHeight}
		</p>
		<div class="mb-4 flex flex-wrap gap-1.5">
			{#each ['auto', '16:9', '4:3', '1:1'] as k}
				<button
					type="button"
					class="rounded-md px-2.5 py-1.5 text-[11px] font-medium {$aspectRatio === k
						? 'bg-[#2c2c2c] text-white ring-1 ring-white/10'
						: 'bg-[#1f1f1f] text-zinc-500 hover:text-zinc-300'}"
					onclick={() => segAspect(k as AspectKey)}
				>
					{k === '16:9' ? '16:9' : k === '4:3' ? '4:3' : k === '1:1' ? '1:1' : 'Auto'}
				</button>
			{/each}
		</div>
		<div class="flex items-center gap-3">
			<span class="w-14 shrink-0 text-[12px] text-zinc-500">Padding</span>
			<input
				type="range"
				class="sf-range min-w-0 flex-1"
				min="0"
				max="128"
				value={$padding}
				oninput={(e) => padding.set(Number(e.currentTarget.value))}
			/>
			<span class="w-7 text-right font-mono text-[12px] text-zinc-400">{$padding}</span>
		</div>
	</section>

	<!-- Mockup Style -->
	<section class="border-b border-white/[0.06] p-4">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h3
				class="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-zinc-500 break-words"
			>
				Mockup Style
			</h3>
			<button
				type="button"
				role="switch"
				aria-label="Toggle mockup style"
				aria-checked={$mockupEnabled}
				class="relative h-6 w-11 rounded-full transition {$mockupEnabled
					? 'bg-blue-500'
					: 'bg-zinc-700'}"
				onclick={() => {
					mockupEnabled.update((v) => {
						const next = !v;
						if (next) importedImageDataUrl.set(null);
						return next;
					});
				}}
			>
				<span
					class="absolute top-0.5 size-5 rounded-full bg-white shadow transition {$mockupEnabled
						? 'left-5'
						: 'left-0.5'}"
				></span>
			</button>
		</div>
		<div class="mb-3 flex rounded-lg bg-[#0f0f0f] p-0.5 ring-1 ring-white/[0.06]">
			{#each ['none', 'macos', 'windows'] as p}
				<button
					type="button"
					class="flex-1 rounded-md py-1.5 text-[11px] font-medium capitalize {$mockupPlatform ===
					p
						? 'bg-[#2a2a2a] text-white'
						: 'text-zinc-500 hover:text-zinc-300'}"
					onclick={() => mockupPlatform.set(p as MockupPlatform)}
				>
					{p === 'macos' ? 'macOS' : p}
				</button>
			{/each}
		</div>
		<p class="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">Theme</p>
		<div class="mb-4 flex rounded-lg bg-[#0f0f0f] p-0.5 ring-1 ring-white/[0.06]">
			<button
				type="button"
				class="flex-1 rounded-md py-1.5 text-[11px] font-medium {$mockupTheme === 'dark'
					? 'bg-[#2a2a2a] text-white'
					: 'text-zinc-500'}"
				onclick={() => mockupTheme.set('dark')}
			>
				Dark
			</button>
			<button
				type="button"
				class="flex-1 rounded-md py-1.5 text-[11px] font-medium {$mockupTheme === 'light'
					? 'bg-[#2a2a2a] text-white'
					: 'text-zinc-500'}"
				onclick={() => mockupTheme.set('light')}
			>
				Light
			</button>
		</div>
		<div class="flex items-center gap-3">
			<span class="w-24 shrink-0 text-[12px] text-zinc-500">Border Radius</span>
			<input
				type="range"
				class="sf-range min-w-0 flex-1"
				min="0"
				max="32"
				value={$mockupBorderRadius}
				oninput={(e) => mockupBorderRadius.set(Number(e.currentTarget.value))}
			/>
			<span class="w-7 text-right font-mono text-[12px] text-zinc-400">{$mockupBorderRadius}</span>
		</div>
	</section>

	<!-- Background -->
	<section class="border-b border-white/[0.06] p-4">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h3
				class="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-zinc-500 break-words"
			>
				Background
			</h3>
			<button
				type="button"
				role="switch"
				aria-label="Toggle background"
				aria-checked={$backgroundEnabled}
				class="relative h-6 w-11 rounded-full transition {$backgroundEnabled
					? 'bg-blue-500'
					: 'bg-zinc-700'}"
				onclick={() => backgroundEnabled.update((v) => !v)}
			>
				<span
					class="absolute top-0.5 size-5 rounded-full bg-white shadow transition {$backgroundEnabled
						? 'left-5'
						: 'left-0.5'}"
				></span>
			</button>
		</div>
		<div class="mb-3 flex flex-wrap gap-1">
			{#each ['solid', 'gradient', 'image', 'blur'] as tab}
				<button
					type="button"
					class="rounded-md px-2 py-1.5 text-[10px] font-medium capitalize {$backgroundTab ===
					tab
						? 'bg-[#2c2c2c] text-white ring-1 ring-white/10'
						: 'bg-transparent text-zinc-500 hover:text-zinc-300'}"
					onclick={() => backgroundTab.set(tab as BgTab)}
				>
					{tab}
				</button>
			{/each}
		</div>
		<div class="mb-3 grid grid-cols-4 gap-2">
			{#each GRADIENT_PRESETS as g, i}
				<button
					type="button"
					class="aspect-square rounded-full ring-2 ring-offset-2 ring-offset-[#151515] {$gradientIndex ===
					i
						? 'ring-blue-500'
						: 'ring-transparent hover:ring-white/20'}"
					style="background: {g};"
					aria-label="Gradient preset {i + 1}"
					onclick={() => gradientIndex.set(i)}
				></button>
			{/each}
			<button
				type="button"
				class="flex aspect-square items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-500 hover:border-zinc-500 hover:text-zinc-400"
				aria-label="Add gradient"
			>
				+
			</button>
		</div>
		<div class="flex items-center gap-3">
			<span class="w-24 shrink-0 text-[12px] text-zinc-500">Outer Radius</span>
			<input
				type="range"
				class="sf-range min-w-0 flex-1"
				min="0"
				max="48"
				value={$outerRadius}
				oninput={(e) => outerRadius.set(Number(e.currentTarget.value))}
			/>
			<span class="w-7 text-right font-mono text-[12px] text-zinc-400">{$outerRadius}</span>
		</div>
	</section>

	<!-- Shadow -->
	<section class="p-4">
		<div class="mb-3 flex items-center justify-between gap-2">
			<h3
				class="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-[0.12em] text-zinc-500 break-words"
			>
				Shadow
			</h3>
			<button
				type="button"
				role="switch"
				aria-label="Toggle shadow"
				aria-checked={$shadowEnabled}
				class="relative h-6 w-11 rounded-full transition {$shadowEnabled ? 'bg-blue-500' : 'bg-zinc-700'}"
				onclick={() => shadowEnabled.update((v) => !v)}
			>
				<span
					class="absolute top-0.5 size-5 rounded-full bg-white shadow transition {$shadowEnabled
						? 'left-5'
						: 'left-0.5'}"
				></span>
			</button>
		</div>
		<p class="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">Intensity</p>
		<input
			type="range"
			class="sf-range w-full"
			min="0"
			max="100"
			value={$shadowIntensity}
			oninput={(e) => shadowIntensity.set(Number(e.currentTarget.value))}
		/>
	</section>
	</aside>
{:else}
	<div
		class="flex h-full w-12 shrink-0 flex-col items-center border-l border-white/[0.06] bg-[#151515] py-3"
		in:fly={{ x: 12, duration: 200 }}
		out:fly={{ x: 12, duration: 180 }}
	>
		<button
			type="button"
			class="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
			title="Mostrar propiedades"
			aria-label="Mostrar panel de propiedades"
			onclick={() => rightSidebarExpanded.set(true)}
		>
			<SlidersHorizontal class="size-[20px]" strokeWidth={2} />
		</button>
	</div>
{/if}
