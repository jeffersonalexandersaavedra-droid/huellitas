import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PaginaEditor from "@/components/PaginaEditor";
import DocumentosManager from "@/components/DocumentosManager";
import { mergeSitio } from "@/lib/sitioDefaults";

export const metadata = { title: "Menú principal" };

export default async function PaginaAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== "admin") {
    redirect("/login");
  }

  const [{ data: config }, { data: documentos }] = await Promise.all([
    supabase.from("sitio_config").select("contenido").eq("id", "landing").maybeSingle(),
    supabase
      .from("documentos")
      .select("id, titulo, tipo, archivo_url, publicado")
      .order("created_at", { ascending: false }),
  ]);

  const contenido = mergeSitio(config?.contenido);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-huellitas-ink">
        Menú principal
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        Edita los textos, datos y documentos de la página principal del colegio.
      </p>

      <div className="mt-6 space-y-6">
        <DocumentosManager documentos={documentos ?? []} />
        <PaginaEditor inicial={contenido} />
      </div>
    </div>
  );
}
