// Datos oficiales de la institución (contrato, boleta preventiva y
// correos internos de las cuentas que entran con DNI).

export const COLEGIO = {
  nombre: "I.E.P. Huellitas",
  ruc: "10009613574",
  direccion: "Jr. Pedro Gómez 437, Tocache – San Martín",
  correo: "colegiohuellitastocache@gmail.com",
  dre: "DRE San Martín",
  ugel: "UGEL Tocache",
  directora: "Daysi Reátegui Peláez",
  // Código de inscripción de los bancos de datos ante la ANPD (Ley 29733).
  // Se muestra en la política de privacidad cuando se complete.
  registroAnpd: null,
  // Fecha de la última actualización de la política de privacidad y los términos.
  textosLegalesActualizados: "5 de octubre de 2026",
};

// Correo de acceso para quien no tiene uno propio (alumnos, y docentes que
// solo entran con DNI). Supabase exige un correo por cuenta: se usa el Gmail
// del colegio con "+", así cualquier aviso llega a la bandeja del colegio y
// nunca a un dominio ajeno. tipo: "alumno" | "docente".
export function correoInterno(tipo, dni) {
  const [usuario, dominio] = COLEGIO.correo.split("@");
  return `${usuario}+${tipo}${dni}@${dominio}`;
}
