"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFecha } from "@/lib/fecha";
import AvisoVacio from "@/components/AvisoVacio";

export default function IncidenciasAdmin({ incidencias }) {
  const router = useRouter();
  const [soloSinLeer, setSoloSinLeer] = useState(false);
  const [abierta, setAbierta] = useState(null);

  const visibles = soloSinLeer ? incidencias.filter((i) => !i.leida) : incidencias;
  const sinLeer = incidencias.filter((i) => !i.leida).length;

  async function marcarLeida(incidencia, leida) {
    const { error } = await createClient()
      .from("incidencias")
      .update({ leida })
      .eq("id", incidencia.id);
    if (!error) router.refresh();
  }

  if (incidencias.length === 0) {
    return <AvisoVacio icono={ShieldAlert}>Los docentes aún no han enviado incidencias.</AvisoVacio>;
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={soloSinLeer}
          onChange={(e) => setSoloSinLeer(e.target.checked)}
          className="accent-huellitas-primary"
        />
        Mostrar solo sin leer ({sinLeer})
      </label>

      {visibles.map((i) => {
        const docente = i.docentes ? `${i.docentes.nombres} ${i.docentes.apellidos}` : "Docente";
        const expandida = abierta === i.id;
        return (
          <div
            key={i.id}
            className={`rounded-xl bg-white p-5 shadow-sm ${i.leida ? "" : "border-l-4 border-rose-400"}`}
          >
            <button
              type="button"
              onClick={() => {
                setAbierta(expandida ? null : i.id);
                if (!i.leida) marcarLeida(i, true);
              }}
              className="w-full text-left"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-huellitas-ink">{i.titulo}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    i.leida ? "bg-stone-100 text-stone-500" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {i.leida ? "Leída" : "Nueva"}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {docente} · {formatFecha(i.fecha)}
                {i.aulas?.nombre ? ` · ${i.aulas.nombre}` : ""}
              </p>
            </button>

            {expandida && (
              <div className="mt-3 border-t border-stone-100 pt-3">
                <p className="whitespace-pre-line text-sm text-stone-700">{i.descripcion}</p>
                {i.leida && (
                  <button
                    type="button"
                    onClick={() => marcarLeida(i, false)}
                    className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-huellitas-primary"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    Marcar como no leída
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
