import { error, json } from '@sveltejs/kit';

import { deletePhotoByKey, listPhotosInBucket } from '$lib/server/s3-upload';
import { getS3PhotosConfig } from '$lib/server/s3-config';
import { env } from '$env/dynamic/private';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
		throw error(503, 'S3 no configurado');
	}
	try {
		// "Mis creaciones" lista solo las capturas combinadas (creations/), no las fotos importadas (photos/).
		const items = await listPhotosInBucket('creation');
		return json({ items });
	} catch (e) {
		console.error('[api/photos GET]', e);
		throw error(502, 'No se pudo listar fotos en S3');
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
		throw error(503, 'S3 no configurado');
	}
	const key = url.searchParams.get('key');
	if (!key || key.length < 8) {
		throw error(400, 'Parámetro key inválido');
	}
	const { creationsPrefix } = getS3PhotosConfig();
	if (!key.startsWith(creationsPrefix) || key.includes('..')) {
		throw error(400, 'Key no permitida');
	}
	try {
		await deletePhotoByKey(key, 'creation');
		return json({ ok: true });
	} catch (e) {
		console.error('[api/photos DELETE]', e);
		throw error(502, 'No se pudo borrar en S3');
	}
};
