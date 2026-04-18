import { env } from '$env/dynamic/private';

/** URI del bucket (referencia): s3://glowshowcontent-716200068584-us-east-2-an/photos/ */
const DEFAULT_REGION = 'us-east-2';
const DEFAULT_BUCKET = 'glowshowcontent-716200068584-us-east-2-an';
const DEFAULT_PHOTOS_PREFIX = 'photos/';

function normalizePrefix(p: string): string {
	const t = p.trim();
	if (!t) return '';
	return t.endsWith('/') ? t : `${t}/`;
}

/**
 * Configuración S3 para fotos (solo importar desde `+server.ts`, hooks o `+page.server.ts`).
 */
export function getS3PhotosConfig(): {
	region: string;
	bucket: string;
	/** Prefijo de keys, siempre termina en `/` (ej. `photos/`). */
	photosPrefix: string;
} {
	return {
		region: env.AWS_REGION ?? DEFAULT_REGION,
		bucket: env.S3_BUCKET ?? DEFAULT_BUCKET,
		photosPrefix: normalizePrefix(env.S3_PHOTOS_PREFIX ?? DEFAULT_PHOTOS_PREFIX)
	};
}
