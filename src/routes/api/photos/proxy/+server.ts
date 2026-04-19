import { error } from '@sveltejs/kit';

import { env } from '$env/dynamic/private';

import type { RequestHandler } from './$types';

function isAllowedUpstream(url: URL): boolean {
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
	// Evitar SSRF a localhost/red interna
	if (
		url.hostname === 'localhost' ||
		url.hostname === '127.0.0.1' ||
		url.hostname === '::1' ||
		url.hostname.endsWith('.local')
	) {
		return false;
	}

	const bucket = env.S3_BUCKET;
	const host = url.hostname.toLowerCase();
	// Permitimos solo S3 (presigned) para no abrir un proxy genérico.
	const isAws = host.endsWith('amazonaws.com');
	const mentionsBucket = bucket ? host.startsWith(`${bucket.toLowerCase()}.`) || url.pathname.includes(`/${bucket}/`) : false;
	return isAws && (bucket ? mentionsBucket : true);
}

export const GET: RequestHandler = async ({ url, fetch }) => {
	const upstream = url.searchParams.get('u');
	if (!upstream) throw error(400, 'Parámetro u requerido');

	let u: URL;
	try {
		u = new URL(upstream);
	} catch {
		throw error(400, 'URL inválida');
	}
	if (!isAllowedUpstream(u)) {
		throw error(400, 'URL no permitida');
	}

	let res: Response;
	try {
		res = await fetch(u.toString(), {
			method: 'GET',
			// importante: no reenviar cookies
			credentials: 'omit'
		});
	} catch (e) {
		console.error('[api/photos/proxy fetch]', e);
		throw error(502, 'No se pudo obtener la imagen');
	}

	if (!res.ok) {
		throw error(502, 'No se pudo obtener la imagen');
	}

	const ct = res.headers.get('content-type') ?? '';
	if (!ct.startsWith('image/')) {
		throw error(415, 'Upstream no es imagen');
	}

	return new Response(res.body, {
		status: 200,
		headers: {
			'content-type': ct,
			'cache-control': 'no-store'
		}
	});
};

