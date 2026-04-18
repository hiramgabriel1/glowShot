import { writable } from 'svelte/store';

export type AspectKey = 'auto' | '16:9' | '4:3' | '1:1';
export type BgTab = 'solid' | 'gradient' | 'image' | 'blur';
export type MockupPlatform = 'none' | 'macos' | 'windows';

export const activeTool = writable('canvas');
export const topTab = writable<
	'editor' | 'templates' | 'creations' | 'shareTemplates'
>('editor');
export const frameWidth = writable(1200);
export const frameHeight = writable(675);
export const aspectRatio = writable<AspectKey>('16:9');
export const padding = writable(64);
export const mockupEnabled = writable(true);

/** Imagen propia dentro del marco (data URL). Si existe, se muestra en lugar del mockup dashboard. */
export const importedImageDataUrl = writable<string | null>(null);
export const mockupPlatform = writable<MockupPlatform>('macos');
export const mockupTheme = writable<'dark' | 'light'>('dark');
export const mockupBorderRadius = writable(12);
export const backgroundEnabled = writable(true);
export const backgroundTab = writable<BgTab>('gradient');
export const gradientIndex = writable(0);
export const outerRadius = writable(24);
export const shadowEnabled = writable(true);
export const shadowIntensity = writable(52);
export const zoom = writable(85);

/** Right properties panel: expanded vs slim rail */
export const rightSidebarExpanded = writable(true);

/** Left tools panel: expanded vs slim rail */
export const leftSidebarExpanded = writable(true);

/**
 * Se incrementa en cada «nuevo proyecto» para que el lienzo resetee pan/herramientas locales.
 */
export const newProjectGeneration = writable(0);

/** Restablece el editor a valores por defecto (no borra Mis creaciones). */
export function startNewProject(): void {
	activeTool.set('canvas');
	frameWidth.set(1200);
	frameHeight.set(675);
	aspectRatio.set('16:9');
	padding.set(64);
	mockupEnabled.set(true);
	importedImageDataUrl.set(null);
	mockupPlatform.set('macos');
	mockupTheme.set('dark');
	mockupBorderRadius.set(12);
	backgroundEnabled.set(true);
	backgroundTab.set('gradient');
	gradientIndex.set(0);
	outerRadius.set(24);
	shadowEnabled.set(true);
	shadowIntensity.set(52);
	zoom.set(85);
	leftSidebarExpanded.set(true);
	rightSidebarExpanded.set(true);
	topTab.set('editor');
	newProjectGeneration.update((n) => n + 1);
}

/** Preset gradients (12 + selection matches reference UI) */
export const GRADIENT_PRESETS = [
	'linear-gradient(135deg, #a8d8ff 0%, #c9b4ff 45%, #ffb8d8 100%)',
	'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fad0c4 100%)',
	'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
	'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
	'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
	'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
	'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
	'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
	'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
	'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
	'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
	'linear-gradient(135deg, #89cff0 0%, #c471f5 50%, #f64f59 100%)'
];

export function applyAspect(key: AspectKey): void {
	switch (key) {
		case 'auto':
		case '16:9':
			frameWidth.set(1200);
			frameHeight.set(675);
			break;
		case '4:3':
			frameWidth.set(960);
			frameHeight.set(720);
			break;
		case '1:1':
			frameWidth.set(800);
			frameHeight.set(800);
			break;
	}
}
