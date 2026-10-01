// Reglas de validación compartidas por formularios y rutas de la API.

export const DNI_REGEX = /^\d{8}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN = 6;
export const MENSAJE_PASSWORD = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`;

export function passwordValida(password) {
  return typeof password === "string" && password.length >= PASSWORD_MIN;
}

// Contraseña temporal fácil de dictar al apoderado (ej. "hue-4821").
export function generarPassword() {
  return `hue-${Math.floor(1000 + Math.random() * 9000)}`;
}
