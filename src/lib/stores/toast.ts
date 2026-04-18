import { writable } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastItem = {
	id: string;
	message: string;
	variant: ToastVariant;
};

const DEFAULT_DURATION_MS = 3200;
const ERROR_DURATION_MS = 4800;
const MAX_VISIBLE = 5;

const inner = writable<ToastItem[]>([]);

function dismiss(id: string) {
	inner.update((list) => list.filter((t) => t.id !== id));
}

function push(message: string, variant: ToastVariant, durationMs: number) {
	const id = crypto.randomUUID();
	inner.update((list) => {
		const next = [...list, { id, message, variant }];
		return next.slice(-MAX_VISIBLE);
	});
	if (durationMs > 0) {
		setTimeout(() => dismiss(id), durationMs);
	}
}

export const toasts = { subscribe: inner.subscribe };

export const toast = {
	success(msg: string, durationMs = DEFAULT_DURATION_MS) {
		push(msg, 'success', durationMs);
	},
	info(msg: string, durationMs = DEFAULT_DURATION_MS) {
		push(msg, 'info', durationMs);
	},
	error(msg: string, durationMs = ERROR_DURATION_MS) {
		push(msg, 'error', durationMs);
	}
};
