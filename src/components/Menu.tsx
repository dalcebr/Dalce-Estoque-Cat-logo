"use client";
import { useState } from "react";
import { Menu as MenuIcon, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
export default function Menu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className="grid size-12 place-items-center rounded-2xl border border-line bg-white text-ink shadow-sm"><MenuIcon size={24} strokeWidth={2.5} /></button>
      {open && (
        <form action={signOut} className="absolute left-0 top-14 z-20 rounded-xl border border-line bg-white p-1 shadow-lg">
          <button className="flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium hover:bg-page"><LogOut size={16} /> Sair</button>
        </form>
      )}
    </div>
  );
}
