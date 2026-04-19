import { randomUUID } from 'node:crypto';

import {
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

import { getS3PhotosConfig } from './s3-config';

/** Por defecto 12 h; máx. típico SigV4 ~7 días. */
const DEFAULT_PRESIGN_SECONDS = 43_200;

function presignExpiresInSeconds(): number {
	const raw = env.S3_PRESIGN_EXPIRES_SECONDS;
	if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
		const n = parseInt(raw.trim(), 10);
		if (n >= 60 && n <= 604_800) return n;
	}
	return DEFAULT_PRESIGN_SECONDS;
}

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

/** URL temporal firmada; funciona con bucket privado (no lectura pública anónima). */
async function presignedGetObjectUrl(client: S3Client, bucket: string, key: string): Promise<string> {
	const command = new GetObjectCommand({ Bucket: bucket, Key: key });
	return getSignedUrl(client, command, { expiresIn: presignExpiresInSeconds() });
}

export type PutPhotoFormat = {
	/** Sin punto: png, jpg, webp… */
	extension: string;
	contentType: string;
};

export type PutObjectKind = 'photo' | 'creation';

function prefixForKind(cfg: ReturnType<typeof getS3PhotosConfig>, kind: PutObjectKind): string {
	return kind === 'creation' ? cfg.creationsPrefix : cfg.photosPrefix;
}

/**
 * Sube una imagen al bucket bajo el prefijo correspondiente.
 */
export async function putPhoto(
	body: Buffer,
	filenameBase: string,
	format: PutPhotoFormat,
	kind: PutObjectKind = 'photo'
): Promise<{ key: string; url: string }> {
	const cfg = getS3PhotosConfig();
	const { region, bucket } = cfg;
	const safe = filenameBase.replace(/[^a-zA-Z0-9-]/g, '') || randomUUID();
	const ext = format.extension.replace(/^\./, '');
	const prefix = prefixForKind(cfg, kind);
	const key = `${prefix}${safe}.${ext}`;

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

	const url = await presignedGetObjectUrl(client, bucket, key);
	return { key, url };
}

/** Sube PNG (capturas del editor). */
export async function putPngPhoto(body: Buffer, filenameBase: string): Promise<{ key: string; url: string }> {
	return putPhoto(body, filenameBase, { extension: 'png', contentType: 'image/png' }, 'creation');
}

export type ListedPhoto = {
	key: string;
	url: string;
	lastModified: string;
};

/** Lista objetos bajo un prefijo. */
export async function listPhotosInBucket(kind: PutObjectKind = 'creation'): Promise<ListedPhoto[]> {
	const cfg = getS3PhotosConfig();
	const { region, bucket } = cfg;
	const prefix = prefixForKind(cfg, kind);
	const client = getClient(region);
	const rows: { key: string; lastModified: string }[] = [];
	let continuationToken: string | undefined;
	do {
		const resp = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: prefix,
				ContinuationToken: continuationToken,
				MaxKeys: 500
			})
		);
		for (const obj of resp.Contents ?? []) {
			if (!obj.Key || obj.Key.endsWith('/')) continue;
			rows.push({
				key: obj.Key,
				lastModified: (obj.LastModified ?? new Date(0)).toISOString()
			});
		}
		continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
	} while (continuationToken);
	rows.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
	const out: ListedPhoto[] = await Promise.all(
		rows.map(async (r) => ({
			key: r.key,
			url: await presignedGetObjectUrl(client, bucket, r.key),
			lastModified: r.lastModified
		}))
	);
	return out;
}

/** Elimina un objeto; `key` debe ser la clave completa bajo el bucket y el prefijo configurado. */
export async function deletePhotoByKey(key: string, kind: PutObjectKind = 'creation'): Promise<void> {
	const cfg = getS3PhotosConfig();
	const { region, bucket } = cfg;
	const prefix = prefixForKind(cfg, kind);
	if (!key.startsWith(prefix) || key.includes('..') || key.includes('//')) {
		throw new Error('invalid key');
	}
	const client = getClient(region);
	await client.send(
		new DeleteObjectCommand({
			Bucket: bucket,
			Key: key
		})
	);
}
