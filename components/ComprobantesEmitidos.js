"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw, Ban, Search, FileText } from "lucide-react";
import ExportarExcelButton from "@/components/ExportarExcelButton";
import AvisoVacio from "@/components/AvisoVacio";
import Campo from "@/components/Campo";
import Modal from "@/components/Modal";
import { AvisoComprobante } from "@/components/FormularioComprobante";
import { controlClass, inputClass, coincide } from "@/lib/ui";
import { formatFecha, hoyISO } from "@/lib/fecha";
import { formatSoles } from "@/lib/cuentas";
import {
  TIPOS_CORTOS,
  ESTADOS_COMPROBANTE,
  DIAS_COMUNICACION_BAJA,
  numeroComprobante,
  enlaceComprobante,
  hojaRegistroVentas,
  hojaArqueo,
  redondear,
  solicitarAccion,
} from "@/lib/facturacion";

const VIGENTE = (c) => c.estado !== "anulado" && c.estado !== "rechazado";
const PLURALES = { boleta: "Boletas", factura: "Facturas", nota_credito: "Notas de crédito", ticket: "Tickets" };

// Comprobantes del mes con sus acciones (ver, actualizar estado, anular) y
// los reportes: registro de ventas del mes y arqueo de caja de un día.
export default function ComprobantesEmitidos({ comprobantes, delDia, mes, dia, conNota, esAdmin }) {
  const router = useRouter();
  const [tipo, setTipo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [procesando, setProcesando] = useState(null);
  const [anulando, setAnulando] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState("");

  const anuladosConNota = useMemo(() => new Set(conNota), [conNota]);
  const visibles = useMemo(
    () =>
      comprobantes.filter(
        (c) => (!tipo || c.tipo === tipo) && coincide(busqueda, c.cliente_nombre, c.alumno, numeroComprobante(c))
      ),
    [comprobantes, tipo, busqueda]
  );

  const totales = ["boleta", "factura", "nota_credito", "ticket"].map((t) => {
    const lista = comprobantes.filter((c) => c.tipo === t && (t === "nota_credito" ? c.estado !== "rechazado" : VIGENTE(c)));
    return { tipo: t, cantidad: lista.length, monto: redondear(lista.reduce((s, c) => s + Number(c.total), 0)) };
  });

  function irA(cambios) {
    const params = new URLSearchParams({ tab: "emitidos", mes, dia, ...cambios });
    router.push(`/admin/facturacion?${params}`);
  }

  async function ejecutar(c, cuerpo) {
    setProcesando(c.id);
    setError("");
    setResultado(null);
    const r = await solicitarAccion(c.id, cuerpo);
    setProcesando(null);
    if (r.error) return setError(r.error);
    setAnulando(null);
    setResultado(r);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-end gap-3">
          <Campo label="Mes">
            <input type="month" value={mes} onChange={(e) => e.target.value && irA({ mes: e.target.value })} className={controlClass} />
          </Campo>
          <ExportarExcelButton
            archivo={`registro_ventas_${mes}`}
            hoja={hojaRegistroVentas(comprobantes, mes, anuladosConNota)}
            label="Registro de ventas"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Campo label="Arqueo del día">
            <input type="date" value={dia} max={hoyISO()} onChange={(e) => e.target.value && irA({ dia: e.target.value })} className={controlClass} />
          </Campo>
          <ExportarExcelButton archivo={`arqueo_${dia}`} hoja={hojaArqueo(delDia, dia)} label="Arqueo de caja" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {totales.map((t) => (
          <div key={t.tipo} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs text-stone-500">
              {PLURALES[t.tipo]} · {t.cantidad}
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-huellitas-ink">
              {t.tipo === "nota_credito" && t.monto > 0 ? "−" : ""}
              {formatSoles(t.monto)}
            </p>
          </div>
        ))}
      </div>

      {resultado && <AvisoComprobante resultado={resultado} onCerrar={() => setResultado(null)} />}
      {error && !anulando && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" strokeWidth={2} />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por cliente, estudiante o número"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={controlClass}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPOS_CORTOS).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      </div>

      {visibles.length === 0 ? (
        <AvisoVacio icono={FileText}>No hay comprobantes en este mes.</AvisoVacio>
      ) : (
        <ul className="space-y-3">
          {visibles.map((c) => {
            const estado = ESTADOS_COMPROBANTE[c.estado];
            const anulable = esAdmin && c.tipo !== "nota_credito" && (c.estado === "emitido" || c.estado === "aceptado");
            return (
              <li key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-huellitas-ink">
                      {TIPOS_CORTOS[c.tipo]} {numeroComprobante(c)}
                      <span className="ml-2 text-xs font-normal text-stone-400">{formatFecha(c.fecha_emision)}</span>
                    </p>
                    <p className="text-sm text-stone-600">{c.cliente_nombre}</p>
                    {c.alumno && <p className="text-xs text-stone-500">Alumno(a): {c.alumno}</p>}
                    {c.referencia && (
                      <p className="text-xs text-stone-500">Anula a {numeroComprobante(c.referencia)}</p>
                    )}
                    {c.estado === "anulado" && c.motivo && (
                      <p className="text-xs text-stone-500">Motivo: {c.motivo}</p>
                    )}
                    {c.sunat_descripcion && c.estado !== "aceptado" && (
                      <p className="text-xs text-amber-700">{c.sunat_descripcion}</p>
                    )}
                    {c.modo === "manual" && <p className="text-xs text-stone-400">Registrado manualmente</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <b className="font-display text-lg text-huellitas-ink">
                      {c.tipo === "nota_credito" ? "−" : ""}
                      {formatSoles(c.total)}
                    </b>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado?.clase}`}>
                      {estado?.texto}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
                  <a
                    href={enlaceComprobante(c, "/admin/facturacion")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                    Ver
                  </a>
                  {c.modo === "electronico" && c.estado === "pendiente" && (
                    <button
                      type="button"
                      disabled={procesando === c.id}
                      onClick={() => ejecutar(c, { accion: "enviar" })}
                      className="flex items-center gap-1 rounded-lg border border-huellitas-primary px-3 py-1.5 text-xs font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                      Actualizar estado
                    </button>
                  )}
                  {anulable && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setAnulando(c);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <Ban className="h-3.5 w-3.5" strokeWidth={2} />
                      Anular
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {anulando && (
        <ModalAnular
          comprobante={anulando}
          procesando={procesando === anulando.id}
          error={error}
          onConfirmar={(cuerpo) => ejecutar(anulando, { accion: "anular", ...cuerpo })}
          onCerrar={() => setAnulando(null)}
        />
      )}
    </div>
  );
}

function ModalAnular({ comprobante: c, procesando, error, onConfirmar, onCerrar }) {
  const [motivo, setMotivo] = useState("");
  const [via, setVia] = useState("nota");
  const dias = Math.round((Date.parse(hoyISO()) - Date.parse(c.fecha_emision)) / 86400000);
  const bajaPosible = c.modo === "electronico" && dias <= DIAS_COMUNICACION_BAJA;

  return (
    <Modal
      titulo={`Anular ${TIPOS_CORTOS[c.tipo].toLowerCase()} ${numeroComprobante(c)}`}
      subtitulo={`${c.cliente_nombre} · ${formatSoles(c.total)}`}
      onCerrar={onCerrar}
      ancho="sm:max-w-lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirmar({ motivo, via: bajaPosible ? via : "nota" });
        }}
      >
        <div className="space-y-3">
          <Campo label="Motivo" required>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={100}
              placeholder="Ej. Error en el nombre del cliente"
              className={inputClass}
            />
          </Campo>

          {c.modo === "electronico" ? (
            <fieldset className="space-y-2">
              <label className="flex gap-2 rounded-lg border border-stone-200 p-3 text-sm">
                <input type="radio" checked={via === "nota"} onChange={() => setVia("nota")} className="mt-0.5 accent-huellitas-primary" />
                <span>
                  <b className="text-huellitas-ink">Nota de crédito</b>
                  <span className="block text-xs text-stone-500">
                    Lo correcto si el padre ya recibió el comprobante (lo ve en su portal o correo).
                  </span>
                </span>
              </label>
              <label
                className={`flex gap-2 rounded-lg border border-stone-200 p-3 text-sm ${bajaPosible ? "" : "opacity-50"}`}
              >
                <input
                  type="radio"
                  disabled={!bajaPosible}
                  checked={via === "baja"}
                  onChange={() => setVia("baja")}
                  className="mt-0.5 accent-huellitas-primary"
                />
                <span>
                  <b className="text-huellitas-ink">Comunicación de baja</b>
                  <span className="block text-xs text-stone-500">
                    Solo si el comprobante no fue entregado y dentro de los {DIAS_COMUNICACION_BAJA} días
                    de emitido.
                  </span>
                </span>
              </label>
            </fieldset>
          ) : (
            <p className="text-xs text-stone-500">
              {c.modo === "manual"
                ? "Se marcará como anulado aquí. Anúlalo también en SUNAT o en el facturador donde lo emitiste."
                : "El ticket quedará anulado. Si era de un pago, este vuelve a «Por facturar»."}
            </p>
          )}

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={procesando || !motivo.trim()}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {procesando ? "Anulando..." : "Anular comprobante"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
