/**
 * Utilidades de color para calcular contraste en build.
 *
 * Los chips de tecnología toman el color de marca, que no está pensado para
 * fondos oscuros: Angular (#DD0031) daba 3.23:1 y Figma (#A259FF) 3.94:1
 * sobre el fondo derivado. Aquí se aclaran lo justo para llegar al 4.5:1 de
 * WCAG AA, conservando el tono.
 */

/** Espejo de --color-bg en global.css */
export const FONDO = "#1a1b26";

export type RGB = [number, number, number];

export function aRGB(hex: string): RGB {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export const aHex = (c: RGB) =>
  "#" +
  c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Mezcla `a` sobre `b`; f = cuánto pesa `a` */
export const mezclar = (a: RGB, b: RGB, f: number): RGB =>
  [0, 1, 2].map((i) => a[i] * f + b[i] * (1 - f)) as RGB;

const canal = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const luminancia = (c: RGB) =>
  0.2126 * canal(c[0]) + 0.7152 * canal(c[1]) + 0.0722 * canal(c[2]);

export function contraste(a: RGB, b: RGB): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Aclara `color` hacia el blanco lo mínimo necesario para alcanzar `objetivo`
 * de contraste contra `fondo`. Si ya lo cumple, lo devuelve intacto.
 */
export function legible(color: RGB, fondo: RGB, objetivo = 4.5): RGB {
  if (contraste(color, fondo) >= objetivo) return color;
  const BLANCO: RGB = [255, 255, 255];
  for (let f = 0.05; f <= 1; f += 0.05) {
    const c = mezclar(BLANCO, color, f);
    if (contraste(c, fondo) >= objetivo) return c;
  }
  return BLANCO;
}
