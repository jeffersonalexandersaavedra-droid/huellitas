"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const TIPOS = {
  transparencia: "Transparencia",
  contrato: "Contrato",
  otro: "Otro",
};

// CRUD de documentos de la página principal (transparencia, contrato, etc.).
// Los marcados como publicados aparecen en la web para descarga.
export default function DocumentosManager({ documentos }) {
  const router = useRouter();
  const supabase = createClient();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("transparencia");
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function subir(event) {
    event.preventDefault();
    if (!titulo.trim() || !archivo) {
      setError("Escribe un título y elige un archivo.");
      return;
    }
    if (archivo.size > 10 * 1024 * 1024) {
      setError("El archivo supera los 10 MB.");
      return;
    }
    setError("");
    setSubiendo(true);
    try {
      const ext = archivo.name.split(".").pop();
      const path = `${tipo}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("documentos")
        .upload(path, archivo);
      if (upErr) throw upErr;

      const {
        data: { publicUrl },
      } = supabase.storage.from("documentos").getPublicUrl(path);

      const { error: insErr } = await supabase.from("documentos").insert({
        titulo: titulo.trim(),
        tipo,
        archivo_url: publicUrl,
        publicado: true,
      });
      if (insErr) throw insErr;

      setTitulo("");
      setArchivo(null);
      router.refresh();
    } catch (e) {
      setError(e.message || "No se pudo subir el documento.");
    } finally {
      setSubiendo(false);
    }
  }

  async function togglePublicado(doc) {
    await supabase
      .from("documentos")
      .update({ publicado: !doc.publicado })
      .eq("id", doc.id);
    router.refresh();
  }

  async function eliminar(doc) {
    if (!confirm(`¿Eliminar "${doc.titulo}"?`)) return;
    await supabase.from("documentos").delete().eq("id", doc.id);
    router.refresh();
  }

  const inputClass =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-huellitas-primary focus:ring-2 focus:ring-huellitas-primary/20";

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
        <FileText className="h-5 w-5" strokeWidth={2} />
        Documentos de la página
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Sube documentos de transparencia, el contrato de servicios u otros. Los
        publicados aparecen en la página principal para descarga.
      </p>

      <form onSubmit={subir} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título del documento"
          className={inputClass}
        />
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputClass}>
          {Object.entries(TIPOS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">
          <Upload className="h-4 w-4" strokeWidth={2} />
          {archivo ? archivo.name.slice(0, 18) : "Archivo"}
          <input
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="submit"
          disabled={subiendo}
          className="rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-huellitas-primary-dark disabled:opacity-50"
        >
          {subiendo ? "Subiendo..." : "Subir"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-6 space-y-2">
        {documentos.length === 0 ? (
          <p className="text-sm text-stone-400">Aún no hay documentos.</p>
        ) : (
          documentos.map((d) => (
            <div
              key={d.id}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                d.publicado ? "border-stone-200" : "border-stone-100 bg-stone-50"
              }`}
            >
              <div className="min-w-0">
                <a
                  href={d.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 truncate font-medium text-huellitas-ink hover:text-huellitas-primary"
                >
                  {d.titulo}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-stone-400" strokeWidth={2} />
                </a>
                <p className="text-xs text-stone-500">
                  {TIPOS[d.tipo] ?? d.tipo} · {d.publicado ? "Publicado" : "Oculto"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => togglePublicado(d)}
                  title={d.publicado ? "Ocultar" : "Publicar"}
                  className="text-stone-400 hover:text-huellitas-primary"
                >
                  {d.publicado ? (
                    <Eye className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <EyeOff className="h-4 w-4" strokeWidth={2} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => eliminar(d)}
                  title="Eliminar"
                  className="text-stone-400 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
