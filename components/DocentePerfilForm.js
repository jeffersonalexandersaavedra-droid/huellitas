"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { subirFotoPerfil } from "@/lib/archivos";
import { inputClass } from "@/lib/ui";
import Campo from "@/components/Campo";
import TarjetaDocente from "@/components/TarjetaDocente";

export default function DocentePerfilForm({ docente }) {
  const router = useRouter();
  const [especialidad, setEspecialidad] = useState(docente.especialidad ?? "");
  const [bio, setBio] = useState(docente.bio ?? "");
  const [fotoUrl, setFotoUrl] = useState(docente.foto_url ?? null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function guardar(cambios) {
    setOcupado(true);
    setMensaje("");
    const { error } = await createClient().rpc("actualizar_perfil_docente", {
      p_especialidad: especialidad,
      p_bio: bio,
      p_foto_url: null,
      ...cambios,
    });
    setOcupado(false);
    setMensaje(error ? `Error: ${error.message}` : "Perfil actualizado.");
    if (!error) router.refresh();
  }

  async function cambiarFoto(file) {
    if (!file) return;
    try {
      setOcupado(true);
      const url = await subirFotoPerfil(createClient(), file);
      setFotoUrl(url);
      await guardar({ p_foto_url: url });
    } catch (e) {
      setOcupado(false);
      setMensaje(`Error: ${e.message}`);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          guardar({});
        }}
        className="space-y-4 rounded-xl bg-white p-6 shadow-sm"
      >
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-huellitas-primary px-3 py-2 text-sm font-medium text-huellitas-primary hover:bg-huellitas-primary-light">
          <Camera className="h-4 w-4" strokeWidth={2} />
          {fotoUrl ? "Cambiar foto" : "Subir foto"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => cambiarFoto(e.target.files?.[0])}
          />
        </label>

        <Campo label="Título o especialidad">
          <input
            type="text"
            maxLength={120}
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            placeholder="Ej. Lic. en Educación Primaria"
            className={inputClass}
          />
        </Campo>

        <Campo label="Trayectoria profesional">
          <textarea
            rows={6}
            maxLength={1200}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Estudios, años de experiencia, capacitaciones, logros..."
            className={inputClass}
          />
        </Campo>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          {mensaje && (
            <p className={`text-sm ${mensaje.startsWith("Error") ? "text-rose-600" : "text-emerald-600"}`}>
              {mensaje}
            </p>
          )}
          <button
            type="submit"
            disabled={ocupado}
            className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-huellitas-primary-dark disabled:opacity-60"
          >
            <Save className="h-4 w-4" strokeWidth={2} />
            {ocupado ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </form>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
          Así te ven los padres
        </p>
        <div className="rounded-xl bg-white p-2 shadow-sm">
          <TarjetaDocente docente={{ ...docente, especialidad, bio, foto_url: fotoUrl }} />
        </div>
      </div>
    </div>
  );
}
