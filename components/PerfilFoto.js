"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AvatarEstudiante from "@/components/AvatarEstudiante";

// Cabecera de perfil del estudiante con foto opcional. Quien no suba foto
// ve sus iniciales (predeterminado). La foto se guarda en Storage, no en la
// base, así que no hace pesado al sistema.
export default function PerfilFoto({ estudianteId, nombre, aula, dni, fotoUrl }) {
  const supabase = createClient();
  const router = useRouter();
  const [preview, setPreview] = useState(fotoUrl ?? null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("La imagen supera los 3 MB.");
      return;
    }
    setError("");
    setSubiendo(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Tu sesión expiró.");
      setSubiendo(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/perfil-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("perfiles")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setError("No se pudo subir la foto.");
      setSubiendo(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("perfiles").getPublicUrl(path);

    const { error: updErr } = await supabase
      .from("estudiantes")
      .update({ foto_url: publicUrl })
      .eq("id", estudianteId);
    if (updErr) {
      setError("No se pudo guardar la foto.");
      setSubiendo(false);
      return;
    }

    setPreview(publicUrl);
    setSubiendo(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
      <div className="relative">
        <AvatarEstudiante nombre={nombre} fotoUrl={preview} size={72} />
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
