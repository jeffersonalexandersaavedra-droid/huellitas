"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import { subirFotoPerfil } from "@/lib/archivos";

// Cabecera de perfil del estudiante con foto opcional. Quien no suba foto
// ve sus iniciales (predeterminado). La foto se guarda en Storage, no en la
// base, así que no hace pesado al sistema.
export default function PerfilFoto({ estudianteId, nombre, aula, dni, fotoUrl }) {
  const router = useRouter();
  const [preview, setPreview] = useState(fotoUrl ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setSubiendo(true);
    try {
      const supabase = createClient();
      const url = await subirFotoPerfil(supabase, file);
      const { error: updErr } = await supabase
        .from("estudiantes")
        .update({ foto_url: url })
        .eq("id", estudianteId);
      if (updErr) throw new Error("No se pudo guardar la foto.");
      setPreview(url);
      router.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="relative">
        <Avatar nombre={nombre} fotoUrl={preview} size={72} />
        <label
          className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-huellitas-primary text-white shadow transition-colors hover:bg-huellitas-primary-dark"
          title="Cambiar foto"
        >
          <Camera className="h-3.5 w-3.5" strokeWidth={2} />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      </div>

      <div className="min-w-0">
        <p className="truncate font-display text-lg font-semibold text-huellitas-ink">
          {nombre}
        </p>
        <p className="truncate text-sm text-stone-500">
          {aula ? `${aula} · ` : ""}DNI {dni}
        </p>
        {subiendo && (
          <p className="mt-1 text-xs text-huellitas-primary">Subiendo foto...</p>
        )}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    </div>
  );
}
