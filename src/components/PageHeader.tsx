import Link from "next/link";
import { ChevronLeft } from "lucide-react";
export default function PageHeader({ eyebrow, title, back }: { eyebrow: string; title: string; back: string }) {
  return (
    <header className="flex items-center gap-4">
      <Link href={back} aria-label="Voltar" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white text-ink shadow-sm"><ChevronLeft size={26} strokeWidth={2.5} /></Link>
      <div className="leading-tight">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
        <h1 className="text-3xl font-extrabold">{title}</h1>
      </div>
    </header>
  );
}
