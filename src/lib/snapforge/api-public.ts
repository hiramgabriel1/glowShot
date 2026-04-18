/**
 * Origen público del backend (SvelteKit con `/api/*`).
 * En `.env`: `PUBLIC_UPLOAD_API_BASE=http://localhost:5173` si hace falta.
 */
export function publicApiOrigin(): string {
	const raw = import.meta.env.PUBLIC_UPLOAD_API_BASE as string | undefined;
	return typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : '';
}

/** Ruta absoluta al mismo host o con origen explícito. */
export function apiUrl(path: string): string {
	const p = path.startsWith('/') ? path : `/${path}`;
	const o = publicApiOrigin();
	return o ? `${o}${p}` : p;
}
