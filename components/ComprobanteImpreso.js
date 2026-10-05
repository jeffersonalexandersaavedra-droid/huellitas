import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import ImprimirButton from "@/components/ImprimirButton";
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

// Comprobante listo para imprimir. Lo carga con el cliente de la sesión,
// así el RLS decide quién lo ve (personal: todos; padre: los suyos).
export default async function ComprobanteImpreso({ supabase, id, volver }) {
  const { data: c } = await supabase
    .from("comprobantes")
    .select("*, referencia:referencia_id(tipo, serie, numero)")
    .eq("id", id)
    .maybeSingle();

  const regreso = (
    <Link href={volver.href} className="flex items-center gap-1 text-sm font-medium text-huellitas-primary hover:underline">
      <ArrowLeft className="h-4 w-4" strokeWidth={2} />
      {volver.texto}
    </Link>
  );

  if (!c) {
    return (
      <div className="space-y-4">
        {regreso}
        <AvisoVacio>No se encontró el comprobante.</AvisoVacio>
      </div>
    );
  }

  const pdfOficial = c.enlace_pdf ?? (await enlacesDeArchivos([c]))[c.id];
  const total = redondear(c.total);
  const datos = [
    ["Fecha de emisión", formatFecha(c.fecha_emision)],
    [DOCUMENTOS_CLIENTE[c.cliente_tipo_doc] ?? "Documento", c.cliente_num_doc ?? "—"],
    [c.tipo === "factura" ? "Razón social" : "Cliente", c.cliente_nombre],
    ...(c.cliente_direccion ? [["Dirección", c.cliente_direccion]] : []),
    ...(c.metodo ? [["Forma de pago", METODOS_PAGO[c.metodo] ?? c.metodo]] : []),
    ...(c.referencia ? [["Documento que modifica", numeroComprobante(c.referencia)]] : []),
    ...(c.tipo === "nota_credito" && c.motivo ? [["Motivo", `Anulación de la operación: ${c.motivo}`]] : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        {regreso}
        <div className="flex flex-wrap gap-2">
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

      <article className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm print:rounded-none print:p-0 print:shadow-none md:p-10">
        {c.estado === "anulado" && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-bold uppercase tracking-widest text-rose-500/15 -rotate-12">
            Anulado
          </p>
        )}

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

        <dl className="mt-5 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {datos.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex gap-2">
              <dt className="w-32 shrink-0 text-stone-500">{etiqueta}:</dt>
              <dd className="font-medium text-huellitas-ink">{valor}</dd>
            </div>
          ))}
        </dl>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="bg-huellitas-primary-light text-huellitas-primary">
              <th className="border border-stone-300 px-2 py-2 text-center">Cant.</th>
              <th className="border border-stone-300 px-3 py-2 text-left">Descripción</th>
              <th className="border border-stone-300 px-2 py-2 text-right">P. unit.</th>
              <th className="border border-stone-300 px-2 py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {c.items.map((item, i) => (
              <tr key={i}>
                <td className="border border-stone-300 px-2 py-2 text-center">{item.cantidad}</td>
                <td className="border border-stone-300 px-3 py-2 text-huellitas-ink">{item.descripcion}</td>
                <td className="whitespace-nowrap border border-stone-300 px-2 py-2 text-right">{formatSoles(item.precio)}</td>
                <td className="whitespace-nowrap border border-stone-300 px-2 py-2 text-right">
                  {formatSoles(redondear(item.cantidad * item.precio))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
          {c.tipo !== "ticket" && (
            <>
              <div className="flex justify-between">
                <dt className="text-stone-500">Op. inafecta</dt>
                <dd>{formatSoles(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">IGV</dt>
                <dd>{formatSoles(0)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-stone-200 pt-1 text-base font-semibold text-huellitas-ink">
            <dt>Total</dt>
            <dd>{formatSoles(total)}</dd>
          </div>
        </dl>

        <footer className="mt-8 border-t border-stone-200 pt-3 text-xs text-stone-500">
          {c.tipo === "ticket" ? (
            <p>Documento interno del colegio. No es comprobante de pago ante SUNAT.</p>
          ) : c.modo === "manual" ? (
            <p>
              Resumen del comprobante emitido por el colegio en SUNAT. El documento oficial es el PDF
              entregado por el colegio.
            </p>
          ) : (
            <p>
              Resumen de la {TIPOS_COMPROBANTE[c.tipo].toLowerCase()}. Su representación impresa oficial,
              con código QR, es el «PDF oficial». Consulte su validez en www.sunat.gob.pe.
              {c.hash ? ` Código hash: ${c.hash}` : ""}
            </p>
          )}
          {c.observaciones && c.tipo !== "nota_credito" && <p className="mt-1">Observaciones: {c.observaciones}</p>}
        </footer>
      </article>
    </div>
  );
}
