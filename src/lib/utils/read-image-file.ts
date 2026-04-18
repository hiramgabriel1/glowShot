/** Lee un archivo de imagen como data URL (p. ej. para el marco del editor). */
export function readImageFileAsDataUrl(file: File): Promise<string> {
	if (!file.type.startsWith('image/')) {
		return Promise.reject(new Error('Elige un archivo de imagen (PNG, JPG, WebP…).'));
	}
	return new Promise((resolve, reject) => {
		const r = new FileReader();
		r.onload = () => resolve(r.result as string);
		r.onerror = () => reject(r.error ?? new Error('No se pudo leer el archivo'));
		r.readAsDataURL(file);
	});
}
