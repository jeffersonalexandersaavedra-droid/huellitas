"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpenText, ChevronDown, Send } from "lucide-react";
import AvisoVacio from "@/components/AvisoVacio";
import HojaReclamacion from "@/components/HojaReclamacion";
import { inputClass } from "@/lib/ui";
import { formatFecha } from "@/lib/fecha";
import { TIPOS_RECLAMACION, codigoReclamacion, fechaLimite } from "@/lib/reclamaciones";

// Hojas del Libro de Reclamaciones: las pendientes primero, con los días
// que quedan para responder. La respuesta se envía al correo del consumidor.
export default function ReclamacionesAdmin({ hojas, correoActivo }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(null);
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [ahora] = useState(() => Date.now());

  if (hojas.length === 0) {
    return <AvisoVacio icono={BookOpenText}>Aún no hay hojas de reclamación registradas.</AvisoVacio>;
  }

  async function responder(hoja) {
    setEnviando(true);
    setMensaje(null);
    try {
      const res = await fetch(`/api/reclamaciones/${hoja.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuesta }),
      });
      const r = await res.json();
      if (r.error) setMensaje({ tipo: "error", texto: r.error });
      else {
        setMensaje({
          tipo: "ok",
          texto: r.enviada
            ? `Respuesta guardada y enviada a ${hoja.consumidor_email}.`
            : `Respuesta guardada. Envíala también a ${hoja.consumidor_email} (el envío automático de correos no está configurado).`,
        });
        setRespuesta("");
        router.refresh();
      }
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor." });
    }
    setEnviando(false);
  }

  return (
    <div className="space-y-3">
      {!correoActivo && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          El envío automático de correos no está configurado: la copia de cada hoja y tu respuesta deben
          enviarse manualmente al correo del consumidor.
        </p>
      )}
      {mensaje && (
        <p
          className={`rounded-lg px-4 py-3 text-sm ${
            mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      {hojas.map((h) => {
        const pendiente = !h.respuesta;
        const limite = fechaLimite(h.created_at);
        const vencida = pendiente && limite < ahora;
        const expandida = abierta === h.id;
        return (
          <div key={h.id} className={`rounded-xl bg-white shadow-sm ${pendiente ? "border-l-4 border-amber-400" : ""}`}>
            <button
              type="button"
              onClick={() => {
                setAbierta(expandida ? null : h.id);
                setMensaje(null);
              }}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div className="min-w-0">
                <p className="font-medium text-huellitas-ink">
                  {TIPOS_RECLAMACION[h.tipo].titulo} N.° {codigoReclamacion(h)}
                </p>
                <p className="truncate text-sm text-stone-500">
                  {h.consumidor_nombre} · {formatFecha(h.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    !pendiente
                      ? "bg-emerald-50 text-emerald-700"
                      : vencida
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {!pendiente ? "Respondida" : vencida ? "Plazo vencido" : `Responder hasta el ${formatFecha(limite)}`}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-stone-400 transition-transform ${expandida ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </div>
            </button>

            {expandida && (
              <div className="space-y-4 border-t border-stone-100 p-4">
                <HojaReclamacion hoja={h} />
                {pendiente && (
                  <div className="space-y-2">
                    <textarea
                      value={respuesta}
                      onChange={(e) => setRespuesta(e.target.value)}
                      rows={4}
                      maxLength={3000}
                      placeholder="Observaciones y acciones adoptadas por el colegio"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      disabled={enviando || !respuesta.trim()}
                      onClick={() => responder(h)}
                      className="flex items-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" strokeWidth={2} />
                      {enviando ? "Enviando..." : "Responder"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
