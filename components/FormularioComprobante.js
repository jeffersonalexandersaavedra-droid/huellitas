"use client";

import { useState } from "react";
import { Search, Plus, Trash2, X, CheckCircle2, AlertTriangle } from "lucide-react";
import Campo from "@/components/Campo";
import Modal from "@/components/Modal";
import { inputClass } from "@/lib/ui";
import { hoyISO } from "@/lib/fecha";
import { formatSoles } from "@/lib/cuentas";
import { METODOS_PAGO } from "@/lib/pagoInfo";
import {
  TIPOS_CORTOS,
  DOCUMENTOS_CLIENTE,
  ESTADOS_COMPROBANTE,
  clienteDeApoderado,
  itemsDePago,
  totalItems,
  errorComprobante,
  numeroComprobante,
  enlaceComprobante,
  solicitarEmision,
  consultarDocumento,
} from "@/lib/facturacion";

const TIPOS = ["boleta", "factura", "ticket"];
const OTRA_PERSONA = "otra";
const SIN_CLIENTE = { tipoDoc: "1", numDoc: "", nombre: "", direccion: "", email: "" };
const nombreApoderado = (a) => `${a.nombres} ${a.apellidos}`;
const nuevoItem = () => ({ descripcion: "", cantidad: "1", precio: "" });

// Formulario para emitir un comprobante.
// - Con `pago`: factura un pago ya registrado (los conceptos salen del pago).
// - Sin `pago`: venta libre (certificados, traslados...), opcionalmente de
//   un `alumno` ({ matriculaId, nombre }), con conceptos sugeridos.
// Si la facturación electrónica no está conectada (`configurado` = false),
// las boletas y facturas se registran con la serie y número emitidos fuera.
export default function FormularioComprobante({
  pago = null,
  alumno = null,
  apoderados = [],
  conceptos = [],
  configurado,
  consultaHabilitada,
  onEmitido,
  onCancelar,
}) {
  const inicial = Math.max(
    0,
    apoderados.findIndex((a) => nombreApoderado(a) === pago?.pagado_por)
  );
  const [tipo, setTipo] = useState("boleta");
  const [titular, setTitular] = useState(apoderados.length ? String(inicial) : OTRA_PERSONA);
  const [cliente, setCliente] = useState(clienteDeApoderado(apoderados[inicial]));
  const [itemsLibres, setItemsLibres] = useState([nuevoItem()]);
  const [metodo, setMetodo] = useState("efectivo");
  const [manual, setManual] = useState({ serie: "", numero: "", fecha: hoyISO() });
  const [archivo, setArchivo] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const items = pago
    ? itemsDePago({ pago, cuotas: pago.cuotas, alumno: pago.alumno, aula: pago.aula, anio: pago.anio })
    : itemsLibres.map((i) => ({ ...i, cantidad: Number(i.cantidad), precio: Number(i.precio) }));
  const esFactura = tipo === "factura";
  const modoManual = tipo !== "ticket" && !configurado;

  function elegirTitular(valor) {
    setTitular(valor);
    setCliente(valor === OTRA_PERSONA ? SIN_CLIENTE : clienteDeApoderado(apoderados[Number(valor)]));
  }

  function cambiarTipo(nuevo) {
    setError("");
    if (nuevo === "factura") setCliente({ ...SIN_CLIENTE, tipoDoc: "6", email: cliente.email });
    else if (esFactura) elegirTitular(apoderados.length ? String(inicial) : OTRA_PERSONA);
    setTipo(nuevo);
  }

  const cambiar = (campo) => (e) => setCliente({ ...cliente, [campo]: e.target.value });

  async function buscarDocumento() {
    setBuscando(true);
    setError("");
    const r = await consultarDocumento(cliente.tipoDoc === "6" ? "ruc" : "dni", cliente.numDoc.trim());
    setBuscando(false);
    if (r.error) return setError(r.error);
    setCliente({ ...cliente, nombre: r.nombre || cliente.nombre, direccion: r.direccion || cliente.direccion });
    if (r.aviso) setError(`Atención: ${r.aviso}.`);
  }

  function cambiarItem(n, campo, valor) {
    setItemsLibres((lista) =>
      lista.map((item, i) => {
        if (i !== n) return item;
        const cambiado = { ...item, [campo]: valor };
        // Al elegir un concepto del catálogo se completa su precio.
        const concepto = campo === "descripcion" && conceptos.find((c) => c.nombre === valor);
        if (concepto) {
          cambiado.descripcion = alumno ? `${concepto.nombre} – Alumno(a): ${alumno.nombre}` : concepto.nombre;
          if (!item.precio) cambiado.precio = String(concepto.monto_base ?? "");
        }
        return cambiado;
      })
    );
  }

  async function emitir(event) {
    event.preventDefault();
    const problema = errorComprobante({ tipo, cliente, items });
    if (problema) return setError(problema);
    if (modoManual && (!manual.serie.trim() || !manual.numero)) {
      return setError("Indica la serie y el número del comprobante que emitiste.");
    }

    setEnviando(true);
    setError("");
    const resultado = await solicitarEmision(
      {
        tipo,
        cliente,
        ...(pago
          ? { pagoId: pago.id }
          : { matriculaId: alumno?.matriculaId ?? null, items, metodo }),
        ...(modoManual && { manual: { ...manual, numero: Number(manual.numero) } }),
      },
      modoManual ? archivo : null
    );
    setEnviando(false);
    if (resultado.error) return setError(resultado.error);
    onEmitido(resultado);
  }

  return (
    <form onSubmit={emitir} className="space-y-5">
      <div>
        <p className="mb-1 text-sm font-medium text-stone-700">Comprobante</p>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => cambiarTipo(t)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                tipo === t
                  ? "border-huellitas-primary bg-huellitas-primary-light text-huellitas-primary"
                  : "border-stone-200 text-stone-600 hover:border-huellitas-primary/40"
              }`}
            >
              {TIPOS_CORTOS[t]}
            </button>
          ))}
        </div>
        {tipo === "ticket" && (
          <p className="mt-2 text-xs text-stone-500">
            Documento interno del colegio: no es comprobante de pago ante SUNAT y no entra al
            registro de ventas.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {!esFactura && apoderados.length > 0 && (
          <Campo label="A nombre de" className="sm:col-span-2">
            <select value={titular} onChange={(e) => elegirTitular(e.target.value)} className={inputClass}>
              {apoderados.map((a, i) => (
                <option key={a.dni ?? i} value={i}>
                  {nombreApoderado(a)}
                  {a.parentesco ? ` (${a.parentesco})` : ""}
                </option>
              ))}
              <option value={OTRA_PERSONA}>Otra persona</option>
            </select>
          </Campo>
        )}

        {!esFactura && (
          <Campo label="Documento">
            <select value={cliente.tipoDoc} onChange={cambiar("tipoDoc")} className={inputClass}>
              {["1", "4", "7", "-"].map((d) => (
                <option key={d} value={d}>
                  {DOCUMENTOS_CLIENTE[d]}
                </option>
              ))}
            </select>
          </Campo>
        )}

        {cliente.tipoDoc !== "-" && (
          <Campo label={esFactura ? "RUC" : "N.° de documento"} required className={esFactura ? "sm:col-span-2" : ""}>
            <div className="flex gap-2">
              <input
                value={cliente.numDoc}
                onChange={cambiar("numDoc")}
                inputMode={cliente.tipoDoc === "1" || esFactura ? "numeric" : "text"}
                maxLength={esFactura ? 11 : 12}
                className={inputClass}
              />
              {consultaHabilitada && (cliente.tipoDoc === "1" || esFactura) && (
                <button
                  type="button"
                  onClick={buscarDocumento}
                  disabled={buscando}
                  title={esFactura ? "Buscar en SUNAT" : "Buscar en RENIEC"}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-huellitas-primary px-3 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
                >
                  <Search className="h-4 w-4" strokeWidth={2} />
                  <span className="hidden sm:inline">{buscando ? "..." : "Buscar"}</span>
                </button>
              )}
            </div>
          </Campo>
        )}

        <Campo label={esFactura ? "Razón social" : "Nombre completo"} required className="sm:col-span-2">
          <input value={cliente.nombre} onChange={cambiar("nombre")} className={inputClass} />
        </Campo>
        <Campo label={esFactura ? "Dirección fiscal" : "Dirección"} required={esFactura}>
          <input value={cliente.direccion} onChange={cambiar("direccion")} className={inputClass} />
        </Campo>
        <Campo label="Correo (recibe el comprobante)">
          <input type="email" value={cliente.email} onChange={cambiar("email")} className={inputClass} />
        </Campo>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700">Detalle</p>
        {pago ? (
          <ul className="mt-2 divide-y divide-stone-100 rounded-lg border border-stone-200">
            {items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                <span className="text-stone-700">{item.descripcion}</span>
                <b className="shrink-0 text-huellitas-ink">{formatSoles(item.precio)}</b>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2 space-y-3">
            {itemsLibres.map((item, i) => (
              <div key={i} className="grid grid-cols-[4.5rem_1fr_auto] gap-2 sm:grid-cols-[1fr_4.5rem_7rem_auto]">
                <input
                  value={item.descripcion}
                  onChange={(e) => cambiarItem(i, "descripcion", e.target.value)}
                  list="conceptos-cobro"
                  placeholder="Concepto (ej. Certificado de estudios)"
                  className={`${inputClass} col-span-3 sm:col-span-1`}
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={item.cantidad}
                  onChange={(e) => cambiarItem(i, "cantidad", e.target.value)}
                  aria-label="Cantidad"
                  className={`${inputClass} text-center`}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precio}
                  onChange={(e) => cambiarItem(i, "precio", e.target.value)}
                  placeholder="Precio S/"
                  aria-label="Precio unitario"
                  className={`${inputClass} text-right`}
                />
                <button
                  type="button"
                  onClick={() => setItemsLibres((lista) => lista.filter((_, n) => n !== i))}
                  disabled={itemsLibres.length === 1}
                  aria-label="Quitar concepto"
                  className="flex h-full w-10 items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            ))}
            <datalist id="conceptos-cobro">
              {conceptos.map((c) => (
                <option key={c.nombre} value={c.nombre} />
              ))}
            </datalist>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <button
                type="button"
                onClick={() => setItemsLibres((lista) => [...lista, nuevoItem()])}
                className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                Agregar concepto
              </button>
              <Campo label="Método de pago">
                <select value={metodo} onChange={(e) => setMetodo(e.target.value)} className={inputClass}>
                  {Object.entries(METODOS_PAGO).map(([valor, texto]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>
          </div>
        )}
        <p className="mt-3 text-right text-sm text-stone-500">
          Total{" "}
          <span className="font-display text-2xl font-semibold text-huellitas-primary">
            {formatSoles(totalItems(items.filter((i) => i.cantidad > 0 && i.precio > 0)))}
          </span>
        </p>
      </div>

      {modoManual && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            La facturación electrónica aún no está conectada. Emite la {TIPOS_CORTOS[tipo].toLowerCase()}{" "}
            en SUNAT (SOL) o en tu facturador y registra aquí sus datos para que el padre la vea en su
            portal.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Campo label="Serie" required>
              <input
                value={manual.serie}
                onChange={(e) => setManual({ ...manual, serie: e.target.value.toUpperCase() })}
                maxLength={4}
                placeholder={esFactura ? "F001" : "B001"}
                className={inputClass}
              />
            </Campo>
            <Campo label="Número" required>
              <input
                type="number"
                min="1"
                value={manual.numero}
                onChange={(e) => setManual({ ...manual, numero: e.target.value })}
                className={inputClass}
              />
            </Campo>
            <Campo label="Fecha de emisión">
              <input
                type="date"
                max={hoyISO()}
                value={manual.fecha}
                onChange={(e) => setManual({ ...manual, fecha: e.target.value })}
                className={inputClass}
              />
            </Campo>
            <Campo label="PDF del comprobante (opcional)" className="sm:col-span-3">
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-huellitas-primary"
              />
            </Campo>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-huellitas-primary px-5 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
        >
          {enviando
            ? "Procesando..."
            : modoManual
              ? "Registrar comprobante"
              : `Emitir ${TIPOS_CORTOS[tipo].toLowerCase()}`}
        </button>
      </div>
    </form>
  );
}

// El mismo formulario en una ventana (pagos por facturar y caja).
export function ModalComprobante({ titulo, subtitulo, onCerrar, ...props }) {
  return (
    <Modal titulo={titulo} subtitulo={subtitulo} onCerrar={onCerrar} ancho="sm:max-w-2xl">
      <FormularioComprobante {...props} onCancelar={onCerrar} />
    </Modal>
  );
}

// Aviso con el resultado de una emisión: número, estado y enlace.
export function AvisoComprobante({ resultado, onCerrar }) {
  const c = resultado.comprobante;
  const problema = c.estado === "rechazado" || resultado.aviso;
  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
        problema ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {problema ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      )}
      <div className="min-w-0 flex-1">
        <p>
          <b>
            {TIPOS_CORTOS[c.tipo]} {numeroComprobante(c)}
          </b>{" "}
          · {ESTADOS_COMPROBANTE[c.estado]?.texto} · {formatSoles(c.total)}
        </p>
        {resultado.aviso && <p className="mt-1">{resultado.aviso}</p>}
        <a
          href={enlaceComprobante(c, "/admin/facturacion")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block font-medium underline"
        >
          Ver o imprimir
        </a>
      </div>
      <button type="button" onClick={onCerrar} aria-label="Cerrar aviso" className="opacity-60 hover:opacity-100">
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
