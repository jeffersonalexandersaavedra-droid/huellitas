"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFecha, hoyISO } from "@/lib/fecha";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";

export default function IncidenciasDocente({ docenteId, aulas, incidencias }) {
  const router = useRouter();
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    aulaId: aulas[0]?.id ?? "",
    fecha: hoyISO(),
  });
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function enviar(event) {
    event.preventDefault();
    setEnviando(true);
    setMensaje("");
    const { error } = await createClient().from("incidencias").insert({
      docente_id: docenteId,
      aula_id: form.aulaId || null,
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim(),
      fecha: form.fecha,
    });
    setEnviando(false);
    if (error) {
      setMensaje(`Error: ${error.message}`);
      return;
    }
    setForm((f) => ({ ...f, titulo: "", descripcion: "" }));
    setMensaje("Incidencia enviada a dirección.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={enviar} className="grid gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
        <Campo label="Título" required className="sm:col-span-2">
          <input
            type="text"
            required
            maxLength={120}
            value={form.titulo}
            onChange={(e) => actualizar("titulo", e.target.value)}
            placeholder="Ej. Caso de agresión verbal en el recreo"
            className={inputClass}
          />
        </Campo>
        <Campo label="Aula">
          <select value={form.aulaId} onChange={(e) => actualizar("aulaId", e.target.value)} className={inputClass}>
            <option value="">General / otra</option>
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Fecha del hecho" required>
          <input
            type="date"
            required
            max={hoyISO()}
            value={form.fecha}
            onChange={(e) => actualizar("fecha", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Descripción" required className="sm:col-span-2">
          <textarea
            required
            rows={6}
            value={form.descripcion}
            onChange={(e) => actualizar("descripcion", e.target.value)}
            placeholder="Qué pasó, quiénes participaron, qué medidas se tomaron..."
            className={inputClass}
          />
        </Campo>
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
          {mensaje && (
            <p className={`text-sm ${mensaje.startsWith("Error") ? "text-rose-600" : "text-emerald-600"}`}>
              {mensaje}
            </p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-60"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
            {enviando ? "Enviando..." : "Enviar a dirección"}
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Mis incidencias enviadas ({incidencias.length})
        </h2>
        {incidencias.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">Aún no has registrado incidencias.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {incidencias.map((i) => (
              <li key={i.id} className="rounded-lg border border-stone-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-huellitas-ink">{i.titulo}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      i.leida ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {i.leida ? "Leída por dirección" : "Sin leer"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {formatFecha(i.fecha)}
                  {i.aulas?.nombre ? ` · ${i.aulas.nombre}` : ""}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-stone-600">{i.descripcion}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
