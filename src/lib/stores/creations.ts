import { get, writable } from 'svelte/store';

import { blobToDataUrl, captureFramePngBlob } from '$lib/export/save-frame-png';
import { tryUploadCreationPng } from '$lib/snapforge/upload-creation-s3';
import {
	activeTool,
	aspectRatio,
	backgroundEnabled,
	frameHeight,
	frameWidth,
	importedFromGallerySnapshot,
	importedImageDataUrl,
	mockupEnabled,
	newProjectGeneration,
	orientationPresetIndex,
	padding,
	shadowEnabled,
	topTab
} from '$lib/stores/editor';

const STORAGE_KEY = 'snapforge-creations-v1';
const MAX_ITEMS = 48;

export type Creation = {
	id: string;
	name: string;
	createdAt: string;
	/**
	 * Vista en miniatura: data URL local o URL `https://` en S3 tras subida.
	 */
	imageDataUrl: string;
	/** SHA-256 del PNG (hex); ausente en datos guardados antes de esta versión */
	contentHash?: string;
};

function loadFromStorage(): Creation[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(x): x is Creation =>
				typeof x === 'object' &&
				x !== null &&
				'id' in x &&
				'name' in x &&
				'createdAt' in x &&
				'imageDataUrl' in x &&
				typeof (x as Creation).imageDataUrl === 'string' &&
				((x as Creation).imageDataUrl.startsWith('data:') ||
					(x as Creation).imageDataUrl.startsWith('http')) &&
				(!('contentHash' in x) ||
					(x as Creation).contentHash === undefined ||
					typeof (x as Creation).contentHash === 'string')
		);
	} catch {
		return [];
	}
}

function persist(list: Creation[]) {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch (e) {
		console.warn('[creations] no se pudo guardar (cuota o privado)', e);
	}
}

const inner = writable<Creation[]>(loadFromStorage());
inner.subscribe((list) => persist(list));

export const creations = {
	subscribe: inner.subscribe,
	add(item: Creation) {
		inner.update((list) => [item, ...list].slice(0, MAX_ITEMS));
	},
	remove(id: string) {
		inner.update((list) => list.filter((c) => c.id !== id));
	},
	clear() {
		inner.set([]);
	}
};

export function formatCreationName(): string {
	const d = new Date();
	return d.toLocaleString(undefined, {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', buffer);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function isDuplicateCreation(list: Creation[], imageDataUrl: string, contentHash: string): boolean {
	return list.some(
		(c) =>
			(c.contentHash != null && c.contentHash === contentHash) || c.imageDataUrl === imageDataUrl
	);
}

/** Captura el marco actual y lo añade a la galería (miniatura para no llenar localStorage). */
export async function saveFrameToCreations(
	frameEl: HTMLElement
): Promise<'added' | 'duplicate'> {
	const blob = await captureFramePngBlob(frameEl, {
		pixelRatio: 1,
		maxOutputSide: 640
	});
	const buf = await blob.arrayBuffer();
	const contentHash = await sha256Hex(buf);
	const dataUrlLocal = await blobToDataUrl(new Blob([buf], { type: 'image/png' }));

	const list = get(creations);
	if (isDuplicateCreation(list, dataUrlLocal, contentHash)) {
		return 'duplicate';
	}

	const remoteUrl = await tryUploadCreationPng(blob);
	const imageDataUrl = remoteUrl ?? dataUrlLocal;

	creations.add({
		id: crypto.randomUUID(),
		name: formatCreationName(),
		createdAt: new Date().toISOString(),
		imageDataUrl,
		contentHash
	});
	return 'added';
}

function loadImageDimensions(src: string): Promise<{ w: number; h: number }> {
	return new Promise((resolve, reject) => {
		if (typeof Image === 'undefined') {
			reject(new Error('no Image'));
			return;
		}
		const load = (withCors: boolean) => {
			const img = new Image();
			if (withCors && (src.startsWith('http://') || src.startsWith('https://'))) {
				img.crossOrigin = 'anonymous';
			}
			img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
			img.onerror = () => {
				if (withCors && (src.startsWith('http://') || src.startsWith('https://'))) {
					load(false);
				} else {
					reject(new Error('decode'));
				}
			};
			img.src = src;
		};
		load(true);
	});
}

function fitFrameSizeToImage(w: number, h: number, maxSide: number): { fw: number; fh: number } {
	if (w <= 0 || h <= 0) return { fw: 1200, fh: 675 };
	if (w >= h) {
		const fw = Math.min(w, maxSide);
		const fh = Math.round((fw * h) / w);
		return { fw, fh: Math.max(1, fh) };
	}
	const fh = Math.min(h, maxSide);
	const fw = Math.round((fh * w) / h);
	return { fw: Math.max(1, fw), fh };
}

/**
 * Abre una creación en el editor: la imagen guardada (miniatura) pasa al marco para seguir editando.
 * No se restaura el mockup ni capas; solo el PNG guardado.
 */
export async function openCreationInEditor(creation: Creation): Promise<void> {
	try {
		const { w, h } = await loadImageDimensions(creation.imageDataUrl);
		const { fw, fh } = fitFrameSizeToImage(w, h, 1200);
		frameWidth.set(fw);
		frameHeight.set(fh);
		aspectRatio.set('auto');
	} catch {
		/* se mantienen el ancho y alto actuales del editor */
	}

	importedFromGallerySnapshot.set(true);
	backgroundEnabled.set(false);
	padding.set(0);
	shadowEnabled.set(false);
	orientationPresetIndex.set(0);

	importedImageDataUrl.set(creation.imageDataUrl);
	mockupEnabled.set(false);
	activeTool.set('canvas');
	topTab.set('editor');
	newProjectGeneration.update((n) => n + 1);
}
