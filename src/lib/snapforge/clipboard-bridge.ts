import { copyFrameElementToClipboard, exportFrameElementToFile } from '$lib/export/save-frame-png';
import { saveFrameToCreations } from '$lib/stores/creations';
import { toast } from '$lib/stores/toast';
import { errorMessage } from '$lib/utils/error-message';

let frameNode: HTMLElement | null = null;

/** EditorCanvas registra aquí el nodo exportable (marco). */
export function setSnapforgeExportFrame(el: HTMLElement | null): void {
	frameNode = el;
}

/** Llamar desde el onclick del botón Copy. */
export function runSnapforgeCopy(): void {
	if (!frameNode) return;
	void copyFrameElementToClipboard(frameNode)
		.then(() => {
			toast.success('Copiado al portapapeles');
		})
		.catch((e) => {
			console.error(e);
			toast.error(errorMessage(e) || 'Error al copiar');
		});
}

/** Llamar desde el onclick del botón Export. */
export function runSnapforgeExport(): void {
	if (!frameNode) return;
	void exportFrameElementToFile(frameNode)
		.then((result) => {
			if (result === 'saved') {
				toast.success('PNG exportado');
			}
		})
		.catch((e) => {
			console.error(e);
			toast.error(errorMessage(e) || 'Error al exportar');
		});
}

/** Guarda una miniatura del marco actual en “Mis creaciones”. */
export function runSaveToGallery(): void {
	if (!frameNode) return;
	void saveFrameToCreations(frameNode)
		.then((result) => {
			if (result === 'added') {
				toast.success('Guardado en Mis creaciones');
			} else {
				toast.info('Esta vista ya está en Mis creaciones');
			}
		})
		.catch((e) => {
			console.error(e);
			toast.error(errorMessage(e) || 'No se pudo guardar en la galería');
		});
}
