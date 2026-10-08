export type StockMode = "all" | "hide" | "unavailable";

export type Benefit = {
  icon: string;
  title: string;
  description: string;
};

/**
 * Cores personalizáveis de cada elemento do catálogo.
 * Cada chave corresponde a um elemento visual da vitrine.
 * A personalização é feita separadamente para o tema claro e o tema escuro.
 */
export type CatalogColors = {
  // Fundo geral
  page_bg: string;
  section_bg: string;
  divider: string;

  // Textos gerais
  text_primary: string;
  text_secondary: string;
  text_tertiary: string;
  text_muted: string;

  // Cabeçalho
  header_bg: string;
  header_text: string;
  header_search_icon: string;
  header_wish_icon: string;
  header_cart_icon: string;
  header_wish_badge_bg: string;
  header_wish_badge_text: string;
  header_cart_badge_bg: string;
  header_cart_badge_text: string;
  header_icon_hover: string;
  header_wish_active: string;
  header_wish_inactive: string;

  // Banner / Hero
  hero_overlay: string;
  hero_overlay_opacity: string;
  hero_title: string;
  hero_description: string;
  hero_button_bg: string;
  hero_button_text: string;
  hero_button_icon: string;
  hero_button_hover_bg: string;
  hero_button_hover_text: string;

  // Benefícios
  benefit_bg: string;
  benefit_icon: string;
  benefit_title: string;
  benefit_description: string;
  benefit_border: string;
  benefit_hover_bg: string;
  benefit_hover_icon: string;

  // Categorias
  category_title: string;
  category_bg: string;
  category_text: string;
  category_border: string;
  category_active_bg: string;
  category_active_text: string;
  category_active_border: string;
  category_hover_bg: string;
  category_hover_text: string;
  category_hover_border: string;

  // Seção de produtos
  products_section_bg: string;
  products_title: string;

  // Pesquisa
  search_bg: string;
  search_text: string;
  search_placeholder: string;
  search_icon: string;
  search_border: string;
  search_border_focus: string;

  // Filtros de produtos
  filter_bg: string;
  filter_text: string;
  filter_border: string;
  filter_active_bg: string;
  filter_active_text: string;
  filter_active_border: string;
  filter_hover_bg: string;
  filter_hover_text: string;
  filter_hover_border: string;

  // Cards de produtos
  card_bg: string;
  card_border: string;
  card_shadow: string;
  card_name: string;
  card_price: string;
  card_cart_icon: string;
  card_cart_icon_hover: string;

  // Favorito do produto
  fav_bg: string;
  fav_icon: string;
  fav_active_bg: string;
  fav_active_icon: string;
  fav_hover_bg: string;
  fav_hover_icon: string;

  // Produto sem imagem
  placeholder_bg: string;
  placeholder_icon: string;
  placeholder_text: string;

  // Rodapé
  footer_bg: string;
  footer_title: string;
  footer_text: string;
  footer_link: string;
  footer_link_hover: string;
  footer_copyright: string;

  // Botão Modo Claro / Escuro
  theme_btn_bg: string;
  theme_btn_text: string;
  theme_btn_icon: string;
  theme_btn_border: string;

  // Estados de interação
  state_hover: string;
  state_focus: string;
  state_selection: string;
  state_disabled: string;
  state_error: string;
  state_success: string;
  state_warning: string;
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
  colors: CatalogColors;      // tema claro
  colors_dark: CatalogColors; // tema escuro
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

/**
 * Grupos de cores exibidos no formulário. Cada grupo vira uma seção
 * expansível/recolhível. `opacity` marca o campo que é um valor de
 * opacidade (0–100) em vez de uma cor hexadecimal.
 */
export type ColorField = { k: keyof CatalogColors; n: string; opacity?: boolean };
export type ColorGroup = { id: string; n: string; icon: string; fields: ColorField[] };

export const COLOR_GROUPS: ColorGroup[] = [
  {
    id: "bg", n: "Fundo geral", icon: "🎨", fields: [
      { k: "page_bg", n: "Fundo do catálogo" },
      { k: "section_bg", n: "Fundo da seção" },
      { k: "divider", n: "Divisor" },
    ],
  },
  {
    id: "text", n: "Textos gerais", icon: "✍️", fields: [
      { k: "text_primary", n: "Texto principal" },
      { k: "text_secondary", n: "Texto secundário" },
      { k: "text_tertiary", n: "Texto terciário" },
      { k: "text_muted", n: "Texto suave (muted)" },
    ],
  },
  {
    id: "header", n: "Cabeçalho", icon: "🔝", fields: [
      { k: "header_bg", n: "Fundo do cabeçalho" },
      { k: "header_text", n: "Texto do cabeçalho" },
      { k: "header_search_icon", n: "Ícone de busca" },
      { k: "header_wish_icon", n: "Ícone de favoritos" },
      { k: "header_cart_icon", n: "Ícone de carrinho" },
      { k: "header_wish_badge_bg", n: "Fundo do badge de favoritos" },
      { k: "header_wish_badge_text", n: "Texto do badge de favoritos" },
      { k: "header_cart_badge_bg", n: "Fundo do badge de carrinho" },
      { k: "header_cart_badge_text", n: "Texto do badge de carrinho" },
      { k: "header_icon_hover", n: "Ícone do cabeçalho (hover)" },
      { k: "header_wish_active", n: "Favorito ativo" },
      { k: "header_wish_inactive", n: "Favorito inativo" },
    ],
  },
  {
    id: "hero", n: "Banner / Hero", icon: "🖼️", fields: [
      { k: "hero_overlay", n: "Cor do overlay" },
      { k: "hero_overlay_opacity", n: "Opacidade do overlay", opacity: true },
      { k: "hero_title", n: "Título do banner" },
      { k: "hero_description", n: "Descrição do banner" },
      { k: "hero_button_bg", n: "Fundo do botão" },
      { k: "hero_button_text", n: "Texto do botão" },
      { k: "hero_button_icon", n: "Ícone do botão" },
      { k: "hero_button_hover_bg", n: "Fundo do botão (hover)" },
      { k: "hero_button_hover_text", n: "Texto do botão (hover)" },
    ],
  },
  {
    id: "benefit", n: "Benefícios", icon: "⭐", fields: [
      { k: "benefit_bg", n: "Fundo do benefício" },
      { k: "benefit_icon", n: "Ícone do benefício" },
      { k: "benefit_title", n: "Título do benefício" },
      { k: "benefit_description", n: "Descrição do benefício" },
      { k: "benefit_border", n: "Borda do benefício" },
      { k: "benefit_hover_bg", n: "Fundo (hover)" },
      { k: "benefit_hover_icon", n: "Ícone (hover)" },
    ],
  },
  {
    id: "category", n: "Categorias", icon: "🏷️", fields: [
      { k: "category_title", n: "Título das categorias" },
      { k: "category_bg", n: "Fundo da categoria" },
      { k: "category_text", n: "Texto da categoria" },
      { k: "category_border", n: "Borda da categoria" },
      { k: "category_active_bg", n: "Fundo ativo" },
      { k: "category_active_text", n: "Texto ativo" },
      { k: "category_active_border", n: "Borda ativa" },
      { k: "category_hover_bg", n: "Fundo (hover)" },
      { k: "category_hover_text", n: "Texto (hover)" },
      { k: "category_hover_border", n: "Borda (hover)" },
    ],
  },
  {
    id: "products", n: "Seção de produtos", icon: "📦", fields: [
      { k: "products_section_bg", n: "Fundo da seção de produtos" },
      { k: "products_title", n: "Título dos produtos" },
    ],
  },
  {
    id: "search", n: "Pesquisa", icon: "🔍", fields: [
      { k: "search_bg", n: "Fundo da busca" },
      { k: "search_text", n: "Texto da busca" },
      { k: "search_placeholder", n: "Placeholder da busca" },
      { k: "search_icon", n: "Ícone da busca" },
      { k: "search_border", n: "Borda da busca" },
      { k: "search_border_focus", n: "Borda da busca (foco)" },
    ],
  },
  {
    id: "filter", n: "Filtros de produtos", icon: "🎚️", fields: [
      { k: "filter_bg", n: "Fundo do filtro" },
      { k: "filter_text", n: "Texto do filtro" },
      { k: "filter_border", n: "Borda do filtro" },
      { k: "filter_active_bg", n: "Fundo ativo" },
      { k: "filter_active_text", n: "Texto ativo" },
      { k: "filter_active_border", n: "Borda ativa" },
      { k: "filter_hover_bg", n: "Fundo (hover)" },
      { k: "filter_hover_text", n: "Texto (hover)" },
      { k: "filter_hover_border", n: "Borda (hover)" },
    ],
  },
  {
    id: "card", n: "Cards de produtos", icon: "🃏", fields: [
      { k: "card_bg", n: "Fundo do card" },
      { k: "card_border", n: "Borda do card" },
      { k: "card_shadow", n: "Sombra do card" },
      { k: "card_name", n: "Nome do produto" },
      { k: "card_price", n: "Preço do produto" },
      { k: "card_cart_icon", n: "Ícone do carrinho" },
      { k: "card_cart_icon_hover", n: "Ícone do carrinho (hover)" },
    ],
  },
  {
    id: "fav", n: "Favorito do produto", icon: "❤️", fields: [
      { k: "fav_bg", n: "Fundo do favorito" },
      { k: "fav_icon", n: "Ícone do favorito" },
      { k: "fav_active_bg", n: "Fundo ativo" },
      { k: "fav_active_icon", n: "Ícone ativo" },
      { k: "fav_hover_bg", n: "Fundo (hover)" },
      { k: "fav_hover_icon", n: "Ícone (hover)" },
    ],
  },
  {
    id: "placeholder", n: "Produto sem imagem", icon: "🖼️", fields: [
      { k: "placeholder_bg", n: "Fundo do placeholder" },
      { k: "placeholder_icon", n: "Ícone do placeholder" },
      { k: "placeholder_text", n: "Texto do placeholder" },
    ],
  },
  {
    id: "footer", n: "Rodapé", icon: "🔻", fields: [
      { k: "footer_bg", n: "Fundo do rodapé" },
      { k: "footer_title", n: "Título do rodapé" },
      { k: "footer_text", n: "Texto do rodapé" },
      { k: "footer_link", n: "Link do rodapé" },
      { k: "footer_link_hover", n: "Link do rodapé (hover)" },
      { k: "footer_copyright", n: "Copyright" },
    ],
  },
  {
    id: "theme", n: "Botão Modo Claro / Escuro", icon: "🌗", fields: [
      { k: "theme_btn_bg", n: "Fundo do botão" },
      { k: "theme_btn_text", n: "Texto do botão" },
      { k: "theme_btn_icon", n: "Ícone do botão" },
      { k: "theme_btn_border", n: "Borda do botão" },
    ],
  },
  {
    id: "state", n: "Estados de interação", icon: "⚡", fields: [
      { k: "state_hover", n: "Hover" },
      { k: "state_focus", n: "Foco" },
      { k: "state_selection", n: "Seleção" },
      { k: "state_disabled", n: "Desabilitado" },
      { k: "state_error", n: "Erro" },
      { k: "state_success", n: "Sucesso" },
      { k: "state_warning", n: "Aviso" },
    ],
  },
];

/** Lista plana de todos os campos de cor (usada na sanitização). */
export const COLOR_FIELDS: ColorField[] = COLOR_GROUPS.flatMap((g) => g.fields);

export const DEFAULT_COLORS: CatalogColors = {
  page_bg: "#FFFFFF",
  section_bg: "#F7F7F7",
  divider: "#E5E5E5",

  text_primary: "#111111",
  text_secondary: "#444444",
  text_tertiary: "#666666",
  text_muted: "#999999",

  header_bg: "#FFFFFF",
  header_text: "#111111",
  header_search_icon: "#111111",
  header_wish_icon: "#111111",
  header_cart_icon: "#111111",
  header_wish_badge_bg: "#E11D48",
  header_wish_badge_text: "#FFFFFF",
  header_cart_badge_bg: "#C9852B",
  header_cart_badge_text: "#FFFFFF",
  header_icon_hover: "#C9852B",
  header_wish_active: "#E11D48",
  header_wish_inactive: "#111111",

  hero_overlay: "#FFFFFF",
  hero_overlay_opacity: "70",
  hero_title: "#111111",
  hero_description: "#444444",
  hero_button_bg: "#C9852B",
  hero_button_text: "#FFFFFF",
  hero_button_icon: "#FFFFFF",
  hero_button_hover_bg: "#A96D1E",
  hero_button_hover_text: "#FFFFFF",

  benefit_bg: "#F7F7F7",
  benefit_icon: "#C9852B",
  benefit_title: "#111111",
  benefit_description: "#666666",
  benefit_border: "#E5E5E5",
  benefit_hover_bg: "#F0F0F0",
  benefit_hover_icon: "#A96D1E",

  category_title: "#111111",
  category_bg: "#F7F7F7",
  category_text: "#444444",
  category_border: "#E5E5E5",
  category_active_bg: "#C9852B",
  category_active_text: "#FFFFFF",
  category_active_border: "#C9852B",
  category_hover_bg: "#F0F0F0",
  category_hover_text: "#111111",
  category_hover_border: "#C9852B",

  products_section_bg: "#FFFFFF",
  products_title: "#111111",

  search_bg: "#F7F7F7",
  search_text: "#111111",
  search_placeholder: "#999999",
  search_icon: "#666666",
  search_border: "#E5E5E5",
  search_border_focus: "#C9852B",

  filter_bg: "#F7F7F7",
  filter_text: "#444444",
  filter_border: "#E5E5E5",
  filter_active_bg: "#C9852B",
  filter_active_text: "#FFFFFF",
  filter_active_border: "#C9852B",
  filter_hover_bg: "#F0F0F0",
  filter_hover_text: "#111111",
  filter_hover_border: "#C9852B",

  card_bg: "#F7F7F7",
  card_border: "#EEEEEE",
  card_shadow: "#000000",
  card_name: "#111111",
  card_price: "#111111",
  card_cart_icon: "#111111",
  card_cart_icon_hover: "#C9852B",

  fav_bg: "#FFFFFF",
  fav_icon: "#111111",
  fav_active_bg: "#FFFFFF",
  fav_active_icon: "#E11D48",
  fav_hover_bg: "#F0F0F0",
  fav_hover_icon: "#E11D48",

  placeholder_bg: "#F7F7F7",
  placeholder_icon: "#999999",
  placeholder_text: "#999999",

  footer_bg: "#F7F7F7",
  footer_title: "#111111",
  footer_text: "#666666",
  footer_link: "#C9852B",
  footer_link_hover: "#A96D1E",
  footer_copyright: "#999999",

  theme_btn_bg: "#000000",
  theme_btn_text: "#FFFFFF",
  theme_btn_icon: "#FFFFFF",
  theme_btn_border: "#000000",

  state_hover: "#F0F0F0",
  state_focus: "#C9852B",
  state_selection: "#C9852B",
  state_disabled: "#CCCCCC",
  state_error: "#DC2626",
  state_success: "#16A34A",
  state_warning: "#F59E0B",
};

export const DEFAULT_COLORS_DARK: CatalogColors = {
  page_bg: "#0A0A0A",
  section_bg: "#141414",
  divider: "#2A2A2A",

  text_primary: "#F5F0EB",
  text_secondary: "#B8B0A8",
  text_tertiary: "#8A8A8A",
  text_muted: "#6B6B6B",

  header_bg: "#0A0A0A",
  header_text: "#F5F0EB",
  header_search_icon: "#F5F0EB",
  header_wish_icon: "#F5F0EB",
  header_cart_icon: "#F5F0EB",
  header_wish_badge_bg: "#E11D48",
  header_wish_badge_text: "#FFFFFF",
  header_cart_badge_bg: "#C9852B",
  header_cart_badge_text: "#FFFFFF",
  header_icon_hover: "#C9852B",
  header_wish_active: "#E11D48",
  header_wish_inactive: "#F5F0EB",

  hero_overlay: "#000000",
  hero_overlay_opacity: "70",
  hero_title: "#FFFFFF",
  hero_description: "#DDDDDD",
  hero_button_bg: "#C9852B",
  hero_button_text: "#FFFFFF",
  hero_button_icon: "#FFFFFF",
  hero_button_hover_bg: "#A96D1E",
  hero_button_hover_text: "#FFFFFF",

  benefit_bg: "#1A1A1A",
  benefit_icon: "#C9852B",
  benefit_title: "#F5F0EB",
  benefit_description: "#B8B0A8",
  benefit_border: "#2A2A2A",
  benefit_hover_bg: "#222222",
  benefit_hover_icon: "#E0A04A",

  category_title: "#F5F0EB",
  category_bg: "#1A1A1A",
  category_text: "#B8B0A8",
  category_border: "#2A2A2A",
  category_active_bg: "#C9852B",
  category_active_text: "#FFFFFF",
  category_active_border: "#C9852B",
  category_hover_bg: "#222222",
  category_hover_text: "#F5F0EB",
  category_hover_border: "#C9852B",

  products_section_bg: "#0A0A0A",
  products_title: "#F5F0EB",

  search_bg: "#1A1A1A",
  search_text: "#F5F0EB",
  search_placeholder: "#6B6B6B",
  search_icon: "#8A8A8A",
  search_border: "#2A2A2A",
  search_border_focus: "#C9852B",

  filter_bg: "#1A1A1A",
  filter_text: "#B8B0A8",
  filter_border: "#2A2A2A",
  filter_active_bg: "#C9852B",
  filter_active_text: "#FFFFFF",
  filter_active_border: "#C9852B",
  filter_hover_bg: "#222222",
  filter_hover_text: "#F5F0EB",
  filter_hover_border: "#C9852B",

  card_bg: "#1A1A1A",
  card_border: "#2A2A2A",
  card_shadow: "#000000",
  card_name: "#F5F0EB",
  card_price: "#F5F0EB",
  card_cart_icon: "#F5F0EB",
  card_cart_icon_hover: "#C9852B",

  fav_bg: "#1A1A1A",
  fav_icon: "#F5F0EB",
  fav_active_bg: "#1A1A1A",
  fav_active_icon: "#E11D48",
  fav_hover_bg: "#222222",
  fav_hover_icon: "#E11D48",

  placeholder_bg: "#1A1A1A",
  placeholder_icon: "#6B6B6B",
  placeholder_text: "#6B6B6B",

  footer_bg: "#111111",
  footer_title: "#F5F0EB",
  footer_text: "#B8B0A8",
  footer_link: "#C9852B",
  footer_link_hover: "#E0A04A",
  footer_copyright: "#6B6B6B",

  theme_btn_bg: "#FFFFFF",
  theme_btn_text: "#000000",
  theme_btn_icon: "#000000",
  theme_btn_border: "#FFFFFF",

  state_hover: "#222222",
  state_focus: "#C9852B",
  state_selection: "#C9852B",
  state_disabled: "#3A3A3A",
  state_error: "#EF4444",
  state_success: "#22C55E",
  state_warning: "#FBBF24",
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
  colors_dark: DEFAULT_COLORS_DARK,
  fonts: DEFAULT_FONTS,
  dark_mode_enabled: true,
  whatsapp_message: "Olá! Gostaria de fazer um pedido:",
};

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
