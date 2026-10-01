// Roles del sistema (app_metadata.role) y qué rutas puede abrir cada uno.
// Lo usan el proxy, el login y el menú lateral: una sola fuente de verdad.

export const ROLES = {
  admin: "Administrador",
  secretaria: "Secretaria",
  docente: "Docente",
  estudiante: "Estudiante",
};

// Secciones del panel que también usa la secretaria: matrícula, pagos,
// facturación y reportes.
const SECCIONES_SECRETARIA = [
  "/admin/dashboard",
  "/admin/estudiantes",
  "/admin/pagos",
  "/admin/facturacion",
  "/admin/reportes",
];

const enSeccion = (pathname, base) =>
  pathname === base || pathname.startsWith(`${base}/`);

export function puedeVerRuta(rol, pathname) {
  if (enSeccion(pathname, "/admin")) {
    if (rol === "admin") return true;
    return rol === "secretaria" && SECCIONES_SECRETARIA.some((s) => enSeccion(pathname, s));
  }
  if (enSeccion(pathname, "/docente")) return rol === "docente";
  if (enSeccion(pathname, "/padre")) return rol === "estudiante";
  return true;
}

export function rutaInicio(rol) {
  const inicio = {
    admin: "/admin/dashboard",
    secretaria: "/admin/dashboard",
    docente: "/docente",
    estudiante: "/padre",
  };
  return inicio[rol] ?? null;
}
