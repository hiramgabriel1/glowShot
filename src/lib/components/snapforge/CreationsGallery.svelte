<script lang="ts">
	import { onMount } from 'svelte';
	import { Pencil, Trash2, X } from 'lucide-svelte';
	import { creations, openCreationInEditor } from '$lib/stores/creations';
	import type { Creation } from '$lib/stores/creations';
	import { toast } from '$lib/stores/toast';
	import {
		deletePhotoOnApi,
		fetchPhotoGalleryFromApi
	} from '$lib/snapforge/fetch-photo-gallery';

	let preview = $state<Creation | null>(null);

	let status = $state<'loading' | 'ok' | 'error'>('loading');
	let remote = $state<Creation[]>([]);

	/** Misma foto con URL pública vs firmada: deduplicar por key en el path S3. */
	function s3ObjectKeyFromImageUrl(u: string): string | null {
		try {
			if (!u.startsWith('http://') && !u.startsWith('https://')) return null;
			const { pathname } = new URL(u);
			if (!pathname || pathname === '/') return null;
			return pathname.startsWith('/') ? pathname.slice(1) : pathname;
		} catch {
			return null;
		}
	}

	function mergeGallery(remoteList: Creation[], localList: Creation[]): Creation[] {
		const remoteKeys = new Set<string>();
		for (const r of remoteList) {
			if (r.s3Key) remoteKeys.add(r.s3Key);
			const fromUrl = s3ObjectKeyFromImageUrl(r.imageDataUrl);
			if (fromUrl) remoteKeys.add(fromUrl);
		}
		const extra = localList.filter((c) => {
			if (c.imageDataUrl.startsWith('data:')) return true;
			const k = c.s3Key ?? s3ObjectKeyFromImageUrl(c.imageDataUrl);
			if (k && remoteKeys.has(k)) return false;
			return true;
		});
		const merged = [...remoteList, ...extra];
		merged.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
		return merged;
	}

	let displayItems = $derived.by(() => {
		if (status === 'error') return $creations;
		if (status === 'loading') return [];
		return mergeGallery(remote, $creations);
	});

	async function loadRemote() {
		status = 'loading';
		try {
			remote = await fetchPhotoGalleryFromApi();
			status = 'ok';
		} catch {
			status = 'error';
			remote = [];
		}
	}

	onMount(() => {
		void loadRemote();
	});

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleString(undefined, {
				dateStyle: 'medium',
				timeStyle: 'short'
			});
		} catch {
			return iso;
		}
	}

	function previewKeydown(e: KeyboardEvent) {
		if (preview === null || e.key !== 'Escape') return;
		preview = null;
	}

	async function editCreation(c: Creation, e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		try {
			await openCreationInEditor(c);
			preview = null;
			toast.success('Creación abierta en el editor');
		} catch {
			toast.error('No se pudo abrir en el editor');
		}
	}

	async function removeCreation(c: Creation, e: MouseEvent) {
		e.stopPropagation();
		e.preventDefault();
		try {
			if (c.s3Key) {
				await deletePhotoOnApi(c.s3Key);
				await loadRemote();
			} else {
				creations.remove(c.id);
			}
			if (preview?.id === c.id) preview = null;
		} catch {
			toast.error('No se pudo eliminar');
		}
	}
</script>

<svelte:window onkeydown={previewKeydown} />

<div
	class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#141414]"
	role="region"
	aria-label="Mis creaciones"
>
	<div class="border-b border-white/[0.06] px-4 py-3 sm:px-6 sm:py-4">
		<h2 class="text-lg font-semibold text-white">Mis creaciones</h2>
		<p class="mt-1 text-[13px] text-zinc-500">
			{#if status === 'ok'}
				Listado desde la nube; las miniaturas solo en este dispositivo se muestran junto a ellas.
			{:else if status === 'error'}
				No se pudo listar el bucket; mostrando solo lo guardado en este dispositivo.
			{:else}
				Cargando galería…
			{/if}
		</p>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
		{#if status === 'loading'}
			<div
				class="flex flex-col items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-[#1a1a1a]/50 py-20 text-center"
			>
				<p class="text-[15px] text-zinc-400">Cargando fotos…</p>
			</div>
		{:else if displayItems.length === 0}
			<div
				class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-[#1a1a1a]/50 py-20 text-center"
			>
				<p class="text-[15px] text-zinc-400">Aún no hay creaciones guardadas.</p>
				<p class="max-w-sm text-[13px] text-zinc-500">
					Vuelve al editor, diseña tu mockup y pulsa <span class="text-zinc-300">Guardar</span> en la
					barra superior.
				</p>
			</div>
		{:else}
			<div
				class="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 min-[640px]:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
			>
				{#each displayItems as c (c.id)}
					<article
						class="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#1a1a1a] shadow-sm transition hover:border-white/15"
					>
						<button
							type="button"
							class="block w-full text-left"
							onclick={() => (preview = c)}
						>
							<div
								class="flex aspect-video w-full items-center justify-center overflow-hidden bg-[#0f0f0f]"
							>
								<img
									src={c.imageDataUrl}
									alt=""
									class="max-h-full max-w-full object-contain transition group-hover:scale-[1.02]"
									loading="lazy"
									decoding="async"
									referrerpolicy="no-referrer"
								/>
							</div>
							<div class="p-2.5">
								<p class="truncate text-[13px] font-medium text-zinc-200">{c.name}</p>
								<p class="truncate text-[11px] text-zinc-500">{formatDate(c.createdAt)}</p>
							</div>
						</button>
						<div
							class="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100"
						>
							<button
								type="button"
								class="rounded-lg bg-black/60 p-1.5 text-zinc-300 backdrop-blur-sm transition hover:bg-sky-500/85 hover:text-white"
								aria-label="Editar en el editor"
								title="Editar en el editor"
								onclick={(e) => void editCreation(c, e)}
							>
								<Pencil class="size-4" strokeWidth={2} />
							</button>
							<button
								type="button"
								class="rounded-lg bg-black/60 p-1.5 text-zinc-300 backdrop-blur-sm transition hover:bg-red-500/80 hover:text-white"
								aria-label="Eliminar creación"
								title="Eliminar"
								onclick={(e) => void removeCreation(c, e)}
							>
								<Trash2 class="size-4" strokeWidth={2} />
							</button>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if preview}
	<div class="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Vista previa">
		<button
			type="button"
			class="absolute inset-0 bg-black/80 backdrop-blur-sm"
			aria-label="Cerrar vista previa"
			onclick={() => (preview = null)}
		></button>
		<div
			class="pointer-events-none absolute inset-0 flex items-center justify-center p-4"
		>
			<div
				class="pointer-events-auto relative max-h-[90vh] max-w-[min(96vw,1200px)] overflow-auto rounded-2xl border border-white/10 bg-[#1a1a1a] p-2 shadow-2xl"
			>
				<button
					type="button"
					class="absolute right-3 top-3 z-10 rounded-lg bg-black/70 p-2 text-white backdrop-blur-sm hover:bg-black/90"
					aria-label="Cerrar"
					onclick={() => (preview = null)}
				>
					<X class="size-5" />
				</button>
				<button
					type="button"
					class="absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-sky-600/90 px-3 py-2 text-[13px] font-medium text-white shadow-lg backdrop-blur-sm transition hover:bg-sky-500"
					onclick={(e) => preview && void editCreation(preview, e)}
				>
					<Pencil class="size-4 shrink-0" strokeWidth={2} />
					Editar en el editor
				</button>
				<div class="flex max-h-[85vh] w-full items-center justify-center overflow-auto rounded-lg bg-[#0f0f0f]">
					<img
						src={preview.imageDataUrl}
						alt=""
						class="max-h-[85vh] w-auto max-w-full object-contain"
						referrerpolicy="no-referrer"
					/>
				</div>
				<p class="px-2 pb-2 pt-3 text-center text-[13px] text-zinc-400">{preview.name}</p>
			</div>
		</div>
	</div>
{/if}
