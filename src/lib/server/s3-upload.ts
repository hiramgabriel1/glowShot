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

/**
 * Sube bytes PNG al prefijo `photos/` del bucket configurado.
 * @returns URL pública del objeto
 */
export async function putPngPhoto(body: Buffer, filenameBase: string): Promise<{ key: string; url: string }> {
	const { region, bucket, photosPrefix } = getS3PhotosConfig();
	const safe = filenameBase.replace(/[^a-zA-Z0-9-]/g, '') || randomUUID();
	const key = `${photosPrefix}${safe}.png`;

	const client = getClient(region);
	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: body,
			ContentType: 'image/png',
			CacheControl: 'public, max-age=31536000, immutable'
		})
	);

	return { key, url: publicObjectUrl(bucket, region, key) };
}
