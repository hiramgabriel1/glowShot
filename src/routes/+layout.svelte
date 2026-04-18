<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import '../app.css';
	import ToastRegion from '$lib/components/ToastRegion.svelte';
	import {
		importedFromGallerySnapshot,
		importedImageDataUrl,
		mockupEnabled,
		topTab
	} from '$lib/stores/editor';
	import { runNewProjectFlow } from '$lib/snapforge/new-project-flow';
	import { toast } from '$lib/stores/toast';

	let { children } = $props();

	onMount(() => {
		if (!browser) return;

		const task = (async () => {
			const { isTauri } = await import('@tauri-apps/api/core');
			if (!isTauri()) return [];
			const { listen } = await import('@tauri-apps/api/event');

			return Promise.all([
				listen<{ dataUrl: string }>('snap-import', (e) => {
					const url = e.payload?.dataUrl;
					if (typeof url === 'string' && url.startsWith('data:image')) {
						importedFromGallerySnapshot.set(false);
						importedImageDataUrl.set(url);
						mockupEnabled.set(false);
						topTab.set('editor');
						toast.success('Captura lista en el marco');
					}
				}),
				listen('snap-select-unavailable', () => {
					toast.info(
						'Selección de captura solo está disponible en macOS (app de escritorio).'
					);
				}),
				listen('new-project-request', () => {
					runNewProjectFlow();
				})
			]);
		})();

		return () => {
			void task.then((unsubs) => unsubs?.forEach((u) => u()));
		};
	});
</script>

<svelte:head>
	<title>GlowShot</title>
	<link rel="icon" href="/icono.png" type="image/png" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
<ToastRegion />
