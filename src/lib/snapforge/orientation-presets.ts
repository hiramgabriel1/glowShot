/** Presets de vista 3D (estilo shots.so): rotaciones en grados respecto al centro del marco. */
export type OrientationPreset = {
	id: string;
	label: string;
	/** rotateX (deg) */
	rx: number;
	/** rotateY (deg) */
	ry: number;
	/** rotateZ (deg) */
	rz: number;
};

export const ORIENTATION_PRESETS: OrientationPreset[] = [
	{ id: 'front', label: 'Frontal', rx: 0, ry: 0, rz: 0 },
	{ id: 'tilt-y-neg', label: 'Horizontal −', rx: 4, ry: -22, rz: 0 },
	{ id: 'tilt-y-pos', label: 'Horizontal +', rx: 4, ry: 22, rz: 0 },
	{ id: 'from-top', label: 'Desde arriba', rx: 32, ry: 0, rz: 0 },
	{ id: 'iso', label: 'Isométrica', rx: 14, ry: -24, rz: 0 },
	{ id: 'diagonal', label: 'Diagonal', rx: 18, ry: 26, rz: -5 },
	{ id: 'from-below', label: 'Desde abajo', rx: -16, ry: -14, rz: 0 }
];

export function orientationCssTransform(p: OrientationPreset): string {
	return `rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`;
}
