import {
  siAstro,
  siTypescript,
  siReact,
  siPostgresql,
  siTailwindcss,
  siSpringboot,
  siOpenjdk,
  siPython,
  siGit,
  siFigma,
  siAngular,
  siAndroidstudio,
} from "simple-icons";

/**
 * Categoría. Hoy la órbita es un solo anillo, pero cada tecnología ya la
 * lleva: pasar a anillos concéntricos será agrupar por este campo, sin
 * tocar la animación.
 */
export type Categoria = "lenguaje" | "framework" | "herramienta";

export interface Tech {
  /** Etiqueta visible en el badge */
  nombre: string;
  /** Path SVG en viewBox 24x24 */
  path: string;
  /** Color de marca — texto e icono */
  color: string;
  categoria: Categoria;
  /**
   * Fondo y borde del badge. El diseño los define a mano para las 7
   * tecnologías de los mockups; el resto los deriva TechBadge con color-mix.
   */
  bg?: string;
  border?: string;
}

/**
 * El destello de Claude no está en simple-icons, así que va generado a mano
 * (12 rayos cónicos). Es una aproximación: reemplázalo por el SVG oficial
 * cuando lo tengas.
 */
const CLAUDE_PATH =
  "M13.70 13.25L22.60 12.40L22.60 11.60L13.70 10.75ZM12.85 13.93L20.98 17.65L21.38 16.95L14.10 11.77ZM11.77 14.10L16.95 21.38L17.65 20.98L13.93 12.85ZM10.75 13.70L11.60 22.60L12.40 22.60L13.25 13.70ZM10.07 12.85L6.35 20.98L7.05 21.38L12.23 14.10ZM9.90 11.77L2.62 16.95L3.02 17.65L11.15 13.93ZM10.30 10.75L1.40 11.60L1.40 12.40L10.30 13.25ZM11.15 10.07L3.02 6.35L2.62 7.05L9.90 12.23ZM12.23 9.90L7.05 2.62L6.35 3.02L10.07 11.15ZM13.25 10.30L12.40 1.40L11.60 1.40L10.75 10.30ZM13.93 11.15L17.65 3.02L16.95 2.62L11.77 9.90ZM14.10 12.23L21.38 7.05L20.98 6.35L12.85 10.07Z";

export const TECH = {
  astro: {
    nombre: "Astro",
    path: siAstro.path,
    color: "#FF5D01",
    categoria: "framework",
    bg: "#2E2322",
    border: "#4A2E28",
  },
  typescript: {
    nombre: "Typescript",
    path: siTypescript.path,
    color: "#7AA2F7",
    categoria: "lenguaje",
    bg: "#1C2638",
    border: "#283A56",
  },
  react: {
    nombre: "React",
    path: siReact.path,
    color: "#61DAFB",
    categoria: "framework",
    bg: "#1E293B",
    border: "#2A3A4E",
  },
  postgresql: {
    nombre: "PostgreSQL",
    path: siPostgresql.path,
    color: "#7AA2F7",
    categoria: "herramienta",
    bg: "#1F263E",
    border: "#2D395B",
  },
  tailwind: {
    nombre: "TailwindCSS",
    path: siTailwindcss.path,
    color: "#7DCFFF",
    categoria: "framework",
    bg: "#1E2A38",
    border: "#2C3E55",
  },
  springboot: {
    nombre: "Spring Boot",
    path: siSpringboot.path,
    color: "#9ECE6A",
    categoria: "framework",
    bg: "#222D28",
    border: "#324438",
  },
  java: {
    nombre: "Java",
    path: siOpenjdk.path,
    color: "#FF9E64",
    categoria: "lenguaje",
    bg: "#2C2628",
    border: "#453432",
  },

  /* Sin badge en los mockups todavía — solo aparecen en la órbita */
  python: {
    nombre: "Python",
    path: siPython.path,
    color: "#FFD43B",
    categoria: "lenguaje",
  },
  git: {
    nombre: "Git",
    path: siGit.path,
    color: "#F34F29",
    categoria: "herramienta",
  },
  figma: {
    nombre: "Figma",
    path: siFigma.path,
    color: "#A259FF",
    categoria: "herramienta",
  },
  angular: {
    nombre: "Angular",
    path: siAngular.path,
    color: "#DD0031",
    categoria: "framework",
  },
  androidstudio: {
    nombre: "Android Studio",
    path: siAndroidstudio.path,
    color: "#3DDC84",
    categoria: "herramienta",
  },
  claude: {
    nombre: "Claude",
    path: CLAUDE_PATH,
    color: "#D97757",
    categoria: "herramienta",
  },
} as const satisfies Record<string, Tech>;

export type TechKey = keyof typeof TECH;

/**
 * Las 10 tecnologías del mockup, en el orden en que se reparten por el
 * anillo. Añadir una aquí la mete en la órbita: el reparto angular es
 * automático.
 */
export const ORBITA: TechKey[] = [
  "androidstudio",
  "angular",
  "astro",
  "python",
  "git",
  "figma",
  "postgresql",
  "react",
  "tailwind",
  "claude",
];
