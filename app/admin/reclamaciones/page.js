import { createClient } from "@/lib/supabase/server";
import ReclamacionesAdmin from "@/components/ReclamacionesAdmin";
import { correoConfigurado } from "@/lib/correo";
import { PLAZO_DIAS_HABILES } from "@/lib/reclamaciones";

export const metadata = { title: "Libro de Reclamaciones" };

export default async function ReclamacionesPage() {
  const supabase = await createClient();
  const { data: hojas } = await supabase
    .from("reclamaciones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  // Pendientes primero (las más antiguas arriba: vencen antes).
  const lista = hojas ?? [];
  const ordenadas = [
    ...lista.filter((h) => !h.respuesta).reverse(),
    ...lista.filter((h) => h.respuesta),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">Libro de Reclamaciones</h1>
      <p className="mt-1 text-sm text-stone-500">
        Reclamos y quejas registrados en la web. Por ley, cada uno se responde en un máximo de{" "}
        {PLAZO_DIAS_HABILES} días hábiles; las hojas se conservan al menos dos años.
      </p>
      <div className="mt-6">
        <ReclamacionesAdmin hojas={ordenadas} correoActivo={correoConfigurado()} />
      </div>
    </div>
  );
}
