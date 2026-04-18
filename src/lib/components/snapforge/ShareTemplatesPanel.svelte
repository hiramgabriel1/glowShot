<script lang="ts">
	import { Share2 } from 'lucide-svelte';
</script>

<div
	class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#141414]"
	role="region"
	aria-label="Compartir plantillas de diseño"
>
	<div class="border-b border-white/[0.06] px-4 py-3 sm:px-6 sm:py-4">
		<h2 class="text-lg font-semibold text-white">Compartir plantillas</h2>
		<p class="mt-1 text-[13px] text-zinc-500">
			Publica y comparte tus propios templates de diseño (marcos, fondos, mockups) para que otros
			puedan reutilizarlos.
		</p>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
		<div
			class="mx-auto flex max-w-lg flex-col items-center gap-5 rounded-2xl border border-dashed border-white/12 bg-[#1a1a1a]/40 px-6 py-12 text-center"
		>
			<div
				class="flex size-14 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.08]"
			>
				<Share2 class="size-7 text-zinc-400" strokeWidth={1.5} />
			</div>
			<div>
				<p class="text-[15px] font-medium text-zinc-200">Próximamente</p>
				<p class="mt-2 text-[13px] leading-relaxed text-zinc-500">
					Aquí podrás subir plantillas creadas en el editor, describirlas y compartir un enlace o
					un archivo para la comunidad.
				</p>
			</div>
			<ul class="w-full max-w-sm space-y-2.5 text-left text-[13px] text-zinc-500">
				<li class="flex gap-2">
					<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-400/80" aria-hidden="true"></span>
					<span
						>Exportar la configuración de tu escena (dimensiones, degradados, mockup…) como
						plantilla reutilizable.</span
					>
				</li>
				<li class="flex gap-2">
					<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-400/80" aria-hidden="true"></span>
					<span>Ver plantillas de otros creadores e importarlas en tu editor.</span>
				</li>
			</ul>
		</div>
	</div>
</div>
