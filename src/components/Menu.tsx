"use client";
import { useState } from "react";
import { Menu as MenuIcon, LogOut } from "lucide-react";
import { signOut } from "@/app/login/actions";
export default function Menu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center gap-2">
      <span className="text-xs font-medium text-brand">Início</span>
      <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="p-1 text-black"><MenuIcon size={26} /></button>
      {open && (
        <form action={signOut} className="absolute right-0 top-10 z-10 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          <button className="flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm text-black hover:bg-gray-100"><LogOut size={16} /> Sair</button>
        </form>
      )}
    </div>
  );
}
