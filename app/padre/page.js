import { createClient } from "@/lib/supabase/server";
import { estudianteActual, matriculaVigente, areasPorNivel, comunicadosRecientes } from "@/lib/consultas";
import { hoyISO, haceDias } from "@/lib/fecha";
import { enlacesDeArchivos } from "@/lib/emision";
import PadreDashboard from "@/components/PadreDashboard";
import AvisoVacio from "@/components/AvisoVacio";

const DIAS_AVISO_NUEVO = 3;
const DIAS_RECHAZO_VISIBLE = 45;

export default async function PadrePage() {
  const supabase = await createClient();

  const estudiante = await estudianteActual(
    supabase,
    "id, dni, nombres, apellidos, password_cambiado, foto_url"
  );
  if (!estudiante) {
    return (
      <AvisoVacio>
        No encontramos tu información de estudiante. Comunícate con administración.
      </AvisoVacio>
    );
  }

  const matricula = await matriculaVigente(
    supabase,
    estudiante.id,
    "id, aulas(nombre, nivel, lista_utiles_url), anios_escolares(anio)"
  );
  if (!matricula) {
    return (
      <AvisoVacio>No tienes una matrícula activa este año. Comunícate con administración.</AvisoVacio>
    );
  }

  const [
    { data: cuotas },
    { data: notas },
    { data: observaciones },
    { data: vinculos },
    { data: docentes },
    { data: comprobantes },
    areas,
    avisos,
    { data: agenda },
    { data: asistencias },
    { data: rechazados },
  ] = await Promise.all([
    supabase
      .from("cuotas")
      .select("id, mes, monto, monto_con_descuento, fecha_vencimiento, estado, conceptos_cobro(nombre, tipo)")
      .eq("matricula_id", matricula.id)
      .order("mes", { ascending: true }),
    supabase
      .from("notas_curso")
      .select("curso, competencia, bimestre, nota, conclusion")
      .eq("matricula_id", matricula.id),
    supabase
      .from("observaciones_estudiante")
      .select("id, bimestre, texto")
      .eq("matricula_id", matricula.id)
      .order("bimestre", { ascending: true }),
    supabase
      .from("estudiante_apoderado")
      .select("es_principal, apoderados(id, nombres, apellidos, parentesco)")
      .eq("estudiante_id", estudiante.id)
      .order("es_principal", { ascending: false }),
    supabase.rpc("mis_docentes"),
    supabase
      .from("comprobantes")
      .select("id, tipo, serie, numero, fecha_emision, total, estado, items, enlace_pdf, archivo_path")
      .eq("matricula_id", matricula.id)
      .order("fecha_emision", { ascending: false }),
    areasPorNivel(supabase),
    comunicadosRecientes(supabase, 10),
    supabase
      .from("comunicados")
      .select("id, titulo, fecha_evento")
      .gte("fecha_evento", hoyISO())
      .order("fecha_evento", { ascending: true })
      .limit(6),
    supabase.from("asistencias").select("fecha, estado").eq("matricula_id", matricula.id),
    supabase
      .from("pagos")
      .select("id, monto, fecha_pago, motivo_rechazo, cuota_id, cuotas_ids")
      .eq("matricula_id", matricula.id)
      .eq("estado", "rechazado")
      .gte("fecha_validacion", haceDias(DIAS_RECHAZO_VISIBLE).toISOString())
      .order("fecha_validacion", { ascending: false }),
  ]);
  const enlaces = await enlacesDeArchivos(comprobantes ?? []);
  const desdeNuevo = haceDias(DIAS_AVISO_NUEVO);

  return (
    <PadreDashboard
      estudiante={estudiante}
      matricula={matricula}
      cuotas={cuotas ?? []}
      areas={areas[matricula.aulas?.nivel] ?? []}
      notas={notas ?? []}
      observaciones={observaciones ?? []}
      apoderados={(vinculos ?? []).map((v) => v.apoderados).filter(Boolean)}
      docentes={docentes ?? []}
      comprobantes={(comprobantes ?? []).map((c) => ({ ...c, archivo_url: enlaces[c.id] ?? null }))}
      avisos={avisos.map((a) => ({ ...a, nuevo: new Date(a.created_at) > desdeNuevo }))}
      agenda={agenda ?? []}
      asistencias={asistencias ?? []}
      rechazados={rechazados ?? []}
    />
  );
}
