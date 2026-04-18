<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import AppHeader from '$lib/components/snapforge/AppHeader.svelte';
	import CreationsGallery from '$lib/components/snapforge/CreationsGallery.svelte';
	import EditorCanvas from '$lib/components/snapforge/EditorCanvas.svelte';
	import LeftTools from '$lib/components/snapforge/LeftTools.svelte';
	import RightPanel from '$lib/components/snapforge/RightPanel.svelte';
	import TemplatesPlaceholder from '$lib/components/snapforge/TemplatesPlaceholder.svelte';
	import {
		leftSidebarExpanded,
		rightSidebarExpanded,
		topTab
	} from '$lib/stores/editor';

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

<div class="flex h-screen min-h-0 flex-col overflow-hidden bg-[#121212] text-zinc-200">
	<AppHeader />
	<div class="flex min-h-0 min-w-0 flex-1">
		{#if $topTab === 'editor'}
			<LeftTools />
			<EditorCanvas />
			<RightPanel />
		{:else if $topTab === 'creations'}
			<CreationsGallery />
		{:else}
			<TemplatesPlaceholder />
		{/if}
	</div>
</div>
