"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Construction, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const WHATSAPP_ADMIN = "https://wa.me/51950617019";

export default function PadrePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-huellitas-primary-light text-huellitas-accent-dark">
        <Construction className="h-8 w-8" strokeWidth={2} />
      </div>

      <h1 className="mt-5 font-display text-2xl font-semibold text-huellitas-primary">
        Portal en construcción
      </h1>

      <p className="mt-3 text-sm text-huellitas-ink/70">
        Muy pronto podrás consultar los pagos y notas de tu hijo.
        Comunícate con la administración para cualquier consulta.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <a
          href={WHATSAPP_ADMIN}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-huellitas-accent px-4 py-2.5 text-sm font-medium text-huellitas-ink transition-colors hover:bg-huellitas-accent-dark hover:text-white"
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2} />
          WhatsApp administración
        </a>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="rounded-lg border border-huellitas-primary px-4 py-2.5 text-sm font-medium text-huellitas-primary transition-colors hover:bg-huellitas-primary-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Cerrando sesión..." : "Cerrar sesión"}
        </button>
      </div>
    </div>
  );
}
