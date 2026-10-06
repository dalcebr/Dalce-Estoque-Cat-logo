import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
export default function PageHeader({ eyebrow, title, back, sub, right }: { eyebrow: string; title: string; back: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="flex items-center gap-4">
      <Link href={back} aria-label="Voltar" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface text-ink shadow-sm"><ChevronLeft size={24} strokeWidth={2.5} /></Link>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {sub && <p className="mt-0.5 text-soft">{sub}</p>}
      </div>
      {right}
    </header>
  );
}
