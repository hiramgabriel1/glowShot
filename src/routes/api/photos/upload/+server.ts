import { error, json } from '@sveltejs/kit';

import { putPhoto, type PutPhotoFormat } from '$lib/server/s3-upload';
import { env } from '$env/dynamic/private';

import type { RequestHandler } from './$types';

function imageFormatFromFile(file: File): PutPhotoFormat {
	const t = (file.type || '').toLowerCase();
	if (t === 'image/png') return { extension: 'png', contentType: 'image/png' };
	if (t === 'image/jpeg' || t === 'image/jpg') return { extension: 'jpg', contentType: 'image/jpeg' };
	if (t === 'image/webp') return { extension: 'webp', contentType: 'image/webp' };
	if (t === 'image/gif') return { extension: 'gif', contentType: 'image/gif' };
	const n = file.name?.toLowerCase() ?? '';
	if (n.endsWith('.png')) return { extension: 'png', contentType: 'image/png' };
	if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return { extension: 'jpg', contentType: 'image/jpeg' };
	if (n.endsWith('.webp')) return { extension: 'webp', contentType: 'image/webp' };
	if (n.endsWith('.gif')) return { extension: 'gif', contentType: 'image/gif' };
	return { extension: 'png', contentType: 'image/png' };
}

export const POST: RequestHandler = async ({ request, url }) => {
	if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
		throw error(503, 'S3 no configurado (faltan AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)');
	}

	const ct = request.headers.get('content-type') ?? '';
	let buffer: Buffer;

	let multipartFormat: PutPhotoFormat | null = null;

	if (ct.includes('multipart/form-data')) {
		const form = await request.formData();
		const file = form.get('file');
		if (!file || !(file instanceof File)) {
			throw error(400, 'Falta el campo file');
		}
		multipartFormat = imageFormatFromFile(file);
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
		const format =
			multipartFormat ??
			({ extension: 'png', contentType: 'image/png' } satisfies PutPhotoFormat);
		const kindRaw = (url.searchParams.get('kind') ?? 'photo').toLowerCase();
		const kind = kindRaw === 'creation' ? 'creation' : 'photo';
		const { url: outUrl, key } = await putPhoto(buffer, id, format, kind);
		return json({ ok: true, url: outUrl, key });
	} catch (e) {
		console.error('[api/photos/upload]', e);
		throw error(502, 'Error al subir a S3');
	}
};
