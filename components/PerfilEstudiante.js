"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subirFotoPerfil } from "@/lib/archivos";
import PortadaPerfil from "@/components/PortadaPerfil";

// Perfil del estudiante: portada del colegio, foto opcional (si no hay, sus
// iniciales) y accesos a la boleta preventiva y la lista de útiles.
export default function PerfilEstudiante({ estudiante, aula, anio, listaUtilesUrl }) {
  const router = useRouter();
  const [fotoUrl, setFotoUrl] = useState(estudiante.foto_url ?? null);
  const [aviso, setAviso] = useState("");

  async function cambiarFoto(file) {
    if (!file) return;
    setAviso("Subiendo foto...");
    try {
      const supabase = createClient();
      const url = await subirFotoPerfil(supabase, file);
      const { error } = await supabase
        .from("estudiantes")
        .update({ foto_url: url })
        .eq("id", estudiante.id);
      if (error) throw new Error("No se pudo guardar la foto.");
      setFotoUrl(url);
      setAviso("");
      router.refresh();
    } catch (e) {
      setAviso(e.message);
    }
  }

  const acceso =
    "flex items-center gap-3 rounded-xl border border-stone-200 px-4 py-3 transition-colors";

  return (
    <PortadaPerfil
      nombre={`${estudiante.nombres} ${estudiante.apellidos}`}
      fotoUrl={fotoUrl}
      etiqueta={`Estudiante · Año escolar ${anio}`}
      detalles={[aula, `DNI ${estudiante.dni}`].filter(Boolean)}
      onFoto={cambiarFoto}
      aviso={aviso}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/padre/boleta" className={`${acceso} hover:border-huellitas-primary hover:bg-huellitas-primary-light/40`}>
          <FileText className="h-6 w-6 shrink-0 text-huellitas-primary" strokeWidth={2} />
          <span>
            <span className="block text-sm font-semibold text-huellitas-ink">Boleta preventiva</span>
            <span className="block text-xs text-stone-500">Vista previa del Informe de progreso para imprimir</span>
          </span>
        </Link>
        {listaUtilesUrl ? (
          <a
            href={listaUtilesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${acceso} hover:border-huellitas-primary hover:bg-huellitas-primary-light/40`}
          >
            <ClipboardList className="h-6 w-6 shrink-0 text-huellitas-primary" strokeWidth={2} />
            <span>
              <span className="block text-sm font-semibold text-huellitas-ink">Lista de útiles</span>
              <span className="block text-xs text-stone-500">Descargar la lista de {aula}</span>
            </span>
          </a>
        ) : (
          <div className={`${acceso} text-stone-400`}>
            <ClipboardList className="h-6 w-6 shrink-0" strokeWidth={2} />
            <span className="text-sm">La lista de útiles aún no está publicada.</span>
          </div>
        )}
      </div>
    </PortadaPerfil>
  );
}
