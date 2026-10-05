"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import Campo from "@/components/Campo";
import HojaReclamacion from "@/components/HojaReclamacion";
import ImprimirButton from "@/components/ImprimirButton";
import { controlClass, inputClass } from "@/lib/ui";
import {
  RECLAMACION_VACIA,
  TIPOS_RECLAMACION,
  DOCUMENTOS_RECLAMACION,
  LIMITES,
  PLAZO_DIAS_HABILES,
  errorReclamacion,
  codigoReclamacion,
} from "@/lib/reclamaciones";

// Hoja de reclamación virtual. Al registrarla se muestra la constancia
// (para imprimir o guardar) y se envía una copia al correo indicado.
export default function FormularioReclamacion() {
  const [datos, setDatos] = useState(RECLAMACION_VACIA);
  const [trampa, setTrampa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [registrada, setRegistrada] = useState(null);

  const cambiar = (campo) => (e) =>
    setDatos({ ...datos, [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const texto = (campo, props = {}) => (
    <input value={datos[campo]} onChange={cambiar(campo)} maxLength={LIMITES[campo]} className={inputClass} {...props} />
  );

  async function registrar(event) {
    event.preventDefault();
    const problema = errorReclamacion(datos);
    if (problema) return setError(problema);
    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...datos, sitio_web: trampa }),
      });
      const r = await res.json();
      if (r.error) setError(r.error);
      else {
        setRegistrada(r);
        window.scrollTo({ top: 0 });
      }
    } catch {
      setError("No se pudo conectar. Revisa tu internet e inténtalo de nuevo.");
    }
    setEnviando(false);
  }

  if (registrada) {
    const { hoja, copiaEnviada } = registrada;
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 print:hidden">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
          <div>
            <p className="font-semibold">Tu {TIPOS_RECLAMACION[hoja.tipo].titulo.toLowerCase()} fue registrado con el N.° {codigoReclamacion(hoja)}.</p>
            <p className="mt-1">
              {copiaEnviada
                ? `Enviamos una copia a ${hoja.consumidor_email}. `
                : "Guarda o imprime esta constancia. "}
              El colegio te responderá en un plazo máximo de {PLAZO_DIAS_HABILES} días hábiles.
            </p>
          </div>
        </div>
        <div className="print:hidden">
          <ImprimirButton label="Imprimir o guardar constancia" />
        </div>
        <HojaReclamacion hoja={hoja} />
      </div>
    );
  }

  return (
    <form onSubmit={registrar} className="space-y-6 rounded-xl bg-white p-5 shadow-sm sm:p-6" noValidate>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        {Object.entries(TIPOS_RECLAMACION).map(([valor, tipo]) => (
          <label
            key={valor}
            className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${
              datos.tipo === valor ? "border-huellitas-primary bg-huellitas-primary-light" : "border-stone-200"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              checked={datos.tipo === valor}
              onChange={() => setDatos({ ...datos, tipo: valor })}
              className="mt-0.5 accent-huellitas-primary"
            />
            <span>
              <b className="text-huellitas-ink">{tipo.titulo}</b>
              <span className="block text-xs text-stone-500">{tipo.ayuda}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="font-display text-lg font-semibold text-huellitas-primary">1. Tus datos</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Campo label="Nombre completo" required className="sm:col-span-2">
            {texto("consumidor_nombre", { autoComplete: "name" })}
          </Campo>
          <Campo label="Documento" required>
            <div className="flex gap-2">
              <select value={datos.consumidor_tipo_doc} onChange={cambiar("consumidor_tipo_doc")} className={`${controlClass} w-28 shrink-0`}>
                {DOCUMENTOS_RECLAMACION.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              {texto("consumidor_documento", { inputMode: datos.consumidor_tipo_doc === "DNI" ? "numeric" : "text" })}
            </div>
          </Campo>
          <Campo label="Teléfono">{texto("consumidor_telefono", { type: "tel", autoComplete: "tel" })}</Campo>
          <Campo label="Domicilio" required className="sm:col-span-2">
            {texto("consumidor_domicilio", { autoComplete: "street-address" })}
          </Campo>
          <Campo label="Correo electrónico (recibirás la copia y la respuesta)" required className="sm:col-span-2">
            {texto("consumidor_email", { type: "email", autoComplete: "email" })}
          </Campo>
          <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
            <input type="checkbox" checked={datos.menor_de_edad} onChange={cambiar("menor_de_edad")} className="accent-huellitas-primary" />
            Soy menor de edad
          </label>
          {datos.menor_de_edad && (
            <Campo label="Nombre del padre, madre o apoderado" required className="sm:col-span-2">
              {texto("apoderado_nombre")}
            </Campo>
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-lg font-semibold text-huellitas-primary">2. ¿Sobre qué es?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Campo label="Tipo">
            <select value={datos.bien_tipo} onChange={cambiar("bien_tipo")} className={inputClass}>
              <option value="servicio">Servicio</option>
              <option value="producto">Producto</option>
            </select>
          </Campo>
          <Campo label="Monto reclamado (S/)">
            <input type="number" min="0" step="0.01" value={datos.monto} onChange={cambiar("monto")} className={inputClass} />
          </Campo>
          <Campo label="Descripción" required className="sm:col-span-3">
            {texto("bien_descripcion", { placeholder: "Ej. Servicio educativo – 3.° de primaria" })}
          </Campo>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-display text-lg font-semibold text-huellitas-primary">3. Detalle y pedido</legend>
        <div className="mt-3 space-y-3">
          <Campo label="Detalle" required>
            <textarea value={datos.detalle} onChange={cambiar("detalle")} maxLength={LIMITES.detalle} rows={5} className={inputClass} />
          </Campo>
          <Campo label="¿Qué solicitas al colegio?" required>
            <textarea value={datos.pedido} onChange={cambiar("pedido")} maxLength={LIMITES.pedido} rows={3} className={inputClass} />
          </Campo>
        </div>
      </fieldset>

      {/* Campo trampa contra robots (oculto para las personas). */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={trampa}
        onChange={(e) => setTrampa(e.target.value)}
        aria-hidden="true"
        className="hidden"
      />

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-stone-500">
          Tus datos se usan solo para atender esta reclamación (ver la política de privacidad).
        </p>
        <button
          type="submit"
          disabled={enviando}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
        >
          <Send className="h-4 w-4" strokeWidth={2} />
          {enviando ? "Registrando..." : "Registrar hoja"}
        </button>
      </div>
    </form>
  );
}
