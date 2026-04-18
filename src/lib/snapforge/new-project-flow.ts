import { startNewProject } from '$lib/stores/editor';
import { toast } from '$lib/stores/toast';

export function runNewProjectFlow(): void {
	if (
		!confirm(
			'¿Empezar un proyecto nuevo? Se restablecerán el marco y los ajustes del editor. «Mis creaciones» no se borra.'
		)
	) {
		return;
	}
	startNewProject();
	toast.success('Proyecto nuevo');
}
