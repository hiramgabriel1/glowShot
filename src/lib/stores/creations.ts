import { get, writable } from 'svelte/store';

import { blobToDataUrl, captureFramePngBlob } from '$lib/export/save-frame-png';

const STORAGE_KEY = 'snapforge-creations-v1';
const MAX_ITEMS = 48;

export type Creation = {
	id: string;
	name: string;
	createdAt: string;
	/** PNG en data URL (miniatura ~640px lado mayor) */
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
	const imageDataUrl = await blobToDataUrl(new Blob([buf], { type: 'image/png' }));

	const list = get(creations);
	if (isDuplicateCreation(list, imageDataUrl, contentHash)) {
		return 'duplicate';
	}

	creations.add({
		id: crypto.randomUUID(),
		name: formatCreationName(),
		createdAt: new Date().toISOString(),
		imageDataUrl,
		contentHash
	});
	return 'added';
}
