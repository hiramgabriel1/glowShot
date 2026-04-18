<script lang="ts">
	import AppHeader from '$lib/components/snapforge/AppHeader.svelte';
	import CreationsGallery from '$lib/components/snapforge/CreationsGallery.svelte';
	import EditorCanvas from '$lib/components/snapforge/EditorCanvas.svelte';
	import LeftTools from '$lib/components/snapforge/LeftTools.svelte';
	import RightPanel from '$lib/components/snapforge/RightPanel.svelte';
	import TemplatesPlaceholder from '$lib/components/snapforge/TemplatesPlaceholder.svelte';
	import { topTab } from '$lib/stores/editor';
</script>

<div class="flex h-screen min-h-0 flex-col overflow-hidden bg-[#121212] text-zinc-200">
	<AppHeader />
	<div class="flex min-h-0 flex-1">
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
