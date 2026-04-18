import { tick } from 'svelte';

import { newProjectIntent, topTab } from '$lib/stores/editor';

export async function runNewProjectFlow(): Promise<void> {
	if (
		!confirm(
			'¿Empezar un proyecto nuevo? Se guardará la vista actual en «Mis creaciones» (si no es duplicada) y el marco quedará vacío para que importes una imagen.'
		)
	) {
		return;
	}
	topTab.set('editor');
	await tick();
	newProjectIntent.update((n) => n + 1);
}
