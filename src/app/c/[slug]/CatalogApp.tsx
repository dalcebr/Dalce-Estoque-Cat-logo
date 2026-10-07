"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { CatalogProduct, CatalogSettings } from "./page";

/* ─── types ─── */
type CartItem = { product: CatalogProduct; qty: number };
type View =
  | { type: "home" }
  | { type: "product"; id: string }
  | { type: "favorites" }
  | { type: "list"; title: string; filter?: string; filterType?: "category" | "collection" };

/* ─── constants ─── */
const GOLD = "#C9A96E";
const BG = "#0A0A0A";
const BG_CARD = "#141414";
const BG_ELEVATED = "#1A1A1A";
const TEXT = "#F5F0EB";
const TEXT_MUTED = "#8A8580";
const BORDER = "#2A2520";

/* ─── helpers ─── */
function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const num = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function loadFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem("catalog_favs") ?? "[]");
  } catch {
    return [];
  }
}
function saveFavorites(ids: string[]) {
  try {
    localStorage.setItem("catalog_favs", JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

/* ─── icons (inline SVG) ─── */
function Icon({ d, size = 24, stroke = "currentColor", fill = "none" }: { d: string; size?: number; stroke?: string; fill?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const MenuIcon = () => <Icon d="M4 6h16M4 12h16M4 18h16" />;
const XIcon = () => <Icon d="M18 6L6 18M6 6l12 12" />;
function SearchIcon({ size = 24 }: { size?: number }) {
  return <Icon d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" size={size} />;
}
const CartIcon = () => <Icon d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />;
function HeartIcon({ filled }: { filled: boolean }) {
  return <Icon d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={filled ? GOLD : "none"} stroke={filled ? GOLD : "currentColor"} />;
}
const PlusIcon = () => <Icon d="M12 5v14M5 12h14" size={18} />;
const MinusIcon = () => <Icon d="M5 12h14" size={18} />;
const TrashIcon = () => <Icon d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" size={18} />;
const ChevronLeft = () => <Icon d="M15 18l-6-6 6-6" />;
const ShareIcon = () => <Icon d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" size={20} />;
const ArrowRight = () => <Icon d="M5 12h14M12 5l7 7-7 7" size={16} />;
const HomeIcon = () => <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" size={20} />;
const StarIcon = () => <Icon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" size={20} />;
const TagIcon = () => <Icon d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" size={20} />;
const GridIcon = () => <Icon d="M10 3H3v7h7V3zM21 3h-7v7h7V3zM21 14h-7v7h7v-7zM10 14H3v7h7v-7z" size={20} />;
const BoltIcon = () => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8" size={20} />;
const ChatIcon = () => <Icon d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" size={20} />;
const ShieldIcon = () => <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={20} />;
const InstaIcon = () => <Icon d="M16 4H8a4 4 0 00-4 4v8a4 4 0 004 4h8a4 4 0 004-4V8a4 4 0 00-4-4zM12 15a3 3 0 100-6 3 3 0 000 6zM16.5 7.5h.01" size={20} />;

/* ─── small sub-components ─── */
function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-black" style={{ background: GOLD }}>
      {children}
    </span>
  );
}

function TrustBadge({ icon, title, sub }: { icon: ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
      <div className="flex size-10 items-center justify-center rounded-full" style={{ border: `1px solid ${GOLD}`, color: GOLD }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: TEXT, fontFamily: "var(--font-sans)" }}>{title}</p>
        <p className="text-xs" style={{ color: TEXT_MUTED }}>{sub}</p>
      </div>
    </div>
  );
}

function MenuBtn({ icon, label, onClick, count }: { icon: ReactNode; label: string; onClick: () => void; count?: number }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: TEXT }}>
      <span style={{ color: TEXT_MUTED }}>{icon}</span>
      {label}
      {count !== undefined && count > 0 && (
        <span className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold text-black" style={{ background: GOLD }}>{count}</span>
      )}
    </button>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-end justify-between px-1">
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="flex items-center gap-1 text-sm font-medium" style={{ color: GOLD }}>
          Ver todos <ArrowRight />
        </button>
      )}
    </div>
  );
}

function CategoryChips({ cats, active, onSelect }: { cats: string[]; active: string | null; onSelect: (c: string | null) => void }) {
  if (cats.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <button onClick={() => onSelect(null)} className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors" style={{ background: !active ? GOLD : BG_CARD, color: !active ? "#000" : TEXT_MUTED, border: `1px solid ${!active ? GOLD : BORDER}` }}>
        Todas
      </button>
      {cats.map((c) => (
        <button key={c} onClick={() => onSelect(c)} className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors" style={{ background: active === c ? GOLD : BG_CARD, color: active === c ? "#000" : TEXT_MUTED, border: `1px solid ${active === c ? GOLD : BORDER}` }}>
          {c}
        </button>
      ))}
    </div>
  );
}

/* ─── ProductCard ─── */
function ProductCard({
  p, isFav, onToggleFav, onAddToCart, onTap,
}: {
  p: CatalogProduct;
  isFav: boolean;
  onToggleFav: () => void;
  onAddToCart: () => void;
  onTap: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
      <button onClick={onTap} className="block aspect-square w-full overflow-hidden" style={{ background: BG_ELEVATED }}>
        {p.image ? (
          <img src={p.image} alt={p.name} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center" style={{ color: TEXT_MUTED }}><GridIcon /></div>
        )}
      </button>
      <button onClick={(e) => { e.stopPropagation(); onToggleFav(); }} className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full backdrop-blur-sm" style={{ background: "rgba(10,10,10,0.6)" }}>
        <HeartIcon filled={isFav} />
      </button>
      <div className="p-3">
        <button onClick={onTap} className="block text-left">
          <p className="line-clamp-2 text-sm font-medium leading-tight" style={{ color: TEXT, fontFamily: "var(--font-sans)" }}>{p.name}</p>
          <p className="mt-1 text-lg font-bold" style={{ color: GOLD, fontFamily: "var(--font-serif)" }}>{brl(p.price)}</p>
        </button>
        {p.available ? (
          <button onClick={(e) => { e.stopPropagation(); onAddToCart(); }} className="mt-2 flex size-9 items-center justify-center rounded-full" style={{ background: GOLD, color: "#000" }}>
            <PlusIcon />
          </button>
        ) : (
          <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ background: BG_ELEVATED, color: TEXT_MUTED }}>Indisponível</span>
        )}
      </div>
    </div>
  );
}

/* ─── ProductGrid helper ─── */
function ProductGrid({
  items, favs, onToggleFav, onAddToCart, onTap,
}: {
  items: CatalogProduct[];
  favs: string[];
  onToggleFav: (id: string) => void;
  onAddToCart: (p: CatalogProduct) => void;
  onTap: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} isFav={favs.includes(p.id)} onToggleFav={() => onToggleFav(p.id)} onAddToCart={() => onAddToCart(p)} onTap={() => onTap(p.id)} />
      ))}
    </div>
  );
}

/* ═══════════════════ ListView (proper component with its own state) ═══════════════════ */
function ListView({
  title, filter, filterType, products, featured, favs, onToggleFav, onAddToCart, onNavigate,
}: {
  title: string;
  filter?: string;
  filterType?: "category" | "collection";
  products: CatalogProduct[];
  featured: CatalogProduct[];
  favs: string[];
  onToggleFav: (id: string) => void;
  onAddToCart: (p: CatalogProduct) => void;
  onNavigate: (v: View) => void;
}) {
  const [catFilter, setCatFilter] = useState<string | null>(null);

  let items = products;
  if (filter === "__featured__") items = featured;
  else if (filter && filterType === "category") items = products.filter((p) => p.category === filter);
  else if (filter && filterType === "collection") items = products.filter((p) => p.collection === filter);

  const display = catFilter ? items.filter((p) => p.category === catFilter) : items;
  const cats = [...new Set(items.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <div className="p-5">
      <button onClick={() => onNavigate({ type: "home" })} className="mb-3 flex items-center gap-1 text-sm" style={{ color: TEXT_MUTED }}>
        <ChevronLeft />Início
      </button>
      <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>{title}</h2>
      <div className="mt-3">
        <CategoryChips cats={cats} active={catFilter} onSelect={setCatFilter} />
      </div>
      <p className="mt-3 text-xs" style={{ color: TEXT_MUTED }}>
        {display.length} {display.length === 1 ? "peça" : "peças"}
      </p>
      <div className="mt-3">
        <ProductGrid items={display} favs={favs} onToggleFav={onToggleFav} onAddToCart={onAddToCart} onTap={(id) => onNavigate({ type: "product", id })} />
      </div>
      {display.length === 0 && <p className="py-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Nenhuma peça encontrada.</p>}
    </div>
  );
}

/* ═══════════════════ FavoritesView (proper component with its own state) ═══════════════════ */
function FavoritesView({
  products, favs, onToggleFav, onAddToCart, onNavigate,
}: {
  products: CatalogProduct[];
  favs: string[];
  onToggleFav: (id: string) => void;
  onAddToCart: (p: CatalogProduct) => void;
  onNavigate: (v: View) => void;
}) {
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);

  const favProducts = products.filter((p) => favs.includes(p.id));
  const filtered = favProducts.filter(
    (p) => (!q || p.name.toLowerCase().includes(q.toLowerCase())) && (!catFilter || p.category === catFilter),
  );
  const cats = [...new Set(favProducts.map((p) => p.category).filter(Boolean))] as string[];

  return (
    <div className="p-5">
      <button onClick={() => onNavigate({ type: "home" })} className="mb-3 flex items-center gap-1 text-sm" style={{ color: TEXT_MUTED }}>
        <ChevronLeft />Início
      </button>
      <h2 className="mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>Meus favoritos</h2>

      <div className="relative mb-3">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }}><SearchIcon size={18} /></div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar peças" className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: TEXT, fontFamily: "var(--font-sans)" }} />
      </div>

      {cats.length > 0 && (
        <div className="mb-3">
          <CategoryChips cats={cats} active={catFilter} onSelect={setCatFilter} />
        </div>
      )}
      <p className="mb-3 text-xs" style={{ color: TEXT_MUTED }}>
        {filtered.length} {filtered.length === 1 ? "peça" : "peças"}
      </p>

      <ProductGrid items={filtered} favs={favs} onToggleFav={onToggleFav} onAddToCart={onAddToCart} onTap={(id) => onNavigate({ type: "product", id })} />

      {favProducts.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div style={{ color: TEXT_MUTED }}><HeartIcon filled={false} /></div>
          <p className="text-sm" style={{ color: TEXT_MUTED }}>Você ainda não favoritou nenhuma peça.</p>
          <button onClick={() => onNavigate({ type: "home" })} className="rounded-lg px-5 py-2.5 text-sm font-semibold text-black" style={{ background: GOLD }}>
            Explorar produtos
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ MAIN CatalogApp ═══════════════════ */
export default function CatalogApp({
  storeName, settings, products, categories, collections,
}: {
  storeName: string;
  settings: CatalogSettings;
  products: CatalogProduct[];
  categories: { name: string; color: string }[];
  collections: string[];
}) {
  const [view, setView] = useState<View>({ type: "home" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [bannerIdx, setBannerIdx] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mainRef = useRef<HTMLDivElement>(null);

  /* load favorites */
  useEffect(() => { setFavs(loadFavorites()); }, []);

  /* auto-advance banner */
  useEffect(() => {
    const t = setInterval(() => setBannerIdx((i) => (i + 1) % 2), 5000);
    return () => clearInterval(t);
  }, []);

  /* scroll to top on view change */
  useEffect(() => { mainRef.current?.scrollTo(0, 0); }, [view]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  }, []);

  const addToCart = useCallback((p: CatalogProduct) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { product: p, qty: 1 }];
    });
    showToast(`${p.name} foi para o carrinho`);
  }, [showToast]);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => prev.map((c) => (c.product.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c)));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== id));
  }, []);

  const cartTotal = cart.reduce((s, c) => s + c.product.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  const wa = settings.phone
    ? (() => { const d = settings.phone!.replace(/\D/g, ""); return d.length <= 11 ? `55${d}` : d; })()
    : "";

  const featured = products.filter((p) => p.featured);
  const newest = [...products].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

  const filteredProducts = searchQ
    ? products.filter((p) => p.name.toLowerCase().includes(searchQ.toLowerCase()))
    : products;

  const navigate = useCallback((v: View) => {
    setView(v);
    setMenuOpen(false);
    setSearchOpen(false);
  }, []);

  const finishWhatsApp = () => {
    if (!wa || cart.length === 0) return;
    const lines = cart.map((c) => `• ${c.qty}x ${c.product.name} — ${brl(c.product.price * c.qty)}`);
    let msg = `Olá, ${storeName}! Gostaria de fazer este pedido:\n\n${lines.join("\n")}\n\nTotal: ${brl(cartTotal)}`;
    if (customerName.trim()) msg += `\n\nMeu nome: ${customerName.trim()}`;
    window.open(waLink(settings.phone!, msg), "_blank");
  };

  /* ─── product detail ─── */
  const renderProduct = (pid: string) => {
    const p = products.find((x) => x.id === pid);
    if (!p) return <p style={{ color: TEXT_MUTED, textAlign: "center", padding: 40 }}>Produto não encontrado.</p>;
    const related = products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
    return (
      <div>
        <button onClick={() => setView({ type: "home" })} className="flex items-center gap-1 px-4 pb-2 pt-4" style={{ color: TEXT_MUTED, fontFamily: "var(--font-sans)" }}>
          <ChevronLeft /><span className="text-sm">Voltar</span>
        </button>
        {p.image ? (
          <div className="aspect-square w-full overflow-hidden" style={{ background: BG_CARD }}>
            <img src={p.image} alt={p.name} className="size-full object-contain" />
          </div>
        ) : (
          <div className="flex aspect-square w-full items-center justify-center" style={{ background: BG_CARD, color: TEXT_MUTED }}>
            <GridIcon />
          </div>
        )}
        <div className="space-y-4 p-5">
          {(p.category || p.collection) && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: GOLD, fontFamily: "var(--font-sans)" }}>
              {p.collection ?? p.category}
            </p>
          )}
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>{p.name}</h2>
          <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: GOLD }}>{brl(p.price)}</p>
          {p.available && <p className="text-sm" style={{ color: TEXT_MUTED }}>Disponível para entrega</p>}

          <div className="flex flex-col gap-3 pt-2">
            {p.available && (
              <button onClick={() => addToCart(p)} className="rounded-xl py-4 text-base font-bold text-black" style={{ background: GOLD, fontFamily: "var(--font-sans)" }}>
                Adicionar ao carrinho
              </button>
            )}
            {wa && (
              <a href={waLink(settings.phone!, `Olá! Tenho interesse no produto: ${p.name} — ${brl(p.price)}`)} target="_blank" rel="noopener noreferrer" className="block rounded-xl py-4 text-center text-base font-bold" style={{ border: `2px solid ${GOLD}`, color: GOLD, fontFamily: "var(--font-sans)" }}>
                Comprar pelo WhatsApp
              </a>
            )}
          </div>

          <div className="flex items-center gap-6 pt-1">
            <button onClick={() => toggleFav(p.id)} className="flex items-center gap-2 text-sm" style={{ color: TEXT_MUTED }}>
              <HeartIcon filled={favs.includes(p.id)} />{favs.includes(p.id) ? "Favoritado" : "Favoritar"}
            </button>
            <button onClick={() => { if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title: p.name, url: window.location.href }); }} className="flex items-center gap-2 text-sm" style={{ color: TEXT_MUTED }}>
              <ShareIcon />Compartilhar
            </button>
          </div>

          {p.description && (
            <div className="pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED, fontFamily: "var(--font-sans)" }}>Descrição</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: TEXT, fontFamily: "var(--font-sans)" }}>{p.description}</p>
            </div>
          )}

          {(p.material || p.collection || p.category) && (
            <div className="pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: TEXT_MUTED, fontFamily: "var(--font-sans)" }}>Detalhes</h3>
              <div>
                {p.material && <div className="flex justify-between border-b py-3 text-sm" style={{ borderColor: BORDER }}><span style={{ color: TEXT_MUTED }}>Material</span><span style={{ color: TEXT }}>{p.material}</span></div>}
                {p.category && <div className="flex justify-between border-b py-3 text-sm" style={{ borderColor: BORDER }}><span style={{ color: TEXT_MUTED }}>Categoria</span><span style={{ color: TEXT }}>{p.category}</span></div>}
                {p.collection && <div className="flex justify-between border-b py-3 text-sm" style={{ borderColor: BORDER }}><span style={{ color: TEXT_MUTED }}>Coleção</span><span style={{ color: TEXT }}>{p.collection}</span></div>}
                {!p.available && <div className="flex justify-between py-3 text-sm"><span style={{ color: TEXT_MUTED }}>Disponibilidade</span><span className="font-semibold" style={{ color: "#EF4444" }}>Indisponível</span></div>}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="pt-6">
              <h3 className="mb-4 text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>Você também pode gostar</h3>
              <ProductGrid items={related} favs={favs} onToggleFav={toggleFav} onAddToCart={addToCart} onTap={(id) => navigate({ type: "product", id })} />
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ─── home view ─── */
  const renderHome = () => {
    const heroProducts = featured.length > 0 ? featured.slice(0, 2) : products.slice(0, 2);
    const banners = [
      { eyebrow: storeName.toUpperCase(), title: "Qualidade e\nElegância", sub: settings.highlight ?? "Peças selecionadas especialmente para você", cta: "Ver produtos", action: () => navigate({ type: "list", title: "Todos os produtos" }) },
      { eyebrow: "COLEÇÃO", title: "Descubra\nNossas Peças", sub: settings.top_text ?? "Encontre a peça perfeita", cta: "Ver coleção", action: () => navigate({ type: "list", title: "Todos os produtos" }) },
    ];
    const banner = banners[bannerIdx];
    const heroImg = heroProducts[bannerIdx]?.image ?? heroProducts[0]?.image ?? null;

    return (
      <>
        {/* Banner */}
        <div className="relative overflow-hidden" style={{ height: 420, background: BG_CARD }}>
          {heroImg && <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover opacity-40" />}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.95) 10%, rgba(10,10,10,0.4) 100%)" }} />
          <div className="relative flex h-full flex-col justify-end p-6">
            <p className="text-xs font-semibold tracking-[0.25em]" style={{ color: GOLD, fontFamily: "var(--font-sans)" }}>{banner.eyebrow}</p>
            <h2 className="mt-2 whitespace-pre-line text-4xl font-bold leading-[1.1]" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>{banner.title}</h2>
            <div className="my-3 h-px w-12" style={{ background: GOLD }} />
            <p className="text-sm" style={{ color: TEXT_MUTED, fontFamily: "var(--font-sans)" }}>{banner.sub}</p>
            <button onClick={banner.action} className="mt-4 w-fit rounded-lg px-6 py-3 text-sm font-bold text-black" style={{ background: GOLD, fontFamily: "var(--font-sans)" }}>{banner.cta}</button>
          </div>
          <div className="absolute bottom-4 right-6 flex gap-2">
            {[0, 1].map((i) => (
              <button key={i} onClick={() => setBannerIdx(i)} className="size-2 rounded-full transition-all" style={{ background: i === bannerIdx ? GOLD : TEXT_MUTED, transform: i === bannerIdx ? "scale(1.3)" : "scale(1)" }} />
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-3 p-5">
          <TrustBadge icon={<StarIcon />} title="Qualidade" sub="Peças selecionadas" />
          <TrustBadge icon={<BoltIcon />} title="Envio rápido" sub="Para todo o Brasil" />
          <TrustBadge icon={<ChatIcon />} title="Atendimento" sub="Pelo WhatsApp" />
          <TrustBadge icon={<ShieldIcon />} title="Compra segura" sub="Direto com a loja" />
        </div>

        {/* Mais vendidos */}
        {featured.length > 0 && (
          <div className="px-5 pb-6">
            <SectionHeader title="Mais vendidos" onSeeAll={() => navigate({ type: "list", title: "Mais vendidos", filter: "__featured__", filterType: "category" })} />
            <div className="mt-4">
              <ProductGrid items={featured.slice(0, 4)} favs={favs} onToggleFav={toggleFav} onAddToCart={addToCart} onTap={(id) => navigate({ type: "product", id })} />
            </div>
          </div>
        )}

        {/* Novidades */}
        <div className="px-5 pb-6">
          <SectionHeader title="Novidades" onSeeAll={() => navigate({ type: "list", title: "Todos os produtos" })} />
          <div className="mt-4">
            <ProductGrid items={(featured.length > 0 ? newest : products).slice(0, 6)} favs={favs} onToggleFav={toggleFav} onAddToCart={addToCart} onTap={(id) => navigate({ type: "product", id })} />
          </div>
        </div>

        {products.length === 0 && <p className="px-5 pb-8 text-center text-sm" style={{ color: TEXT_MUTED }}>Nenhum produto disponível no momento.</p>}

        {settings.about && (
          <div className="mx-5 mb-6 rounded-2xl p-5" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
            <h3 className="mb-2 text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>Sobre nós</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: TEXT_MUTED, fontFamily: "var(--font-sans)" }}>{settings.about}</p>
          </div>
        )}
      </>
    );
  };

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="relative min-h-dvh" style={{ background: BG, color: TEXT, fontFamily: "var(--font-sans)" }}>
      {/* Inline keyframes for toast animation */}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)translateX(-50%)}to{opacity:1;transform:translateY(0)translateX(-50%)}}`}</style>

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3" style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
        <button onClick={() => setMenuOpen(true)} aria-label="Menu" style={{ color: TEXT }}><MenuIcon /></button>
        <button onClick={() => navigate({ type: "home" })} className="flex flex-col items-center">
          {settings.logo ? (
            <img src={settings.logo} alt={storeName} className="h-8 object-contain" />
          ) : (
            <span className="text-lg font-bold tracking-[0.15em]" style={{ fontFamily: "var(--font-serif)", color: TEXT }}>{storeName.toUpperCase()}</span>
          )}
          <span className="text-[10px] tracking-[0.2em]" style={{ color: TEXT_MUTED }}>Qualidade · Excelência</span>
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => { setSearchOpen(!searchOpen); setSearchQ(""); }} aria-label="Buscar" style={{ color: TEXT }}><SearchIcon size={22} /></button>
          <button onClick={() => setCartOpen(true)} aria-label="Carrinho" className="relative" style={{ color: TEXT }}>
            <CartIcon />
            {cartCount > 0 && <Badge>{cartCount}</Badge>}
          </button>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="sticky top-[57px] z-30 p-3" style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }}><SearchIcon size={18} /></div>
            <input autoFocus value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Buscar produtos..." className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
          </div>
          {searchQ && (
            <div className="mt-2 max-h-72 overflow-y-auto">
              {filteredProducts.length === 0 && <p className="p-4 text-center text-sm" style={{ color: TEXT_MUTED }}>Nenhum produto encontrado.</p>}
              {filteredProducts.slice(0, 8).map((p) => (
                <button key={p.id} onClick={() => { navigate({ type: "product", id: p.id }); setSearchOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:opacity-80">
                  {p.image ? <img src={p.image} alt="" className="size-10 rounded-lg object-cover" /> : <div className="flex size-10 items-center justify-center rounded-lg" style={{ background: BG_ELEVATED }}><GridIcon /></div>}
                  <div>
                    <p className="text-sm font-medium" style={{ color: TEXT }}>{p.name}</p>
                    <p className="text-xs" style={{ color: GOLD }}>{brl(p.price)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── SIDE MENU ─── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <nav className="relative h-full w-72 overflow-y-auto p-6" style={{ background: BG }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMenuOpen(false)} className="absolute right-4 top-4" style={{ color: TEXT_MUTED }}><XIcon /></button>
            <div className="mb-8 mt-2">
              {settings.logo ? <img src={settings.logo} alt={storeName} className="h-10 object-contain" /> : <span className="text-xl font-bold tracking-[0.15em]" style={{ fontFamily: "var(--font-serif)" }}>{storeName.toUpperCase()}</span>}
            </div>
            <div className="space-y-1">
              <MenuBtn icon={<HomeIcon />} label="Início" onClick={() => navigate({ type: "home" })} />
              <MenuBtn icon={<GridIcon />} label="Todos os produtos" onClick={() => navigate({ type: "list", title: "Todos os produtos" })} />
              <MenuBtn icon={<HeartIcon filled={false} />} label="Meus favoritos" onClick={() => navigate({ type: "favorites" })} count={favs.length || undefined} />
            </div>
            {collections.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: TEXT_MUTED }}>Coleções</p>
                <div className="space-y-1">
                  {collections.map((c) => <MenuBtn key={c} icon={<TagIcon />} label={c} onClick={() => navigate({ type: "list", title: c, filter: c, filterType: "collection" })} />)}
                </div>
              </div>
            )}
            {categories.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: TEXT_MUTED }}>Categorias</p>
                <div className="space-y-1">
                  {categories.map((c) => <MenuBtn key={c.name} icon={<span className="size-3 rounded-full" style={{ background: c.color }} />} label={c.name} onClick={() => navigate({ type: "list", title: c.name, filter: c.name, filterType: "category" })} />)}
                </div>
              </div>
            )}
            {(wa || settings.instagram) && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: TEXT_MUTED }}>Fale com a gente</p>
                <div className="space-y-1">
                  {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: TEXT }}><ChatIcon />WhatsApp</a>}
                  {settings.instagram && <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:opacity-80" style={{ color: TEXT }}><InstaIcon />@{settings.instagram}</a>}
                </div>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* ─── CART DRAWER ─── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="relative flex h-full w-80 max-w-[85vw] flex-col" style={{ background: BG }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <h3 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>Carrinho</h3>
              <button onClick={() => setCartOpen(false)} style={{ color: TEXT_MUTED }}><XIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 && <p className="py-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Seu carrinho está vazio.</p>}
              <div className="space-y-4">
                {cart.map((c) => (
                  <div key={c.product.id} className="flex gap-3 rounded-xl p-3" style={{ background: BG_CARD, border: `1px solid ${BORDER}` }}>
                    {c.product.image ? <img src={c.product.image} alt="" className="size-16 shrink-0 rounded-lg object-cover" /> : <div className="flex size-16 shrink-0 items-center justify-center rounded-lg" style={{ background: BG_ELEVATED }}><GridIcon /></div>}
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight" style={{ color: TEXT }}>{c.product.name}</p>
                      <p className="mt-0.5 text-sm font-bold" style={{ color: GOLD }}>{brl(c.product.price * c.qty)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => updateQty(c.product.id, -1)} className="flex size-7 items-center justify-center rounded-md" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}><MinusIcon /></button>
                        <span className="w-6 text-center text-sm font-semibold" style={{ color: TEXT }}>{c.qty}</span>
                        <button onClick={() => updateQty(c.product.id, 1)} className="flex size-7 items-center justify-center rounded-md" style={{ border: `1px solid ${BORDER}`, color: TEXT_MUTED }}><PlusIcon /></button>
                        <button onClick={() => removeFromCart(c.product.id)} className="ml-auto" style={{ color: TEXT_MUTED }}><TrashIcon /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {cart.length > 0 && (
              <div className="p-5" style={{ borderTop: `1px solid ${BORDER}` }}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: TEXT_MUTED }}>Total</span>
                  <span className="text-xl font-bold" style={{ color: GOLD, fontFamily: "var(--font-serif)" }}>{brl(cartTotal)}</span>
                </div>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Seu nome (opcional)" className="mb-3 w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: TEXT }} />
                <button onClick={finishWhatsApp} className="w-full rounded-xl py-4 text-base font-bold text-black" style={{ background: GOLD }}>
                  Finalizar pelo WhatsApp
                </button>
                <p className="mt-2 text-center text-xs" style={{ color: TEXT_MUTED }}>Você combina pagamento e entrega direto com a loja.</p>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ─── MAIN CONTENT ─── */}
      <div ref={mainRef} className="overflow-y-auto">
        {view.type === "home" && renderHome()}
        {view.type === "product" && renderProduct(view.id)}
        {view.type === "favorites" && (
          <FavoritesView products={products} favs={favs} onToggleFav={toggleFav} onAddToCart={addToCart} onNavigate={navigate} />
        )}
        {view.type === "list" && (
          <ListView title={view.title} filter={view.filter} filterType={view.filterType} products={products} featured={featured} favs={favs} onToggleFav={toggleFav} onAddToCart={addToCart} onNavigate={navigate} />
        )}
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="p-6 text-center" style={{ borderTop: `1px solid ${BORDER}` }}>
        {settings.logo
          ? <img src={settings.logo} alt={storeName} className="mx-auto mb-3 h-8 object-contain opacity-60" />
          : <p className="mb-3 text-sm font-bold tracking-[0.15em] opacity-60" style={{ fontFamily: "var(--font-serif)" }}>{storeName.toUpperCase()}</p>
        }
        <div className="flex items-center justify-center gap-4">
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: GOLD }}>Fale no WhatsApp</a>}
          {settings.instagram && <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium" style={{ color: GOLD }}>@{settings.instagram}</a>}
        </div>
        <p className="mt-3 text-xs" style={{ color: TEXT_MUTED }}>© {new Date().getFullYear()} {storeName}</p>
      </footer>

      {/* ─── TOAST ─── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50" style={{ animation: "fadeUp 0.3s ease-out forwards" }}>
          <div className="flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl" style={{ background: BG_ELEVATED, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-medium" style={{ color: TEXT }}>{toast}</p>
            <button onClick={() => { setCartOpen(true); setToast(null); }} className="shrink-0 text-xs font-bold" style={{ color: GOLD }}>Ver carrinho</button>
          </div>
        </div>
      )}
    </div>
  );
}
