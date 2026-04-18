import { apiUrl, publicApiOrigin } from '$lib/snapforge/api-public';
import type { Creation } from '$lib/stores/creations';

function nameFromS3List(iso: string): string {
	try {
		return new Date(iso).toLocaleString(undefined, {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	} catch {
		return iso;
	}
}

/** Lista fotos del bucket vía `GET /api/photos`. */
export async function fetchPhotoGalleryFromApi(): Promise<Creation[]> {
	const res = await fetch(apiUrl('/api/photos'));
	if (!res.ok) {
		const t = await res.text().catch(() => '');
		throw new Error(t || `HTTP ${res.status}`);
	}
	const data = (await res.json()) as {
		items: Array<{ key: string; url: string; lastModified: string }>;
	};
	return (data.items ?? []).map((row) => ({
		id: row.key,
		s3Key: row.key,
		name: nameFromS3List(row.lastModified),
		createdAt: row.lastModified,
		imageDataUrl: row.url
	}));
}

export async function deletePhotoOnApi(key: string): Promise<void> {
	const origin = publicApiOrigin();
	const q = `key=${encodeURIComponent(key)}`;
	const path = `/api/photos?${q}`;
	const url = origin ? `${origin}${path}` : path;
	const res = await fetch(url, { method: 'DELETE' });
	if (!res.ok) {
		const t = await res.text().catch(() => '');
		throw new Error(t || `HTTP ${res.status}`);
	}
}
