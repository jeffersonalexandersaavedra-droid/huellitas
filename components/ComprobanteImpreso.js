import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import ImprimirButton from "@/components/ImprimirButton";
import HojaTicket from "@/components/HojaTicket";
import AvisoVacio from "@/components/AvisoVacio";
import { COLEGIO } from "@/lib/colegio";
import { formatFecha } from "@/lib/fecha";
import { formatSoles } from "@/lib/cuentas";
import { METODOS_PAGO } from "@/lib/pagoInfo";
import { enlacesDeArchivos } from "@/lib/emision";
import {
  TIPOS_COMPROBANTE,
  DOCUMENTOS_CLIENTE,
  numeroComprobante,
  redondear,
} from "@/lib/facturacion";

// Datos del cliente y del documento que van bajo la cabecera.
function datosDe(c) {
  return [
    ["Fecha de emisión", formatFecha(c.fecha_emision)],
    [DOCUMENTOS_CLIENTE[c.cliente_tipo_doc] ?? "Documento", c.cliente_num_doc ?? "—"],
    [c.tipo === "factura" ? "Razón social" : "Cliente", c.cliente_nombre],
    ...(c.cliente_direccion ? [["Dirección", c.cliente_direccion]] : []),
    ...(c.metodo ? [["Forma de pago", METODOS_PAGO[c.metodo] ?? c.metodo]] : []),
    ...(c.referencia ? [["Documento que modifica", numeroComprobante(c.referencia)]] : []),
    ...(c.tipo === "nota_credito" && c.motivo ? [["Motivo", `Anulación de la operación: ${c.motivo}`]] : []),
  ];
}

function Regreso({ href, texto }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline">
      <ArrowLeft className="h-4 w-4" strokeWidth={2} />
      {texto}
    </Link>
  );
}

function Cabecera({ c }) {
  return (
    <header className="flex flex-col gap-4 border-b-2 border-huellitas-primary pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        <Image src="/logos/huellitas-escudo.png" alt="" width={48} height={58} />
        <div>
          <p className="font-display text-lg font-semibold text-huellitas-primary">{COLEGIO.nombre}</p>
          <p className="text-xs text-stone-500">{COLEGIO.direccion}</p>
          <p className="text-xs text-stone-500">{COLEGIO.correo}</p>
        </div>
      </div>
      <div className="rounded-lg border-2 border-huellitas-primary px-4 py-2 text-center">
        <p className="text-xs font-semibold text-stone-600">RUC {COLEGIO.ruc}</p>
        <p className="text-sm font-bold uppercase text-huellitas-primary">{TIPOS_COMPROBANTE[c.tipo]}</p>
        <p className="font-mono text-sm font-semibold text-huellitas-ink">{numeroComprobante(c)}</p>
      </div>
    </header>
  );
}

function Detalle({ items }) {
  const celda = "border border-stone-300 py-2";
  return (
    <table className="mt-6 w-full border-collapse text-sm">
      <thead>
        <tr className="bg-huellitas-primary-light text-huellitas-primary">
          <th className={`${celda} px-2 text-center`}>Cant.</th>
          <th className={`${celda} px-3 text-left`}>Descripción</th>
          <th className={`${celda} px-2 text-right`}>P. unit.</th>
          <th className={`${celda} px-2 text-right`}>Importe</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          // Líneas fijas de un comprobante ya emitido (no se reordenan ni se
          // editan) y pueden repetirse: la posición es su identidad.
          // react-doctor-disable-next-line no-array-index-as-key
          <tr key={i}>
            <td className={`${celda} px-2 text-center`}>{item.cantidad}</td>
            <td className={`${celda} px-3 text-huellitas-ink`}>{item.descripcion}</td>
            <td className={`${celda} whitespace-nowrap px-2 text-right`}>{formatSoles(item.precio)}</td>
            <td className={`${celda} whitespace-nowrap px-2 text-right`}>{formatSoles(redondear(item.cantidad * item.precio))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Líneas antes del total (el ticket interno no lleva IGV).
function subtotalesDe(c) {
  if (c.tipo === "ticket") return [];
  return [
    ["Op. inafecta", formatSoles(redondear(c.total))],
    ["IGV", formatSoles(0)],
  ];
}

function Totales({ c }) {
  return (
    <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
      {subtotalesDe(c).map(([etiqueta, valor]) => (
        <div key={etiqueta} className="flex justify-between">
          <dt className="text-stone-500">{etiqueta}</dt>
          <dd>{valor}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-stone-200 pt-1 text-base font-semibold text-huellitas-ink">
        <dt>Total</dt>
        <dd>{formatSoles(redondear(c.total))}</dd>
      </div>
    </dl>
  );
}

function leyendaDe(c) {
  if (c.tipo === "ticket") return "Documento interno del colegio. No es comprobante de pago ante SUNAT.";
  if (c.modo === "manual") {
    return "Resumen del comprobante emitido por el colegio en SUNAT. El documento oficial es el PDF entregado por el colegio.";
  }
  return `Resumen de la ${TIPOS_COMPROBANTE[c.tipo].toLowerCase()}. Su representación impresa oficial, con código QR, es el «PDF oficial». Consulte su validez en www.sunat.gob.pe.${c.hash ? ` Código hash: ${c.hash}` : ""}`;
}

function Pie({ c }) {
  return (
    <footer className="mt-8 border-t border-stone-200 pt-3 text-xs text-stone-500">
      <p>{leyendaDe(c)}</p>
      {c.observaciones && c.tipo !== "nota_credito" && <p className="mt-1">Observaciones: {c.observaciones}</p>}
    </footer>
  );
}

function HojaA4({ c }) {
  return (
    <article className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm print:rounded-none print:p-0 print:shadow-none md:p-10">
      {c.estado === "anulado" && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-bold uppercase tracking-widest text-rose-500/15 -rotate-12">
          Anulado
        </p>
      )}
      <Cabecera c={c} />
      <dl className="mt-5 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {datosDe(c).map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex gap-2">
            <dt className="w-32 shrink-0 text-stone-500">{etiqueta}:</dt>
            <dd className="font-medium text-huellitas-ink">{valor}</dd>
          </div>
        ))}
      </dl>
      <Detalle items={c.items} />
      <Totales c={c} />
      <Pie c={c} />
    </article>
  );
}

const Linea = () => <hr className="my-2 border-t border-dashed border-black" />;

// Mismo comprobante en papel de ticketera (80 mm): una sola columna, solo
// negro (la impresora térmica no imprime colores).
function Ticket({ c }) {
  return (
    <HojaTicket>
      <header className="text-center">
        <Image src="/logos/huellitas-escudo.png" alt="" width={36} height={44} className="mx-auto grayscale" />
        <p className="mt-1 text-sm font-bold uppercase">{COLEGIO.nombre}</p>
        <p>{COLEGIO.direccion}</p>
        <p>{COLEGIO.correo}</p>
        <p className="font-semibold">RUC {COLEGIO.ruc}</p>
      </header>
      <Linea />
      <div className="text-center">
        <p className="font-bold uppercase">{TIPOS_COMPROBANTE[c.tipo]}</p>
        <p className="font-mono text-sm font-bold">{numeroComprobante(c)}</p>
        {c.estado === "anulado" && <p className="mt-1 font-bold">*** ANULADO ***</p>}
      </div>
      <Linea />
      <dl className="space-y-0.5">
        {datosDe(c).map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex gap-1">
            <dt className="shrink-0">{etiqueta}:</dt>
            <dd className="font-semibold">{valor}</dd>
          </div>
        ))}
      </dl>
      <Linea />
      <ul className="space-y-1.5">
        {c.items.map((item, i) => (
          // Líneas fijas de un comprobante ya emitido: la posición es su identidad.
          // react-doctor-disable-next-line no-array-index-as-key
          <li key={i}>
            <p>{item.descripcion}</p>
            <p className="flex justify-between">
              <span>
                {item.cantidad} x {formatSoles(item.precio)}
              </span>
              <span>{formatSoles(redondear(item.cantidad * item.precio))}</span>
            </p>
          </li>
        ))}
      </ul>
      <Linea />
      <dl className="space-y-0.5">
        {subtotalesDe(c).map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between">
            <dt>{etiqueta}</dt>
            <dd>{valor}</dd>
          </div>
        ))}
        <div className="flex justify-between text-sm font-bold">
          <dt>TOTAL</dt>
          <dd>{formatSoles(redondear(c.total))}</dd>
        </div>
      </dl>
      <Linea />
      <p className="text-[10px]">{leyendaDe(c)}</p>
      {c.observaciones && c.tipo !== "nota_credito" && <p className="mt-1 text-[10px]">Obs.: {c.observaciones}</p>}
      <p className="mt-2 text-center font-semibold">¡Gracias por su pago!</p>
    </HojaTicket>
  );
}

// Boletas y tickets salen en ticketera; facturas (y sus notas), en A4.
const formatoPorDefecto = (c) =>
  c.tipo === "factura" || c.referencia?.tipo === "factura" ? "a4" : "ticketera";

const FORMATOS = [
  ["ticketera", "Ticketera 80 mm"],
  ["a4", "Hoja A4"],
];

function SelectorFormato({ actual }) {
  return (
    <nav aria-label="Formato de impresión" className="flex rounded-lg border border-stone-300 bg-white p-0.5 text-sm">
      {FORMATOS.map(([valor, texto]) => (
        <Link
          key={valor}
          href={{ query: { formato: valor } }}
          replace
          aria-current={actual === valor ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 font-medium ${
            actual === valor ? "bg-huellitas-primary text-white" : "text-stone-600 hover:bg-stone-50"
          }`}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}

// Comprobante listo para imprimir. Lo carga con el cliente de la sesión,
// así el RLS decide quién lo ve (personal: todos; padre: los suyos).
// `formato`: "ticketera" | "a4" (si no viene, según el tipo).
export default async function ComprobanteImpreso({ supabase, id, volver, formato }) {
  const { data: c } = await supabase
    .from("comprobantes")
    .select("*, referencia:referencia_id(tipo, serie, numero)")
    .eq("id", id)
    .maybeSingle();

  if (!c) {
    return (
      <div className="space-y-4">
        <Regreso {...volver} />
        <AvisoVacio>No se encontró el comprobante.</AvisoVacio>
      </div>
    );
  }

  const pdfOficial = c.enlace_pdf ?? (await enlacesDeArchivos([c]))[c.id];
  const actual = FORMATOS.some(([valor]) => valor === formato) ? formato : formatoPorDefecto(c);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Regreso {...volver} />
        <div className="flex flex-wrap gap-2">
          <SelectorFormato actual={actual} />
          {pdfOficial && (
            <a
              href={pdfOficial}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-huellitas-primary px-4 py-2 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light"
            >
              <Download className="h-4 w-4" strokeWidth={2} />
              PDF oficial
            </a>
          )}
          <ImprimirButton />
        </div>
      </div>

      {actual === "ticketera" ? <Ticket c={c} /> : <HojaA4 c={c} />}
    </div>
  );
}
