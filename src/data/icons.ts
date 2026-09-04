import { siGithub, siInstagram } from "simple-icons";

/**
 * Iconos que no son de tecnologías. Todos en viewBox 24x24.
 * LinkedIn no está en simple-icons (retirado del set), va a mano.
 */
export const ICONS = {
  github: siGithub.path,
  instagram: siInstagram.path,
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  pdf: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z",
} as const;

export type IconKey = keyof typeof ICONS;

export const SOCIALS = [
  {
    nombre: "Instagram",
    icon: "instagram" as const,
    url: "https://www.instagram.com/jos3_cf/",
  },
  { nombre: "Github", icon: "github" as const, url: "https://github.com/josecur" },
  {
    nombre: "LinkedIn",
    icon: "linkedin" as const,
    url: "https://www.linkedin.com/in/jose-cordova-fernandez-33a512342/",
  },
];

export const PERFIL = {
  nombre: "JOSÉ CÓRDOVA",
  titulo: "Ingeniero de Sistemas de Información",
  rol: "FULLSTACK DEVELOPER",
  estado: "Buscando Trabajo",
  universidad: "Universidad San Ignacio de Loyola",
  email: "josecordovafernand3z@gmail.com",
  bio: "Estudiante de 9no ciclo multidisciplinario con experiencia en el diseño e implementación de soluciones integrales. Especializado en el desarrollo de interfaces web con Astro, React, Angular y TypeScript. Cuento con experiencia en el modelado relacional y creación de dashboards en Power BI mediante DAX. Adicionalmente, poseo conocimientos en la integración de modelos de inteligencia artificial (API de Ollama) con Python y análisis de tráfico de red, respaldado por una sólida base en infraestructura de servidores y contenedores.",
  prompt: "┌──(josec@JOSE-CF)-[System32]\n└─//cat README.md",
};
