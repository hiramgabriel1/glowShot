<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AppHeader from '$lib/components/snapforge/AppHeader.svelte';
	import CreationsGallery from '$lib/components/snapforge/CreationsGallery.svelte';
	import EditorCanvas from '$lib/components/snapforge/EditorCanvas.svelte';
	import LeftTools from '$lib/components/snapforge/LeftTools.svelte';
	import RightPanel from '$lib/components/snapforge/RightPanel.svelte';
	import ShareTemplatesPanel from '$lib/components/snapforge/ShareTemplatesPanel.svelte';
	import TemplatesPlaceholder from '$lib/components/snapforge/TemplatesPlaceholder.svelte';
	import {
		leftSidebarExpanded,
		rightSidebarExpanded,
		topTab
	} from '$lib/stores/editor';

	function isTypingTarget(el: EventTarget | null): boolean {
		if (!(el instanceof HTMLElement)) return false;
		const tag = el.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
		if (el.isContentEditable) return true;
		return el.closest('[contenteditable="true"]') != null;
	}

	function onPanelShortcut(e: KeyboardEvent) {
		if ($topTab !== 'editor') return;
		if (e.repeat) return;
		if (isTypingTarget(e.target)) return;

		const mod = e.metaKey || e.ctrlKey;

		// [ — panel izquierdo (sin Cmd/Ctrl: evita chocar con Cmd+[ del navegador)
		if (e.key === '[' && !mod && !e.altKey) {
			e.preventDefault();
			leftSidebarExpanded.update((v) => !v);
			return;
		}

		// Cmd/Ctrl+B — herramientas (como barra lateral en editores)
		if ((e.key === 'b' || e.key === 'B') && mod && !e.shiftKey && !e.altKey) {
			e.preventDefault();
			leftSidebarExpanded.update((v) => !v);
			return;
		}

		// Cmd/Ctrl+L — propiedades
		if ((e.key === 'l' || e.key === 'L') && mod && !e.shiftKey && !e.altKey) {
			e.preventDefault();
			rightSidebarExpanded.update((v) => !v);
		}
	}

	onMount(() => {
		if (!browser) return;
		const mq = window.matchMedia('(max-width: 1100px)');
		const collapseSidebars = () => {
			if (mq.matches) {
				leftSidebarExpanded.set(false);
				rightSidebarExpanded.set(false);
			}
		};
		collapseSidebars();
		mq.addEventListener('change', collapseSidebars);
		return () => mq.removeEventListener('change', collapseSidebars);
	});
</script>

<svelte:window onkeydown={onPanelShortcut} />

<div class="flex h-screen min-h-0 flex-col overflow-hidden bg-[#121212] text-zinc-200">
	<AppHeader />
	<div class="flex min-h-0 min-w-0 flex-1 overflow-hidden">
		{#if $topTab === 'editor'}
			<LeftTools />
			<EditorCanvas />
			<RightPanel />
		{:else if $topTab === 'creations'}
			<CreationsGallery />
		{:else if $topTab === 'shareTemplates'}
			<ShareTemplatesPanel />
		{:else}
			<TemplatesPlaceholder />
		{/if}
	</div>
</div>
