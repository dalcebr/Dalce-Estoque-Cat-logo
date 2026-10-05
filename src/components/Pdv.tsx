"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Banknote, Check, ChevronLeft, ChevronRight, CircleDollarSign, CreditCard, Delete, Plus, Printer, QrCode, ScanLine, Search, Share2, ShoppingCart, Trash2, User, X, Zap, Minus } from "lucide-react";
import Menu from "@/components/Menu";
import { brl } from "@/lib/format";
import { createSale } from "@/app/vendas/nova/actions";

export type Product = { id: string; name: string; price: number; cat: string | null; color: string | null };
type Line = { key: string; productId?: string; name: string; price: number; qty: number; color: string };
type Pay = { method: string; amount: number };
type Step = "catalog" | "cart" | "pay" | "amount" | "close" | "done";

const m = (c: number) => brl(c / 100);
const GRAY = "#3b4260", BRAND = "#1d4ed8";
const METHODS = [
  { k: "dinheiro", n: "Dinheiro", s: "calcular troco", Icon: Banknote, c: "bg-green-100 text-green-700" },
  { k: "débito", n: "Débito", s: "cartão à vista", Icon: CreditCard, c: "bg-sky-100 text-sky-700" },
  { k: "crédito", n: "Crédito", s: "pode parcelar", Icon: CreditCard, c: "bg-tint text-brand" },
  { k: "pix", n: "Pix", s: "cai na hora", Icon: QrCode, c: "bg-teal-100 text-teal-700" },
  { k: "fiado", n: "Fiado", s: "a prazo", Icon: BookOpen, c: "bg-amber-100 text-amber-700" },
  { k: "outros", n: "Outros", s: "", Icon: CircleDollarSign, c: "bg-slate-100 text-slate-600" },
];
const meth = (k: string) => METHODS.find((x) => x.k === k) ?? METHODS[5];
const tile = (c: string) => ({ background: `linear-gradient(180deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.35)),${c}` });

function Head({ eyebrow, title, onBack, left, meta }: { eyebrow: string; title: ReactNode; onBack?: () => void; left?: ReactNode; meta?: string }) {
  return (
    <header className="flex items-center gap-4">
      {left ?? <button onClick={onBack} aria-label="Voltar" className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-white shadow-sm"><ChevronLeft size={26} strokeWidth={2.5} /></button>}
      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex justify-between"><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>{meta && <span className="text-sm font-semibold text-soft">{meta}</span>}</div>
        <h1 className="text-3xl font-extrabold">{title}</h1>
      </div>
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-tint text-brand ring-4 ring-white"><User size={22} /></span>
    </header>
  );
}

function CobrarBar({ count, total, onClick }: { count: number; total: number; onClick: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <button disabled={count === 0} onClick={onClick} className="mx-auto flex w-full max-w-md overflow-hidden rounded-[28px] bg-brand text-white shadow-lg disabled:opacity-45">
        <span className="flex items-center gap-3 bg-black/20 px-6 py-5 text-xl font-extrabold"><ShoppingCart size={26} />{count}</span>
        <span className="flex flex-1 items-center justify-between px-6 text-2xl font-extrabold"><span>Cobrar</span><span>{m(total)}</span></span>
      </button>
    </div>
  );
}

function Customer({ value, set }: { value: string; set: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  if (open) return <input autoFocus defaultValue={value} placeholder="Nome do cliente" onBlur={(e) => { set(e.target.value.trim()); setOpen(false); }} onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()} className="mt-4 w-full rounded-2xl border border-brand bg-white px-4 py-3 text-lg outline-none" />;
  return (
    <button onClick={() => setOpen(true)} className="mt-4 flex items-center gap-3 text-lg font-bold text-brand">
      <span className="grid size-9 place-items-center rounded-full border-2 border-brand/50"><Plus size={20} /></span>
      {value || "Identificar cliente"} {!value && <span className="text-base font-medium text-soft">· opcional</span>}
    </button>
  );
}

export default function Pdv({ products, dateLabel }: { products: Product[]; dateLabel: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("catalog");
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [pays, setPays] = useState<Pay[]>([]);
  const [method, setMethod] = useState("pix");
  const [typed, setTyped] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string; time: string } | null>(null);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const paid = pays.reduce((s, p) => s + p.amount, 0);
  const remaining = Math.max(0, total - paid);
  const amount = typed === null ? remaining : Number(typed || 0);
  const applied = Math.min(amount, remaining);
  const change = method === "dinheiro" ? Math.max(0, amount - remaining) : 0;
  const cats = [...new Map(products.filter((p) => p.cat).map((p) => [p.cat as string, p.color ?? GRAY])).entries()];
  const shown = products.filter((p) => (!cat || p.cat === cat) && p.name.toLowerCase().includes(q.toLowerCase()));

  const add = (p: Product) => setLines((ls) => ls.some((l) => l.key === p.id) ? ls.map((l) => l.key === p.id ? { ...l, qty: l.qty + 1 } : l) : [...ls, { key: p.id, productId: p.id, name: p.name, price: p.price, qty: 1, color: p.color ?? GRAY }]);
  const quick = () => {
    const v = Math.round(Number((prompt("Valor da venda rápida (R$)") ?? "").replace(/\./g, "").replace(",", ".")) * 100);
    if (v > 0) setLines((ls) => [...ls, { key: `q${Date.now()}`, name: "Venda rápida", price: v, qty: 1, color: BRAND }]);
  };
  const step_ = (key: string, d: number) => setLines((ls) => ls.map((l) => l.key === key ? { ...l, qty: l.qty + d } : l).filter((l) => l.qty > 0));
  const digit = (d: string) => setTyped((t) => String(Number((t ?? "") + d)).slice(0, 9));
  const back = () => setTyped((t) => { const s = t ?? String(remaining); return s.length > 1 ? s.slice(0, -1) : "0"; });
  const receive = () => { if (applied > 0) { setPays([...pays, { method, amount: applied }]); setTyped(null); setStep("close"); } };
  const reset = () => { setLines([]); setPays([]); setCustomer(""); setNote(""); setShowNote(false); setTyped(null); setDone(null); setStep("catalog"); router.refresh(); };

  async function finish() {
    setBusy(true); setError("");
    const r = await createSale({ items: lines.map((l) => ({ productId: l.productId, name: l.name, qty: l.qty, price: l.price / 100 })), payments: pays.map((p) => ({ method: p.method, amount: p.amount / 100 })), customer, note });
    setBusy(false);
    if ("error" in r) setError(r.error); else { setDone({ code: r.code, time: r.time }); setStep("done"); }
  }
  const receipt = () => [`Dalce Estoque · Venda ${done?.code}`, ...lines.map((l) => `${l.qty}x ${l.name} — ${m(l.price * l.qty)}`), "", `Total: ${m(total)}`, ...pays.map((p) => `${meth(p.method).n}: ${m(p.amount)}`)].join("\n");
  async function share() {
    if (navigator.share) { try { await navigator.share({ text: receipt() }); } catch {} } else { await navigator.clipboard.writeText(receipt()); alert("Recibo copiado."); }
  }

  const shell = "mx-auto flex min-h-dvh max-w-md flex-col bg-page px-5 pt-5";

  if (step === "done") return (
    <main className="fixed inset-0 z-50 flex flex-col items-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 text-white" style={{ background: "linear-gradient(180deg,#16a34a,#14532d)" }}>
      <span className="rounded-full border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-bold uppercase tracking-[0.2em]">Venda {done?.code} · {done?.time}</span>
      <div className="mt-auto grid size-56 place-items-center rounded-[48px] bg-white/10"><div className="grid size-44 place-items-center rounded-[40px] bg-white/15"><div className="grid size-36 place-items-center rounded-[40px] bg-white text-green-700"><Check size={64} strokeWidth={3} /></div></div></div>
      <h1 className="mt-8 text-4xl font-extrabold">Venda concluída!</h1>
      <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-white/60">Total da venda</p>
      <p className="mt-2 text-6xl font-extrabold">{m(total)}</p>
      <div className="mt-auto w-full max-w-md space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 py-4 text-lg font-bold"><Printer size={22} /> Imprimir</button>
          <button onClick={share} className="flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/15 py-4 text-lg font-bold"><Share2 size={22} /> Compartilhar</button>
        </div>
        <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-3xl bg-white py-5 text-2xl font-extrabold text-green-700"><Plus size={26} /> Nova venda</button>
      </div>
    </main>
  );

  if (step === "close") return (
    <main className={`${shell} pb-32`}>
      <Head eyebrow="Venda · Fechamento" title="Confira e feche a venda" onBack={() => setStep("cart")} />
      <div className="mt-6 flex flex-col items-center">
        {remaining === 0
          ? <span className="flex items-center gap-3 rounded-full border border-green-300 bg-green-100 py-2.5 pl-2.5 pr-6 text-lg font-extrabold uppercase tracking-[0.15em] text-green-700"><span className="grid size-10 place-items-center rounded-full bg-green-700 text-white"><Check size={20} /></span>Tudo pago</span>
          : <span className="rounded-full bg-amber-100 px-6 py-3 text-lg font-extrabold text-amber-700">Faltam {m(remaining)}</span>}
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-soft">Total da venda</p>
        <p className="text-6xl font-extrabold tracking-tight">{m(total)}</p>
      </div>
      <h2 className="mb-2 mt-8 px-1 text-sm font-bold uppercase tracking-[0.18em] text-soft">Pagamentos recebidos</h2>
      <section className="rounded-3xl border border-line bg-white p-4">
        {pays.map((p, i) => { const M = meth(p.method); return (
          <div key={i} className="mb-3 flex items-center gap-4"><span className={`grid size-12 place-items-center rounded-xl ${M.c}`}><M.Icon size={24} /></span><b className="flex-1 text-lg">{M.n}</b><b className="text-lg">{m(p.amount)}</b>
            <button aria-label="Remover" onClick={() => setPays(pays.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-xl border border-line bg-page text-soft"><X size={18} /></button></div>); })}
        <div className="flex items-center justify-between border-t border-line pt-3"><span className="text-sm font-bold uppercase tracking-[0.18em] text-soft">Recebido</span><b className="text-2xl">{m(paid)}</b></div>
        {remaining > 0 && <button onClick={() => setStep("pay")} className="mt-3 w-full rounded-xl border-2 border-brand py-3 font-bold text-brand">+ Adicionar pagamento</button>}
      </section>
      <h2 className="mb-2 mt-7 px-1 text-sm font-bold uppercase tracking-[0.18em] text-soft">Observação</h2>
      {showNote ? <textarea autoFocus value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-3xl border border-brand bg-white p-4 text-lg outline-none" />
        : <button onClick={() => setShowNote(true)} className="flex w-full items-center justify-between rounded-3xl border border-line bg-white p-5 text-lg text-soft">Adicionar observação <Plus className="text-brand" /></button>}
      {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
      <div className="fixed inset-x-0 bottom-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button disabled={remaining > 0 || busy} onClick={finish} className="mx-auto flex w-full max-w-md items-center justify-center gap-3 rounded-[28px] bg-green-600 py-5 text-xl font-extrabold text-white shadow-lg disabled:opacity-45"><Check size={26} /> {busy ? "Salvando..." : `Finalizar venda · ${m(total)}`}</button>
      </div>
    </main>
  );

  if (step === "amount") return (
    <main className={`${shell} pb-5`}>
      <Head eyebrow={`Pagamento · ${meth(method).n}`} title="Quanto o cliente vai pagar?" onBack={() => { setTyped(null); setStep("pay"); }} />
      <div className="my-auto flex flex-col items-center py-6">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-soft">Valor a receber</p>
        <p className="mt-2 text-6xl font-extrabold tracking-tight">{m(amount)}</p>
        <span className="mt-5 rounded-full bg-green-100 px-6 py-3 text-lg font-bold text-green-700">
          {amount >= remaining ? <>Após este pagamento: quitado ✓{change > 0 && ` · troco ${m(change)}`}</> : `Ainda faltam ${m(remaining - amount)}`}
        </span>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[["Metade", Math.round(remaining / 2)], ["R$ 20", 2000], ["R$ 50", 5000], ["R$ 100", 10000]].map(([l, v]) => (
            <button key={l} onClick={() => setTyped(String(v))} className={`rounded-full border px-5 py-3 text-lg font-bold ${amount === v ? "border-tint bg-tint text-brand" : "border-line text-soft"}`}>{l}</button>))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} onClick={() => digit(d)} className="rounded-3xl border border-line bg-white py-4 text-4xl font-semibold">{d}</button>)}
        <button onClick={() => setTyped("0")} className="rounded-3xl border border-line bg-white py-4 text-2xl font-bold text-brand">limpar</button>
        <button onClick={() => digit("0")} className="rounded-3xl border border-line bg-white py-4 text-4xl font-semibold">0</button>
        <button onClick={back} aria-label="Apagar" className="grid place-items-center rounded-3xl border border-line bg-white text-brand"><Delete size={30} /></button>
      </div>
      <button disabled={applied <= 0} onClick={receive} className="mt-4 w-full rounded-[28px] bg-brand py-5 text-xl font-extrabold text-white shadow-lg disabled:opacity-45">Receber {m(applied)} no {meth(method).n.toLowerCase()}</button>
    </main>
  );

  if (step === "pay") return (
    <main className={`${shell} pb-8`}>
      <Head eyebrow="Venda · Pagamento" title={<>Como o <span className="text-brand">cliente</span> vai pagar?</>} onBack={() => setStep(pays.length ? "close" : "cart")} />
      <p className="mt-8 text-center text-xl text-soft">O cliente tem a pagar</p>
      <p className="mt-2 text-center text-7xl font-extrabold tracking-tight">{m(remaining)}</p>
      <div className="mt-10 grid grid-cols-2 gap-4">
        {METHODS.map((x) => (
          <button key={x.k} onClick={() => { setMethod(x.k); setTyped(null); setStep("amount"); }} className="flex min-h-40 flex-col items-start rounded-3xl border border-line bg-white p-5 text-left">
            <span className={`grid size-14 place-items-center rounded-2xl ${x.c}`}><x.Icon size={28} /></span>
            <b className="mt-5 text-2xl font-extrabold">{x.n}</b><span className="text-lg text-soft">{x.s}</span>
          </button>))}
      </div>
    </main>
  );

  if (step === "cart") return (
    <main className={`${shell} pb-32`}>
      <Head eyebrow="Venda · Carrinho" title="Revise a venda" onBack={() => setStep("catalog")} />
      <Customer value={customer} set={setCustomer} />
      <div className="mt-4 space-y-3">
        {lines.map((l) => (
          <div key={l.key} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-extrabold text-white" style={{ background: l.color }}>{l.name.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><b className="block truncate text-lg">{l.name}</b><span className="text-soft">{m(l.price)}</span></div>
            <div className="text-right">
              <div className="flex items-center gap-1 rounded-xl border border-line bg-page p-1">
                <button aria-label="Diminuir" onClick={() => step_(l.key, -1)} className="grid size-9 place-items-center text-soft"><Minus size={18} /></button>
                <b className="w-6 text-center text-lg">{l.qty}</b>
                <button aria-label="Aumentar" onClick={() => step_(l.key, 1)} className="grid size-9 place-items-center rounded-lg bg-ink text-white"><Plus size={18} /></button>
              </div>
              <b className="mt-1.5 block">{m(l.price * l.qty)}</b>
            </div>
          </div>))}
      </div>
      <div className="mt-auto flex items-center justify-between px-1 pb-3 pt-6 text-lg font-semibold"><span className="text-soft">{count} {count === 1 ? "item" : "itens"}</span>
        <button onClick={() => { setLines([]); setStep("catalog"); }} className="flex items-center gap-2 text-red-700"><Trash2 size={20} /> Limpar carrinho</button></div>
      <div className="mb-24 flex items-center gap-4 rounded-3xl border border-line bg-white p-5 text-lg text-soft opacity-60"><ChevronRight size={22} /> Desconto e salvar pedido</div>
      <CobrarBar count={count} total={total} onClick={() => { setPays([]); setStep("pay"); }} />
    </main>
  );

  return (
    <main className={`${shell} pb-32`}>
      <Head left={<Menu />} eyebrow="Ponto de venda" meta={dateLabel} title="O que vai vender?" />
      <Customer value={customer} set={setCustomer} />
      <div className="mt-4 flex gap-3">
        <label className="flex flex-1 items-center gap-3 rounded-3xl border border-line bg-white px-5 py-4 text-soft"><Search size={22} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto ou código" className="w-full bg-transparent text-lg text-ink outline-none placeholder:text-soft" /></label>
        <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-brand text-white shadow-lg"><ScanLine size={28} /></span>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        <button onClick={() => setCat(null)} className={`shrink-0 rounded-2xl px-6 py-3.5 text-lg font-semibold ${!cat ? "bg-ink text-white" : "border border-line bg-white text-soft"}`}>Todos</button>
        {cats.map(([n, c]) => <button key={n} onClick={() => setCat(n)} className={`flex shrink-0 items-center gap-2.5 rounded-2xl px-5 py-3.5 text-lg font-semibold ${cat === n ? "bg-ink text-white" : "border border-line bg-white text-soft"}`}><span className="size-3.5 rounded-full" style={{ background: c }} />{n}</button>)}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <button onClick={quick} className="flex aspect-[9/10] flex-col justify-between rounded-3xl p-3 text-left text-white" style={{ background: "#1e40af" }}>
          <b className="text-lg leading-tight"><Zap size={18} className="mb-0.5 mr-1 inline fill-amber-400 text-amber-400" />Venda rápida</b><b>valor livre</b>
        </button>
        {shown.map((p) => { const n = lines.find((l) => l.key === p.id)?.qty ?? 0; return (
          <button key={p.id} onClick={() => add(p)} className={`relative flex aspect-[9/10] flex-col justify-end rounded-3xl p-3 text-left text-white ${n ? "ring-4 ring-ink" : ""}`} style={tile(p.color ?? GRAY)}>
            {n > 0 && <span className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-ink text-lg font-extrabold">{n}</span>}
            <b className="text-lg leading-tight">{p.name}</b><b className="text-lg">{m(p.price)}</b>
          </button>); })}
        <Link href="/produtos/novo" className="relative flex aspect-[9/10] flex-col justify-between rounded-3xl p-3 text-white" style={{ background: "linear-gradient(180deg,#252438,#33324a)" }}>
          <span><b className="block text-xl leading-tight">Novo produto</b><span className="text-sm text-white/70">cadastrar item</span></span>
          <span className="grid size-12 self-end place-items-center rounded-xl bg-brand"><Plus /></span>
        </Link>
      </div>
      <CobrarBar count={count} total={total} onClick={() => setStep("cart")} />
    </main>
  );
}
