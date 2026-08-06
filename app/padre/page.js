import { Upload, FileText, FileCheck2 } from "lucide-react";
import EstadoBadge from "@/components/EstadoBadge";

export default function PadrePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            Cuota del mes
          </h2>
          <EstadoBadge estado="pendiente" />
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Aquí se mostrará el monto pendiente del mes en curso.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Upload className="h-4 w-4" strokeWidth={2} />
          Subir voucher de pago
        </button>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">
          Estado de cuenta {new Date().getFullYear()}
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Aquí se mostrará el detalle de cuotas y pagos del año en curso.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-stone-500" strokeWidth={2} />
          <h2 className="text-base font-semibold text-stone-900">
            Boletas de notas {new Date().getFullYear()}
          </h2>
        </div>
        <p className="mt-2 text-sm text-stone-500">
          Aquí se mostrarán las boletas de notas por bimestre del año en
          curso.
        </p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-base font-semibold text-stone-900">
          Documentos
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Solicita certificados, constancias u otros documentos.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-800 px-4 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-50"
        >
          <FileCheck2 className="h-4 w-4" strokeWidth={2} />
          Solicitar documento
        </button>
      </section>
    </div>
  );
}
