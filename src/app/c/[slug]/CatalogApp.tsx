"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { CatalogProduct, CatalogSettings, Benefit } from "./page";
import { fontStack, type CatalogColors, type CatalogFonts } from "@/lib/catalog";

/* ─── types ─── */
/** Variação escolhida pelo cliente (ex.: Tamanho: 16). */
type ChosenVariation = { group: string; option: string; price: number | null };
type CartItem = { key: string; product: CatalogProduct; qty: number; variations: ChosenVariation[] };
type Category = { name: string; color: string; image: string | null };
type SortKey = "relevance" | "price_desc" | "price_asc" | "best_sellers" | "newest";
type View =
  | { type: "home" }
  | { type: "products"; category?: string }
  | { type: "product"; id: string }
  | { type: "cart" }
  | { type: "wishlist" };

/* ─── helpers ─── */
function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Chave única de um item do carrinho (produto + combinação de variações). */
function cartKey(productId: string, variations: ChosenVariation[]): string {
  if (variations.length === 0) return productId;
  const sig = variations
    .map((v) => `${v.group.toLowerCase()}=${v.option.toLowerCase()}`)
    .sort()
    .join("|");
  return `${productId}::${sig}`;
}

/** Preço efetivo do produto considerando as variações escolhidas. */
function effectivePrice(product: CatalogProduct, variations: ChosenVariation[]): number {
  let price = product.price;
  for (const v of variations) {
    if (v.price != null && Number.isFinite(v.price)) price = v.price;
  }
  return price;
}

/** Texto curto das variações (ex.: "Tamanho: 16 · Cor: Ouro"). */
function variationsLabel(variations: ChosenVariation[]): string {
  return variations.map((v) => `${v.group}: ${v.option}`).join(" · ");
}

function waLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const num = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/** Converte "#RRGGBB" + opacidade (0–100) em rgba(). */
function withAlpha(hex: string, opacity: string | number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.min(100, Math.max(0, Number(opacity) || 0)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ─── SVG icons ─── */
function Ico({ d, size = 24, sw = 1.5, fill = "none", stroke = "currentColor" }: { d: string; size?: number; sw?: number; fill?: string; stroke?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}
function SearchIcon({ size = 26 }: { size?: number }) {
  return <Ico d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" size={size} />;
}
function CartIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    </svg>
  );
}
function AddCartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    </svg>
  );
}
function HeartIcon({ size = 22, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
function ChevronRightIcon({ size = 16 }: { size?: number }) { return <Ico d="M9 18l6-6-6-6" size={size} sw={2.5} />; }
function PlusIcon() { return <Ico d="M12 5v14M5 12h14" size={18} />; }
function MinusIcon() { return <Ico d="M5 12h14" size={18} />; }
function TrashIcon() { return <Ico d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" size={18} />; }
function ArrowLeftIcon({ size = 20 }: { size?: number }) { return <Ico d="M19 12H5M12 19l-7-7 7-7" size={size} sw={2} />; }

function BackButton({ onClick, colors, font }: { onClick: () => void; colors: CatalogColors; font: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px 8px 10px",
        marginBottom: 16, borderRadius: 999, border: `1px solid ${colors.category_border}`,
        background: colors.category_bg, color: colors.category_text, fontSize: 14, fontWeight: 600,
        cursor: "pointer", fontFamily: font,
      }}
    >
      <ArrowLeftIcon size={18} />
      Voltar
    </button>
  );
}
function FilterIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}
function CheckIcon({ size = 16 }: { size?: number }) { return <Ico d="M20 6L9 17l-5-5" size={size} sw={2.5} />; }

/* Benefit icons — mapped by key string from settings */
function BenefitIcon({ name, size = 40, color = "#000" }: { name: string; size?: number; color?: string }) {
  const s = size, c = color;
  switch (name) {
    case "headphones":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="22" r="5" /><path d="M22 44c0-5.52 4.48-10 10-10s10 4.48 10 10" />
          <circle cx="42" cy="38" r="6" fill={c} stroke="none" /><path d="M39.5 38l1.5 1.5 3-3" stroke="#fff" strokeWidth="2" />
        </svg>
      );
    case "truck":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="18" width="36" height="22" rx="2" /><path d="M40 28h10l6 8v6h-16v-14z" />
          <circle cx="16" cy="44" r="4" /><circle cx="48" cy="44" r="4" /><path d="M20 44h24" />
        </svg>
      );
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M32 6L10 16v14c0 14 9.33 22 22 28 12.67-6 22-14 22-28V16L32 6z" /><path d="M24 32l5 5 11-11" />
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
          <circle cx="32" cy="32" r="20" /><path d="M22 32l7 7 13-13" />
        </svg>
      );
    case "clock":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="20" /><path d="M32 18v14l8 8" />
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
          <rect x="8" y="28" width="48" height="26" rx="2" /><rect x="12" y="20" width="40" height="8" rx="2" />
          <path d="M32 20v34M12 28h40" /><path d="M32 20c-4-6-12-8-12-2s8 6 12 2zM32 20c4-6 12-8 12-2s-8 6-12 2z" />
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

function ImgPlaceholder({ bg, fg }: { bg: string; fg: string }) {
  return (
    <div style={{ width: "100%", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", background: bg, borderRadius: 14 }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
      </svg>
    </div>
  );
}

/* ═══ PRODUCT CARD ═══ */
function ProductCard({
  product, colors, cardFont, wishlisted, onView, onAddCart, onToggleWish,
}: {
  product: CatalogProduct;
  colors: CatalogColors;
  cardFont: string;
  wishlisted: boolean;
  onView: () => void;
  onAddCart: () => void;
  onToggleWish: () => void;
}) {
  const [cartHover, setCartHover] = useState(false);
  const [favHover, setFavHover] = useState(false);
  const favBg = wishlisted ? colors.fav_active_bg : favHover ? colors.fav_hover_bg : colors.fav_bg;
  const favFg = wishlisted ? colors.fav_active_icon : favHover ? colors.fav_hover_icon : colors.fav_icon;
  const hasVariations = (product.variations?.length ?? 0) > 0;
  return (
    <div style={{ background: colors.card_bg, border: `1px solid ${colors.card_border}`, boxShadow: `0 2px 10px ${withAlpha(colors.card_shadow, 12)}`, borderRadius: 16, padding: 10, position: "relative" }}>
      <button
        onClick={onToggleWish}
        onMouseEnter={() => setFavHover(true)}
        onMouseLeave={() => setFavHover(false)}
        aria-label={wishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        style={{
          position: "absolute", top: 16, right: 16, zIndex: 2, width: 32, height: 32, borderRadius: "50%",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          background: favBg, color: favFg, transition: "background .15s, color .15s",
        }}
      >
        <HeartIcon size={18} filled={wishlisted} />
      </button>
      <button onClick={onView} style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12, display: "block", background: colors.card_bg }} />
        ) : (
          <ImgPlaceholder bg={colors.placeholder_bg} fg={colors.placeholder_icon} />
        )}
      </button>
      <p style={{ fontFamily: cardFont, fontSize: 16, fontWeight: 500, color: colors.card_name, marginTop: 8, lineHeight: 1.2 }}>{product.name}</p>
      {product.description && (
        <p style={{ fontFamily: cardFont, fontSize: 12, color: colors.text_secondary, marginTop: 3, lineHeight: 1.35, whiteSpace: "pre-line", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.description}</p>
      )}
      {hasVariations && (
        <p style={{ fontFamily: cardFont, fontSize: 11, color: colors.text_muted, marginTop: 2 }}>Escolha as opções</p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <p style={{ fontFamily: cardFont, fontSize: 15, fontWeight: 700, color: colors.card_price }}>{brl(product.price)}</p>
        <button onClick={onAddCart} onMouseEnter={() => setCartHover(true)} onMouseLeave={() => setCartHover(false)}
          aria-label={hasVariations ? "Escolher opções" : "Adicionar ao carrinho"} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: cartHover ? colors.card_cart_icon_hover : colors.card_cart_icon, transition: "color .15s" }}>
          <AddCartIcon size={22} />
        </button>
      </div>
    </div>
  );
}

function ProductGrid({
  products, colors, cardFont, wishlist, onView, onAddCart, onToggleWish,
}: {
  products: CatalogProduct[];
  colors: CatalogColors;
  cardFont: string;
  wishlist: string[];
  onView: (id: string) => void;
  onAddCart: (p: CatalogProduct) => void;
  onToggleWish: (p: CatalogProduct) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px 14px" }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} colors={colors} cardFont={cardFont} wishlisted={wishlist.includes(p.id)}
          onView={() => onView(p.id)}
          onAddCart={() => ((p.variations?.length ?? 0) > 0 ? onView(p.id) : onAddCart(p))}
          onToggleWish={() => onToggleWish(p)} />
      ))}
    </div>
  );
}

/* ═══ CATEGORY CARDS ═══ */
function CategoryCard({
  label, image, colors, bodyFont, active, onClick,
}: {
  label: string;
  image?: string | null;
  colors: CatalogColors;
  bodyFont: string;
  active: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const bg = active ? colors.category_active_bg : hover ? colors.category_hover_bg : colors.category_bg;
  const fg = active ? colors.category_active_text : hover ? colors.category_hover_text : colors.category_text;
  const bd = active ? colors.category_active_border : hover ? colors.category_hover_border : colors.category_border;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: "0 0 auto", width: 140, scrollSnapAlign: "start", padding: 0, cursor: "pointer",
        display: "flex", flexDirection: "column", overflow: "hidden",
        borderRadius: 14, border: `1px solid ${bd}`, background: bg,
        boxShadow: hover ? `0 6px 18px ${withAlpha(colors.card_shadow, 22)}` : `0 2px 8px ${withAlpha(colors.card_shadow, 10)}`,
        transform: hover ? "translateY(-2px)" : "none", transition: "transform .15s, box-shadow .15s, background .15s, border-color .15s",
      }}
    >
      <div style={{ width: "100%", height: 110, background: colors.placeholder_bg, overflow: "hidden" }}>
        {image ? (
          <img src={image} alt={label} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={colors.placeholder_icon} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
      </div>
      <span style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 600, color: fg, padding: "10px 8px", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%", boxSizing: "border-box" }}>
        {label}
      </span>
    </button>
  );
}

/* ═══ PRODUCTS LIST ═══ */
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevância" },
  { key: "price_desc", label: "Maior preço" },
  { key: "price_asc", label: "Menor preço" },
  { key: "best_sellers", label: "Mais vendidos" },
  { key: "newest", label: "Novidades" },
];

function ProductsListView({
  products, categories, colors, headingFont, cardFont, bodyFont, wishlist,
  initialCategory, onView, onAddCart, onToggleWish, onBack,
}: {
  products: CatalogProduct[];
  categories: Category[];
  colors: CatalogColors;
  headingFont: string;
  cardFont: string;
  bodyFont: string;
  wishlist: string[];
  initialCategory?: string;
  onView: (id: string) => void;
  onAddCart: (p: CatalogProduct) => void;
  onToggleWish: (p: CatalogProduct) => void;
  onBack?: () => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | undefined>(initialCategory);
  const [focus, setFocus] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    function onDoc(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterOpen]);

  const filtered = products.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "price_desc": return b.price - a.price;
      case "price_asc": return a.price - b.price;
      case "best_sellers": return (b.sold_count ?? 0) - (a.sold_count ?? 0);
      case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default: return 0;
    }
  });

  const activeSort = SORT_OPTIONS.find((o) => o.key === sort)!;

  return (
    <section style={{ padding: "0 16px", background: colors.products_section_bg }}>
      {onBack && <BackButton onClick={onBack} colors={colors} font={bodyFont} />}
      <h2 style={{ fontFamily: headingFont, fontSize: 26, fontWeight: 700, color: colors.products_title, marginBottom: 16 }}>
        {cat || "Todos os produtos"}
      </h2>

      {/* busca + filtro */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <input
          type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="O que você procura ?" aria-label="Pesquisar produtos"
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{
            flex: 1, minWidth: 0, height: 42, borderRadius: 40,
            border: `1px solid ${focus ? colors.search_border_focus : colors.search_border}`,
            background: colors.search_bg,
            padding: "0 18px", fontSize: 15, color: colors.search_text, outline: "none", boxSizing: "border-box",
            fontFamily: bodyFont,
          }}
        />
        <div ref={filterRef} style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            aria-label="Filtrar e ordenar"
            style={{
              width: 42, height: 42, borderRadius: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `1px solid ${sort !== "relevance" ? colors.filter_active_border : colors.filter_border}`,
              background: sort !== "relevance" ? colors.filter_active_bg : colors.filter_bg,
              color: sort !== "relevance" ? colors.filter_active_text : colors.filter_text,
            }}
          >
            <FilterIcon size={20} />
          </button>
          {filterOpen && (
            <div style={{
              position: "absolute", top: 50, right: 0, zIndex: 50, minWidth: 190,
              background: colors.card_bg, border: `1px solid ${colors.card_border}`,
              borderRadius: 14, padding: 6, boxShadow: `0 8px 24px ${withAlpha(colors.card_shadow, 25)}`,
            }}>
              {SORT_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={() => { setSort(o.key); setFilterOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 10, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: sort === o.key ? colors.filter_active_bg : "transparent",
                    color: sort === o.key ? colors.filter_active_text : colors.filter_text,
                    fontSize: 13, fontWeight: 600, fontFamily: bodyFont, textAlign: "left",
                  }}
                >
                  {o.label}
                  {sort === o.key && <CheckIcon size={15} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.text_secondary, padding: "40px 0", fontSize: 15, fontFamily: bodyFont }}>Nenhum produto encontrado.</p>
      ) : (
        <>
          {sort !== "relevance" && (
            <p style={{ fontFamily: bodyFont, fontSize: 12, color: colors.text_muted, marginBottom: 12 }}>
              Ordenado por: <strong style={{ color: colors.text_secondary }}>{activeSort.label}</strong>
            </p>
          )}
          <ProductGrid products={sorted} colors={colors} cardFont={cardFont} wishlist={wishlist} onView={onView} onAddCart={onAddCart} onToggleWish={onToggleWish} />
        </>
      )}
    </section>
  );
}

/* ═══ WISHLIST ═══ */
function WishlistView({
  products, colors, headingFont, cardFont, bodyFont, wishlist, onView, onAddCart, onToggleWish, onBack,
}: {
  products: CatalogProduct[];
  colors: CatalogColors;
  headingFont: string;
  cardFont: string;
  bodyFont: string;
  wishlist: string[];
  onView: (id: string) => void;
  onAddCart: (p: CatalogProduct) => void;
  onToggleWish: (p: CatalogProduct) => void;
  onBack: () => void;
}) {
  const items = products.filter((p) => wishlist.includes(p.id));
  return (
    <section style={{ padding: "0 16px" }}>
      <BackButton onClick={onBack} colors={colors} font={bodyFont} />
      <h2 style={{ fontFamily: headingFont, fontSize: 26, fontWeight: 700, color: colors.products_title, marginBottom: 16 }}>Favoritos</h2>
      {items.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.text_secondary, padding: "40px 0", fontSize: 15, fontFamily: bodyFont }}>
          Você ainda não favoritou nenhum produto. Toque na estrelinha dos produtos que mais gostou.
        </p>
      ) : (
        <ProductGrid products={items} colors={colors} cardFont={cardFont} wishlist={wishlist} onView={onView} onAddCart={onAddCart} onToggleWish={onToggleWish} />
      )}
    </section>
  );
}

/* ═══ CART ═══ */
function CartView({
  cart, colors, headingFont, bodyFont, phone, whatsappMsg, onUpdateQty, onRemove, onBack,
}: {
  cart: CartItem[];
  colors: CatalogColors;
  headingFont: string;
  bodyFont: string;
  phone: string | null;
  whatsappMsg: string;
  onUpdateQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const total = cart.reduce((s, i) => s + effectivePrice(i.product, i.variations) * i.qty, 0);

  function checkout() {
    if (!phone || cart.length === 0) return;
    const items = cart
      .map((i) => {
        const line = `• ${i.qty}x ${i.product.name}${i.variations.length ? ` (${variationsLabel(i.variations)})` : ""} — ${brl(effectivePrice(i.product, i.variations) * i.qty)}`;
        return line;
      })
      .join("\n");
    const msg = `${whatsappMsg}\n\n${items}\n\n*Total: ${brl(total)}*${name ? `\n\nNome: ${name}` : ""}`;
    window.open(waLink(phone, msg), "_blank");
  }

  return (
    <section style={{ padding: "0 16px" }}>
      <BackButton onClick={onBack} colors={colors} font={bodyFont} />
      <h2 style={{ fontFamily: headingFont, fontSize: 26, fontWeight: 700, color: colors.products_title, marginBottom: 16 }}>Carrinho</h2>
      {cart.length === 0 ? (
        <p style={{ textAlign: "center", color: colors.text_secondary, padding: "40px 0", fontSize: 15, fontFamily: bodyFont }}>Seu carrinho está vazio.</p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {cart.map((item) => (
              <div key={item.key} style={{ display: "flex", gap: 12, padding: 12, borderRadius: 14, background: colors.card_bg, border: `1px solid ${colors.card_border}` }}>
                {item.product.image ? (
                  <img src={item.product.image} alt={item.product.name} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: 10, background: colors.placeholder_bg }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 500, color: colors.card_name }}>{item.product.name}</p>
                  {item.variations.length > 0 && (
                    <p style={{ fontFamily: bodyFont, fontSize: 12, color: colors.text_secondary, marginTop: 2 }}>{variationsLabel(item.variations)}</p>
                  )}
                  <p style={{ fontFamily: bodyFont, fontSize: 13, color: colors.text_secondary, marginTop: 2 }}>{brl(effectivePrice(item.product, item.variations))}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <button onClick={() => onUpdateQty(item.key, -1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${colors.divider}`, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.text_primary }}><MinusIcon /></button>
                    <span style={{ fontFamily: bodyFont, fontSize: 14, fontWeight: 600, color: colors.text_primary, minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => onUpdateQty(item.key, 1)} style={{ width: 28, height: 28, borderRadius: 8, border: `1px solid ${colors.divider}`, background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.text_primary }}><PlusIcon /></button>
                    <button onClick={() => onRemove(item.key)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: colors.state_error }}><TrashIcon /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome (opcional)"
            style={{ width: "100%", height: 44, borderRadius: 12, border: `1px solid ${colors.search_border}`, background: colors.search_bg, padding: "0 14px", fontSize: 14, color: colors.search_text, marginTop: 20, outline: "none", boxSizing: "border-box", fontFamily: bodyFont }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 0", borderTop: `1px solid ${colors.divider}` }}>
            <span style={{ fontFamily: bodyFont, fontSize: 16, fontWeight: 600, color: colors.text_primary }}>Total</span>
            <span style={{ fontFamily: bodyFont, fontSize: 18, fontWeight: 700, color: colors.hero_button_bg }}>{brl(total)}</span>
          </div>
          {phone && (
            <button onClick={checkout} style={{ width: "100%", height: 48, borderRadius: 14, border: "none", cursor: "pointer", background: "#25D366", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, fontFamily: bodyFont }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              Finalizar pelo WhatsApp
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* ═══ PRODUCT DETAIL ═══ */
function ProductDetailView({
  product, related, colors, headingFont, bodyFont, phone, whatsappMsg, wishlisted, onBack, onAddCart, onView, onToggleWish,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
  colors: CatalogColors;
  headingFont: string;
  bodyFont: string;
  phone: string | null;
  whatsappMsg: string;
  wishlisted: boolean;
  onBack: () => void;
  onAddCart: (variations: ChosenVariation[]) => void;
  onView: (id: string) => void;
  onToggleWish: () => void;
}) {
  const [favHover, setFavHover] = useState(false);
  const [active, setActive] = useState(0);
  // Opção escolhida por grupo (nome do grupo → opção).
  const [selected, setSelected] = useState<Record<string, string>>({});
  const favBg = wishlisted ? colors.fav_active_bg : favHover ? colors.fav_hover_bg : colors.fav_bg;
  const favFg = wishlisted ? colors.fav_active_icon : favHover ? colors.fav_hover_icon : colors.fav_icon;
  const gallery = product.images?.length ? product.images : product.image ? [product.image] : [];
  const current = gallery[Math.min(active, gallery.length - 1)] ?? null;
  // Agrupa as variações por nome de grupo para exibição.
  const variationGroups = (product.variations ?? []).reduce<{ name: string; options: { option: string; stock: number; price: number | null }[] }[]>((acc, v) => {
    const g = acc.find((x) => x.name === v.group);
    if (g) g.options.push({ option: v.option, stock: v.stock, price: v.price });
    else acc.push({ name: v.group, options: [{ option: v.option, stock: v.stock, price: v.price }] });
    return acc;
  }, []);

  // Um grupo só bloqueia opções sem estoque quando há estoque informado em
  // pelo menos uma opção. Se todas estiverem zeradas, o estoque não está
  // sendo controlado e as opções continuam selecionáveis.
  const groupTracksStock = (g: { options: { stock: number }[] }) => g.options.some((o) => o.stock > 0);

  /** Variações escolhidas (na ordem dos grupos). */
  const chosen: ChosenVariation[] = variationGroups
    .map((g) => {
      const opt = selected[g.name];
      if (!opt) return null;
      const found = g.options.find((o) => o.option === opt);
      return { group: g.name, option: opt, price: found?.price ?? null };
    })
    .filter((v): v is ChosenVariation => v !== null);

  const missing = variationGroups.filter((g) => !selected[g.name]);
  const ready = missing.length === 0;
  const price = effectivePrice(product, chosen);

  return (
    <section style={{ padding: "0 16px" }}>
      <BackButton onClick={onBack} colors={colors} font={bodyFont} />
      <div style={{ position: "relative" }}>
        {current ? (
          <img src={current} alt={product.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 16, background: colors.card_bg }} />
        ) : (
          <ImgPlaceholder bg={colors.placeholder_bg} fg={colors.placeholder_icon} />
        )}
        <button onClick={onToggleWish} onMouseEnter={() => setFavHover(true)} onMouseLeave={() => setFavHover(false)}
          aria-label={wishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          style={{ position: "absolute", top: 12, right: 12, width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: favBg, color: favFg, transition: "background .15s, color .15s" }}>
          <HeartIcon size={22} filled={wishlisted} />
        </button>
      </div>
      {gallery.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 10, paddingBottom: 4, scrollbarWidth: "none" }}>
          {gallery.map((src, i) => (
            <button key={src} onClick={() => setActive(i)} aria-label={`Foto ${i + 1}`}
              style={{ flex: "0 0 auto", width: 64, height: 64, padding: 0, cursor: "pointer", borderRadius: 10, overflow: "hidden", background: colors.card_bg,
                border: `2px solid ${i === active ? colors.hero_button_bg : colors.card_border}` }}>
              <img src={src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </button>
          ))}
        </div>
      )}
      <h1 style={{ fontFamily: headingFont, fontSize: 24, fontWeight: 700, color: colors.products_title, marginTop: 16 }}>{product.name}</h1>
      <p style={{ fontFamily: bodyFont, fontSize: 22, fontWeight: 700, color: colors.card_price, marginTop: 8 }}>{brl(price)}</p>
      {product.description && (
        <p style={{ fontFamily: bodyFont, fontSize: 14, color: colors.text_secondary, lineHeight: 1.6, marginTop: 12, whiteSpace: "pre-line" }}>{product.description}</p>
      )}
      {variationGroups.length > 0 && (
        <div style={{ marginTop: 18 }}>
          {variationGroups.map((g) => (
            <div key={g.name} style={{ marginBottom: 14 }}>
              <p style={{ fontFamily: bodyFont, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: colors.text_secondary, marginBottom: 8 }}>
                {g.name}
                {selected[g.name] && <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: colors.text_muted }}> · {selected[g.name]}</span>}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {g.options.map((o) => {
                  const out = groupTracksStock(g) && o.stock <= 0;
                  const isSel = selected[g.name] === o.option;
                  return (
                    <button
                      key={o.option}
                      type="button"
                      disabled={out}
                      onClick={() => setSelected((prev) => ({ ...prev, [g.name]: isSel ? "" : o.option }))}
                      style={{
                        fontFamily: bodyFont, fontSize: 13, fontWeight: 600, padding: "8px 14px", borderRadius: 10,
                        cursor: out ? "not-allowed" : "pointer",
                        border: `1px solid ${isSel ? colors.category_active_border : out ? colors.divider : colors.category_border}`,
                        background: isSel ? colors.category_active_bg : out ? "transparent" : colors.category_bg,
                        color: isSel ? colors.category_active_text : out ? colors.text_muted : colors.category_text,
                        textDecoration: out ? "line-through" : "none",
                        transition: "background .15s, color .15s, border-color .15s",
                      }}
                    >
                      {o.option}{o.price != null && o.price !== product.price ? ` · ${brl(o.price)}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!ready && (
            <p style={{ fontFamily: bodyFont, fontSize: 12, color: colors.state_warning, marginTop: 2 }}>
              Escolha {missing.map((m) => m.name).join(", ")} para continuar.
            </p>
          )}
        </div>
      )}
      {(product.material || product.collection || product.category) && (
        <div style={{ marginTop: 16, borderRadius: 12, overflow: "hidden", border: `1px solid ${colors.divider}` }}>
          {[
            product.category && ["Categoria", product.category],
            product.material && ["Material", product.material],
            product.collection && ["Coleção", product.collection],
          ].filter(Boolean).map((row, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${colors.divider}`, background: i % 2 === 0 ? colors.card_bg : "transparent" }}>
              <span style={{ fontFamily: bodyFont, fontSize: 13, color: colors.text_secondary }}>{(row as string[])[0]}</span>
              <span style={{ fontFamily: bodyFont, fontSize: 13, fontWeight: 500, color: colors.card_name }}>{(row as string[])[1]}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={() => ready && onAddCart(chosen)}
          disabled={!ready}
          style={{ flex: 1, height: 48, borderRadius: 14, border: "none", cursor: ready ? "pointer" : "not-allowed", background: colors.hero_button_bg, color: colors.hero_button_text, fontSize: 15, fontWeight: 700, fontFamily: bodyFont, opacity: ready ? 1 : 0.5 }}
        >
          Adicionar ao carrinho
        </button>
      </div>
      {phone && (
        <button
          onClick={() => {
            const label = chosen.length ? ` (${variationsLabel(chosen)})` : "";
            const msg = `${whatsappMsg}\n\n${product.name}${label} — ${brl(price)}`;
            window.open(waLink(phone, msg), "_blank");
          }}
          style={{ width: "100%", height: 48, borderRadius: 14, border: "none", cursor: "pointer", background: "#25D366", color: "#fff", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 10, fontFamily: bodyFont }}>
          Perguntar pelo WhatsApp
        </button>
      )}
      {related.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ fontFamily: headingFont, fontSize: 18, fontWeight: 700, color: colors.products_title, marginBottom: 14 }}>Você também pode gostar</h3>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {related.map((r) => (
              <button key={r.id} onClick={() => onView(r.id)} style={{ flex: "0 0 auto", width: 120, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
                {r.image ? (
                  <img src={r.image} alt={r.name} loading="lazy" style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 120, height: 120, borderRadius: 12, background: colors.placeholder_bg }} />
                )}
                <p style={{ fontFamily: bodyFont, fontSize: 12, color: colors.card_name, marginTop: 4, lineHeight: 1.2 }}>{r.name}</p>
                <p style={{ fontFamily: bodyFont, fontSize: 12, color: colors.text_secondary }}>{brl(r.price)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══ MAIN APP ═══ */
export default function CatalogApp({
  storeName, settings, products, categories,
}: {
  storeName: string;
  settings: CatalogSettings;
  products: CatalogProduct[];
  categories: Category[];
}) {
  const fonts: CatalogFonts = settings.fonts;
  const f1 = fontStack(fonts.font_1);
  const f2 = fontStack(fonts.font_2);
  const pick = (slot: 1 | 2) => (slot === 2 ? f2 : f1);
  const storeNameFont = pick(fonts.store_name_font);
  const headingFont = pick(fonts.heading_font);
  const cardFont = pick(fonts.card_font);
  const bodyFont = pick(fonts.body_font);

  const [view, setView] = useState<View>({ type: "home" });
  const [dark, setDark] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mainRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>(view);
  viewRef.current = view;

  /* ─── navegação com histórico (botão voltar do celular) ─── */
  const go = useCallback((next: View) => {
    setView(next);
    try { window.history.pushState({ catalogView: next }, ""); } catch { /* noop */ }
  }, []);

  const back = useCallback(() => {
    try { window.history.back(); } catch { setView({ type: "home" }); }
  }, []);

  useEffect(() => {
    try { window.history.replaceState({ catalogView: { type: "home" } }, ""); } catch { /* noop */ }
    function onPop(e: PopStateEvent) {
      const v = (e.state && (e.state as { catalogView?: View }).catalogView) || { type: "home" as const };
      setView(v);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* ─── restore persisted state ─── */
  useEffect(() => {
    try {
      if (localStorage.getItem("catalog_dark") === "1") setDark(true);
      const rawCart = localStorage.getItem("catalog_cart");
      if (rawCart) {
        const parsed = JSON.parse(rawCart) as { id: string; qty: number; variations?: ChosenVariation[] }[];
        const restored: CartItem[] = [];
        for (const it of parsed) {
          const p = products.find((x) => x.id === it.id);
          if (!p) continue;
          const variations = Array.isArray(it.variations) ? it.variations : [];
          restored.push({ key: cartKey(p.id, variations), product: p, qty: Math.max(1, it.qty), variations });
        }
        setCart(restored);
      }
      const rawWish = localStorage.getItem("catalog_wishlist");
      if (rawWish) {
        const ids = JSON.parse(rawWish) as string[];
        setWishlist(ids.filter((id) => products.some((p) => p.id === id)));
      }
    } catch { /* noop */ }
    setHydrated(true);
  }, [products]);

  /* ─── persist cart ─── */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("catalog_cart", JSON.stringify(cart.map((i) => ({ id: i.product.id, qty: i.qty, variations: i.variations }))));
    } catch { /* noop */ }
  }, [cart, hydrated]);

  /* ─── persist wishlist ─── */
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("catalog_wishlist", JSON.stringify(wishlist)); } catch { /* noop */ }
  }, [wishlist, hydrated]);

  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); window.scrollTo({ top: 0 }); }, [view]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const addToCart = useCallback((p: CatalogProduct, variations: ChosenVariation[] = []) => {
    const key = cartKey(p.id, variations);
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => i.key === key ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key, product: p, qty: 1, variations }];
    });
    const label = variations.length ? ` (${variationsLabel(variations)})` : "";
    showToast(`${p.name}${label} adicionado ao carrinho`);
  }, [showToast]);

  const updateQty = useCallback((key: string, delta: number) => {
    setCart((prev) => prev.map((i) => i.key === key ? { ...i, qty: Math.max(1, i.qty + delta) } : i));
  }, []);

  const removeFromCart = useCallback((key: string) => {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const toggleWish = useCallback((p: CatalogProduct) => {
    setWishlist((prev) => {
      const has = prev.includes(p.id);
      showToast(has ? `${p.name} removido dos favoritos` : `${p.name} adicionado aos favoritos`);
      return has ? prev.filter((id) => id !== p.id) : [...prev, p.id];
    });
  }, [showToast]);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      try { localStorage.setItem("catalog_dark", next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  /* Cores do tema ativo (claro ou escuro), conforme configurado */
  const C: CatalogColors = dark ? settings.colors_dark : settings.colors;

  return (
    <div ref={mainRef} style={{ minHeight: "100vh", background: C.page_bg, overflowX: "hidden", fontFamily: bodyFont }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
        *::-webkit-scrollbar { display: none; }
        * { scrollbar-width: none; }
        ::selection { background: ${C.state_selection}; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: C.header_bg, position: "sticky", top: 0, zIndex: 100, borderBottom: `1px solid ${C.divider}` }}>
        <button onClick={() => go({ type: "home" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontFamily: storeNameFont, fontSize: 22, fontWeight: 700, color: C.header_text, whiteSpace: "nowrap" }}>{storeName}</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => go({ type: "products" })} aria-label="Pesquisar" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: C.header_search_icon }}><SearchIcon size={26} /></button>
          <button onClick={() => go({ type: "wishlist" })} aria-label="Favoritos" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", color: wishlist.length > 0 ? C.header_wish_active : C.header_wish_icon }}>
            <HeartIcon size={26} filled={false} />
            {wishlist.length > 0 && (
              <span style={{ position: "absolute", top: -6, right: -8, fontSize: 10, fontWeight: 700, background: C.header_wish_badge_bg, color: C.header_wish_badge_text, borderRadius: "50%", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{wishlist.length}</span>
            )}
          </button>
          <button onClick={() => go({ type: "cart" })} aria-label="Carrinho" style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", color: C.header_cart_icon }}>
            <CartIcon size={26} />
            <span style={{ position: "absolute", top: -6, right: -8, fontSize: 10, fontWeight: 700, background: C.header_cart_badge_bg, color: C.header_cart_badge_text, borderRadius: "50%", minWidth: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>
          </button>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <div style={{ paddingTop: 20, paddingBottom: 40 }}>
        {view.type === "home" && (
          <>
            {/* HERO BANNER */}
            <section style={{ padding: "0 16px" }}>
              <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", height: 360, background: C.card_bg }}>
                {settings.hero_image && (
                  <img src={settings.hero_image} alt="Banner" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${withAlpha(C.hero_overlay, C.hero_overlay_opacity)} 40%, ${withAlpha(C.hero_overlay, Number(C.hero_overlay_opacity) * 0.15)} 100%)` }} />
                <div style={{ position: "relative", zIndex: 1, padding: "32px 20px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
                  {settings.hero_title && (
                    <h2 style={{ fontFamily: headingFont, fontSize: 36, fontWeight: 800, color: C.hero_title, lineHeight: 1.05, textTransform: "uppercase" }}>{settings.hero_title}</h2>
                  )}
                  <div style={{ width: 60, height: 3, background: C.hero_button_bg, margin: "18px 0 10px" }} />
                  {settings.hero_description && (
                    <p style={{ fontFamily: bodyFont, fontSize: 16, color: C.hero_description, lineHeight: 1.4 }}>{settings.hero_description}</p>
                  )}
                  <button onClick={() => go({ type: "products" })} style={{ display: "inline-flex", alignItems: "center", gap: 10, maxWidth: "100%", minHeight: 44, borderRadius: 40, border: "none", cursor: "pointer", background: C.hero_button_bg, color: C.hero_button_text, fontSize: 13, fontWeight: 700, padding: "6px 6px 6px 18px", marginTop: 16, fontFamily: bodyFont }}>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{settings.hero_button_text}</span>
                    <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: "50%", background: withAlpha(C.hero_button_icon, 25), display: "flex", alignItems: "center", justifyContent: "center", color: C.hero_button_icon }}><ChevronRightIcon size={16} /></span>
                  </button>
                </div>
              </div>
            </section>

            {/* BENEFITS — carrossel horizontal */}
            {settings.benefits.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 8px", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
                  {settings.benefits.map((b: Benefit, i: number) => (
                    <div key={i} style={{ flex: "0 0 auto", width: 150, scrollSnapAlign: "start", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "18px 12px", borderRadius: 16, background: C.benefit_bg, border: `1px solid ${C.benefit_border}` }}>
                      <BenefitIcon name={b.icon} size={40} color={C.benefit_icon} />
                      <p style={{ fontFamily: headingFont, fontSize: 14, fontWeight: 700, color: C.benefit_title, marginTop: 10 }}>{b.title}</p>
                      {b.description && <p style={{ fontFamily: bodyFont, fontSize: 12, color: C.benefit_description, marginTop: 4 }}>{b.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CATEGORIAS */}
            {categories.length > 0 && (
              <section style={{ marginTop: 28 }}>
                <h2 style={{ fontFamily: headingFont, fontSize: 22, fontWeight: 700, color: C.category_title, margin: "0 16px 14px" }}>Categorias</h2>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 8px", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
                  {categories.map((c) => (
                    <CategoryCard key={c.name} label={c.name} image={c.image} colors={C} bodyFont={bodyFont} active={false}
                      onClick={() => go({ type: "products", category: c.name })} />
                  ))}
                </div>
              </section>
            )}

            {/* ALL PRODUCTS */}
            <div style={{ marginTop: 28 }}>
              <ProductsListView products={products} categories={categories} colors={C} headingFont={headingFont} cardFont={cardFont} bodyFont={bodyFont} wishlist={wishlist}
                onView={(id) => go({ type: "product", id })} onAddCart={addToCart} onToggleWish={toggleWish} />
            </div>
          </>
        )}

        {view.type === "products" && (
          <ProductsListView products={products} categories={categories} colors={C} headingFont={headingFont} cardFont={cardFont} bodyFont={bodyFont} wishlist={wishlist}
            initialCategory={view.category} onView={(id) => go({ type: "product", id })} onAddCart={addToCart} onToggleWish={toggleWish} onBack={back} />
        )}

        {view.type === "wishlist" && (
          <WishlistView products={products} colors={C} headingFont={headingFont} cardFont={cardFont} bodyFont={bodyFont} wishlist={wishlist}
            onView={(id) => go({ type: "product", id })} onAddCart={addToCart} onToggleWish={toggleWish} onBack={back} />
        )}

        {view.type === "cart" && (
          <CartView cart={cart} colors={C} headingFont={headingFont} bodyFont={bodyFont} phone={settings.phone}
            whatsappMsg={settings.whatsapp_message || "Olá! Gostaria de fazer um pedido:"} onUpdateQty={updateQty} onRemove={removeFromCart} onBack={back} />
        )}

        {view.type === "product" && (() => {
          const p = products.find((x) => x.id === view.id);
          if (!p) return <p style={{ textAlign: "center", color: C.text_secondary, padding: 40 }}>Produto não encontrado.</p>;
          const related = products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 6);
          return (
            <ProductDetailView product={p} related={related} colors={C} headingFont={headingFont} bodyFont={bodyFont}
              phone={settings.phone} whatsappMsg={settings.whatsapp_message || "Olá! Gostaria de fazer um pedido:"}
              wishlisted={wishlist.includes(p.id)}
              onBack={back} onAddCart={(variations) => addToCart(p, variations)} onView={(id) => go({ type: "product", id })} onToggleWish={() => toggleWish(p)} />
          );
        })()}
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ padding: "28px 16px 20px", textAlign: "center", background: C.footer_bg, borderTop: `1px solid ${C.divider}` }}>
        <p style={{ fontFamily: storeNameFont, fontSize: 14, fontWeight: 600, color: C.footer_title }}>{storeName}</p>
        {settings.instagram && (
          <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" style={{ fontFamily: bodyFont, fontSize: 12, color: C.footer_link, marginTop: 4, display: "inline-block" }}>@{settings.instagram}</a>
        )}
        {settings.email && <p style={{ fontFamily: bodyFont, fontSize: 12, color: C.footer_text, marginTop: 4 }}>{settings.email}</p>}
        {settings.phone && <p style={{ fontFamily: bodyFont, fontSize: 12, color: C.footer_text, marginTop: 4 }}>{settings.phone}</p>}
        <p style={{ fontFamily: bodyFont, fontSize: 11, color: C.footer_copyright, marginTop: 8 }}>© {new Date().getFullYear()} {storeName}. Todos os direitos reservados.</p>
      </footer>

      {/* ═══ DARK MODE TOGGLE ═══ */}
      {settings.dark_mode_enabled && (
        <button onClick={toggleDark} style={{ position: "fixed", right: 0, top: "70%", zIndex: 999, background: C.theme_btn_bg, color: C.theme_btn_text, border: `1px solid ${C.theme_btn_border}`, cursor: "pointer", borderRadius: "10px 0 0 10px", padding: "10px 6px", writingMode: "vertical-rl", textOrientation: "mixed", fontSize: 10, fontWeight: 700, letterSpacing: 1, transform: "rotate(180deg)" }}>
          {dark ? "MODO CLARO" : "MODO ESCURO"}
        </button>
      )}

      {/* ═══ TOAST ═══ */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: 16, right: 16, zIndex: 1000, background: C.text_primary, color: C.page_bg, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeUp .3s ease-out" }}>
          <span style={{ fontSize: 13, fontFamily: bodyFont }}>{toast}</span>
          <button onClick={() => go({ type: "cart" })} style={{ background: C.hero_button_bg, color: C.hero_button_text, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: bodyFont }}>Ver carrinho</button>
        </div>
      )}
    </div>
  );
}
