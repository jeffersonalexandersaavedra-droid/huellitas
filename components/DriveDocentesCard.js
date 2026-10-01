"use client";

import { useState } from "react";
import { FolderOpen, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { inputClass } from "@/lib/ui";

// Enlace único de Google Drive ("Unidades de docentes") que todos los
// docentes ven en su portal para subir sus unidades y sesiones.
export default function DriveDocentesCard({ urlInicial }) {
  const [url, setUrl] = useState(urlInicial ?? "");
  const [estado, setEstado] = useState("");

  async function guardar(event) {
    event.preventDefault();
    const limpio = url.trim();
    if (limpio && !/^https?:\/\//i.test(limpio)) {
      setEstado("El enlace debe empezar con https://");
      return;
    }
    setEstado("Guardando...");
    const { error } = await createClient()
      .from("sitio_config")
      .upsert({ id: "docentes", contenido: { drive_url: limpio }, updated_at: new Date().toISOString() });
    setEstado(error ? `Error: ${error.message}` : "Enlace guardado. Ya lo ven todos los docentes.");
  }

  return (
    <form onSubmit={guardar} className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-huellitas-primary">
        <FolderOpen className="h-5 w-5" strokeWidth={2} />
        Unidades de docentes (Google Drive)
      </h2>
      <p className="mt-1 text-sm text-stone-500">
        Pega el enlace de la carpeta del año. Aparece en el portal de cada docente para que
        suba sus unidades y sesiones, y tú las revises en un solo lugar.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className={inputClass}
        />
        <button
          type="submit"
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-huellitas-primary px-4 py-2 text-sm font-medium text-white hover:bg-huellitas-primary-dark"
        >
          <Save className="h-4 w-4" strokeWidth={2} />
          Guardar
        </button>
      </div>
      {estado && <p className="mt-2 text-sm text-stone-600">{estado}</p>}
    </form>
  );
}
