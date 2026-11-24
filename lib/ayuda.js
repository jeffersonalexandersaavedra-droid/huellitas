// Guías de uso del sistema (capacitación del personal). Cada guía lleva a
// su sección; el panel muestra solo las que el rol puede abrir
// (`soloAdmin`: tareas que la secretaria no hace).

export const GUIAS_PERSONAL = [
  {
    id: "matricula",
    titulo: "Matricular a un estudiante",
    ruta: "/admin/estudiantes/nuevo",
    pasos: [
      "Entra a Estudiantes y presiona «Registrar».",
      "Completa los datos del alumno, el aula y la contraseña inicial del portal.",
      "Agrega a sus apoderados y marca al principal (a él se le escriben los recordatorios).",
      "Al guardar se crean solas las 10 pensiones del año (marzo a diciembre).",
      "Entrega al padre su usuario (el DNI del alumno) y la contraseña inicial.",
    ],
  },
  {
    id: "importar",
    titulo: "Cargar varios estudiantes desde Excel",
    ruta: "/admin/estudiantes/importar",
    pasos: [
      "Entra a Estudiantes, presiona «Importar» y descarga la plantilla.",
      "Llénala con una fila por estudiante, sin cambiar los títulos de las columnas.",
      "Súbela, revisa la vista previa y presiona «Importar».",
    ],
  },
  {
    id: "vouchers",
    titulo: "Validar el voucher que envió un padre",
    ruta: "/admin/pagos",
    pasos: [
      "Entra a Pagos › Vouchers por validar.",
      "Presiona «Ver voucher» y busca ese pago en el Yape o el banco del colegio (fecha, monto y nombre).",
      "Si coincide, presiona «Validar»: la pensión pasa a Pagado.",
      "Si no, presiona «Rechazar» y elige el motivo: el padre lo verá en su portal y podrá volver a enviarlo.",
    ],
  },
  {
    id: "caja",
    titulo: "Cobrar en caja (efectivo)",
    ruta: "/admin/pagos?tab=caja",
    pasos: [
      "Entra a Pagos › Registrar pago en caja y busca al estudiante.",
      "Elige cuántas pensiones paga: siempre se cobran en orden, desde la más antigua.",
      "Elige el método y quién pagó, y registra el pago.",
      "Luego puedes entregar su comprobante.",
    ],
  },
  {
    id: "recordatorios",
    titulo: "Recordar las pensiones pendientes",
    ruta: "/admin/pagos?tab=recordatorios",
    pasos: [
      "Entra a Pagos › Recordatorios: aparecen las familias con pensiones atrasadas o por vencer.",
      "Presiona «WhatsApp»: se abre WhatsApp con el mensaje ya escrito y solo presionas Enviar.",
      "Si el colegio activó el correo, también puedes enviarlo por correo a una familia o a toda la lista.",
      "El padre además ve el recordatorio al entrar a su portal.",
    ],
  },
  {
    id: "comprobante",
    titulo: "Entregar un comprobante (ticket o boleta)",
    ruta: "/admin/facturacion",
    pasos: [
      "Entra a Facturación › Dar comprobante de un pago y elige el pago.",
      "Elige el tipo y a nombre de qué apoderado (padre o madre) va.",
      "Imprímelo en la ticketera (80 mm) o en A4. El padre también lo ve en su portal.",
      "Para cobrar otra cosa (certificados, constancias) usa «Cobrar otra cosa».",
    ],
  },
  {
    id: "reportes",
    titulo: "Sacar reportes en Excel",
    ruta: "/admin/reportes",
    pasos: [
      "En Reportes descarga la cobranza del año (quién debe y cuánto) y los pagos recibidos.",
      "En Facturación › Reportes para el contador están las ventas del mes y el cuadre de caja del día.",
    ],
  },
  {
    id: "comunicados",
    titulo: "Publicar un aviso o evento",
    ruta: "/admin/comunicados",
    pasos: [
      "Entra a Comunicados y escribe el título y el mensaje.",
      "Elige para quién es: todo el colegio, un nivel o un aula. Si es un evento, pon la fecha.",
      "Los padres lo ven en «Avisos del colegio» y en su agenda.",
    ],
  },
  {
    id: "descuentos",
    titulo: "Dar un descuento a un estudiante",
    ruta: "/admin/estudiantes",
    soloAdmin: true,
    pasos: [
      "Abre la ficha del estudiante y ve a la sección Descuentos.",
      "Elige el motivo (hermanos, buenas notas u otro) y el monto mensual.",
      "Se resta de cada pensión que aún no se pagó; las pagadas no cambian.",
    ],
  },
  {
    id: "notas",
    titulo: "Revisar notas e informes de progreso",
    ruta: "/admin/notas",
    pasos: [
      "En Notas eliges el aula y ves los niveles de logro que registraron los docentes.",
      "En la ficha del estudiante, «Informe de progreso» muestra la boleta del bimestre lista para imprimir.",
    ],
  },
  {
    id: "contrasenas",
    titulo: "Restablecer una contraseña",
    ruta: "/admin/estudiantes",
    pasos: [
      "Padres: abre la ficha del estudiante y presiona «Restablecer contraseña».",
      "Personal: entra a Configuración › Personal con acceso.",
      "El sistema no tiene «olvidé mi contraseña»: siempre la restablece el colegio.",
    ],
  },
];

export const GUIAS_DOCENTE = [
  {
    id: "notas",
    titulo: "Registrar notas por competencia",
    ruta: "/docente",
    pasos: [
      "En Notas elige el aula, el área y el bimestre.",
      "Marca el nivel de logro (AD, A, B o C) de cada competencia y, si quieres, la conclusión descriptiva.",
      "Guarda. Puedes descargar el registro auxiliar o completar el archivo que bajaste del SIAGIE.",
    ],
  },
  {
    id: "asistencia",
    titulo: "Tomar asistencia",
    ruta: "/docente/asistencia",
    pasos: [
      "En Asistencia elige el aula y la fecha.",
      "Marca a cada alumno: asistió, tardanza, tardanza justificada, falta justificada o injustificada.",
      "Guarda. Los padres lo ven en su portal.",
    ],
  },
  {
    id: "comunicados",
    titulo: "Enviar un comunicado a tus aulas",
    ruta: "/docente/comunicados",
    pasos: [
      "En Comunicados escribe el mensaje y elige una de tus aulas.",
      "Los padres de esa aula lo ven en su portal.",
    ],
  },
  {
    id: "incidencias",
    titulo: "Reportar una incidencia",
    ruta: "/docente/incidencias",
    pasos: [
      "En Incidencias escribe el título, el aula, la fecha y qué ocurrió.",
      "La dirección la recibe en su panel.",
    ],
  },
  {
    id: "perfil",
    titulo: "Actualizar tu perfil",
    ruta: "/docente/perfil",
    pasos: ["En Mi perfil cambia tu foto, tu especialidad y tu trayectoria: los padres las ven en su portal."],
  },
];
