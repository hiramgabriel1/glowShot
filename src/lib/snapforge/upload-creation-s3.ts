/**
 * Intenta subir el PNG al API de SvelteKit (`/api/photos/upload`), que escribe en S3.
 * Devuelve la URL pública o `null` si no hay servidor / credenciales / error de red.
 *
 * No funciona en un despliegue 100% estático sin backend; en ese caso el guardado sigue siendo solo local (data URL).
 */
export async function tryUploadCreationPng(blob: Blob): Promise<string | null> {
	try {
		const fd = new FormData();
		fd.append('file', blob, 'creation.png');
		const res = await fetch('/api/photos/upload', { method: 'POST', body: fd });
		if (!res.ok) return null;
		const data = (await res.json()) as { url?: string };
		return typeof data.url === 'string' ? data.url : null;
	} catch {
		return null;
	}
}
