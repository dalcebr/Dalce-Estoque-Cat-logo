export type StockMode = "all" | "hide" | "unavailable";

export type Benefit = {
  icon: string;
  title: string;
  description: string;
};

/**
 * Cores personalizáveis de cada elemento do catálogo.
 * Cada chave corresponde a um elemento visual da vitrine.
 */
export type CatalogColors = {
  page_bg: string;        // fundo da página
  card_bg: string;        // fundo do card de produto
  card_text: string;      // texto do card (nome/preço)
  store_name: string;     // texto do nome da loja
  heading: string;        // títulos de seção
  body_text: string;      // textos gerais
  button_bg: string;      // fundo dos botões
  button_text: string;    // texto dos botões
  header_bg: string;      // fundo do cabeçalho
  footer_bg: string;      // fundo do rodapé
};

/**
 * Fontes do catálogo. Duas fontes disponíveis; cada bloco de texto
 * escolhe qual usar (permite mesclar).
 */
export type FontKey =
  | "inter" | "poppins" | "playfair" | "montserrat" | "lora" | "roboto"
  | "opensans" | "raleway" | "nunito" | "worksans" | "dmsans" | "quicksand"
  | "josefin" | "cormorant" | "merriweather" | "bebas" | "oswald" | "dancing"
  | "pacifico" | "greatvibes" | "cinzel" | "abril" | "righteous" | "satisfy";

export type CatalogFonts = {
  font_1: FontKey;        // fonte 1
  font_2: FontKey;        // fonte 2
  store_name_font: 1 | 2; // fonte do nome da loja
  heading_font: 1 | 2;    // fonte dos títulos
  card_font: 1 | 2;       // fonte do texto do card
  body_font: 1 | 2;       // fonte dos textos gerais
};

export type CatalogSettings = {
  active: boolean;
  slug: string;
  store_name: string;
  phone: string;
  email: string;
  instagram: string;
  stock_mode: StockMode;
  // Banner principal
  hero_title: string;
  hero_description: string;
  hero_image: string;
  hero_button_text: string;
  // Benefícios
  benefits: Benefit[];
  // Aparência
  colors: CatalogColors;
  fonts: CatalogFonts;
  dark_mode_enabled: boolean;
  // WhatsApp
  whatsapp_message: string;
};

export const BENEFIT_ICONS = [
  { k: "headphones", n: "Atendimento" },
  { k: "truck", n: "Entrega" },
  { k: "shield", n: "Segurança" },
  { k: "star", n: "Qualidade" },
  { k: "check", n: "Garantia" },
  { k: "clock", n: "Rapidez" },
  { k: "heart", n: "Cuidado" },
  { k: "gift", n: "Presente" },
] as const;

export const FONTS: { k: FontKey; n: string; stack: string }[] = [
  { k: "inter", n: "Inter", stack: "var(--font-inter), Arial, Helvetica, sans-serif" },
  { k: "poppins", n: "Poppins", stack: "var(--font-poppins), Arial, Helvetica, sans-serif" },
  { k: "montserrat", n: "Montserrat", stack: "var(--font-montserrat), Arial, Helvetica, sans-serif" },
  { k: "roboto", n: "Roboto", stack: "var(--font-roboto), Arial, Helvetica, sans-serif" },
  { k: "opensans", n: "Open Sans", stack: "var(--font-opensans), Arial, Helvetica, sans-serif" },
  { k: "raleway", n: "Raleway", stack: "var(--font-raleway), Arial, Helvetica, sans-serif" },
  { k: "nunito", n: "Nunito", stack: "var(--font-nunito), Arial, Helvetica, sans-serif" },
  { k: "worksans", n: "Work Sans", stack: "var(--font-worksans), Arial, Helvetica, sans-serif" },
  { k: "dmsans", n: "DM Sans", stack: "var(--font-dmsans), Arial, Helvetica, sans-serif" },
  { k: "quicksand", n: "Quicksand", stack: "var(--font-quicksand), Arial, Helvetica, sans-serif" },
  { k: "josefin", n: "Josefin Sans", stack: "var(--font-josefin), Arial, Helvetica, sans-serif" },
  { k: "oswald", n: "Oswald", stack: "var(--font-oswald), Arial, Helvetica, sans-serif" },
  { k: "bebas", n: "Bebas Neue", stack: "var(--font-bebas), Impact, sans-serif" },
  { k: "righteous", n: "Righteous", stack: "var(--font-righteous), Arial, sans-serif" },
  { k: "playfair", n: "Playfair Display", stack: "var(--font-playfair), Georgia, serif" },
  { k: "lora", n: "Lora", stack: "var(--font-lora), Georgia, serif" },
  { k: "cormorant", n: "Cormorant Garamond", stack: "var(--font-cormorant), Georgia, serif" },
  { k: "merriweather", n: "Merriweather", stack: "var(--font-merriweather), Georgia, serif" },
  { k: "cinzel", n: "Cinzel", stack: "var(--font-cinzel), Georgia, serif" },
  { k: "abril", n: "Abril Fatface", stack: "var(--font-abril), Georgia, serif" },
  { k: "dancing", n: "Dancing Script", stack: "var(--font-dancing), cursive" },
  { k: "pacifico", n: "Pacifico", stack: "var(--font-pacifico), cursive" },
  { k: "greatvibes", n: "Great Vibes", stack: "var(--font-greatvibes), cursive" },
  { k: "satisfy", n: "Satisfy", stack: "var(--font-satisfy), cursive" },
];

export const fontStack = (k: FontKey): string =>
  FONTS.find((f) => f.k === k)?.stack ?? FONTS[0].stack;

export const COLOR_FIELDS: { k: keyof CatalogColors; n: string }[] = [
  { k: "page_bg", n: "Fundo da página" },
  { k: "header_bg", n: "Fundo do cabeçalho" },
  { k: "card_bg", n: "Fundo do card" },
  { k: "card_text", n: "Texto do card" },
  { k: "store_name", n: "Nome da loja" },
  { k: "heading", n: "Títulos" },
  { k: "body_text", n: "Textos gerais" },
  { k: "button_bg", n: "Fundo dos botões" },
  { k: "button_text", n: "Texto dos botões" },
  { k: "footer_bg", n: "Fundo do rodapé" },
];

export const DEFAULT_COLORS: CatalogColors = {
  page_bg: "#FFFFFF",
  card_bg: "#F7F7F7",
  card_text: "#111111",
  store_name: "#111111",
  heading: "#111111",
  body_text: "#444444",
  button_bg: "#C9852B",
  button_text: "#FFFFFF",
  header_bg: "#FFFFFF",
  footer_bg: "#F7F7F7",
};

export const DEFAULT_FONTS: CatalogFonts = {
  font_1: "inter",
  font_2: "playfair",
  store_name_font: 1,
  heading_font: 2,
  card_font: 1,
  body_font: 1,
};

export const DEFAULT_BENEFITS: Benefit[] = [
  { icon: "headphones", title: "Atendimento 24h", description: "De qualidade" },
  { icon: "truck", title: "Envio rápido", description: "Para todo brasil" },
];

export const DEFAULTS: CatalogSettings = {
  active: false,
  slug: "",
  store_name: "",
  phone: "",
  email: "",
  instagram: "",
  stock_mode: "all",
  hero_title: "",
  hero_description: "",
  hero_image: "",
  hero_button_text: "VER PRODUTOS",
  benefits: DEFAULT_BENEFITS,
  colors: DEFAULT_COLORS,
  fonts: DEFAULT_FONTS,
  dark_mode_enabled: true,
  whatsapp_message: "Olá! Gostaria de fazer um pedido:",
};

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
