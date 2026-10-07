"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
export default function ThemeSwitch() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => { const d = !dark; setDark(d); document.documentElement.classList.toggle("dark", d); try { localStorage.setItem("theme", d ? "dark" : "light"); } catch {} };
  return (
    <button role="switch" aria-checked={dark} onClick={toggle} className="flex w-full items-center gap-4 px-5 py-4 text-left">
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600">{dark ? <Moon size={24} /> : <Sun size={24} />}</span>
      <span className="flex-1 leading-tight"><b className="block text-xl font-extrabold">Modo escuro</b><span className="text-soft">{dark ? "ativado" : "desativado"}</span></span>
      <span className={`h-7 w-12 shrink-0 rounded-full p-0.5 transition-colors ${dark ? "bg-brand" : "bg-line"}`}><span className={`block size-6 rounded-full bg-white shadow transition-transform ${dark ? "translate-x-5" : ""}`} /></span>
    </button>
  );
}
