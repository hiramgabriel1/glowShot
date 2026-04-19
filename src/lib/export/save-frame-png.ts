import { invoke, isTauri } from '@tauri-apps/api/core';
import { toBlob } from 'html-to-image';
import { get } from 'svelte/store';

import { frameHeight, frameWidth } from '$lib/stores/editor';

export function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result as string);
		r.onerror = () => reject(r.error ?? new Error('readAsDataURL failed'));
		r.readAsDataURL(blob);
	});
}

/**
 * Re-codifica una imagen ya cargada en un PNG vía canvas. Garantiza que el `<img>`
 * que clona html-to-image cargue dentro del foreignObject del SVG intermedio.
 * Sin esto, los data URLs grandes (capturas) o las URLs https con CORS hacen que
 * el preview se vea pero el PNG exportado salga solo con el fondo.
 */
async function reencodeImageThroughCanvas(
	img: HTMLImageElement,
	maxSide = 2400
): Promise<string | null> {
	try {
		await img.decode?.();
	} catch {
		/* puede no estar lista todavía; seguimos */
	}
	const w0 = img.naturalWidth;
	const h0 = img.naturalHeight;
	if (!w0 || !h0) return null;
	let w = w0;
	let h = h0;
	if (Math.max(w, h) > maxSide) {
		const s = maxSide / Math.max(w, h);
		w = Math.max(1, Math.round(w * s));
		h = Math.max(1, Math.round(h * s));
	}
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) return null;
	try {
		ctx.drawImage(img, 0, 0, w, h);
	} catch {
		return null;
	}
	try {
		return canvas.toDataURL('image/png');
	} catch {
		return null;
	}
}

/**
 * Sustituye temporalmente cada `<img>` por un `<canvas>` pintado con la misma imagen.
 * Motivo: en WebKit/Tauri, los `<img>` dentro de `<foreignObject>` (lo que usa
 * html-to-image) a menudo no se renderizan, y el PNG sale con todo menos la foto.
 * `<canvas>` SÍ se serializa correctamente (html-to-image lo convierte a `<img>` data URL
 * en su clon).
 */
async function replaceImagesWithCanvasForCapture(
	root: HTMLElement
): Promise<() => void> {
	const replacements: { canvas: HTMLCanvasElement; original: HTMLImageElement; nextSibling: ChildNode | null; parent: ParentNode }[] = [];
	const imgs = Array.from(root.querySelectorAll('img'));

	for (const img of imgs) {
		try {
			try {
				await img.decode?.();
			} catch {
				/* puede no estar lista; ignoramos */
			}
			const rect = img.getBoundingClientRect();
			const w = Math.max(1, Math.round(rect.width));
			const h = Math.max(1, Math.round(rect.height));
			const nw = img.naturalWidth || w;
			const nh = img.naturalHeight || h;
			if (!nw || !nh) continue;

			const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(w * dpr));
			canvas.height = Math.max(1, Math.round(h * dpr));
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			canvas.style.display = getComputedStyle(img).display || 'inline-block';
			canvas.style.objectFit = 'unset';
			canvas.className = img.className;

			const ctx = canvas.getContext('2d');
			if (!ctx) continue;

			// `object-fit: contain` es lo que usa el frame del editor: ajustar manteniendo proporción.
			const fit = (getComputedStyle(img).objectFit || 'contain').toLowerCase();
			let dx = 0,
				dy = 0,
				dw = canvas.width,
				dh = canvas.height;
			if (fit === 'contain') {
				const s = Math.min(canvas.width / nw, canvas.height / nh);
				dw = Math.round(nw * s);
				dh = Math.round(nh * s);
				dx = Math.round((canvas.width - dw) / 2);
				dy = Math.round((canvas.height - dh) / 2);
			} else if (fit === 'cover') {
				const s = Math.max(canvas.width / nw, canvas.height / nh);
				dw = Math.round(nw * s);
				dh = Math.round(nh * s);
				dx = Math.round((canvas.width - dw) / 2);
				dy = Math.round((canvas.height - dh) / 2);
			}

			try {
				ctx.drawImage(img, dx, dy, dw, dh);
			} catch {
				continue;
			}

			const parent = img.parentNode;
			if (!parent) continue;
			replacements.push({
				canvas,
				original: img,
				nextSibling: img.nextSibling,
				parent
			});
			parent.replaceChild(canvas, img);
		} catch {
			/* si falla, dejamos el <img> tal cual */
		}
	}

	return () => {
		for (const r of replacements) {
			try {
				r.parent.insertBefore(r.original, r.canvas);
				r.parent.removeChild(r.canvas);
			} catch {
				/* nada que hacer */
			}
		}
	};
}

/**
 * Para imágenes remotas (S3, blob:): las traemos como data URL con CORS o vía proxy
 * antes de capturar. Las data URL locales se dejan tal cual.
 */
async function inlineRemoteImagesForCapture(root: HTMLElement): Promise<() => void> {
	const imgs = Array.from(root.querySelectorAll('img'));
	const snapshots: { el: HTMLImageElement; src: string; srcset: string | null }[] = [];

	const recordOriginal = (img: HTMLImageElement) => {
		if (snapshots.some((s) => s.el === img)) return;
		snapshots.push({
			el: img,
			src: img.src,
			srcset: img.getAttribute('srcset')
		});
	};

	for (const img of imgs) {
		const resolved = img.currentSrc || img.src || '';
		if (!resolved) continue;

		// `data:` URLs (foto importada localmente) ya las soporta html-to-image
		// nativamente. Tocarlas hace más mal que bien.
		if (resolved.startsWith('data:')) continue;

		if (!/^https?:\/\//i.test(resolved) && !resolved.startsWith('blob:')) continue;

		try {
			const fetchAsImageBlob = async (href: string): Promise<Blob | null> => {
				try {
					const res = await fetch(href, { mode: 'cors', credentials: 'omit' });
					if (!res.ok) return null;
					const b = await res.blob();
					return b.type.startsWith('image/') ? b : null;
				} catch {
					return null;
				}
			};

			let blob = await fetchAsImageBlob(resolved);
			if (!blob && /^https?:\/\//i.test(resolved)) {
				const proxyUrl = `/api/photos/proxy?u=${encodeURIComponent(resolved)}`;
				blob = await fetchAsImageBlob(proxyUrl);
			}
			if (blob) {
				const dataUrl = await blobToDataUrl(blob);
				recordOriginal(img);
				img.removeAttribute('srcset');
				img.src = dataUrl;
				try {
					await img.decode?.();
				} catch {
					/* sigue: re-codificación canvas opcional debajo */
				}
				// Re-codificar SOLO cuando convertimos un recurso remoto
				// (a veces la imagen original es enorme y conviene un PNG manejable).
				try {
					const reencoded = await reencodeImageThroughCanvas(img);
					if (reencoded && reencoded !== img.src) {
						img.src = reencoded;
					}
				} catch {
					/* si falla, nos quedamos con el data URL del fetch */
				}
			}
		} catch {
			/* sin CORS o red */
		}
	}

	for (const img of imgs) {
		try {
			await img.decode?.();
		} catch {
			/* decode puede fallar si la imagen aún no está lista; seguimos */
		}
	}

	return () => {
		for (const s of snapshots) {
			s.el.src = s.src;
			if (s.srcset != null) s.el.setAttribute('srcset', s.srcset);
			else s.el.removeAttribute('srcset');
		}
	};
}

export type CaptureOptions = {
	/** Escala de píxeles del canvas (export usa 2; copiar usa 1 para limitar tamaño). */
	pixelRatio?: number;
	/** Si el marco supera este valor en el lado mayor, se escala el PNG manteniendo proporción. */
	maxOutputSide?: number;
};

/** Tamaño de salida: caja renderizada (incluye rotación 3D / zoom), no solo el marco plano. */
function captureOutputSize(el: HTMLElement): { width: number; height: number } {
	const r = el.getBoundingClientRect();
	let w = Math.max(1, Math.ceil(r.width));
	let h = Math.max(1, Math.ceil(r.height));
	if (w < 8 || h < 8) {
		w = get(frameWidth);
		h = get(frameHeight);
	}
	return { width: w, height: h };
}

/**
 * Oculta temporalmente todos los `[data-glow-export-hide]` (barra de zoom, toasts,
 * dot grid del editor…) para que la captura nativa de pantalla no los recoja.
 */
function hideExportOverlays(): () => void {
	const els = Array.from(
		document.querySelectorAll<HTMLElement>('[data-glow-export-hide]')
	);
	const previous = els.map((el) => el.style.visibility);
	for (const el of els) el.style.visibility = 'hidden';
	return () => {
		els.forEach((el, i) => {
			el.style.visibility = previous[i] ?? '';
		});
	};
}

/**
 * Color de chroma-key para la captura nativa.
 * Lime verde puro: ningún `GRADIENT_PRESETS` se acerca lo suficiente como para
 * confundirse, así que podemos pintarlo bajo el marco y luego hacerlo transparente.
 */
const CHROMA_KEY_RGB = { r: 0, g: 255, b: 0 } as const;
const CHROMA_KEY_CSS = '#00ff00';

/**
 * Pinta `el` con el chroma color sobreescribiendo cualquier `bg-*` de Tailwind.
 * Devuelve una función que restaura el background original.
 */
function paintChromaBackground(el: HTMLElement): () => void {
	const previousValue = el.style.getPropertyValue('background');
	const previousPriority = el.style.getPropertyPriority('background');
	el.style.setProperty('background', CHROMA_KEY_CSS, 'important');
	return () => {
		if (previousValue) {
			el.style.setProperty('background', previousValue, previousPriority);
		} else {
			el.style.removeProperty('background');
		}
	};
}

/**
 * Quita el chroma-key del PNG: píxeles iguales al verde puro → alpha 0; píxeles
 * cercanos (antialias en el borde del marco rotado) → alpha proporcional para no
 * dejar un halo verde alrededor del mockup.
 */
async function chromaKeyToTransparent(pngBlob: Blob): Promise<Blob> {
	const bitmap = await createImageBitmap(pngBlob);
	try {
		const canvas = document.createElement('canvas');
		canvas.width = bitmap.width;
		canvas.height = bitmap.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return pngBlob;
		ctx.drawImage(bitmap, 0, 0);

		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		const px = imageData.data;
		// Distancia euclídea en RGB. Ajustada empíricamente: <50 quita el verde puro
		// y blends con casi-verde, 50–110 hace fade para evitar el halo en los bordes.
		const innerThresholdSq = 50 * 50;
		const outerThresholdSq = 110 * 110;
		for (let i = 0; i < px.length; i += 4) {
			const dr = px[i]! - CHROMA_KEY_RGB.r;
			const dg = px[i + 1]! - CHROMA_KEY_RGB.g;
			const db = px[i + 2]! - CHROMA_KEY_RGB.b;
			const distSq = dr * dr + dg * dg + db * db;
			if (distSq <= innerThresholdSq) {
				px[i + 3] = 0;
			} else if (distSq <= outerThresholdSq) {
				const dist = Math.sqrt(distSq);
				const t =
					(dist - Math.sqrt(innerThresholdSq)) /
					(Math.sqrt(outerThresholdSq) - Math.sqrt(innerThresholdSq));
				px[i + 3] = Math.round((px[i + 3] ?? 255) * t);
			}
		}
		ctx.putImageData(imageData, 0, 0);

		return await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (blob) resolve(blob);
				else reject(new Error('canvas.toBlob devolvió null al recodificar PNG'));
			}, 'image/png');
		});
	} finally {
		bitmap.close?.();
	}
}

/**
 * Captura nativa vía `screencapture` (Rust). Coge exactamente lo pintado por WebKit
 * en pantalla, así que la foto del marco ya no desaparece como pasa con html-to-image
 * (bug de `<img>` dentro de `<foreignObject>` en WebKit/Tauri).
 *
 * Solo macOS de momento. Para otros SO se usa el fallback de html-to-image.
 */
async function captureFramePngBlobNative(
	frameEl: HTMLElement,
	options: CaptureOptions
): Promise<Blob> {
	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	const win = getCurrentWindow();
	const [scale, innerPos] = await Promise.all([win.scaleFactor(), win.innerPosition()]);

	// `innerPosition` viene en píxeles físicos relativos al top-left de la pantalla principal.
	// `screencapture -R` espera puntos lógicos. Dividimos por el factor de escala.
	const logicalX = innerPos.x / scale;
	const logicalY = innerPos.y / scale;

	const restoreOverlays = hideExportOverlays();
	const restoreBg = paintChromaBackground(frameEl);

	try {
		await document.fonts.ready;
		// Doble RAF: deja que el navegador aplique el chroma + `visibility: hidden`
		// antes de disparar la captura. Sin esto a veces sale el dot grid mezclado.
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
		);

		const rect = frameEl.getBoundingClientRect();
		const x = Math.floor(logicalX + rect.left);
		const y = Math.floor(logicalY + rect.top);
		const width = Math.max(1, Math.ceil(rect.width));
		const height = Math.max(1, Math.ceil(rect.height));

		const result = (await invoke('capture_screen_rect_png', {
			rect: {
				x,
				y,
				width,
				height,
				maxSide: options.maxOutputSide ?? null
			}
		})) as ArrayBuffer | Uint8Array | number[];

		// `tauri::ipc::Response` se entrega como ArrayBuffer en JS; nos curamos en salud.
		const ab: ArrayBuffer =
			result instanceof ArrayBuffer
				? result
				: result instanceof Uint8Array
					? new Uint8Array(
							result.buffer.slice(
								result.byteOffset,
								result.byteOffset + result.byteLength
							) as ArrayBuffer
						).buffer
					: new Uint8Array(result as number[]).buffer;

		const rawBlob = new Blob([ab], { type: 'image/png' });
		if (!rawBlob.size) {
			throw new Error('La captura nativa devolvió un PNG vacío');
		}
		// Restauramos el editor lo antes posible: el post-procesado del chroma no necesita el DOM.
		restoreBg();
		restoreOverlays();
		return await chromaKeyToTransparent(rawBlob);
	} catch (e) {
		restoreBg();
		restoreOverlays();
		throw e;
	}
}

/**
 * Camino legado: html-to-image. Lo dejamos como fallback (Linux/Windows o si la captura
 * nativa falla por permisos). En Tauri/macOS sufre el bug de WebKit con `<img>` en
 * `<foreignObject>`, por eso preferimos `captureFramePngBlobNative` cuando esté disponible.
 */
async function captureFramePngBlobHtmlToImage(
	frameEl: HTMLElement,
	options: CaptureOptions
): Promise<Blob> {
	const { width: w0, height: h0 } = captureOutputSize(frameEl);
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
	await new Promise<void>((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve());
		});
	});

	const restoreImages = await inlineRemoteImagesForCapture(frameEl);
	const restoreCanvases = await replaceImagesWithCanvasForCapture(frameEl);

	try {
		const blob = await toBlobWithCaptureFixes(frameEl, {
			width: outW,
			height: outH,
			pixelRatio,
			cacheBust: false
		});

		if (!blob) {
			throw new Error('No se pudo generar la imagen');
		}

		return blob;
	} finally {
		restoreCanvases();
		restoreImages();
	}
}

/**
 * Rasteriza el marco del editor a PNG (incluye perspectiva + vista 3D + degradado del marco).
 *
 * Estrategia: en Tauri intentamos primero captura nativa (pixel-perfect, sin el bug de
 * foreignObject). Si falla por cualquier razón (permisos de Screen Recording, etc.),
 * caemos al pipeline `html-to-image` heredado.
 */
export async function captureFramePngBlob(
	frameEl: HTMLElement,
	options: CaptureOptions = {}
): Promise<Blob> {
	if (isTauri()) {
		try {
			return await captureFramePngBlobNative(frameEl, options);
		} catch (e) {
			console.warn('[capture] native screencapture failed, falling back to html-to-image:', e);
		}
	}
	return captureFramePngBlobHtmlToImage(frameEl, options);
}

/** html-to-image puede hacer `reject(event)` en errores de <img> o del SVG final (Event, no Error). */
function isLikelyDomEvent(e: unknown): boolean {
	return (
		typeof Event !== 'undefined' &&
		e instanceof Event &&
		!(e instanceof ErrorEvent && e.error instanceof Error)
	);
}

async function toBlobWithCaptureFixes(
	frameEl: HTMLElement,
	base: { width: number; height: number; pixelRatio: number; cacheBust: boolean }
): Promise<Blob> {
	const pixelRatios =
		base.pixelRatio > 1 ? [base.pixelRatio, 1] : [base.pixelRatio];

	let lastErr: unknown;
	for (let i = 0; i < pixelRatios.length; i++) {
		const pr = pixelRatios[i]!;
		const isLastAttempt = i === pixelRatios.length - 1;
		try {
			const b = await toBlob(frameEl, {
				...base,
				pixelRatio: pr,
				// En el último intento, no dejamos que un fallo de <img> tire la captura
				// (preferimos un PNG con el fondo a un error). En el primer intento,
				// dejamos que el error se propague para que el reintento haga su trabajo.
				...(isLastAttempt ? { onImageErrorHandler: () => undefined } : {})
			});
			if (b) return b;
			lastErr = new Error('toBlob devolvió vacío');
			continue;
		} catch (e) {
			lastErr = e;
			if (isLikelyDomEvent(e) && i < pixelRatios.length - 1) {
				continue;
			}
			if (isLikelyDomEvent(e)) {
				throw new Error(
					'No se pudo capturar la vista (demasiado grande o recurso bloqueado). Prueba a bajar el zoom o guardar de nuevo.'
				);
			}
			throw e;
		}
	}
	throw lastErr instanceof Error
		? lastErr
		: new Error('No se pudo generar la imagen del marco');
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
