import { error, json } from '@sveltejs/kit';

import { putPngPhoto } from '$lib/server/s3-upload';
import { env } from '$env/dynamic/private';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
		throw error(503, 'S3 no configurado (faltan AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)');
	}

	const ct = request.headers.get('content-type') ?? '';
	let buffer: Buffer;

	if (ct.includes('multipart/form-data')) {
		const form = await request.formData();
		const file = form.get('file');
		if (!file || !(file instanceof File)) {
			throw error(400, 'Falta el campo file');
		}
		if (!file.type.includes('png') && file.name && !file.name.toLowerCase().endsWith('.png')) {
			/* permitir si el tipo viene vacío pero es png por nombre */
		}
		buffer = Buffer.from(await file.arrayBuffer());
	} else if (ct.includes('application/json')) {
		const body = (await request.json()) as { base64?: string };
		if (!body.base64 || typeof body.base64 !== 'string') {
			throw error(400, 'Falta base64');
		}
		const raw = body.base64.includes(',') ? body.base64.split(',')[1]! : body.base64;
		buffer = Buffer.from(raw, 'base64');
	} else {
		throw error(415, 'Usa multipart/form-data (file) o application/json { base64 }');
	}

	if (buffer.length < 16 || buffer.length > 12 * 1024 * 1024) {
		throw error(400, 'Tamaño de imagen no válido');
	}

	const id = crypto.randomUUID();
	try {
		const { url, key } = await putPngPhoto(buffer, id);
		return json({ ok: true, url, key });
	} catch (e) {
		console.error('[api/photos/upload]', e);
		throw error(502, 'Error al subir a S3');
	}
};
