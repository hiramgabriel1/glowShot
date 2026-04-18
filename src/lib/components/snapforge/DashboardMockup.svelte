<script lang="ts">
	import { TrendingUp } from 'lucide-svelte';

	let {
		borderRadius = 12,
		theme = 'dark',
		platform = 'macos'
	}: {
		borderRadius?: number;
		theme?: 'dark' | 'light';
		platform?: 'none' | 'macos' | 'windows';
	} = $props();

	const dark = $derived(theme === 'dark');
	const shell = $derived(
		dark
			? 'bg-[#1e1e1e] text-zinc-200 border-zinc-800/80'
			: 'bg-white text-zinc-800 border-zinc-200'
	);
	const navBg = $derived(dark ? 'bg-[#161616]' : 'bg-zinc-50');
	const cardBg = $derived(dark ? 'bg-[#252525] border-zinc-700/50' : 'bg-white border-zinc-200');
</script>

<div
	class="overflow-hidden border shadow-2xl {shell}"
	style="border-radius: {borderRadius}px;"
>
	{#if platform === 'macos'}
		<!-- Title bar -->
		<div
			class="flex h-9 items-center gap-2 border-b px-3 {dark
				? 'border-zinc-800/80 bg-[#2d2d2d]'
				: 'border-zinc-200 bg-zinc-100'}"
		>
			<div class="flex gap-1">
				<span class="size-2.5 rounded-full bg-[#ff5f57]"></span>
				<span class="size-2.5 rounded-full bg-[#febc2e]"></span>
				<span class="size-2.5 rounded-full bg-[#28c840]"></span>
			</div>
			<div
				class="mx-auto flex min-w-0 flex-1 max-w-[200px] items-center justify-center rounded-md px-2 py-0.5 text-[10px] {dark
					? 'bg-black/30 text-zinc-400'
					: 'bg-white text-zinc-500 shadow-sm'}"
			>
				localhost:3000
			</div>
		</div>
	{:else if platform === 'windows'}
		<div
			class="flex h-8 items-center justify-between border-b px-2 text-[10px] {dark
				? 'border-zinc-800 bg-[#2d2d2d] text-zinc-400'
				: 'border-zinc-200 bg-zinc-100 text-zinc-600'}"
		>
			<span>SAS Dashboard</span>
			<span class="opacity-60">□ ×</span>
		</div>
	{:else}
		<div class="h-2"></div>
	{/if}

	<div class="flex min-h-[200px]">
		<!-- App sidebar -->
		<aside
			class="w-[88px] shrink-0 border-r p-2.5 {navBg} {dark ? 'border-zinc-800/80' : 'border-zinc-200'}"
		>
			<p
				class="mb-2 truncate text-[8px] font-bold uppercase tracking-wide {dark
					? 'text-zinc-500'
					: 'text-zinc-400'}"
			>
				SAS Dashboard
			</p>
			<nav class="flex flex-col gap-0.5 text-[9px]">
				<span
					class="rounded px-1.5 py-1 font-medium {dark
						? 'bg-blue-500/20 text-blue-300'
						: 'bg-blue-100 text-blue-700'}"
					>Dashboard</span
				>
				<span class="rounded px-1.5 py-1 {dark ? 'text-zinc-500' : 'text-zinc-500'}">Analytics</span>
				<span class="rounded px-1.5 py-1 {dark ? 'text-zinc-500' : 'text-zinc-500'}">Projects</span>
				<span class="rounded px-1.5 py-1 {dark ? 'text-zinc-500' : 'text-zinc-500'}">Team</span>
				<span class="rounded px-1.5 py-1 {dark ? 'text-zinc-500' : 'text-zinc-500'}">Settings</span>
			</nav>
		</aside>

		<!-- Main -->
		<main class="min-w-0 flex-1 space-y-2 p-2.5 {dark ? 'bg-[#1a1a1a]' : 'bg-zinc-50'}">
			<!-- Overview -->
			<div class="rounded-lg border p-2.5 {cardBg}">
				<p class="mb-1 text-[8px] font-medium uppercase tracking-wide {dark ? 'text-zinc-500' : 'text-zinc-500'}">
					Overview
				</p>
				<div class="flex items-end justify-between gap-2">
					<div>
						<p class="text-[15px] font-bold leading-none {dark ? 'text-white' : 'text-zinc-900'}">
							Revenue: +12.5%
						</p>
						<p class="mt-0.5 text-[8px] {dark ? 'text-zinc-500' : 'text-zinc-500'}">vs last month</p>
					</div>
					<div
						class="flex size-8 items-center justify-center rounded-md {dark
							? 'bg-blue-500/20 text-blue-400'
							: 'bg-blue-100 text-blue-600'}"
					>
						<TrendingUp class="size-4" strokeWidth={2} />
					</div>
				</div>
			</div>

			<!-- Weekly Progress -->
			<div class="rounded-lg border p-2.5 {cardBg}">
				<p class="mb-2 text-[8px] font-medium uppercase tracking-wide {dark ? 'text-zinc-500' : 'text-zinc-500'}">
					Weekly Progress
				</p>
				<div class="mb-2 flex h-10 items-end gap-1">
					{#each [40, 65, 45, 80, 55, 70, 90] as h}
						<div
							class="flex-1 rounded-t bg-gradient-to-t from-blue-600 to-blue-400 opacity-90"
							style="height: {h}%"
						></div>
					{/each}
				</div>
				<p class="text-[9px] {dark ? 'text-zinc-400' : 'text-zinc-600'}">
					Tasks Completed: <span class="font-semibold {dark ? 'text-white' : 'text-zinc-900'}">75/100</span>
				</p>
			</div>

			<!-- Recent Activity -->
			<div class="rounded-lg border p-2.5 {cardBg}">
				<p class="mb-1.5 text-[8px] font-medium uppercase tracking-wide {dark ? 'text-zinc-500' : 'text-zinc-500'}">
					Recent Activity
				</p>
				<ul class="space-y-1 text-[8px] {dark ? 'text-zinc-400' : 'text-zinc-600'}">
					<li class="flex gap-1">
						<span class="text-blue-400">•</span> Project Alpha updated
					</li>
					<li class="flex gap-1">
						<span class="text-blue-400">•</span> New team member joined
					</li>
					<li class="flex gap-1">
						<span class="text-blue-400">•</span> Q4 report generated
					</li>
				</ul>
			</div>
		</main>
	</div>
</div>
