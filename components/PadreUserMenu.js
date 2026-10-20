"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, ChevronDown, KeyRound, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ModalCambiarPassword from "@/components/ModalCambiarPassword";

export default function PadreUserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Menú de la cuenta"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
      >
        <User className="h-5 w-5" strokeWidth={2} />
        <ChevronDown className="h-4 w-4" strokeWidth={2} />
      </button>

      {open && (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-lg bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setShowPasswordModal(true);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-huellitas-ink hover:bg-huellitas-cream"
            >
              <KeyRound className="h-4 w-4 text-huellitas-primary" strokeWidth={2} />
              Cambiar contraseña
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-huellitas-ink hover:bg-huellitas-cream"
            >
              <LogOut className="h-4 w-4 text-huellitas-primary" strokeWidth={2} />
              Cerrar sesión
            </button>
          </div>
        </>
      )}

      <ModalCambiarPassword
        open={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />
    </div>
  );
}
