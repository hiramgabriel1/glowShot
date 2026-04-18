<script lang="ts">
	import {
		Code2,
		Image as ImageIcon,
		LayoutGrid,
		Monitor,
		Palette,
		Settings,
		Share2,
		Sparkles,
		Stamp,
		ChevronLeft,
		User
	} from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { activeTool, leftSidebarExpanded } from '$lib/stores/editor';

	const tools = [
		{ id: 'canvas', label: 'Canvas', Icon: LayoutGrid },
		{ id: 'remove-bg', label: 'Remove BG', Icon: Sparkles, badge: 'AI' },
		{ id: 'mockups', label: 'Mockups', Icon: Monitor },
		{ id: 'background', label: 'Background', Icon: Palette },
		{ id: 'watermark', label: 'Watermark', Icon: Stamp }
	] as const;

	const presets = [
		{ id: 'social', label: 'Social Post', Icon: Share2 },
		{ id: 'dribbble', label: 'Dribbble Shot', Icon: ImageIcon },
		{ id: 'code', label: 'Code Snippet', Icon: Code2 }
	] as const;
</script>

{#if $leftSidebarExpanded}
	<aside
		class="relative z-10 flex h-full min-h-0 w-[clamp(200px,26vw,228px)] max-w-[min(90vw,280px)] shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#111111]"
		transition:fly={{ x: -20, duration: 200 }}
	>
		<div
			class="flex shrink-0 items-center border-b border-white/[0.06] bg-[#111111] px-2 py-2"
		>
			<button
				type="button"
				class="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
				title="Ocultar herramientas ( [ · Ctrl/Cmd+B )"
				aria-label="Ocultar panel de herramientas"
				onclick={() => leftSidebarExpanded.set(false)}
			>
				<ChevronLeft class="size-[18px]" strokeWidth={2} />
			</button>
		</div>

		<div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden px-3 py-4">
			<div>
				<p class="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
					Tools
				</p>
				<nav class="flex flex-col gap-0.5">
					{#each tools as t}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-[13px] transition {$activeTool ===
							t.id
								? 'bg-[#1e2433] text-[#89b4fa]'
								: 'text-[#999999] hover:bg-white/[0.04] hover:text-zinc-200'}"
							onclick={() => activeTool.set(t.id)}
						>
							<span
								class="flex size-9 shrink-0 items-center justify-center rounded-lg {$activeTool ===
								t.id
									? 'bg-[#89b4fa]/15 text-[#89b4fa]'
									: 'bg-white/[0.05] text-zinc-500'}"
							>
								<t.Icon class="size-[17px]" strokeWidth={1.75} />
							</span>
							<span class="min-w-0 font-medium">{t.label}</span>
							{#if 'badge' in t && t.badge}
								<span
									class="ml-auto shrink-0 rounded bg-[#5e35b1]/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/95"
									>{t.badge}</span
								>
							{/if}
						</button>
					{/each}
				</nav>
			</div>

			<div>
				<p class="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
					Smart Presets
				</p>
				<div class="flex flex-col gap-0.5">
					{#each presets as p}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-[13px] font-medium text-[#999999] transition hover:bg-white/[0.04] hover:text-zinc-200"
						>
							<span
								class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-zinc-500"
							>
								<p.Icon class="size-[17px]" strokeWidth={1.75} />
							</span>
							<span class="min-w-0">{p.label}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div
			class="flex shrink-0 items-stretch gap-1 border-t border-white/[0.06] px-2 py-2"
		>
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
				title="Ajustes"
				aria-label="Ajustes"
			>
				<Settings class="size-[18px] shrink-0" strokeWidth={1.75} />
				<span class="hidden text-[12px] font-medium sm:inline">Ajustes</span>
			</button>
			<button
				type="button"
				class="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
				title="Perfil"
				aria-label="Perfil"
			>
				<User class="size-[18px] shrink-0" strokeWidth={1.75} />
				<span class="hidden text-[12px] font-medium sm:inline">Perfil</span>
			</button>
		</div>
	</aside>
{:else}
	<div
		class="relative z-10 flex h-full w-12 shrink-0 flex-col items-center border-r border-white/[0.06] bg-[#111111] py-3"
		in:fly={{ x: -12, duration: 200 }}
		out:fly={{ x: -12, duration: 180 }}
	>
		<button
			type="button"
			class="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
			title="Mostrar herramientas ( [ · Ctrl/Cmd+B )"
			aria-label="Mostrar panel de herramientas"
			onclick={() => leftSidebarExpanded.set(true)}
		>
			<LayoutGrid class="size-[20px]" strokeWidth={2} />
		</button>
		<div class="min-h-2 flex-1"></div>
		<button
			type="button"
			class="rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
			title="Ajustes"
			aria-label="Ajustes"
		>
			<Settings class="size-[20px]" strokeWidth={2} />
		</button>
		<button
			type="button"
			class="mt-1 rounded-lg p-2 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-300"
			title="Perfil"
			aria-label="Perfil"
		>
			<User class="size-[20px]" strokeWidth={2} />
		</button>
	</div>
{/if}
