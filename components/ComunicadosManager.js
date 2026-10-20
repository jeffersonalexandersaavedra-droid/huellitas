"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Megaphone, Send, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFecha, diaYMes, hoyISO } from "@/lib/fecha";
import { columnasDestino, destinoDe } from "@/lib/comunicados";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";
import AvisoVacio from "@/components/AvisoVacio";

const formularioVacio = (destino) => ({ titulo: "", mensaje: "", destino, fechaEvento: "" });

// Publicar avisos para los padres (y verlos en su portal). Con fecha de
// evento, el aviso también sale en la agenda "Próximas fechas".
//   destinos: [{ valor, label }] (ver opcionesDestino)
//   puedeBorrarTodo: el personal borra cualquiera; el docente, solo los suyos.
export default function ComunicadosManager({ destinos, comunicados, usuarioId, puedeBorrarTodo }) {
  const router = useRouter();
  const [form, setForm] = useState(() => formularioVacio(destinos[0]?.valor ?? ""));
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [porBorrar, setPorBorrar] = useState(null);

  const actualizar = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function publicar(event) {
    event.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setMensaje("");
    const { error } = await createClient()
      .from("comunicados")
      .insert({
        titulo: form.titulo.trim(),
        mensaje: form.mensaje.trim(),
        fecha_evento: form.fechaEvento || null,
        ...columnasDestino(form.destino),
      });
    setEnviando(false);
    if (error) return setMensaje(`Error: no se pudo publicar (${error.message}).`);
    setForm(formularioVacio(form.destino));
    setMensaje("¡Listo! Los padres ya pueden ver el aviso en su portal.");
    router.refresh();
  }

  async function borrar(id) {
    const { error } = await createClient().from("comunicados").delete().eq("id", id);
    setPorBorrar(null);
    if (error) return setMensaje(`Error: no se pudo borrar (${error.message}).`);
    router.refresh();
  }

  if (!destinos.length) {
    return <AvisoVacio icono={Megaphone}>Aún no tienes aulas asignadas para enviar avisos.</AvisoVacio>;
  }

  return (
    <div className="space-y-6">
      <form onSubmit={publicar} className="grid gap-4 rounded-xl bg-white p-6 shadow-sm sm:grid-cols-2">
        <Campo label="Título del aviso" required className="sm:col-span-2" ayuda="Ejemplo: Reunión de padres de familia">
          <input
            type="text"
            required
            minLength={3}
            maxLength={120}
            value={form.titulo}
            onChange={(e) => actualizar("titulo", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="¿Para quién es?" required>
          <select value={form.destino} onChange={(e) => actualizar("destino", e.target.value)} className={inputClass}>
            {destinos.map((d) => (
              <option key={d.valor} value={d.valor}>
                {d.label}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Fecha del evento (opcional)" ayuda="Si pones una fecha, sale en la agenda de los padres.">
          <input
            type="date"
            min={hoyISO()}
            value={form.fechaEvento}
            onChange={(e) => actualizar("fechaEvento", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Mensaje" required className="sm:col-span-2" ayuda="Qué, cuándo, dónde y qué deben traer o hacer.">
          <textarea
            required
            minLength={3}
            maxLength={2000}
            rows={5}
            value={form.mensaje}
            onChange={(e) => actualizar("mensaje", e.target.value)}
            className={inputClass}
          />
        </Campo>
        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-end">
          {mensaje && (
            <p className={`text-sm ${mensaje.startsWith("Error") ? "text-rose-600" : "text-emerald-600"}`}>{mensaje}</p>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-60"
          >
            <Send className="h-4 w-4" strokeWidth={2} />
            {enviando ? "Publicando..." : "Publicar aviso"}
          </button>
        </div>
      </form>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-huellitas-primary">
          Avisos publicados ({comunicados.length})
        </h2>
        {comunicados.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">Aún no hay avisos publicados.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {comunicados.map((c) => (
              <li key={c.id} className="rounded-lg border border-stone-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-huellitas-ink">{c.titulo}</p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {c.autor} · {formatFecha(c.created_at)} · Para: {destinoDe(c)}
                    </p>
                  </div>
                  {c.fecha_evento && (
                    <span className="flex items-center gap-1 rounded-full bg-huellitas-accent/20 px-2 py-0.5 text-xs font-medium text-huellitas-ink">
                      <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                      {diaYMes(c.fecha_evento)}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-stone-600">{c.mensaje}</p>
                {(puedeBorrarTodo || c.autor_id === usuarioId) && (
                  <div className="mt-3 flex justify-end gap-2 text-xs">
                    {porBorrar === c.id ? (
                      <>
                        <span className="self-center text-stone-500">¿Borrar este aviso?</span>
                        <button type="button" onClick={() => setPorBorrar(null)} className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-600 hover:bg-stone-50">
                          No
                        </button>
                        <button type="button" onClick={() => borrar(c.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700">
                          Sí, borrar
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setPorBorrar(c.id)} className="flex items-center gap-1 font-medium text-stone-400 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        Borrar
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
