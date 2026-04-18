<script lang="ts">
	let {
		borderRadius = 12,
		theme = 'dark',
		platform = 'none'
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
	const contentBg = $derived(dark ? 'bg-[#1a1a1a]' : 'bg-zinc-50');
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
			<span class="truncate">GlowShot</span>
			<span class="shrink-0 opacity-60">□ ×</span>
		</div>
	{:else}
		<div class="h-2"></div>
	{/if}

	<div
		class="flex min-h-[200px] min-w-0 items-center justify-center border-t {dark
			? 'border-zinc-800/40'
			: 'border-zinc-200/80'} {contentBg}"
	>
		<div
			class="pointer-events-none mx-4 flex h-[min(240px,36vw)] w-full max-w-[min(100%,420px)] items-center justify-center rounded-lg border border-dashed {dark
				? 'border-white/[0.08] bg-black/20'
				: 'border-zinc-300/80 bg-white/50'}"
			aria-hidden="true"
		></div>
	</div>
</div>
