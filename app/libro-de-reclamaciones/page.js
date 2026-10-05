import PaginaLegal from "@/components/PaginaLegal";
import FormularioReclamacion from "@/components/FormularioReclamacion";
import { COLEGIO } from "@/lib/colegio";
import { PLAZO_DIAS_HABILES } from "@/lib/reclamaciones";

export const metadata = { title: "Libro de Reclamaciones" };

export default function LibroReclamacionesPage() {
  return (
    <PaginaLegal
      titulo="Libro de Reclamaciones"
      subtitulo={`${COLEGIO.nombre} · RUC ${COLEGIO.ruc} · ${COLEGIO.direccion}`}
    >
      <p className="mb-6 rounded-xl border border-huellitas-primary/20 bg-white p-4 text-sm text-huellitas-ink">
        Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, esta institución
        cuenta con un Libro de Reclamaciones a tu disposición. Al registrar tu hoja recibirás su número y
        una copia; te responderemos en un plazo máximo de {PLAZO_DIAS_HABILES} días hábiles.
      </p>
      <FormularioReclamacion />
    </PaginaLegal>
  );
}
