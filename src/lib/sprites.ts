/**
 * Sprites de los eventos del fondo, con la MISMA técnica que los planetas:
 * masa sólida con surcos restados por máscara, no contorno de línea.
 *
 * La versión anterior eran dibujos de trazo constante, que es justo lo que no
 * encaja en una página de grabado. Y además estaban dibujados en un viewBox
 * mucho mayor que su tamaño de presentación, así que la mitad del rayado
 * salía a menos de 1px y no llegaba a verse. Aquí el viewBox va 1:1 con los
 * píxeles en pantalla: lo que se dibuja, se ve.
 */
import { esferaGrabada, cintaGrabada, tubo, sembrar, uid } from "./fondo";

export const ASTRO_W = 110;
export const ASTRO_H = 140;
export const OVNI_W = 118;
export const OVNI_H = 50;

type P = [number, number];
/** sup-izq, sup-der, inf-der, inf-izq */
type Quad = [P, P, P, P];

const lerp = (a: P, b: P, t: number): P => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

const quad = (q: Quad) =>
  `<path d="M${q.map((p) => `${p[0]} ${p[1]}`).join("L")}Z"/>`;

/**
 * Talla un panel: surcos horizontales de borde a borde, finos por la
 * izquierda (donde da la luz) y anchos por la derecha. Es el mismo criterio
 * que usa la esfera, aplicado a una superficie plana.
 */
function tallarPanel(q: Quad, espacio = 3.3): string {
  const [tl, tr, br, bl] = q;
  const alto = Math.max(
    Math.hypot(bl[0] - tl[0], bl[1] - tl[1]),
    Math.hypot(br[0] - tr[0], br[1] - tr[1]),
  );
  const n = Math.max(2, Math.round(alto / espacio));
  const out: string[] = [];
  for (let i = 1; i < n; i++) {
    const v = i / n;
    const iz = lerp(tl, bl, v);
    const de = lerp(tr, br, v);
    out.push(
      cintaGrabada(
        iz[0],
        iz[1],
        de[0],
        de[1],
        (u) => espacio * (0.16 + 0.66 * u),
      ),
    );
  }
  return out.join("");
}

/** Surcos cruzando un miembro, para que no quede plano */
function tallarMiembro(pts: P[], radios: number[]): string {
  const out: string[] = [];
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i];
    const r = radios[i] * 1.15;
    const a = pts[i - 1];
    const dx = x - a[0];
    const dy = y - a[1];
    const L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * r;
    const ny = (dx / L) * r;
    out.push(cintaGrabada(x - nx, y - ny, x + nx, y + ny, (u) => 1.5 + 1.2 * u));
  }
  return out.join("");
}

interface Pose {
  /** cx, cy, r */
  casco: [number, number, number];
  visor: boolean;
  mochila: Quad;
  /** En la pose de espaldas lo tapa la mochila */
  torso?: Quad;
  brazos: { pts: P[]; radios: number[] }[];
  piernas: { pts: P[]; radios: number[] }[];
  cordon: P[];
}

const POSES: Record<string, Pose> = {
  /* A la deriva: cuerpo escorzado, miembros descompensados */
  deriva: {
    casco: [58, 33, 21],
    visor: true,
    mochila: [
      [40, 55],
      [79, 51],
      [76, 89],
      [43, 92],
    ],
    torso: [
      [46, 57],
      [74, 54],
      [71, 88],
      [48, 90],
    ],
    brazos: [
      {
        pts: [
          [47, 62],
          [28, 71],
          [15, 88],
        ],
        radios: [6, 5, 4.2],
      },
      {
        pts: [
          [73, 59],
          [91, 46],
          [99, 27],
        ],
        radios: [6, 5, 4.2],
      },
    ],
    piernas: [
      {
        pts: [
          [53, 88],
          [45, 111],
          [50, 131],
        ],
        radios: [7.5, 6, 5],
      },
      {
        pts: [
          [69, 87],
          [84, 106],
          [80, 128],
        ],
        radios: [7.5, 6, 5],
      },
    ],
    cordon: [
      [42, 76],
      [27, 86],
      [12, 76],
      [0, 88],
    ],
  },

  /* De frente pero suelto: simétrico de tronco, asimétrico de miembros */
  frente: {
    casco: [55, 32, 22],
    visor: true,
    mochila: [
      [37, 56],
      [74, 56],
      [72, 91],
      [39, 91],
    ],
    torso: [
      [42, 58],
      [69, 58],
      [66, 90],
      [45, 90],
    ],
    brazos: [
      {
        pts: [
          [43, 63],
          [24, 74],
          [14, 92],
        ],
        radios: [6, 5, 4.2],
      },
      {
        pts: [
          [68, 63],
          [89, 71],
          [98, 87],
        ],
        radios: [6, 5, 4.2],
      },
    ],
    piernas: [
      {
        pts: [
          [50, 90],
          [43, 113],
          [45, 133],
        ],
        radios: [7.5, 6, 5],
      },
      {
        pts: [
          [63, 90],
          [72, 112],
          [69, 132],
        ],
        radios: [7.5, 6, 5],
      },
    ],
    cordon: [
      [39, 79],
      [25, 91],
      [11, 80],
      [0, 91],
    ],
  },

  /* De espaldas, alejándose: manda la mochila, el cordón viene hacia ti */
  espaldas: {
    casco: [55, 29, 18],
    visor: false,
    mochila: [
      [34, 47],
      [77, 47],
      [74, 97],
      [37, 97],
    ],
    brazos: [
      {
        pts: [
          [37, 57],
          [17, 65],
          [7, 80],
        ],
        radios: [6, 5, 4.2],
      },
      {
        pts: [
          [74, 57],
          [94, 65],
          [104, 80],
        ],
        radios: [6, 5, 4.2],
      },
    ],
    piernas: [
      {
        pts: [
          [47, 96],
          [41, 117],
          [44, 136],
        ],
        radios: [7.5, 6, 5],
      },
      {
        pts: [
          [64, 96],
          [72, 117],
          [69, 136],
        ],
        radios: [7.5, 6, 5],
      },
    ],
    cordon: [
      [55, 90],
      [59, 106],
      [49, 120],
      [57, 140],
    ],
  },
};

export const VARIANTES = Object.keys(POSES);

export function astronauta(clave: string, trazo = "#C0CAF5"): string {
  const p = POSES[clave] ?? POSES.deriva;
  const rng = sembrar(4100 + clave.length * 37);
  const id = uid();

  const solidas: string[] = [];
  const surcos: string[] = [];

  // El cordón va primero: queda por detrás de todo
  solidas.push(
    tubo(
      p.cordon,
      p.cordon.map((_, i) => 2.2 - i * 0.35),
    ),
  );

  solidas.push(quad(p.mochila));
  surcos.push(tallarPanel(p.mochila, 3.6));

  if (p.torso) {
    solidas.push(quad(p.torso));
    surcos.push(tallarPanel(p.torso, 3.2));
  }

  for (const m of [...p.brazos, ...p.piernas]) {
    solidas.push(tubo(m.pts, m.radios));
    surcos.push(tallarMiembro(m.pts, m.radios));
  }

  const [cx, cy, r] = p.casco;

  const mascara =
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${ASTRO_W}" height="${ASTRO_H}">` +
    `<g fill="#fff">${solidas.join("")}</g>` +
    `<g fill="#000">${surcos.join("")}</g>` +
    `</mask>`;

  /*
   * El casco es una esfera grabada de verdad: la misma llamada que usa el
   * planeta de la órbita. Así queda emparentado con los planetas del fondo
   * por construcción y no por imitarlos a mano.
   */
  const visor = p.visor
    ? `<ellipse cx="1" cy="-2" rx="${(r * 0.66).toFixed(1)}" ry="${(r * 0.54).toFixed(1)}" fill="#0F1018" opacity="0.62"/>` +
      `<path d="M${(-r * 0.5).toFixed(1)} ${(-r * 0.42).toFixed(1)}a${(r * 0.5).toFixed(1)} ${(r * 0.4).toFixed(1)} 0 0 1 ${(r * 0.42).toFixed(1)} ${(-r * 0.18).toFixed(1)}" fill="none" stroke="${trazo}" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/>`
    : "";

  const casco =
    `<g transform="translate(${cx} ${cy})">` +
    esferaGrabada(rng, r, "rayas", { trazo }) +
    visor +
    `</g>`;

  return (
    `<defs>${mascara}</defs>` +
    `<rect width="${ASTRO_W}" height="${ASTRO_H}" fill="${trazo}" mask="url(#${id})"/>` +
    casco
  );
}

/**
 * El OVNI cruza en 3 segundos: no se le ve el detalle interior, solo la
 * silueta. Por eso va con cúpula gruesa, pocos surcos y las luces intactas,
 * que es lo único que registra el ojo en un cruce rápido.
 */
export function ovni(trazo = "#C0CAF5"): string {
  const id = uid();
  const cx = OVNI_W / 2;
  const cy = 30;
  const rx = OVNI_W / 2 - 2;
  const ry = 9;

  const solidas =
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>` +
    `<path d="M${cx - 26} ${cy - 3}a26 21 0 0 1 52 0Z"/>`;

  // Surcos siguiendo la curvatura: finos a la izquierda, anchos a la derecha
  const surcos: string[] = [];
  for (let i = 1; i <= 4; i++) {
    const v = i / 5;
    const y = cy - 3 - 21 * (1 - v);
    const w = 26 * Math.sqrt(Math.max(0, 1 - (1 - v) ** 2));
    surcos.push(cintaGrabada(cx - w, y, cx + w, y, (u) => 2.4 * (0.2 + 0.8 * u)));
  }
  for (let i = -1; i <= 1; i++) {
    surcos.push(
      cintaGrabada(
        cx - rx * 0.82,
        cy + i * 3.6,
        cx + rx * 0.82,
        cy + i * 3.6,
        (u) => 2.1 * (0.18 + 0.8 * u),
      ),
    );
  }

  const luces = [-40, -20, 0, 20, 40]
    .map(
      (dx, i) =>
        `<circle cx="${cx + dx}" cy="${(cy + 8 - Math.abs(dx) * 0.06).toFixed(1)}" r="${i === 2 ? 3.2 : 2.7}"/>`,
    )
    .join("");

  return (
    `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${OVNI_W}" height="${OVNI_H}">` +
    `<g fill="#fff">${solidas}</g><g fill="#000">${surcos.join("")}</g>` +
    `</mask></defs>` +
    `<rect width="${OVNI_W}" height="${OVNI_H}" fill="${trazo}" mask="url(#${id})"/>` +
    `<g fill="${trazo}" opacity="0.95">${luces}</g>`
  );
}
