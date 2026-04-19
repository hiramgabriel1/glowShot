export function errorMessage(e: unknown): string {
	if (e instanceof Error) return e.message || 'Error desconocido';
	if (typeof e === 'string') return e;
	if (e && typeof e === 'object') {
		if ('message' in e) {
			const m = (e as { message: unknown }).message;
			if (typeof m === 'string' && m.length > 0) return m;
		}
		if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.message) {
			return e.message;
		}
		if (typeof Event !== 'undefined' && e instanceof Event) {
			return 'No se pudo completar la operación. Prueba de nuevo o con otra imagen.';
		}
	}
	try {
		const s = JSON.stringify(e);
		if (s === '{}' || s === '{"isTrusted":true}' || s === '{"isTrusted":false}') {
			return 'Error desconocido. Prueba otra imagen o con otra operación.';
		}
		return s;
	} catch {
		return String(e);
	}
}
