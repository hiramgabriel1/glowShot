import { randomUUID } from 'node:crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

import { getS3PhotosConfig } from './s3-config';

function getClient(region: string): S3Client {
	const id = env.AWS_ACCESS_KEY_ID;
	const secret = env.AWS_SECRET_ACCESS_KEY;
	return new S3Client({
		region,
		...(id && secret
			? { credentials: { accessKeyId: id, secretAccessKey: secret } }
			: {})
	});
}

/** URL pública por objeto (bucket con lectura pública o política que lo permita). */
export function publicObjectUrl(bucket: string, region: string, key: string): string {
	const safe = key.split('/').map(encodeURIComponent).join('/');
	return `https://${bucket}.s3.${region}.amazonaws.com/${safe}`;
}

export type PutPhotoFormat = {
	/** Sin punto: png, jpg, webp… */
	extension: string;
	contentType: string;
};

/**
 * Sube una imagen al prefijo `photos/` del bucket.
 */
export async function putPhoto(
	body: Buffer,
	filenameBase: string,
	format: PutPhotoFormat
): Promise<{ key: string; url: string }> {
	const { region, bucket, photosPrefix } = getS3PhotosConfig();
	const safe = filenameBase.replace(/[^a-zA-Z0-9-]/g, '') || randomUUID();
	const ext = format.extension.replace(/^\./, '');
	const key = `${photosPrefix}${safe}.${ext}`;

	const client = getClient(region);
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: format.contentType,
			CacheControl: 'public, max-age=31536000, immutable'
		})
	);

	return { key, url: publicObjectUrl(bucket, region, key) };
}

/** Sube PNG (capturas del editor). */
export async function putPngPhoto(body: Buffer, filenameBase: string): Promise<{ key: string; url: string }> {
	return putPhoto(body, filenameBase, { extension: 'png', contentType: 'image/png' });
}
