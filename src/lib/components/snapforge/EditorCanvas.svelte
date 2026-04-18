<script lang="ts">
	import { get } from 'svelte/store';
	import { Hand, Home, ImagePlus, Minus, Plus, RotateCcw, Upload } from 'lucide-svelte';
	import { setSnapforgeExportFrame } from '$lib/snapforge/clipboard-bridge';
	import { saveFrameToCreations } from '$lib/stores/creations';
	import { toast } from '$lib/stores/toast';
	import { errorMessage } from '$lib/utils/error-message';
	import { readImageFileAsDataUrl } from '$lib/utils/read-image-file';
	import DashboardMockup from './DashboardMockup.svelte';
	import {
		ORIENTATION_PRESETS,
		orientationCssTransform
	} from '$lib/snapforge/orientation-presets';
	import {
		backgroundEnabled,
		GRADIENT_PRESETS,
		gradientIndex,
		frameHeight,
		frameWidth,
		importedFromGallerySnapshot,
		importedImageDataUrl,
		mockupBorderRadius,
		mockupEnabled,
		mockupPlatform,
		mockupTheme,
		orientationPresetIndex,
		outerRadius,
		padding,
		shadowEnabled,
		shadowIntensity,
		newProjectGeneration,
		newProjectIntent,
		startNewProjectEmptyImport,
		zoom
	} from '$lib/stores/editor';

	const ZOOM_MIN = 25;
	const ZOOM_MAX = 150;

	function clampZoom(n: number): number {
		return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(n)));
	}

	function zoomIn() {
		zoom.update((z) => clampZoom(z + 5));
	}
	function zoomOut() {
		zoom.update((z) => clampZoom(z - 5));
	}

	let zoomDraft = $state(String(get(zoom)));
	let zoomFocused = $state(false);

	$effect(() => {
		const z = $zoom;
		if (!zoomFocused) zoomDraft = String(z);
	});

	function commitZoomInput() {
		const raw = zoomDraft.replace(/[^\d]/g, '');
		const n = parseInt(raw, 10);
		if (raw !== '' && Number.isFinite(n)) {
			zoom.set(clampZoom(n));
		}
		zoomDraft = String(get(zoom));
		zoomFocused = false;
	}

	function onZoomFocus(ev: FocusEvent & { currentTarget: HTMLInputElement }) {
		zoomFocused = true;
		requestAnimationFrame(() => ev.currentTarget.select());
	}

	const bgStyle = $derived(
		$backgroundEnabled ? GRADIENT_PRESETS[$gradientIndex] ?? GRADIENT_PRESETS[0] : '#2a2a2a'
	);

	const frameShadow = $derived.by(() => {
		if (!$shadowEnabled) return 'none';
		const s = ($shadowIntensity / 100) * 48;
		return `0 ${s * 0.35}px ${s}px rgba(0,0,0,0.55), 0 ${s * 0.15}px ${s * 0.5}px rgba(0,0,0,0.35)`;
	});

	const orientationTransform = $derived.by(() => {
		const i = Math.min(
			Math.max(0, $orientationPresetIndex),
			ORIENTATION_PRESETS.length - 1
		);
		return orientationCssTransform(ORIENTATION_PRESETS[i]);
	});

	/** Nodo raíz del marco con zoom + vista 3D (export / copiar / Mis creaciones). */
	let frameCaptureRoot = $state<HTMLElement | undefined>();

	$effect(() => {
		setSnapforgeExportFrame(frameCaptureRoot ?? null);
		return () => setSnapforgeExportFrame(null);
	});

	let lastHandledNewProjectIntent = 0;
	$effect(() => {
		const id = $newProjectIntent;
		if (id <= lastHandledNewProjectIntent) return;
		lastHandledNewProjectIntent = id;
		void runNewProjectAfterConfirm();
	});

	async function runNewProjectAfterConfirm() {
		try {
			if (frameCaptureRoot) {
				const result = await saveFrameToCreations(frameCaptureRoot);
				startNewProjectEmptyImport();
				if (result === 'added') {
					toast.success('Guardado en Mis creaciones. Marco vacío: importa una foto.');
				} else {
					toast.info('Ya estaba en Mis creaciones. Marco vacío para importar.');
				}
			} else {
				startNewProjectEmptyImport();
				toast.success('Marco vacío: importa una foto.');
			}
		} catch (err) {
			console.error(err);
			toast.error(errorMessage(err) || 'No se pudo guardar antes de empezar');
		}
	}

	/** Solo con la herramienta «mano» activa se puede arrastrar el fondo. */
	let handToolActive = $state(false);

	/** Pan en píxeles de pantalla (área vacía detrás del marco). */
	let panX = $state(0);
	let panY = $state(0);
	let panDragging = $state(false);
	let panRef = $state<{ x: number; y: number; px: number; py: number } | null>(null);

	$effect(() => {
		if (!handToolActive) {
			panDragging = false;
			panRef = null;
		}
	});

	function onPanDown(e: PointerEvent) {
		if (!handToolActive) return;
		if (e.button !== 0) return;
		e.preventDefault();
		panDragging = true;
		panRef = { x: e.clientX, y: e.clientY, px: panX, py: panY };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function onPanMove(e: PointerEvent) {
		if (!panDragging || !panRef) return;
		panX = panRef.px + (e.clientX - panRef.x);
		panY = panRef.py + (e.clientY - panRef.y);
	}

	function onPanUp(e: PointerEvent) {
		if (!panDragging) return;
		panDragging = false;
		panRef = null;
		try {
			(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		} catch {
			/* noop */
		}
	}

	function resetPan() {
		panX = 0;
		panY = 0;
	}

	function toggleHandTool() {
		handToolActive = !handToolActive;
	}

	let startOverOpen = $state(false);
	let importInputEl = $state<HTMLInputElement | undefined>();
	let emptyDropActive = $state(false);

	$effect(() => {
		$newProjectGeneration;
		panX = 0;
		panY = 0;
		handToolActive = false;
		panDragging = false;
		panRef = null;
		startOverOpen = false;
	});

	async function applyImageFile(file: File) {
		try {
			const url = await readImageFileAsDataUrl(file);
			importedFromGallerySnapshot.set(false);
			importedImageDataUrl.set(url);
			mockupEnabled.set(false);
			toast.success('Imagen añadida al marco');
		} catch (err) {
			toast.error(errorMessage(err) || 'No se pudo cargar la imagen');
		}
	}

	function onImportInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const f = input.files?.[0];
		input.value = '';
		if (f) void applyImageFile(f);
	}

	function onFrameDragOver(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
		if (!get(importedImageDataUrl) && !get(mockupEnabled)) emptyDropActive = true;
	}

	function onFrameDragLeave(e: DragEvent) {
		const el = e.currentTarget as HTMLElement;
		if (!el.contains(e.relatedTarget as Node | null)) emptyDropActive = false;
	}

	async function onFrameDrop(e: DragEvent) {
		e.preventDefault();
		emptyDropActive = false;
		const f = e.dataTransfer?.files?.[0];
		if (f) await applyImageFile(f);
	}

	function clearFrameToEmpty() {
		importedFromGallerySnapshot.set(false);
		importedImageDataUrl.set(null);
		mockupEnabled.set(false);
		panX = 0;
		panY = 0;
		handToolActive = false;
	}

	function openStartOver() {
		startOverOpen = true;
	}

	function closeStartOver() {
		startOverOpen = false;
	}

	async function startOverWithSave() {
		if (!frameCaptureRoot) {
			closeStartOver();
			clearFrameToEmpty();
			toast.info('Marco vaciado');
			return;
		}
		try {
			const result = await saveFrameToCreations(frameCaptureRoot);
			closeStartOver();
			clearFrameToEmpty();
			if (result === 'added') {
				toast.success('Guardado en Mis creaciones. Marco vaciado.');
			} else {
				toast.info('Ya estaba en Mis creaciones. Marco vaciado.');
			}
		} catch (err) {
			console.error(err);
			toast.error(errorMessage(err) || 'No se pudo guardar');
			closeStartOver();
		}
	}

	function startOverWithoutSave() {
		closeStartOver();
		clearFrameToEmpty();
		toast.info('Marco vaciado');
	}

	function triggerImport() {
		importInputEl?.click();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape' && startOverOpen) {
			closeStartOver();
			return;
		}
		if (e.key === 'Escape' && handToolActive) {
			handToolActive = false;
		}
	}}
/>

<div
	class="relative isolate z-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#141414]"
>
	<!-- Dot grid -->
	<div
		class="pointer-events-none absolute inset-0 opacity-90"
		style="background-image: radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px); background-size: 18px 18px;"
	></div>

	<div class="relative min-h-0 min-w-0 flex-1 overflow-hidden pb-20">
		<div
			class="absolute inset-0 z-[5] touch-none select-none"
			class:pointer-events-none={!handToolActive}
			class:cursor-grab={handToolActive && !panDragging}
			class:cursor-grabbing={handToolActive && panDragging}
			onpointerdown={onPanDown}
			onpointermove={onPanMove}
			onpointerup={onPanUp}
			onpointercancel={onPanUp}
			role="presentation"
			aria-hidden="true"
		></div>

		<div
			class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-visible p-8"
		>
			<div
				class="pointer-events-none will-change-transform"
				class:transition-transform={!panDragging}
				class:duration-150={!panDragging}
				class:ease-out={!panDragging}
				style="transform: translate({panX}px, {panY}px);"
			>
				<div
					class="flex items-center justify-center overflow-visible"
					style="perspective: 1400px; perspective-origin: 50% 50%;"
				>
					<div
						bind:this={frameCaptureRoot}
						class="origin-center will-change-transform [transform-style:preserve-3d] transition-[transform] duration-300 ease-out pointer-events-auto"
						style="transform: {orientationTransform} scale({$zoom / 100});"
					>
					<div
						class="relative flex min-h-0 w-full items-center justify-center {$importedFromGallerySnapshot
							? 'border border-white/[0.12] ring-1 ring-white/[0.06]'
							: 'border border-blue-500/45 shadow-2xl ring-1 ring-blue-400/20'}"
						style:width="{$frameWidth}px"
						style:height="{$frameHeight}px"
						style:border-radius="{$outerRadius}px"
						style:padding="{$padding}px"
						style:background={bgStyle}
						style:box-shadow={$importedFromGallerySnapshot ? 'none' : frameShadow}
					>
						<div
							class="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center overflow-hidden"
							ondragover={onFrameDragOver}
							ondragleave={onFrameDragLeave}
							ondrop={onFrameDrop}
							role="presentation"
						>
							{#if $importedImageDataUrl}
								<div
									class="flex h-full min-h-0 w-full items-center justify-center {$importedFromGallerySnapshot
										? 'min-h-0 overflow-hidden rounded-[inherit]'
										: ''}"
								>
									<img
										src={$importedImageDataUrl}
										class="max-h-full max-w-full object-contain select-none"
										alt=""
										draggable="false"
									/>
								</div>
							{:else if $mockupEnabled}
								<div class="flex h-full min-h-0 w-full items-center justify-center overflow-hidden">
									<div class="w-full max-w-[min(100%,420px)] shrink-0">
										<DashboardMockup
											borderRadius={$mockupBorderRadius}
											theme={$mockupTheme}
											platform={$mockupPlatform}
										/>
									</div>
								</div>
							{:else}
								<div
									class="flex min-h-[240px] w-full max-w-md flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center transition {emptyDropActive
										? 'border-sky-400/55 bg-sky-500/10'
										: 'border-white/12 bg-black/25'}"
									role="region"
									aria-label="Marco vacío"
								>
									<ImagePlus class="size-10 shrink-0 text-zinc-500" strokeWidth={1.5} />
									<div>
										<p class="text-[14px] font-medium text-zinc-300">Marco vacío</p>
										<p class="mt-1 text-[12px] text-zinc-500">
											Arrastra una imagen o usa Importar
										</p>
									</div>
									<button
										type="button"
										class="rounded-lg border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-medium text-zinc-200 transition hover:bg-white/10"
										onclick={triggerImport}
									>
										Importar imagen
									</button>
								</div>
							{/if}
						</div>
					</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Zoom bar -->
	<div
		class="absolute bottom-3 left-1/2 z-20 flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-full border border-white/[0.08] bg-[#1f1f1f]/95 px-1.5 py-1.5 shadow-lg backdrop-blur-sm sm:bottom-5 sm:max-w-[min(100vw-2rem,52rem)] sm:flex-nowrap sm:px-2"
	>
		<button
			type="button"
			class="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
			aria-label="Zoom out"
			onclick={zoomOut}
		>
			<Minus class="size-4" strokeWidth={2} />
		</button>
		<div class="flex items-center gap-0.5 px-0.5">
			<input
				type="text"
				inputmode="numeric"
				autocomplete="off"
				spellcheck="false"
				aria-label="Zoom porcentaje"
				title="Escribe un valor entre {ZOOM_MIN} y {ZOOM_MAX}"
				class="min-w-[2.25rem] max-w-[4rem] cursor-text rounded px-1.5 py-0.5 text-center font-mono text-[12px] font-medium tabular-nums text-zinc-200 outline-none transition placeholder:text-zinc-500 {zoomFocused
					? 'bg-sky-500/25 ring-1 ring-sky-400/45'
					: 'bg-transparent hover:bg-white/[0.06]'}"
				bind:value={zoomDraft}
				onfocus={onZoomFocus}
				onblur={commitZoomInput}
				onkeydown={(e) => {
					if (e.key === 'Enter') e.currentTarget.blur();
					if (e.key === 'Escape') {
						zoomDraft = String(get(zoom));
						e.currentTarget.blur();
					}
				}}
			/>
			<span class="select-none text-[12px] font-medium text-zinc-400">%</span>
		</div>
		<button
			type="button"
			class="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
			aria-label="Zoom in"
			onclick={zoomIn}
		>
			<Plus class="size-4" strokeWidth={2} />
		</button>
		<span class="mx-1 h-4 w-px bg-white/10"></span>
		<button
			type="button"
			class="rounded-md p-1.5 transition {handToolActive
				? 'bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/35'
				: 'text-zinc-400 hover:bg-white/10 hover:text-white'}"
			aria-label="Herramienta mano: arrastrar el lienzo por el fondo"
			aria-pressed={handToolActive}
			title="Mover el lienzo: arrastra el fondo oscuro (Esc para salir)"
			onclick={toggleHandTool}
		>
			<Hand class="size-4" strokeWidth={2} />
		</button>
		<button
			type="button"
			class="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
			aria-label="Volver a la posición inicial del diseño"
			title="Centrar de nuevo el diseño en el lienzo"
			onclick={resetPan}
		>
			<Home class="size-4" strokeWidth={2} />
		</button>
		<span class="mx-1 h-4 w-px bg-white/10"></span>
		<button
			type="button"
			class="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-amber-200/90"
			aria-label="Empezar de nuevo"
			title="Vaciar el marco (puedes guardar antes en Mis creaciones)"
			onclick={openStartOver}
		>
			<RotateCcw class="size-4" strokeWidth={2} />
		</button>
		<button
			type="button"
			class="rounded-md p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
			aria-label="Importar imagen al marco"
			title="Importar imagen (PNG, JPG, WebP…)"
			onclick={triggerImport}
		>
			<Upload class="size-4" strokeWidth={2} />
		</button>
		<input
			bind:this={importInputEl}
			type="file"
			class="sr-only"
			accept="image/*"
			tabindex="-1"
			aria-hidden="true"
			onchange={onImportInput}
		/>
	</div>

	{#if startOverOpen}
		<div
			class="fixed inset-0 z-[400] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="start-over-title"
		>
			<button
				type="button"
				class="absolute inset-0 cursor-default"
				aria-label="Cerrar"
				onclick={closeStartOver}
			></button>
			<div
				class="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1c1c] p-6 shadow-2xl"
			>
				<h2 id="start-over-title" class="text-lg font-semibold text-white">Empezar de nuevo</h2>
				<p class="mt-2 text-[13px] leading-relaxed text-zinc-400">
					Se vaciará el marco (imagen o mockup). ¿Quieres guardar antes una copia en Mis
					creaciones?
				</p>
				<div class="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
					<button
						type="button"
						class="order-3 rounded-lg px-4 py-2.5 text-[13px] font-medium text-zinc-400 transition hover:bg-white/[0.06] hover:text-white sm:order-1"
						onclick={closeStartOver}
					>
						Cancelar
					</button>
					<button
						type="button"
						class="order-2 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[13px] font-medium text-zinc-200 transition hover:bg-white/10 sm:order-2"
						onclick={startOverWithoutSave}
					>
						Vaciar sin guardar
					</button>
					<button
						type="button"
						class="order-1 rounded-lg px-4 py-2.5 text-[13px] font-semibold text-[#0c0c0c] shadow-sm transition hover:brightness-105 sm:order-3"
						style="background: linear-gradient(180deg, #8fd4f0 0%, #7ec8e3 100%);"
						onclick={() => void startOverWithSave()}
					>
						Guardar y vaciar
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
