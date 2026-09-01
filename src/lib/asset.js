// Los ficheros de `public/` se sirven bajo el `base` de Vite (`/gym/` en
// producción), así que cualquier ruta absoluta escrita a mano debe pasar
// por aquí en vez de asumir la raíz del dominio.
export function asset(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}
