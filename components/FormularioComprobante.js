"use client";

import { useRef, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Ticket,
  UserRound,
  UserPlus,
} from "lucide-react";
import Campo from "@/components/Campo";
import Modal from "@/components/Modal";
import { inputClass } from "@/lib/ui";
import { hoyISO } from "@/lib/fecha";
import { formatSoles } from "@/lib/cuentas";
import { METODOS_PAGO } from "@/lib/pagoInfo";
import {
  TIPOS_CORTOS,
  AYUDA_TIPOS,
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

const TIPOS = [
  { tipo: "boleta", icono: FileText },
  { tipo: "factura", icono: Building2 },
  { tipo: "ticket", icono: Ticket },
];
const OTRA_PERSONA = "otra";
const SIN_CLIENTE = { tipoDoc: "1", numDoc: "", nombre: "", direccion: "", email: "" };
const SIN_CONCEPTOS = [];
const nombreApoderado = (a) => `${a.nombres} ${a.apellidos}`;

let siguienteClave = 0;
function nuevoItem(descripcion = "", precio = "") {
  siguienteClave += 1;
  return { clave: siguienteClave, descripcion, cantidad: "1", precio };
}

const opcionClase = (activa) =>
  `flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
    activa
      ? "border-huellitas-primary bg-huellitas-primary-light"
      : "border-stone-200 bg-white hover:border-huellitas-primary/40"
  }`;

const chipClase = (activo) =>
  `rounded-full border px-3 py-1.5 text-sm ${
    activo
      ? "border-huellitas-primary bg-huellitas-primary text-white"
      : "border-stone-200 bg-white text-stone-600 hover:border-huellitas-primary/40"
  }`;

function Paso({ numero, titulo, children }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-huellitas-ink">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-huellitas-primary text-sm text-white">
          {numero}
        </span>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Opcion({ activa, onClick, icono: Icono, titulo, texto }) {
  return (
    <button type="button" aria-pressed={activa} onClick={onClick} className={opcionClase(activa)}>
      <Icono className="mt-0.5 h-5 w-5 shrink-0 text-huellitas-primary" strokeWidth={2} />
      <span className="min-w-0">
        <b className="block truncate text-sm text-huellitas-ink">{titulo}</b>
        <span className="block text-xs text-stone-500">{texto}</span>
      </span>
    </button>
  );
}

// Paso 2: a nombre de quién (un apoderado, otra persona o una empresa).
function DatosCliente({ esFactura, apoderados, titular, onTitular, cliente, setCliente, consultaHabilitada, onError }) {
  const [masDatos, setMasDatos] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const puedeBuscar = consultaHabilitada && (cliente.tipoDoc === "1" || esFactura);
  const cambiar = (campo) => (e) => setCliente({ ...cliente, [campo]: e.target.value });

  async function buscarDocumento() {
    if (buscando) return;
    setBuscando(true);
    onError("");
    const r = await consultarDocumento(esFactura ? "ruc" : "dni", cliente.numDoc.trim());
    setBuscando(false);
    if (r.error) return onError(r.error);
    setCliente({ ...cliente, nombre: r.nombre || cliente.nombre, direccion: r.direccion || cliente.direccion });
    if (r.aviso) onError(`Atención: ${r.aviso}.`);
  }

  return (
    <>
      {!esFactura && apoderados.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {apoderados.map((a, i) => (
            <Opcion
              key={a.dni || nombreApoderado(a)}
              activa={titular === String(i)}
              onClick={() => onTitular(String(i))}
              icono={UserRound}
              titulo={nombreApoderado(a)}
              texto={[a.parentesco, a.dni && `DNI ${a.dni}`].filter(Boolean).join(" · ")}
            />
          ))}
          <Opcion
            activa={titular === OTRA_PERSONA}
            onClick={() => onTitular(OTRA_PERSONA)}
            icono={UserPlus}
            titulo="Otra persona"
            texto="Escribe su DNI y nombre"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {cliente.tipoDoc !== "-" && (
          <Campo
            label={esFactura ? "RUC de la empresa" : DOCUMENTOS_CLIENTE[cliente.tipoDoc]}
            required
            ayuda={puedeBuscar && (esFactura || titular === OTRA_PERSONA) ? "Escríbelo y toca Buscar: el nombre se llena solo." : undefined}
          >
            <div className="flex gap-2">
              <input
                value={cliente.numDoc}
                onChange={cambiar("numDoc")}
                inputMode={cliente.tipoDoc === "1" || esFactura ? "numeric" : "text"}
                maxLength={esFactura ? 11 : 12}
                className={inputClass}
              />
              {puedeBuscar && (
                <button
                  type="button"
                  onClick={buscarDocumento}
                  disabled={buscando}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-huellitas-primary px-3 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light disabled:opacity-50"
                >
                  <Search className="h-4 w-4" strokeWidth={2} />
                  {buscando ? "..." : "Buscar"}
                </button>
              )}
            </div>
          </Campo>
        )}
        <Campo label={esFactura ? "Nombre de la empresa (razón social)" : "Nombre completo"} required>
          <input value={cliente.nombre} onChange={cambiar("nombre")} className={inputClass} />
        </Campo>
        {esFactura && (
          <Campo label="Dirección de la empresa" required className="sm:col-span-2">
            <input value={cliente.direccion} onChange={cambiar("direccion")} className={inputClass} />
          </Campo>
        )}
      </div>

      <button
        type="button"
        aria-expanded={masDatos}
        onClick={() => setMasDatos((v) => !v)}
        className="text-sm font-medium text-huellitas-primary hover:underline"
      >
        {masDatos ? "Ocultar más datos" : "Más datos (opcional): otro documento, dirección, correo"}
      </button>
      {masDatos && (
        <div className="grid gap-3 rounded-lg bg-stone-50 p-3 sm:grid-cols-2">
          {!esFactura && (
            <>
              <Campo label="Tipo de documento">
                <select value={cliente.tipoDoc} onChange={cambiar("tipoDoc")} className={inputClass}>
                  {["1", "4", "7", "-"].map((d) => (
                    <option key={d} value={d}>
                      {DOCUMENTOS_CLIENTE[d]}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Dirección">
                <input value={cliente.direccion} onChange={cambiar("direccion")} className={inputClass} />
              </Campo>
            </>
          )}
          <Campo label="Correo" ayuda="Le llega una copia del comprobante." className={esFactura ? "sm:col-span-2" : ""}>
            <input type="email" value={cliente.email} onChange={cambiar("email")} className={inputClass} />
          </Campo>
        </div>
      )}
    </>
  );
}

// Paso 3 de un pago ya registrado: lo cobrado sale del pago.
function DetalleDelPago({ items }) {
  return (
    <>
      <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
        {items.map((item) => (
          <li key={item.descripcion} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
            <span className="text-stone-700">{item.descripcion}</span>
            <b className="shrink-0 text-huellitas-ink">{formatSoles(item.precio)}</b>
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">Esto sale del pago que ya se registró; no tienes que escribir nada.</p>
    </>
  );
}

// Paso 3 de otro cobro: conceptos del catálogo, filas editables y método.
function ConceptosLibres({ items, setItems, conceptos, alumno, metodo, setMetodo }) {
  const cambiarItem = (clave, campo, valor) =>
    setItems((lista) => lista.map((item) => (item.clave === clave ? { ...item, [campo]: valor } : item)));

  // Tocar un concepto lo agrega con su precio (o llena la primera fila vacía).
  function agregarConcepto(concepto) {
    const descripcion = alumno ? `${concepto.nombre} – Alumno(a): ${alumno.nombre}` : concepto.nombre;
    const precio = String(concepto.monto_base ?? "");
    setItems((lista) => {
      const vacia = lista.find((i) => !i.descripcion.trim() && !i.precio);
      return vacia
        ? lista.map((i) => (i === vacia ? { ...i, descripcion, precio } : i))
        : [...lista, nuevoItem(descripcion, precio)];
    });
  }

  return (
    <>
      {conceptos.length > 0 && (
        <div>
          <p className="text-xs text-stone-500">Toca lo que se cobró y se agrega con su precio:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {conceptos.map((c) => (
              <button
                key={c.nombre}
                type="button"
                onClick={() => agregarConcepto(c)}
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-huellitas-primary hover:text-huellitas-primary"
              >
                {c.nombre}
                {c.monto_base ? ` · ${formatSoles(c.monto_base)}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <div className="hidden grid-cols-[1fr_4.5rem_7rem_2.5rem] gap-2 text-xs font-medium text-stone-500 sm:grid">
          <span>Qué se cobró</span>
          <span className="text-center">Cantidad</span>
          <span className="text-right">Precio (S/)</span>
        </div>
        {items.map((item) => (
          <div key={item.clave} className="grid grid-cols-[4.5rem_1fr_2.5rem] gap-2 sm:grid-cols-[1fr_4.5rem_7rem_2.5rem]">
            <input
              value={item.descripcion}
              onChange={(e) => cambiarItem(item.clave, "descripcion", e.target.value)}
              aria-label="Qué se cobró"
              className={`${inputClass} col-span-3 sm:col-span-1`}
            />
            <input
              type="number"
              min="1"
              step="1"
              value={item.cantidad}
              onChange={(e) => cambiarItem(item.clave, "cantidad", e.target.value)}
              aria-label="Cantidad"
              className={`${inputClass} text-center`}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.precio}
              onChange={(e) => cambiarItem(item.clave, "precio", e.target.value)}
              aria-label="Precio en soles"
              className={`${inputClass} text-right`}
            />
            <button
              type="button"
              onClick={() => setItems((lista) => lista.filter((i) => i.clave !== item.clave))}
              disabled={items.length === 1}
              aria-label="Quitar esta fila"
              className="flex h-full items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:text-rose-600 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setItems((lista) => [...lista, nuevoItem()])}
          className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Agregar otra cosa
        </button>
      </div>
      <div>
        <p className="text-sm font-medium text-stone-700">¿Cómo pagó?</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(METODOS_PAGO).map(([valor, texto]) => (
            <button key={valor} type="button" aria-pressed={metodo === valor} onClick={() => setMetodo(valor)} className={chipClase(metodo === valor)}>
              {texto}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// Paso 4 sin facturación electrónica: datos del comprobante hecho en SUNAT.
function DatosManual({ tipo, manual, setManual, archivoRef }) {
  const nombreTipo = TIPOS_CORTOS[tipo].toLowerCase();
  return (
    <>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
        Primero haz la {nombreTipo} en la página de SUNAT (SOL) o en tu facturador. Luego copia aquí su serie y número:
        así el padre la ve en su portal.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo label="Serie" required ayuda={`Ejemplo: ${tipo === "factura" ? "F001" : "B001"}`}>
          <input
            value={manual.serie}
            onChange={(e) => setManual({ ...manual, serie: e.target.value.toUpperCase() })}
            maxLength={4}
            className={inputClass}
          />
        </Campo>
        <Campo label="Número" required ayuda="Ejemplo: 125">
          <input
            type="number"
            min="1"
            value={manual.numero}
            onChange={(e) => setManual({ ...manual, numero: e.target.value })}
            className={inputClass}
          />
        </Campo>
        <Campo label="Fecha">
          <input
            type="date"
            max={hoyISO()}
            value={manual.fecha}
            onChange={(e) => setManual({ ...manual, fecha: e.target.value })}
            className={inputClass}
          />
        </Campo>
        <Campo label="PDF o foto del comprobante (opcional)" className="sm:col-span-3">
          <input
            ref={archivoRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-huellitas-primary-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-huellitas-primary"
          />
        </Campo>
      </div>
    </>
  );
}

// Formulario paso a paso para entregar un comprobante.
// - Con `pago`: comprobante de un pago ya registrado (lo cobrado sale del pago).
// - Sin `pago`: otro cobro (certificados, uniformes...), opcionalmente de un
//   `alumno` ({ matriculaId, nombre }), con los conceptos del catálogo.
// Si la facturación electrónica no está conectada (`configurado` = false),
// las boletas y facturas se hacen en SUNAT y aquí se copia su serie y número.
export default function FormularioComprobante({
  pago = null,
  alumno = null,
  apoderados,
  conceptos = SIN_CONCEPTOS,
  configurado,
  consultaHabilitada,
  onEmitido,
  onCancelar,
}) {
  const inicial = Math.max(0, apoderados.findIndex((a) => nombreApoderado(a) === pago?.pagado_por));
  const titularInicial = apoderados.length ? String(inicial) : OTRA_PERSONA;
  const [tipo, setTipo] = useState("boleta");
  const [titular, setTitular] = useState(titularInicial);
  const [cliente, setCliente] = useState(() => clienteDeApoderado(apoderados[inicial]));
  const [itemsLibres, setItemsLibres] = useState(() => [nuevoItem()]);
  const [metodo, setMetodo] = useState("efectivo");
  const [manual, setManual] = useState({ serie: "", numero: "", fecha: hoyISO() });
  const archivoRef = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const items = pago
    ? itemsDePago({ pago, cuotas: pago.cuotas, alumno: pago.alumno, aula: pago.aula, anio: pago.anio })
    : itemsLibres.map((i) => ({ ...i, cantidad: Number(i.cantidad), precio: Number(i.precio) }));
  const total = totalItems(items.filter((i) => i.cantidad > 0 && i.precio > 0));
  const esFactura = tipo === "factura";
  const modoManual = tipo !== "ticket" && !configurado;
  const nombreTipo = TIPOS_CORTOS[tipo].toLowerCase();

  function elegirTitular(valor) {
    setTitular(valor);
    setCliente(valor === OTRA_PERSONA ? SIN_CLIENTE : clienteDeApoderado(apoderados[Number(valor)]));
  }

  function cambiarTipo(nuevo) {
    setError("");
    if (nuevo === "factura") setCliente({ ...SIN_CLIENTE, tipoDoc: "6", email: cliente.email });
    else if (esFactura) elegirTitular(titularInicial);
    setTipo(nuevo);
  }

  async function emitir(event) {
    event.preventDefault();
    if (enviando) return;
    const problema = errorComprobante({ tipo, cliente, items });
    if (problema) return setError(problema);
    if (modoManual && (!manual.serie.trim() || !manual.numero)) {
      return setError(`Copia la serie y el número de la ${nombreTipo} que hiciste en SUNAT.`);
    }

    setEnviando(true);
    setError("");
    const resultado = await solicitarEmision(
      {
        tipo,
        cliente,
        ...(pago ? { pagoId: pago.id } : { matriculaId: alumno?.matriculaId ?? null, items, metodo }),
        ...(modoManual && { manual: { ...manual, numero: Number(manual.numero) } }),
      },
      modoManual ? (archivoRef.current?.files?.[0] ?? null) : null
    );
    setEnviando(false);
    if (resultado.error) return setError(resultado.error);
    onEmitido(resultado);
  }

  return (
    <form onSubmit={emitir} className="space-y-6">
      <Paso numero={1} titulo="¿Qué vas a entregar?">
        <div className="grid gap-2 sm:grid-cols-3">
          {TIPOS.map(({ tipo: t, icono }) => (
            <Opcion
              key={t}
              activa={tipo === t}
              onClick={() => cambiarTipo(t)}
              icono={icono}
              titulo={t === "ticket" ? "Ticket interno" : TIPOS_CORTOS[t]}
              texto={AYUDA_TIPOS[t]}
            />
          ))}
        </div>
      </Paso>

      <Paso numero={2} titulo={esFactura ? "¿Para qué empresa?" : "¿A nombre de quién?"}>
        <DatosCliente
          esFactura={esFactura}
          apoderados={apoderados}
          titular={titular}
          onTitular={elegirTitular}
          cliente={cliente}
          setCliente={setCliente}
          consultaHabilitada={consultaHabilitada}
          onError={setError}
        />
      </Paso>

      <Paso numero={3} titulo="¿Qué se cobró?">
        {pago ? (
          <DetalleDelPago items={items} />
        ) : (
          <ConceptosLibres
            items={itemsLibres}
            setItems={setItemsLibres}
            conceptos={conceptos}
            alumno={alumno}
            metodo={metodo}
            setMetodo={setMetodo}
          />
        )}
      </Paso>

      {modoManual && (
        <Paso numero={4} titulo={`Copia los datos de la ${nombreTipo} de SUNAT`}>
          <DatosManual tipo={tipo} manual={manual} setManual={setManual} archivoRef={archivoRef} />
        </Paso>
      )}

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex flex-col gap-3 rounded-xl bg-huellitas-cream p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          Total a cobrar{" "}
          <span className="block font-display text-3xl font-semibold text-huellitas-primary">{formatSoles(total)}</span>
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-huellitas-primary px-6 py-2.5 text-base font-semibold text-white hover:bg-huellitas-primary-dark disabled:opacity-50"
          >
            {enviando ? "Un momento..." : `${modoManual ? "Guardar" : "Crear"} ${nombreTipo}`}
          </button>
        </div>
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

// Aviso con el resultado: número, estado y enlace para imprimir.
export function AvisoComprobante({ resultado, onCerrar }) {
  const c = resultado.comprobante;
  const problema = c.estado === "rechazado" || resultado.aviso;
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-lg px-4 py-3 text-sm ${
        problema ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {problema ? (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
      ) : (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={2} />
      )}
      <div className="min-w-0 flex-1">
        <p>
          {problema ? "" : "¡Listo! "}
          <b>
            {TIPOS_CORTOS[c.tipo]} {numeroComprobante(c)}
          </b>{" "}
          por {formatSoles(c.total)} · {ESTADOS_COMPROBANTE[c.estado]?.texto}
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
