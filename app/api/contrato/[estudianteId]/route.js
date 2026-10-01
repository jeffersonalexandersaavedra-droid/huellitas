import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { createClient } from "@/lib/supabase/server";
import { usuarioConRol, respuestaError, noAutorizado } from "@/lib/api";
import { fechaLarga } from "@/lib/fecha";
import { NIVELES } from "@/lib/grados";

// Plantilla oficial del colegio con etiquetas {padre_nombre}, {grado}, etc.
// Cuando cambie el contrato (cada año) basta reemplazar este .docx
// manteniendo las mismas etiquetas.
const PLANTILLA = "/plantillas/contrato_servicio_educativo.docx";

const mayus = (texto) => (texto ?? "").toUpperCase();

// Contrato de servicio educativo autollenado con los datos de la matrícula.
export async function GET(request, { params }) {
  if (!(await usuarioConRol("admin", "secretaria"))) return noAutorizado();

  const { estudianteId } = await params;
  const supabase = await createClient();

  const [{ data: estudiante }, { data: matricula }, { data: vinculos }] = await Promise.all([
    supabase
      .from("estudiantes")
      .select("dni, nombres, apellidos")
      .eq("id", estudianteId)
      .maybeSingle(),
    supabase
      .from("matriculas")
      .select("fecha_matricula, aulas(nombre, nivel)")
      .eq("estudiante_id", estudianteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("estudiante_apoderado")
      .select("es_principal, apoderados(nombres, apellidos, dni, telefono, email, direccion)")
      .eq("estudiante_id", estudianteId)
      .order("es_principal", { ascending: false })
      .limit(1),
  ]);

  if (!estudiante) return respuestaError("No se encontró el estudiante.", 404);
  if (!matricula) return respuestaError("El estudiante no tiene matrícula.", 404);

  const plantilla = await fetch(new URL(PLANTILLA, request.nextUrl.origin));
  if (!plantilla.ok) return respuestaError("No se encontró la plantilla del contrato.", 500);

  const apoderado = vinculos?.[0]?.apoderados ?? {};
  const doc = new Docxtemplater(new PizZip(await plantilla.arrayBuffer()), {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
  });

  doc.render({
    padre_nombre: mayus([apoderado.apellidos, apoderado.nombres].filter(Boolean).join(", ")),
    padre_dni: apoderado.dni,
    padre_telefono: apoderado.telefono,
    padre_domicilio: apoderado.direccion,
    padre_correo: apoderado.email,
    estudiante_nombre: mayus(`${estudiante.apellidos}, ${estudiante.nombres}`),
    estudiante_dni: estudiante.dni,
    nivel: NIVELES[matricula.aulas?.nivel] ?? "",
    grado: matricula.aulas?.nombre ?? "",
    fecha: fechaLarga(matricula.fecha_matricula ?? new Date()),
  });

  const archivo = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

  return new Response(archivo, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="Contrato_${estudiante.dni}.docx"`,
    },
  });
}
