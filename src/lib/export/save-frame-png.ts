import { isTauri } from '@tauri-apps/api/core';
import { toBlob } from 'html-to-image';
import { get } from 'svelte/store';

import { frameHeight, frameWidth } from '$lib/stores/editor';

export type CaptureOptions = {
	/** Escala de píxeles del canvas (export usa 2; copiar usa 1 para limitar tamaño). */
	pixelRatio?: number;
	/** Si el marco supera este valor en el lado mayor, se escala el PNG manteniendo proporción. */
	maxOutputSide?: number;
};

/**
 * Rasteriza el marco del editor a PNG.
 */
export async function captureFramePngBlob(
	frameEl: HTMLElement,
	options: CaptureOptions = {}
): Promise<Blob> {
	const w0 = get(frameWidth);
	const h0 = get(frameHeight);
	const maxSide = options.maxOutputSide;
	let outW = w0;
	let outH = h0;
	if (maxSide != null && Math.max(w0, h0) > maxSide) {
		const s = maxSide / Math.max(w0, h0);
		outW = Math.round(w0 * s);
		outH = Math.round(h0 * s);
	}
	const pixelRatio = options.pixelRatio ?? 2;

	await document.fonts.ready;

	const blob = await toBlob(frameEl, {
		width: outW,
		height: outH,
		pixelRatio,
		cacheBust: true,
		backgroundColor: 'transparent'
	});

	if (!blob) {
		throw new Error('No se pudo generar la imagen');
	}

	return blob;
}

/**
 * Guarda PNG (diálogo nativo en Tauri, descarga en navegador).
 * En Tauri, `cancelled` = el usuario cerró el diálogo sin elegir ruta.
 */
export async function exportFrameElementToFile(
	frameEl: HTMLElement
): Promise<'saved' | 'cancelled'> {
	const blob = await captureFramePngBlob(frameEl, { pixelRatio: 2 });

	const name = `snapforge-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;

	if (isTauri()) {
		const { save } = await import('@tauri-apps/plugin-dialog');
		const { writeFile } = await import('@tauri-apps/plugin-fs');
		const path = await save({
			defaultPath: name,
			filters: [{ name: 'PNG', extensions: ['png'] }]
		});
		if (path == null) return 'cancelled';
		await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
		return 'saved';
	}

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
	return 'saved';
}

export function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result as string);
		r.onerror = () => reject(r.error ?? new Error('readAsDataURL failed'));
		r.readAsDataURL(blob);
	});
}

/**
 * Portapapeles del navegador: llamar en el mismo turno síncrono que el clic.
 * Usa `Promise<Blob>` en `ClipboardItem` para no perder el gesto de usuario.
 */
export function copyFrameToClipboardWebDeferred(frameEl: HTMLElement): Promise<void> {
	if (!navigator.clipboard?.write) {
		return Promise.reject(new Error('El portapapeles no está disponible en este entorno'));
	}

	const pngPromise = captureFramePngBlob(frameEl, {
		pixelRatio: 1,
		maxOutputSide: 2048
	});

	return navigator.clipboard.write([
		new ClipboardItem({
			'image/png': pngPromise
		})
	]);
}

/**
 * Tauri: imagen en portapapeles nativo vía PNG decodificado en Rust.
 */
async function copyPngWithTauriPlugin(bytes: Uint8Array): Promise<void> {
	const { Image } = await import('@tauri-apps/api/image');
	const { writeImage } = await import('@tauri-apps/plugin-clipboard-manager');
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	const image = await Image.fromBytes(copy);
	await writeImage(image);
}

/**
 * Tauri: si falla la imagen nativa, copiar PNG como data URL en texto (API nativa, no pasa por WKWebView clipboard).
 */
async function copyPngDataUrlWithTauriWriteText(frameEl: HTMLElement): Promise<void> {
	const blob = await captureFramePngBlob(frameEl, {
		pixelRatio: 1,
		maxOutputSide: 800
	});
	const { writeText } = await import('@tauri-apps/plugin-clipboard-manager');
	await writeText(await blobToDataUrl(blob));
}

/**
 * Copia el marco al portapapeles (Tauri y navegador), con varias rutas de respaldo.
 */
export async function copyFrameElementToClipboard(frameEl: HTMLElement): Promise<void> {
	if (isTauri()) {
		try {
			const blob = await captureFramePngBlob(frameEl, {
				pixelRatio: 1,
				maxOutputSide: 2048
			});
			await copyPngWithTauriPlugin(new Uint8Array(await blob.arrayBuffer()));
			return;
		} catch (e) {
			console.warn('[copy] Tauri writeImage 2048:', e);
		}

		try {
			const blob = await captureFramePngBlob(frameEl, {
				pixelRatio: 1,
				maxOutputSide: 1024
			});
			await copyPngWithTauriPlugin(new Uint8Array(await blob.arrayBuffer()));
			return;
		} catch (e) {
			console.warn('[copy] Tauri writeImage 1024:', e);
		}

		try {
			await copyPngDataUrlWithTauriWriteText(frameEl);
			return;
		} catch (e) {
			console.warn('[copy] Tauri writeText data URL:', e);
		}

		try {
			await copyFrameToClipboardWebDeferred(frameEl);
			return;
		} catch (e) {
			console.warn('[copy] WebView clipboard image:', e);
		}

		throw new Error(
			'No se pudo copiar. Usa Export para guardar el PNG. Si usas la app de escritorio, ejecuta `cargo build` en `src-tauri` con la feature `image-png` en Tauri.'
		);
	}

	if (!globalThis.isSecureContext) {
		throw new Error(
			'El portapapeles requiere HTTPS o localhost (p. ej. http://127.0.0.1:5173). También puedes usar Export.'
		);
	}

	try {
		await copyFrameToClipboardWebDeferred(frameEl);
		return;
	} catch (e) {
		console.warn('[copy] navegador ClipboardItem:', e);
	}

	try {
		const blob = await captureFramePngBlob(frameEl, {
			pixelRatio: 1,
			maxOutputSide: 800
		});
		await navigator.clipboard.writeText(await blobToDataUrl(blob));
		return;
	} catch (e) {
		console.warn('[copy] navegador writeText data URL:', e);
	}

	try {
		const blob = await captureFramePngBlob(frameEl, {
			pixelRatio: 1,
			maxOutputSide: 800
		});
		await navigator.clipboard.write([
			new ClipboardItem({
				'image/png': blob
			})
		]);
		return;
	} catch (e) {
		console.warn('[copy] navegador image/png blob:', e);
	}

	throw new Error(
		'No se pudo copiar al portapapeles. Prueba otro navegador o usa Export para guardar el PNG.'
	);
}
