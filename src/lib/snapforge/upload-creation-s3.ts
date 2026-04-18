/** Origen del backend con rutas `/api/*` (ej. `http://localhost:5173` en Tauri si el fetch relativo falla). Opcional: `.env` → `PUBLIC_UPLOAD_API_BASE`. */
function uploadApiUrl(): string {
	const raw = import.meta.env.PUBLIC_UPLOAD_API_BASE as string | undefined;
	const base = typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : '';
	if (base) return `${base}/api/photos/upload`;
	return '/api/photos/upload';
}

async function postUpload(fd: FormData): Promise<string | null> {
	try {
		const res = await fetch(uploadApiUrl(), { method: 'POST', body: fd });
		if (!res.ok) {
			const text = await res.text().catch(() => '');
			if (import.meta.env.DEV) {
				console.warn('[upload-creation-s3]', res.status, text.slice(0, 200));
			}
			return null;
		}
		const data = (await res.json()) as { url?: string };
		return typeof data.url === 'string' ? data.url : null;
	} catch (e) {
		if (import.meta.env.DEV) {
			console.warn('[upload-creation-s3] red', e);
		}
		return null;
	}
}

/**
 * Miniatura PNG del marco (Mis creaciones / nuevo proyecto).
 */
export async function tryUploadCreationPng(blob: Blob): Promise<string | null> {
	const fd = new FormData();
	fd.append('file', blob, 'creation.png');
	return postUpload(fd);
}

/**
 * Archivo de imagen importado por el usuario (mismo endpoint; extensión según tipo/nombre).
 */
export async function tryUploadImportedPhotoFile(file: File): Promise<string | null> {
	const fd = new FormData();
	fd.append('file', file, file.name || 'photo.png');
	return postUpload(fd);
}

/**
 * Data URL (p. ej. captura Tauri) → Blob y subida.
 */
export async function tryUploadDataUrlAsPhoto(dataUrl: string): Promise<string | null> {
	try {
		const res = await fetch(dataUrl);
		const blob = await res.blob();
		const name = dataUrl.includes('image/png') ? 'capture.png' : 'capture.jpg';
		const fd = new FormData();
		fd.append('file', blob, name);
		return postUpload(fd);
	} catch {
		return null;
	}
}
