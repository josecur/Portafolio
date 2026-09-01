import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

const proyectos = defineCollection({
  loader: file("src/content/proyectos.json"),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    imagen: z.string(),
    techs: z.array(z.string()),
    repo: z.string().url(),
  }),
});

const certificados = defineCollection({
  loader: file("src/content/certificados.json"),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    imagen: z.string(),
    nivel: z.string(),
    horas: z.number(),
    pdf: z.string(),
  }),
});

const participaciones = defineCollection({
  loader: file("src/content/participaciones.json"),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    imagen: z.string(),
    horas: z.number(),
    pdf: z.string(),
  }),
});

export const collections = { proyectos, certificados, participaciones };
