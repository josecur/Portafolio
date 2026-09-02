/**
 * Rutas a archivos de public/.
 *
 * Astro antepone `base` solo a lo que él mismo empaqueta (CSS, JS, imágenes
 * optimizadas). Lo que vive en public/ se copia literal, así que en un
 * despliegue bajo subcarpeta —GitHub Pages en /Portafolio— hay que ponerlo
 * a mano o el recurso apunta fuera del sitio.
 *
 * Los JSON de contenido siguen guardando la ruta dentro de public/
 * ("/images/foo.svg"): dónde está el archivo es una cosa y dónde está
 * publicado el sitio es otra. Renombrar el repo es cambiar `base` y ya.
 */

// BASE_URL vale "/Portafolio" (sin barra final), pero se normaliza por si
// algún día `base` se escribe con ella.
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export const ruta = (p: string) => `${BASE}/${p.replace(/^\//, "")}`;
