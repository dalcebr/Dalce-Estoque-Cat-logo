"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CatalogProduct, CatalogSettings, Benefit } from "./page";

/* ─── types ─── */
type CartItem = { product: CatalogProduct; qty: number };
type View =
  | { type: "home" }
  | { type: "products"; category?: string }
  | { type: "product"; id: string }
  | { type: "favorites" }
  | { type: "cart" };

/* ─── helpers ─── */
function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const num = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function loadFavs(): string[] {
  try { return JSON.parse(localStorage.getItem("catalog_favs") ?? "[]"); }
  catch { return []; }
}
function saveFavs(ids: string[]) {
  try { localStorage.setItem("catalog_favs", JSON.stringify(ids)); }
  catch { /* noop */ }
}

/* ─── SVG icons (Lucide-style outline, ~1.5–2px stroke) ─── */
function Ico({ d, size = 24, sw = 1.5, fill = "none", stroke = "currentColor" }: { d: string; size?: number; sw?: number; fill?: string; stroke?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

/* header icons */
function BookmarkStarIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      <path d="M12 7l1.09 2.21L15.5 9.6l-1.75 1.7.41 2.4L12 12.6l-2.16 1.1.41-2.4-1.75-1.7 2.41-.39z" />
    </svg>
  );
}
function SearchIcon({ size = 28 }: { size?: number }) {
  return <Ico d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" size={size} />;
}
function CartIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
    </svg>
  );
}
function FilterIcon({ size = 28 }: { size?: number }) {
  return <Ico d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" size={size} sw={2} />;
}
function AddCartIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
    </svg>
  );
}
function StarOutlineIcon({ size = 24 }: { size?: number }) {
  return <Ico d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" size={size} sw={1.8} />;
}
function StarFilledIcon({ size = 24, color = "#C9852B" }: { size?: number; color?: string }) {
  return <Ico d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" size={size} fill={color} stroke={color} />;
}
function ChevronRightIcon({ size = 20 }: { size?: number }) {
  return <Ico d="M9 18l6-6-6-6" size={size} sw={2.5} />;
}
function ChevronLeftIcon({ size = 24 }: { size?: number }) {
  return <Ico d="M15 18l-6-6 6-6" size={size} />;
}
function XIcon({ size = 24 }: { size?: number }) {
  return <Ico d="M18 6L6 18M6 6l12 12" size={size} />;
}
function PlusIcon() { return <Ico d="M12 5v14M5 12h14" size={18} />; }
function MinusIcon() { return <Ico d="M5 12h14" size={18} />; }
function TrashIcon() { return <Ico d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" size={18} />; }

/* Benefit icons — mapped by key string from settings */
function BenefitIcon({ name, size = 48, color = "#000" }: { name: string; size?: number; color?: string }) {
  const s = size;
  const c = color;
  switch (name) {
    case "headphones":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="22" r="5" />
          <path d="M22 44c0-5.52 4.48-10 10-10s10 4.48 10 10" />
          <circle cx="42" cy="38" r="6" fill={c} stroke="none" />
          <path d="M39.5 38l1.5 1.5 3-3" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case "truck":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="18" width="36" height="22" rx="2" />
          <path d="M40 28h10l6 8v6h-16v-14z" />
          <circle cx="16" cy="44" r="4" />
          <circle cx="48" cy="44" r="4" />
          <path d="M20 44h24" />
        </svg>
      );
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 6L10 16v14c0 14 9.33 22 22 28 12.67-6 22-14 22-28V16L32 6z" />
          <path d="M24 32l5 5 11-11" />
        </svg>
      );
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 6l7.5 15.2L56 23.6l-12 11.7 2.8 16.7L32 44.5 17.2 52l2.8-16.7-12-11.7 16.5-2.4z" />
        </svg>
      );
    case "check":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="20" />
          <path d="M22 32l7 7 13-13" />
        </svg>
      );
    case "clock":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="20" />
          <path d="M32 18v14l8 8" />
        </svg>
      );
    case "heart":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 54s-20-12-20-26a10 10 0 0120-2 10 10 0 0120 2c0 14-20 26-20 26z" />
        </svg>
      );
    case "gift":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="28" width="48" height="26" rx="2" />
          <rect x="12" y="20" width="40" height="8" rx="2" />
          <path d="M32 20v34M12 28h40" />
          <path d="M32 20c-4-6-12-8-12-2s8 6 12 2zM32 20c4-6 12-8 12-2s-8 6-12 2z" />
        </svg>
      );
    default:
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 6l7.5 15.2L56 23.6l-12 11.7 2.8 16.7L32 44.5 17.2 52l2.8-16.7-12-11.7 16.5-2.4z" />
        </svg>
      );
  }
}

/* ─── Product image placeholder ─── */
function ImgPlaceholder({ dark }: { dark: boolean }) {
  return (
    <div style={{
      width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
      background: dark ? "#222" : "#f1f1f1", borderRadius: 14,
    }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={dark ? "#555" : "#ccc"} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY SECTION (horizontal scroll cards)
   ═══════════════════════════════════════════════════════════════ */
function CategorySection({
  categories, products, dark, onSelect,
}: {
  categories: { name: string; color: string }[];
  products: CatalogProduct[];
  dark: boolean;
  onSelect: (cat: string) => void;
}) {
  if (categories.length === 0) return null;

  // Pick first product image per category as thumbnail
  const thumbs: Record<string, string | null> = {};
  for (const cat of categories) {
    const p = products.find((x) => x.category === cat.name && x.image);
    thumbs[cat.name] = p?.image ?? null;
  }

  const bgContainer = dark ? "#1a1510" : "#F5EBDD";
  const textColor = dark ? "#F5F0EB" : "#000";

  return (
    <section style={{ background: bgContainer, borderRadius: "0 30px 30px 0", padding: "28px 0 32px 20px", marginRight: 0 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: textColor, marginBottom: 20, paddingLeft: 4 }}>Categorias</h2>
      <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingRight: 20, scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button key={cat.name} onClick={() => onSelect(cat.name)} style={{
            flex: "0 0 auto", width: 140, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "center",
          }}>
            <div style={{
              width: 140, height: 140, borderRadius: 16, overflow: "hidden",
              border: dark ? "2px solid #444" : "2px solid #000",
            }}>
              {thumbs[cat.name] ? (
                <img src={thumbs[cat.name]!} alt={cat.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: dark ? "#222" : "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 40 }}>💍</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 18, fontWeight: 400, color: textColor, marginTop: 10 }}>{cat.name}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT CARD
   ═══════════════════════════════════════════════════════════════ */
function ProductCard({
  product, isFav, dark, primaryColor,
  onView, onToggleFav, onAddCart,
}: {
  product: CatalogProduct;
  isFav: boolean;
  dark: boolean;
  primaryColor: string;
  onView: () => void;
  onToggleFav: () => void;
  onAddCart: () => void;
}) {
  const textColor = dark ? "#F5F0EB" : "#111";
  return (
    <div>
      <button onClick={onView} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" style={{
            width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 14, display: "block",
            background: dark ? "#222" : "#f5f5f5",
          }} />
        ) : (
          <ImgPlaceholder dark={dark} />
        )}
      </button>
      <p style={{ fontSize: 16, fontWeight: 400, color: textColor, marginTop: 8, lineHeight: 1.2 }}>{product.name}</p>
      <p style={{ fontSize: 15, fontWeight: 400, color: textColor, marginTop: 6 }}>{brl(product.price)}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
        <button onClick={onAddCart} aria-label="Adicionar ao carrinho" style={{
          background: "none", border: "none", padding: 0, cursor: "pointer", color: dark ? "#F5F0EB" : "#000",
        }}>
          <AddCartIcon size={22} />
        </button>
        <button onClick={onToggleFav} aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"} style={{
          background: "none", border: "none", padding: 0, cursor: "pointer",
        }}>
          {isFav ? <StarFilledIcon size={22} color={primaryColor} /> : <StarOutlineIcon size={22} />}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT GRID
   ═══════════════════════════════════════════════════════════════ */
function ProductGrid({
  products, favs, dark, primaryColor,
  onView, onToggleFav, onAddCart,
}: {
  products: CatalogProduct[];
  favs: string[];
  dark: boolean;
  primaryColor: string;
  onView: (id: string) => void;
  onToggleFav: (id: string) => void;
  onAddCart: (p: CatalogProduct) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px 16px" }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} isFav={favs.includes(p.id)} dark={dark} primaryColor={primaryColor}
          onView={() => onView(p.id)} onToggleFav={() => onToggleFav(p.id)} onAddCart={() => onAddCart(p)} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SEARCH BAR + FILTER
   ═══════════════════════════════════════════════════════════════ */
function SearchBar({
  value, onChange, dark,
}: { value: string; onChange: (v: string) => void; dark: boolean }) {
  const bg = dark ? "#1a1a1a" : "#F1F1F1";
  const textColor = dark ? "#F5F0EB" : "#111";
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="O que você procura ?"
      aria-label="Pesquisar produtos"
      style={{
        flex: 1, height: 40, borderRadius: 40, border: "none", background: bg,
        padding: "0 18px", fontSize: 15, color: textColor, outline: "none",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILTER PANEL (overlay bottom sheet)
   ═══════════════════════════════════════════════════════════════ */
function FilterPanel({
  categories, selected, onSelect, onClose, dark, primaryColor,
}: {
  categories: { name: string }[];
  selected: string | null;
  onSelect: (c: string | null) => void;
  onClose: () => void;
  dark: boolean;
  primaryColor: string;
}) {
  const bg = dark ? "#111" : "#fff";
  const textColor = dark ? "#F5F0EB" : "#111";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,.4)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, background: bg, borderRadius: "20px 20px 0 0",
        padding: "24px 20px 32px", maxHeight: "60vh", overflowY: "auto",
        animation: "slideUp .25s ease-out",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: textColor }}>Filtrar por categoria</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: textColor }}><XIcon /></button>
        </div>
        <button onClick={() => { onSelect(null); onClose(); }} style={{
          display: "block", width: "100%", padding: "12px 16px", marginBottom: 8,
          borderRadius: 12, border: !selected ? `2px solid ${primaryColor}` : `1px solid ${dark ? "#333" : "#ddd"}`,
          background: !selected ? (dark ? "#1a1a1a" : "#f9f4ee") : "transparent",
          color: textColor, fontSize: 15, fontWeight: !selected ? 600 : 400, cursor: "pointer", textAlign: "left",
        }}>Todas</button>
        {categories.map((c) => (
          <button key={c.name} onClick={() => { onSelect(c.name); onClose(); }} style={{
            display: "block", width: "100%", padding: "12px 16px", marginBottom: 8,
            borderRadius: 12, border: selected === c.name ? `2px solid ${primaryColor}` : `1px solid ${dark ? "#333" : "#ddd"}`,
            background: selected === c.name ? (dark ? "#1a1a1a" : "#f9f4ee") : "transparent",
            color: textColor, fontSize: 15, fontWeight: selected === c.name ? 600 : 400, cursor: "pointer", textAlign: "left",
          }}>{c.name}</button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCTS LIST VIEW (standalone — has its own search/filter state)
   ═══════════════════════════════════════════════════════════════ */
function ProductsListView({
  products, categories, favs, dark, primaryColor, initialCategory,
  onView, onToggleFav, onAddCart,
}: {
  products: CatalogProduct[];
  categories: { name: string; color: string }[];
  favs: string[];
  dark: boolean;
  primaryColor: string;
  initialCategory?: string;
  onView: (id: string) => void;
  onToggleFav: (id: string) => void;
  onAddCart: (p: CatalogProduct) => void;
}) {
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(initialCategory ?? null);
  const [filterOpen, setFilterOpen] = useState(false);

  const textColor = dark ? "#F5F0EB" : "#000";
  const filtered = products.filter((p) => {
    if (catFilter && p.category !== catFilter) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <section style={{ padding: "0 16px" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: textColor, marginBottom: 16 }}>
        {catFilter || "Todos os produtos"}
      </h2>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <SearchBar value={q} onChange={setQ} dark={dark} />
        <button onClick={() => setFilterOpen(true)} aria-label="Filtrar" style={{
          background: "none", border: "none", cursor: "pointer", padding: 0, color: dark ? "#F5F0EB" : "#000",
        }}>
          <FilterIcon size={28} />
        </button>
      </div>
      {filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: dark ? "#777" : "#999", padding: "40px 0", fontSize: 15 }}>
          Nenhum produto encontrado.
        </p>
      ) : (
        <ProductGrid products={filtered} favs={favs} dark={dark} primaryColor={primaryColor}
          onView={onView} onToggleFav={onToggleFav} onAddCart={onAddCart} />
      )}
      {filterOpen && (
        <FilterPanel categories={categories} selected={catFilter} onSelect={setCatFilter}
          onClose={() => setFilterOpen(false)} dark={dark} primaryColor={primaryColor} />
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FAVORITES VIEW
   ═══════════════════════════════════════════════════════════════ */
function FavoritesView({
  products, favs, dark, primaryColor,
  onView, onToggleFav, onAddCart,
}: {
  products: CatalogProduct[];
  favs: string[];
  dark: boolean;
  primaryColor: string;
  onView: (id: string) => void;
  onToggleFav: (id: string) => void;
  onAddCart: (p: CatalogProduct) => void;
}) {
  const textColor = dark ? "#F5F0EB" : "#000";
  const favProducts = products.filter((p) => favs.includes(p.id));
  return (
    <section style={{ padding: "0 16px" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: textColor, marginBottom: 16 }}>Favoritos</h2>
      {favProducts.length === 0 ? (
        <p style={{ textAlign: "center", color: dark ? "#777" : "#999", padding: "40px 0", fontSize: 15 }}>
          Você ainda não tem favoritos.
        </p>
      ) : (
        <ProductGrid products={favProducts} favs={favs} dark={dark} primaryColor={primaryColor}
          onView={onView} onToggleFav={onToggleFav} onAddCart={onAddCart} />
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CART VIEW
   ═══════════════════════════════════════════════════════════════ */
function CartView({
  cart, dark, primaryColor, phone, whatsappMsg,
  onUpdateQty, onRemove,
}: {
  cart: CartItem[];
  dark: boolean;
  primaryColor: string;
  phone: string | null;
  whatsappMsg: string;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const textColor = dark ? "#F5F0EB" : "#000";
  const total = cart.reduce((s, i) => s + i.product.price * i.qty, 0);

  function checkout() {
    if (!phone || cart.length === 0) return;
    const items = cart.map((i) => `• ${i.qty}x ${i.product.name} — ${brl(i.product.price * i.qty)}`).join("\n");
    const msg = `${whatsappMsg}\n\n${items}\n\n*Total: ${brl(total)}*${name ? `\n\nNome: ${name}` : ""}`;
    window.open(waLink(phone, msg), "_blank");
  }

  return (
    <section style={{ padding: "0 16px" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: textColor, marginBottom: 16 }}>Carrinho</h2>
      {cart.length === 0 ? (
        <p style={{ textAlign: "center", color: dark ? "#777" : "#999", padding: "40px 0", fontSize: 15 }}>
          Seu carrinho está vazio.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {cart.map((item) => (
              <div key={item.product.id} style={{
                display: "flex", gap: 12, padding: 12, borderRadius: 14,
                background: dark ? "#141414" : "#f9f9f9", border: `1px solid ${dark ? "#2a2a2a" : "#eee"}`,
              }}>
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} style={{
                    width: 72, height: 72, borderRadius: 10, objectFit: "cover",
                  }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: 10, background: dark ? "#222" : "#eee" }} />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: textColor }}>{item.product.name}</p>
                  <p style={{ fontSize: 13, color: dark ? "#aaa" : "#666", marginTop: 2 }}>{brl(item.product.price)}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <button onClick={() => onUpdateQty(item.product.id, -1)} style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${dark ? "#333" : "#ddd"}`,
                      background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: textColor,
                    }}><MinusIcon /></button>
                    <span style={{ fontSize: 14, fontWeight: 600, color: textColor, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.product.id, 1)} style={{
                      width: 28, height: 28, borderRadius: 8, border: `1px solid ${dark ? "#333" : "#ddd"}`,
                      background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: textColor,
                    }}><PlusIcon /></button>
                    <button onClick={() => onRemove(item.product.id)} style={{
                      marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                      color: dark ? "#f87171" : "#dc2626",
                    }}><TrashIcon /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Name */}
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome (opcional)"
            style={{
              width: "100%", height: 44, borderRadius: 12, border: `1px solid ${dark ? "#333" : "#ddd"}`,
              background: dark ? "#1a1a1a" : "#f9f9f9", padding: "0 14px", fontSize: 14, color: textColor,
              marginTop: 20, outline: "none", boxSizing: "border-box",
            }}
          />
          {/* Total */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 0", borderTop: `1px solid ${dark ? "#2a2a2a" : "#eee"}` }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: textColor }}>Total</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: primaryColor }}>{brl(total)}</span>
          </div>
          {/* Checkout */}
          {phone && (
            <button onClick={checkout} style={{
              width: "100%", height: 48, borderRadius: 14, border: "none", cursor: "pointer",
              background: "#25D366", color: "#fff", fontSize: 15, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Finalizar pelo WhatsApp
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PRODUCT DETAIL VIEW
   ═══════════════════════════════════════════════════════════════ */
function ProductDetailView({
  product, related, isFav, dark, primaryColor, phone, whatsappMsg,
  onBack, onToggleFav, onAddCart, onView,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
  isFav: boolean;
  dark: boolean;
  primaryColor: string;
  phone: string | null;
  whatsappMsg: string;
  onBack: () => void;
  onToggleFav: () => void;
  onAddCart: () => void;
  onView: (id: string) => void;
}) {
  const textColor = dark ? "#F5F0EB" : "#111";
  const mutedColor = dark ? "#888" : "#666";
  return (
    <section style={{ padding: "0 16px" }}>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer", display: "flex",
        alignItems: "center", gap: 6, color: textColor, fontSize: 14, marginBottom: 12, padding: 0,
      }}>
        <ChevronLeftIcon size={20} /> Voltar
      </button>
      {product.image ? (
        <img src={product.image} alt={product.name} style={{
          width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 16,
          background: dark ? "#222" : "#f5f5f5",
        }} />
      ) : (
        <ImgPlaceholder dark={dark} />
      )}
      <h1 style={{ fontSize: 24, fontWeight: 700, color: textColor, marginTop: 16 }}>{product.name}</h1>
      <p style={{ fontSize: 22, fontWeight: 700, color: primaryColor, marginTop: 8 }}>{brl(product.price)}</p>
      {product.description && (
        <p style={{ fontSize: 14, color: mutedColor, lineHeight: 1.6, marginTop: 12 }}>{product.description}</p>
      )}
      {/* Details table */}
      {(product.material || product.collection || product.category) && (
        <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", border: `1px solid ${dark ? "#2a2a2a" : "#eee"}` }}>
          {[
            product.category && ["Categoria", product.category],
            product.material && ["Material", product.material],
            product.collection && ["Coleção", product.collection],
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", padding: "10px 14px",
              borderBottom: `1px solid ${dark ? "#2a2a2a" : "#eee"}`,
              background: i % 2 === 0 ? (dark ? "#141414" : "#fafafa") : "transparent",
            }}>
              <span style={{ fontSize: 13, color: mutedColor }}>{(row as string[])[0]}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: textColor }}>{(row as string[])[1]}</span>
            </div>
          ))}
        </div>
      )}
      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={onAddCart} style={{
          flex: 1, height: 48, borderRadius: 14, border: "none", cursor: "pointer",
          background: primaryColor, color: "#fff", fontSize: 15, fontWeight: 700,
        }}>Adicionar ao carrinho</button>
        <button onClick={onToggleFav} style={{
          width: 48, height: 48, borderRadius: 14, border: `1px solid ${dark ? "#333" : "#ddd"}`,
          background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {isFav ? <StarFilledIcon size={22} color={primaryColor} /> : <StarOutlineIcon size={22} />}
        </button>
      </div>
      {phone && (
        <button onClick={() => {
          const msg = `${whatsappMsg}\n\n${product.name} — ${brl(product.price)}`;
          window.open(waLink(phone, msg), "_blank");
        }} style={{
          width: "100%", height: 48, borderRadius: 14, border: "none", cursor: "pointer",
          background: "#25D366", color: "#fff", fontSize: 15, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10,
        }}>
          Perguntar pelo WhatsApp
        </button>
      )}
      {/* Related */}
      {related.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: textColor, marginBottom: 14 }}>Você também pode gostar</h3>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {related.map((r) => (
              <button key={r.id} onClick={() => onView(r.id)} style={{
                flex: "0 0 auto", width: 120, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left",
              }}>
                {r.image ? (
                  <img src={r.image} alt={r.name} loading="lazy" style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: 12, background: dark ? "#222" : "#eee" }} />
                )}
                <p style={{ fontSize: 12, color: textColor, marginTop: 4, lineHeight: 1.2 }}>{r.name}</p>
                <p style={{ fontSize: 12, color: mutedColor }}>{brl(r.price)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function CatalogApp({
  storeName, settings, products, categories, collections,
}: {
  storeName: string;
  settings: CatalogSettings;
  products: CatalogProduct[];
  categories: { name: string; color: string }[];
  collections: string[];
}) {
  const primaryColor = settings.primary_color || "#C9852B";

  const [view, setView] = useState<View>({ type: "home" });
  const [dark, setDark] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favs, setFavs] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mainRef = useRef<HTMLDivElement>(null);

  // Load favs + dark mode from localStorage
  useEffect(() => {
    setFavs(loadFavs());
    try {
      if (localStorage.getItem("catalog_dark") === "1") setDark(true);
    } catch { /* noop */ }
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [view]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveFavs(next);
      return next;
    });
  }, []);

  const addToCart = useCallback((p: CatalogProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === p.id);
      if (existing) return prev.map((i) => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product: p, qty: 1 }];
    });
    showToast(`${p.name} adicionado ao carrinho`);
  }, [showToast]);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      try { localStorage.setItem("catalog_dark", next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  /* colors based on dark mode */
  const bgPage = dark ? "#0A0A0A" : "#FFFFFF";
  const textColor = dark ? "#F5F0EB" : "#000000";
  const borderColor = dark ? "#2A2520" : "#000000";

  return (
    <div ref={mainRef} style={{ minHeight: "100vh", background: bgPage, overflowX: "hidden" }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
        *::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 16px 14px", background: bgPage, position: "sticky", top: 0, zIndex: 100,
      }}>
        <button onClick={() => setView({ type: "home" })} style={{
          background: "none", border: "none", cursor: "pointer", padding: 0,
        }}>
          {settings.logo ? (
            <img src={settings.logo} alt={storeName} style={{ height: 36, maxWidth: 180, objectFit: "contain" }} />
          ) : (
            <span style={{ fontSize: 22, fontWeight: 700, color: textColor, whiteSpace: "nowrap" }}>{storeName}</span>
          )}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setView({ type: "favorites" })} aria-label="Favoritos" style={{
            background: "none", border: "none", cursor: "pointer", padding: 0, color: textColor,
          }}>
            <BookmarkStarIcon size={26} />
          </button>
          <button onClick={() => setView({ type: "products" })} aria-label="Pesquisar" style={{
            background: "none", border: "none", cursor: "pointer", padding: 0, color: textColor,
          }}>
            <SearchIcon size={26} />
          </button>
          <button onClick={() => setView({ type: "cart" })} aria-label="Carrinho" style={{
            background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", color: textColor,
          }}>
            <CartIcon size={26} />
            <span style={{
              position: "absolute", top: -6, right: -8, fontSize: 10, fontWeight: 700,
              background: bgPage, color: textColor, borderRadius: "50%",
              minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${textColor}`,
            }}>{cartCount}</span>
          </button>
        </div>
      </header>

      {/* Divider line */}
      <div style={{ height: 2, background: borderColor, margin: "0 16px" }} />

      {/* ═══ CONTENT ═══ */}
      <div style={{ paddingTop: 20, paddingBottom: 40 }}>
        {view.type === "home" && (
          <>
            {/* ═══ HERO BANNER ═══ */}
            <section style={{ padding: "0 16px", marginBottom: 0 }}>
              <div style={{
                position: "relative", borderRadius: 18, overflow: "hidden",
                height: 360, background: dark ? "#1a1510" : "#e8ddd0",
              }}>
                {settings.hero_image && (
                  <img src={settings.hero_image} alt="Banner" style={{
                    position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
                  }} />
                )}
                {/* Overlay for text readability */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: dark
                    ? "linear-gradient(to right, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.1) 100%)"
                    : "linear-gradient(to right, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.1) 100%)",
                }} />
                <div style={{
                  position: "relative", zIndex: 1, padding: "32px 20px", height: "100%",
                  display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                  {settings.hero_title && (
                    <h2 style={{
                      fontSize: 36, fontWeight: 800, color: dark ? "#fff" : "#000", lineHeight: 1.0,
                      textTransform: "uppercase", marginBottom: 0,
                    }}>{settings.hero_title}</h2>
                  )}
                  {settings.hero_subtitle && (
                    <h3 style={{
                      fontSize: 34, fontWeight: 800, color: dark ? "#fff" : "#000", lineHeight: 1.0,
                      textTransform: "uppercase", marginTop: 2,
                    }}>{settings.hero_subtitle}</h3>
                  )}
                  {/* Accent line */}
                  <div style={{ width: 60, height: 3, background: primaryColor, margin: "18px 0 10px" }} />
                  {settings.hero_description && (
                    <p style={{ fontSize: 16, fontWeight: 400, color: dark ? "#ddd" : "#222", lineHeight: 1.4 }}>{settings.hero_description}</p>
                  )}
                  <button onClick={() => setView({ type: "products" })} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: 200, height: 42, borderRadius: 40, border: "none", cursor: "pointer",
                    background: "#55504C", color: "#fff", fontSize: 13, fontWeight: 700,
                    paddingLeft: 16, paddingRight: 4, marginTop: 16,
                  }}>
                    <span>{settings.hero_button_text}</span>
                    <span style={{
                      width: 34, height: 34, borderRadius: "50%", background: "#000",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ChevronRightIcon size={16} />
                    </span>
                  </button>
                </div>
              </div>
            </section>

            {/* ═══ BENEFITS ═══ */}
            {settings.benefits.length > 0 && (
              <section style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "36px 16px", gap: 0,
              }}>
                {settings.benefits.map((b: Benefit, i: number) => (
                  <div key={i} style={{ display: "contents" }}>
                    {i > 0 && (
                      <div style={{ width: 1, height: 80, background: dark ? "#444" : "#000", margin: "0 20px", flexShrink: 0 }} />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1 }}>
                      <BenefitIcon name={b.icon} size={40} color={dark ? "#F5F0EB" : "#000"} />
                      <p style={{ fontSize: 13, fontWeight: 700, color: textColor, marginTop: 8 }}>{b.title}</p>
                      <p style={{ fontSize: 11, color: dark ? "#888" : "#555", marginTop: 2 }}>{b.description}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* ═══ CATEGORIES ═══ */}
            <CategorySection
              categories={categories}
              products={products}
              dark={dark}
              onSelect={(cat) => setView({ type: "products", category: cat })}
            />

            {/* ═══ ALL PRODUCTS ═══ */}
            <div style={{ marginTop: 28 }}>
              <ProductsListView
                products={products}
                categories={categories}
                favs={favs}
                dark={dark}
                primaryColor={primaryColor}
                onView={(id) => setView({ type: "product", id })}
                onToggleFav={toggleFav}
                onAddCart={addToCart}
              />
            </div>
          </>
        )}

        {view.type === "products" && (
          <ProductsListView
            products={products}
            categories={categories}
            favs={favs}
            dark={dark}
            primaryColor={primaryColor}
            initialCategory={view.category}
            onView={(id) => setView({ type: "product", id })}
            onToggleFav={toggleFav}
            onAddCart={addToCart}
          />
        )}

        {view.type === "favorites" && (
          <FavoritesView
            products={products}
            favs={favs}
            dark={dark}
            primaryColor={primaryColor}
            onView={(id) => setView({ type: "product", id })}
            onToggleFav={toggleFav}
            onAddCart={addToCart}
          />
        )}

        {view.type === "cart" && (
          <CartView
            cart={cart}
            dark={dark}
            primaryColor={primaryColor}
            phone={settings.phone}
            whatsappMsg={settings.whatsapp_message || "Olá! Gostaria de fazer um pedido:"}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
          />
        )}

        {view.type === "product" && (() => {
          const p = products.find((x) => x.id === view.id);
          if (!p) return <p style={{ textAlign: "center", color: "#999", padding: 40 }}>Produto não encontrado.</p>;
          const related = products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 6);
          return (
            <ProductDetailView
              product={p}
              related={related}
              isFav={favs.includes(p.id)}
              dark={dark}
              primaryColor={primaryColor}
              phone={settings.phone}
              whatsappMsg={settings.whatsapp_message || "Olá! Gostaria de fazer um pedido:"}
              onBack={() => setView({ type: "home" })}
              onToggleFav={() => toggleFav(p.id)}
              onAddCart={() => addToCart(p)}
              onView={(id) => setView({ type: "product", id })}
            />
          );
        })()}
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{
        padding: "28px 16px 20px", textAlign: "center",
        borderTop: `1px solid ${dark ? "#2a2a2a" : "#eee"}`,
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{storeName}</p>
        {settings.footer_text && (
          <p style={{ fontSize: 12, color: dark ? "#777" : "#999", marginTop: 4 }}>{settings.footer_text}</p>
        )}
        <p style={{ fontSize: 11, color: dark ? "#555" : "#bbb", marginTop: 8 }}>
          © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
        </p>
      </footer>

      {/* ═══ DARK MODE TOGGLE (vertical button on right edge) ═══ */}
      {settings.dark_mode_enabled && (
        <button onClick={toggleDark} style={{
          position: "fixed", right: 0, top: "70%", zIndex: 999,
          background: dark ? "#fff" : "#000", color: dark ? "#000" : "#fff",
          border: "none", cursor: "pointer",
          borderRadius: "10px 0 0 10px", padding: "10px 6px",
          writingMode: "vertical-rl", textOrientation: "mixed",
          fontSize: 10, fontWeight: 700, letterSpacing: 1,
          transform: "rotate(180deg)",
        }}>
          {dark ? "MODO CLARO" : "MODO ESCURO"}
        </button>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: 16, right: 16, zIndex: 1000,
          background: dark ? "#222" : "#333", color: "#fff", borderRadius: 14,
          padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          animation: "fadeUp .3s ease-out",
        }}>
          <span style={{ fontSize: 13 }}>{toast}</span>
          <button onClick={() => setView({ type: "cart" })} style={{
            background: primaryColor, color: "#fff", border: "none", borderRadius: 8,
            padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>Ver carrinho</button>
        </div>
      )}
    </div>
  );
}
