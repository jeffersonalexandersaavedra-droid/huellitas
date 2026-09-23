// Contenido por defecto de la página principal (landing). El admin puede
// editar todo esto desde "Menú principal"; lo que edite se guarda en la
// tabla sitio_config y reemplaza estos valores. Los íconos de la propuesta
// son fijos (por posición).

export const SITIO_DEFAULT = {
  hero: {
    titulo: "Educando con Calidad y",
    tituloAccent: "Calidez",
    subtitulo: "I.E.P. Huellitas · Inicial y Primaria en Tocache, San Martín",
    aniosTexto: "Más de 22 años formando estudiantes",
  },
  niveles: {
    inicialDesc:
      "Estímulos para el desarrollo psicomotriz, intelectual y emocional en un ambiente seguro y afectivo.",
    inicialEdades: "3, 4 y 5 años",
    primariaDesc:
      "Alto nivel académico con formación en libertad, liderazgo, pensamiento crítico y valores.",
    primariaGrados: "1° a 6° grado",
  },
  nosotros: {
    parrafo1:
      "La I.E.P. Huellitas es una institución educativa privada ubicada en la provincia de Tocache, San Martín. Con más de dos décadas de trayectoria, nos hemos consolidado como referente educativo en la región.",
    parrafo2:
      "Brindamos educación de calidad en los niveles de Inicial y Primaria, formando estudiantes íntegros, con valores sólidos, capacidad crítica y preparados para los desafíos del futuro.",
  },
  stats: [
    { valor: "22+", label: "años de trayectoria" },
    { valor: "170+", label: "estudiantes matriculados" },
    { valor: "2", label: "niveles educativos" },
  ],
  propuesta: [
    { titulo: "Educación en Valores", desc: "Formamos en respeto, empatía y convivencia." },
    { titulo: "Departamento de Psicología", desc: "Apoyo emocional e inteligencia emocional." },
    { titulo: "Actividades Deportivas", desc: "Formación física e integral a través del deporte." },
    { titulo: "Talleres Artísticos", desc: "Música y danza para la expresión creativa." },
    { titulo: "Aulas Conectadas", desc: "Tecnología al servicio del aprendizaje." },
    { titulo: "Escuela para Padres", desc: "Charlas y talleres para la familia." },
  ],
  contacto: {
    ubicacion: "Tocache, San Martín, Perú",
    horario: "Lun a Vie · Hasta 18:00",
    facebookLabel: "@iephuellitastocache",
    facebookUrl: "https://www.facebook.com/iephuellitastocache",
  },
  directivos: [
    {
      inicial: "D",
      nombre: "Daysi Reátegui Peláez",
      cargo: "Promotora",
      telefono: "942 608 498",
      email: "daysireategui@gmail.com",
    },
    {
      inicial: "R",
      nombre: "Richter Henry Salas Rivera",
      cargo: "Administrador",
      telefono: "950 617 019",
      email: "richterhenrysalas@gmail.com",
    },
  ],
};

// Une el contenido guardado con los valores por defecto (por sección).
export function mergeSitio(guardado) {
  const g = guardado || {};
  return {
    hero: { ...SITIO_DEFAULT.hero, ...(g.hero || {}) },
    niveles: { ...SITIO_DEFAULT.niveles, ...(g.niveles || {}) },
    nosotros: { ...SITIO_DEFAULT.nosotros, ...(g.nosotros || {}) },
    stats: Array.isArray(g.stats) && g.stats.length ? g.stats : SITIO_DEFAULT.stats,
    propuesta:
      Array.isArray(g.propuesta) && g.propuesta.length
        ? g.propuesta
        : SITIO_DEFAULT.propuesta,
    contacto: { ...SITIO_DEFAULT.contacto, ...(g.contacto || {}) },
    directivos:
      Array.isArray(g.directivos) && g.directivos.length
        ? g.directivos
        : SITIO_DEFAULT.directivos,
  };
}

// Genera el enlace de WhatsApp a partir de un teléfono peruano.
export function waLink(telefono, nombre) {
  const num = String(telefono || "").replace(/\D/g, "");
  const full = num.length === 9 ? `51${num}` : num;
  const texto = encodeURIComponent(
    `Hola ${nombre || ""}, me comunico desde la web de Huellitas`
  );
  return `https://wa.me/${full}?text=${texto}`;
}
