/**
 * Generador de la escena espacial de fondo, en el estilo grabado/xilografía
 * de diseno_portafolio/estilo.jpg.
 *
 * Corre en tiempo de build (Astro ejecuta los componentes al compilar), así
 * que no cuesta nada en el navegador. El generador aleatorio va SEMBRADO:
 * la escena es idéntica en cada build y no cambia sola entre despliegues.
 *
 * CLAVE DEL ESTILO: en la referencia los planetas son MASAS CLARAS con
 * surcos oscuros tallados encima, no alambres claros sobre el vacío. Así que
 * aquí se rellena el disco y se le resta el surco con una máscara. Medido en
 * el mockup del diseño, una masa de planeta debe leerse en rgb(69,69,78)
 * sobre el vacío: con tinta #C0CAF5 al 26% eso equivale a un disco lleno.
 */

/** PRNG determinista (mulberry32) */
function sembrar(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Redondeo corto: recorta bastante peso del SVG sin diferencia visible */
const d1 = (n: number) => Math.round(n * 10) / 10;
const d2 = (n: number) => Math.round(n * 100) / 100;

const entre = (rng: () => number, a: number, b: number) => a + rng() * (b - a);
const limitar = (n: number, a: number, b: number) => (n < a ? a : n > b ? b : n);

/** Identificadores únicos para las máscaras, únicos dentro del documento */
let contador = 0;
const uid = () => `e${(contador++).toString(36)}`;

export const ANCHO = 1920;
export const ALTO = 2200;

interface Punto {
  x: number;
  y: number;
  r: number;
  o: number;
}

/**
 * Agrupa por opacidad y la pone en el <g>, no en cada círculo.
 * Con miles de puntos eso ahorra bastantes KB.
 */
function emitirPuntos(puntos: Punto[]): string {
  const cubos = new Map<number, Punto[]>();
  for (const p of puntos) {
    const k = Math.max(0.05, Math.round(p.o * 10) / 10);
    let lista = cubos.get(k);
    if (!lista) {
      lista = [];
      cubos.set(k, lista);
    }
    lista.push(p);
  }
  const out: string[] = [];
  for (const [o, lista] of [...cubos.entries()].sort((a, b) => a[0] - b[0])) {
    const cs = lista
      .map((p) => `<circle cx="${d1(p.x)}" cy="${d1(p.y)}" r="${d2(p.r)}"/>`)
      .join("");
    out.push(`<g opacity="${o}">${cs}</g>`);
  }
  return out.join("");
}

/** Puntos planos, sin agrupar por opacidad: para las máscaras (negro puro) */
const emitirPlano = (puntos: Punto[]) =>
  puntos
    .map((p) => `<circle cx="${d1(p.x)}" cy="${d1(p.y)}" r="${d2(p.r)}"/>`)
    .join("");

/** Campo de estrellas repartido por toda la escena */
function campoEstrellas(
  rng: () => number,
  n: number,
  rMin: number,
  rMax: number,
  oMin: number,
  oMax: number,
): Punto[] {
  const out: Punto[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: rng() * ANCHO,
      y: rng() * ALTO,
      r: entre(rng, rMin, rMax),
      o: entre(rng, oMin, oMax),
    });
  }
  return out;
}

/**
 * Banda de nebulosa: puntos dispersos a lo largo de una diagonal, con la
 * densidad cayendo hacia los extremos y hacia los lados. Es el puntillismo
 * que en la referencia cruza el cuadro en diagonal — y ahí pesa tanto como
 * los planetas, así que va denso y con opacidad alta.
 */
function bandaNebulosa(
  rng: () => number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  n: number,
  ancho: number,
): Punto[] {
  const out: Punto[] = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const largo = Math.hypot(dx, dy);
  const nx = -dy / largo;
  const ny = dx / largo;

  for (let i = 0; i < n; i++) {
    const t = rng();
    // Densidad máxima al centro de la banda
    const caida = Math.sin(t * Math.PI);
    if (rng() > caida) continue;

    // Dispersión perpendicular tipo campana (suma de dos uniformes)
    const g = (rng() + rng() - 1) * ancho;
    const desvanece = 1 - Math.abs(g) / ancho;

    out.push({
      x: x0 + dx * t + nx * g,
      y: y0 + dy * t + ny * g,
      r: entre(rng, 0.6, 1.7),
      o: entre(rng, 0.48, 1) * desvanece * caida,
    });
  }
  return out;
}

export type Variante = "rayas" | "ondas" | "punteado" | "crateres";

interface OpcEsfera {
  trazo: string;
  /** Número de líneas de rayado; por defecto se deriva del radio */
  lineas?: number;
}

/**
 * Iluminación lambertiana sobre la esfera, con la luz entrando por arriba a
 * la izquierda y algo de frente. Devuelve 0 (terminador) a ~1 (pleno sol).
 *
 * Esto es lo que faltaba antes: el tono dependía solo de la altura de la
 * línea, así que las esferas se leían como cilindros rayados. Al depender de
 * (x, y) el degradado corre en diagonal y la bola se redondea.
 */
function luz(x: number, y: number, R: number): number {
  const nx = x / R;
  const ny = y / R;
  const q = 1 - nx * nx - ny * ny;
  if (q <= 0) return 0;
  const nz = Math.sqrt(q);
  // Vector de luz ya normalizado
  const d = nx * -0.52 + ny * -0.58 + nz * 0.63;
  return d <= 0 ? 0 : Math.min(1, (d / 0.78) ** 0.7);
}

/**
 * Esfera grabada.
 *
 * El disco va RELLENO y una máscara le talla los surcos: cada surco es un
 * polígono afilado en las puntas cuyo grosor crece hacia la zona en sombra.
 * Donde la luz pega de lleno el surco casi desaparece y la superficie se ve
 * maciza; hacia el terminador el surco se ensancha hasta comerse el carril y
 * la esfera se funde con el vacío. Es exactamente cómo trabaja el buril.
 *
 * Como todo se recorta contra el círculo de la máscara, la silueta es
 * siempre un círculo perfecto por construcción: ni la comba de las líneas ni
 * las ondas pueden desbordarla.
 *
 * Devuelve marcado centrado en (0,0) — quien lo use lo coloca con un
 * <g transform="translate(...)">. La usan TANTO el fondo como el planeta
 * central de la órbita, así que quedan coherentes por construcción.
 */
export function esferaGrabada(
  rng: () => number,
  R: number,
  variante: Variante,
  o: OpcEsfera,
): string {
  const n = o.lineas ?? Math.max(18, Math.round(R / 3.6));
  const espacio = (2 * R) / n;
  const id = uid();
  const surcos: string[] = [];
  const motas: Punto[] = [];

  // Cuántas muestras a lo ancho de cada surco: suficientes para que el
  // grosor siga el degradado diagonal sin inflar el peso del SVG.
  const PASOS = 7;

  /*
   * Campo de onda ÚNICO para toda la esfera: si cada línea sortea su propia
   * amplitud y fase, las ondas se cruzan entre sí y el planeta se lee como
   * una maraña. Con un solo campo —y un desfase que avanza despacio con la
   * altura— las líneas fluyen paralelas, como en la referencia. La amplitud
   * se ata al espaciado para que dos líneas vecinas nunca puedan tocarse.
   */
  const ondaAmp = espacio * entre(rng, 2.1, 3.1);
  const ondaFrec = entre(rng, 1.2, 1.9);
  const ondaFase = rng() * Math.PI * 2;
  // Deriva muy lenta: con amplitud alta, dos líneas vecinas sólo pueden
  // tocarse si sus fases se separan, así que este número manda.
  const ondaDeriva = entre(rng, 0.0006, 0.0018);

  for (let i = 1; i < n; i++) {
    const y = -R + espacio * i;
    const hw = Math.sqrt(Math.max(0, R * R - y * y));
    if (hw < R * 0.05) continue;

    // Bandas oscuras ocasionales, como las de un gigante gaseoso
    const banda = rng() < 0.1 ? 1.9 : 1;
    const jitter = entre(rng, 0.9, 1.12);
    const comba = y * 0.17;

    const arriba: string[] = [];
    const abajo: string[] = [];

    for (let s = 0; s <= PASOS; s++) {
      const u = s / PASOS;
      const x = -hw + 2 * hw * u;

      let cy = y + comba * (1 - (x / hw) ** 2);
      if (variante === "ondas") {
        cy +=
          ondaAmp *
          Math.sin((x / R) * Math.PI * ondaFrec + ondaFase + y * ondaDeriva);
      }

      // Hueco: fino a plena luz, ancho hacia la sombra
      const b = luz(x, y, R);
      const hueco = limitar(0.05 + 0.85 * (1 - b) ** 1.25, 0.04, 0.95);

      // Afilado en las puntas: el surco muere justo en la silueta
      const afila = Math.sin(Math.PI * Math.max(0.001, u)) ** 0.35;
      const h = 0.5 * espacio * hueco * banda * jitter * afila;

      arriba.push(`${s === 0 ? "M" : "L"}${d1(x)} ${d1(cy - h)}`);
      abajo.unshift(`L${d1(x)} ${d1(cy + h)}`);
    }

    surcos.push(`<path d="${arriba.join("")}${abajo.join("")}Z"/>`);
  }

  /*
   * Disolución punteada: en vez de un corte seco entre rayado y puntillismo,
   * se siembran motas negras cuya densidad sube con la sombra. El rayado se
   * deshace en grano de forma gradual, como en la referencia.
   */
  if (variante === "punteado" || variante === "crateres") {
    const area = Math.PI * R * R;
    const cuantos = Math.round(area / (variante === "crateres" ? 14 : 26));
    for (let k = 0; k < cuantos; k++) {
      // Muestreo uniforme dentro del disco
      const ang = rng() * Math.PI * 2;
      const rad = R * Math.sqrt(rng());
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad;
      const b = luz(x, y, R);
      const prob = variante === "crateres" ? 0.35 + 0.5 * (1 - b) : (1 - b) ** 1.4;
      if (rng() > prob) continue;
      motas.push({ x, y, r: entre(rng, 0.6, 2.1), o: 1 });
    }
  }

  /* Cráteres: manchas negras grandes con un reborde claro por el lado del sol */
  const crateres: string[] = [];
  if (variante === "crateres") {
    const cuantos = 3 + Math.floor(rng() * 4);
    for (let k = 0; k < cuantos; k++) {
      const ang = rng() * Math.PI * 2;
      const rad = R * 0.75 * Math.sqrt(rng());
      const cr = R * entre(rng, 0.1, 0.24);
      crateres.push(
        `<circle cx="${d1(Math.cos(ang) * rad)}" cy="${d1(Math.sin(ang) * rad)}" r="${d1(cr)}"/>`,
      );
    }
  }

  const mascara =
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="${d1(-R - 1)}" y="${d1(-R - 1)}" width="${d1(2 * R + 2)}" height="${d1(2 * R + 2)}">` +
    `<circle r="${d1(R)}" fill="#fff"/>` +
    `<g fill="#000">${surcos.join("")}${crateres.join("")}${emitirPlano(motas)}</g>` +
    `</mask>`;

  return (
    `<defs>${mascara}</defs>` +
    `<circle r="${d1(R)}" fill="${o.trazo}" mask="url(#${id})"/>`
  );
}

/** Anillo tipo Saturno: elipses concéntricas achatadas e inclinadas */
function anilloSaturno(
  R: number,
  trazo: string,
  w: number,
  tilt: number,
): string {
  const capas = [
    { rx: R * 1.85, ry: R * 0.42, op: 0.95, sw: w * 3.2 },
    { rx: R * 1.62, ry: R * 0.35, op: 0.7, sw: w * 1.4 },
    { rx: R * 2.05, ry: R * 0.5, op: 0.5, sw: w * 1.2 },
  ];
  const es = capas
    .map(
      (c) =>
        `<ellipse rx="${d1(c.rx)}" ry="${d1(c.ry)}" fill="none" stroke="${trazo}" stroke-width="${d2(c.sw)}" opacity="${c.op}"/>`,
    )
    .join("");
  return `<g transform="rotate(${tilt})">${es}</g>`;
}

/** Luna creciente: un disco al que otro disco desplazado le come el interior */
function creciente(rng: () => number, R: number, trazo: string): string {
  const id = uid();
  return (
    `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${d1(-R - 1)}" y="${d1(-R - 1)}" width="${d1(2 * R + 2)}" height="${d1(2 * R + 2)}">` +
    `<circle r="${d1(R)}" fill="#fff"/>` +
    `<circle cx="${d1(R * 0.45)}" cy="${d1(-R * 0.3)}" r="${d1(R * 0.92)}" fill="#000"/>` +
    `</mask></defs>` +
    `<g mask="url(#${id})">` +
    esferaGrabada(rng, R, "rayas", { trazo, lineas: 16 }) +
    `</g>`
  );
}

export interface Destello {
  x: number;
  y: number;
  r: number;
  dur: number;
  retraso: number;
}

export interface Escena {
  lejano: string;
  medio: string;
  cerca: string;
  cuerpos: string;
  /** Estrellas que parpadean, aparte para poder animarlas en CSS */
  destellos: Destello[];
  ancho: number;
  alto: number;
}

export function generarEscena(trazo = "#C0CAF5"): Escena {
  const rng = sembrar(20260827);

  /* ---- Plano lejano: polvo fino + bandas de nebulosa ---- */
  const polvo = campoEstrellas(rng, 1500, 0.4, 1.05, 0.2, 0.68);
  const nebulosas = [
    ...bandaNebulosa(rng, -200, 820, 1250, 460, 1320, 175),
    ...bandaNebulosa(rng, 760, 1500, 2120, 1150, 1140, 152),
    ...bandaNebulosa(rng, -150, 1960, 980, 2200, 1080, 163),
    ...bandaNebulosa(rng, 1250, 1780, 2100, 2150, 745, 128),
  ];
  const lejano = `<g fill="${trazo}">${emitirPuntos([...polvo, ...nebulosas])}</g>`;

  /* ---- Plano medio ---- */
  const medio = `<g fill="${trazo}">${emitirPuntos(
    campoEstrellas(rng, 520, 0.5, 1.2, 0.2, 0.6),
  )}</g>`;

  /* ---- Plano cercano ---- */
  const cerca = `<g fill="${trazo}">${emitirPuntos(
    campoEstrellas(rng, 130, 1, 2.2, 0.4, 0.9),
  )}</g>`;

  /* ---- Estrellas que parpadean ---- */
  const destellos: Destello[] = Array.from({ length: 90 }, () => ({
    x: d1(rng() * ANCHO),
    y: d1(rng() * ALTO),
    r: d2(entre(rng, 0.9, 2.1)),
    dur: d1(entre(rng, 3, 7)),
    retraso: d1(entre(rng, 0, 7)),
  }));

  /*
   * ---- Cuerpos ----
   * Más grandes que antes (el mayor ~27% del ancho, como en el mockup) y
   * varios RECORTADOS por el borde: es lo que hace que la escena se lea como
   * una ventana a algo mayor y no como una composición cerrada.
   */
  const cuerpos: string[] = [];
  const poner = (x: number, y: number, dentro: string) =>
    cuerpos.push(`<g transform="translate(${x} ${y})">${dentro}</g>`);

  // Grande arriba a la izquierda, mordido por el borde
  poner(190, 330, esferaGrabada(rng, 258, "rayas", { trazo }));
  // Saturno, cortado por la derecha
  poner(
    1830,
    640,
    esferaGrabada(rng, 212, "rayas", { trazo }) +
      anilloSaturno(212, trazo, 1.2, -16),
  );
  poner(1480, 1140, esferaGrabada(rng, 128, "punteado", { trazo }));
  poner(700, 1250, creciente(rng, 64, trazo));
  poner(1080, 1580, esferaGrabada(rng, 96, "rayas", { trazo, lineas: 26 }));
  // Grande abajo a la izquierda, cortado por abajo
  poner(280, 1960, esferaGrabada(rng, 232, "ondas", { trazo }));
  poner(1010, 2030, esferaGrabada(rng, 72, "crateres", { trazo }));
  poner(1800, 1970, esferaGrabada(rng, 98, "crateres", { trazo }));
  poner(150, 1400, esferaGrabada(rng, 40, "crateres", { trazo }));
  poner(1655, 1610, esferaGrabada(rng, 30, "crateres", { trazo }));

  return {
    lejano,
    medio,
    cerca,
    cuerpos: cuerpos.join(""),
    destellos,
    ancho: ANCHO,
    alto: ALTO,
  };
}
