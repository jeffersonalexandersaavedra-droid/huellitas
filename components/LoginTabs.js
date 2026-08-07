"use client";

import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import PadrePortalNotice from "@/components/PadrePortalNotice";

const TABS = [
  { id: "admin", label: "Administrador" },
  { id: "padre", label: "Padre de familia" },
];

export default function LoginTabs() {
  const [tab, setTab] = useState("admin");

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-huellitas-cream p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-huellitas-primary shadow-sm"
                : "text-huellitas-ink/60 hover:text-huellitas-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "admin" ? <LoginForm /> : <PadrePortalNotice />}
    </div>
  );
}
