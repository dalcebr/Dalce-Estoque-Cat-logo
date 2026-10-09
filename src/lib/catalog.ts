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

  // Títulos das seções (Categorias, Todos os produtos, Favoritos, Carrinho…)
  section_title: string;

  // Avisos (pop-up de produto adicionado ao carrinho / favoritos)
  toast_bg: string;
  toast_text: string;
  toast_button_bg: string;
  toast_button_text: string;

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
  filter_icon: string;
  filter_active_bg: string;
  filter_active_text: string;
  filter_active_border: string;
  filter_hover_bg: string;
  filter_hover_text: string;
  filter_hover_border: string;
  filter_list_bg: string;
  filter_list_text: string;
  filter_list_check: string;
  filter_list_selected_bg: string;

  // Cards de produtos
  card_bg: string;
  card_border: string;
  card_shadow: string;
  card_name: string;
  card_subtitle: string;
  card_price: string;
  card_cart_icon: string;
  card_cart_icon_hover: string;
  card_button_bg: string;
  card_button_text: string;
  card_button_border: string;
  card_gradient: string;
  card_gradient_opacity: string;
  card_gradient_fill: string;

  // Página de produto
  product_title: string;
  product_price: string;
  product_description: string;
  product_info_bg: string;
  product_info_text: string;
  product_cart_btn_bg: string;
  product_cart_btn_text: string;
  product_whats_btn_bg: string;
  product_whats_btn_text: string;

  // Seção carrinho
  cart_card_bg: string;
  cart_card_border: string;
  cart_title: string;

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
 *
 * A ORDEM da lista segue a ordem visual da vitrine (de cima para baixo):
 * cabeçalho → banner → benefícios → categorias → busca → filtros →
 * produtos → favorito → placeholder → rodapé → botão de tema → estados.
 * O campo `step` é o número exibido na interface para reforçar a sequência.
 */
export type ColorField = { k: keyof CatalogColors; n: string; opacity?: boolean };
export type ColorGroup = { id: string; n: string; icon: string; step: number; fields: ColorField[] };

export const COLOR_GROUPS: ColorGroup[] = [
  {
    id: "general", n: "Cores gerais", icon: "🎨", step: 1, fields: [
      { k: "section_title", n: "Títulos das seções (Categorias, Todos os produtos, Favoritos, Carrinho…)" },
      { k: "page_bg", n: "Fundo do catálogo" },
      { k: "section_bg", n: "Fundo das seções" },
      { k: "divider", n: "Divisor / separador" },
    ],
  },
  {
    id: "toast", n: "Avisos (pop-up)", icon: "🔔", step: 2, fields: [
      { k: "toast_bg", n: "Fundo do pop-up de aviso" },
      { k: "toast_text", n: "Texto do pop-up de aviso" },
      { k: "toast_button_bg", n: "Fundo do botão do aviso" },
      { k: "toast_button_text", n: "Texto do botão do aviso" },
    ],
  },
  {
    id: "product_page", n: "Página de produto", icon: "📄", step: 3, fields: [
      { k: "product_title", n: "Título da página de produto" },
      { k: "product_price", n: "Valor da página de produto" },
      { k: "product_description", n: "Descrição da página de produto" },
      { k: "product_info_bg", n: "Fundo da informação de categoria" },
      { k: "product_info_text", n: "Texto da informação de categoria" },
      { k: "product_cart_btn_bg", n: "Fundo do botão Adicionar ao carrinho" },
      { k: "product_cart_btn_text", n: "Texto do botão Adicionar ao carrinho" },
      { k: "product_whats_btn_bg", n: "Fundo do botão de WhatsApp" },
      { k: "product_whats_btn_text", n: "Texto do botão de WhatsApp" },
    ],
  },
  {
    id: "header", n: "Cabeçalho", icon: "🔝", step: 4, fields: [
      { k: "header_bg", n: "Fundo do cabeçalho" },
      { k: "header_text", n: "Nome da loja" },
      { k: "header_search_icon", n: "Ícone de lupa" },
      { k: "header_wish_icon", n: "Ícone de coração" },
      { k: "header_wish_badge_text", n: "Texto de quantidade (coração)" },
      { k: "header_wish_badge_bg", n: "Círculo de quantidade (coração)" },
      { k: "header_cart_icon", n: "Ícone de carrinho" },
      { k: "header_cart_badge_text", n: "Texto de quantidade (carrinho)" },
      { k: "header_cart_badge_bg", n: "Círculo de quantidade (carrinho)" },
      { k: "header_icon_hover", n: "Ícone do cabeçalho (hover)" },
      { k: "header_wish_active", n: "Coração ativo" },
      { k: "header_wish_inactive", n: "Coração inativo" },
    ],
  },
  {
    id: "card", n: "Cards de produtos", icon: "🃏", step: 5, fields: [
      { k: "card_gradient", n: "Cor do gradiente do card" },
      { k: "card_gradient_opacity", n: "Transparência do gradiente (0–100)", opacity: true },
      { k: "card_gradient_fill", n: "Preenchimento do gradiente (0–100)", opacity: true },
      { k: "card_bg", n: "Fundo do card" },
      { k: "card_border", n: "Borda do card" },
      { k: "card_shadow", n: "Sombra do card" },
      { k: "card_name", n: "Título do card" },
      { k: "card_subtitle", n: "Subtítulo do card" },
      { k: "card_price", n: "Valor do card" },
      { k: "card_cart_icon", n: "Ícone de carrinho do card" },
      { k: "card_cart_icon_hover", n: "Ícone de carrinho do card (hover)" },
      { k: "card_button_bg", n: "Fundo do botão do card" },
      { k: "card_button_text", n: "Texto do botão do card" },
      { k: "card_button_border", n: "Borda do botão do card" },
    ],
  },
  {
    id: "benefit", n: "Benefícios", icon: "⭐", step: 6, fields: [
      { k: "benefit_icon", n: "Ícones dos benefícios" },
      { k: "benefit_title", n: "Títulos dos benefícios" },
      { k: "benefit_description", n: "Subtítulos dos benefícios" },
      { k: "benefit_bg", n: "Fundo do benefício" },
      { k: "benefit_border", n: "Borda do benefício" },
      { k: "benefit_hover_bg", n: "Fundo (hover)" },
      { k: "benefit_hover_icon", n: "Ícone (hover)" },
    ],
  },
  {
    id: "category", n: "Categorias", icon: "🏷️", step: 7, fields: [
      { k: "category_title", n: "Título da seção de categorias" },
      { k: "category_text", n: "Título do card das categorias" },
      { k: "category_bg", n: "Fundo do card das categorias" },
      { k: "category_border", n: "Borda do card das categorias" },
      { k: "category_active_bg", n: "Fundo ativo" },
      { k: "category_active_text", n: "Texto ativo" },
      { k: "category_active_border", n: "Borda ativa" },
      { k: "category_hover_bg", n: "Fundo (hover)" },
      { k: "category_hover_text", n: "Texto (hover)" },
      { k: "category_hover_border", n: "Borda (hover)" },
    ],
  },
  {
    id: "search", n: "Todos os produtos · Barra de pesquisa", icon: "🔍", step: 8, fields: [
      { k: "search_bg", n: "Fundo da barra de pesquisa" },
      { k: "search_border", n: "Borda da barra de pesquisa" },
      { k: "search_text", n: "Texto da barra de pesquisa" },
      { k: "search_placeholder", n: "Placeholder da barra de pesquisa" },
      { k: "search_icon", n: "Ícone da barra de pesquisa" },
      { k: "search_border_focus", n: "Borda da barra de pesquisa (foco)" },
    ],
  },
  {
    id: "filter", n: "Todos os produtos · Filtro", icon: "🎚️", step: 9, fields: [
      { k: "filter_icon", n: "Ícone do filtro" },
      { k: "filter_text", n: "Texto do filtro" },
      { k: "filter_bg", n: "Fundo do filtro" },
      { k: "filter_border", n: "Borda do filtro" },
      { k: "filter_active_bg", n: "Fundo ativo" },
      { k: "filter_active_text", n: "Texto ativo" },
      { k: "filter_active_border", n: "Borda ativa" },
      { k: "filter_hover_bg", n: "Fundo (hover)" },
      { k: "filter_hover_text", n: "Texto (hover)" },
      { k: "filter_hover_border", n: "Borda (hover)" },
      { k: "filter_list_bg", n: "Fundo da lista de opções" },
      { k: "filter_list_text", n: "Texto da lista de opções" },
      { k: "filter_list_check", n: "Check da lista de opções" },
      { k: "filter_list_selected_bg", n: "Fundo do item selecionado" },
    ],
  },
  {
    id: "products", n: "Todos os produtos · Seção", icon: "📦", step: 10, fields: [
      { k: "products_section_bg", n: "Fundo da seção de produtos" },
      { k: "products_title", n: "Título da seção de produtos" },
    ],
  },
  {
    id: "fav", n: "Favorito do produto", icon: "❤️", step: 11, fields: [
      { k: "fav_bg", n: "Fundo do ícone de coração" },
      { k: "fav_icon", n: "Ícone de coração" },
      { k: "fav_active_bg", n: "Fundo ativo" },
      { k: "fav_active_icon", n: "Ícone ativo" },
      { k: "fav_hover_bg", n: "Fundo (hover)" },
      { k: "fav_hover_icon", n: "Ícone (hover)" },
    ],
  },
  {
    id: "cart", n: "Seção carrinho", icon: "🛒", step: 12, fields: [
      { k: "cart_card_bg", n: "Fundo do card do carrinho" },
      { k: "cart_card_border", n: "Borda do card do carrinho" },
      { k: "cart_title", n: "Título da seção carrinho" },
    ],
  },
  {
    id: "footer", n: "Rodapé", icon: "🔻", step: 13, fields: [
      { k: "footer_bg", n: "Fundo da seção rodapé" },
      { k: "footer_title", n: "Título do rodapé" },
      { k: "footer_text", n: "Textos normais do rodapé" },
      { k: "footer_link", n: "Links do rodapé" },
      { k: "footer_link_hover", n: "Links do rodapé (hover)" },
      { k: "footer_copyright", n: "Copyright" },
    ],
  },
  {
    id: "theme", n: "Botão Modo Escuro / Claro", icon: "🌗", step: 14, fields: [
      { k: "theme_btn_bg", n: "Fundo do botão" },
      { k: "theme_btn_text", n: "Texto do botão" },
      { k: "theme_btn_icon", n: "Ícone do botão" },
      { k: "theme_btn_border", n: "Borda do botão" },
    ],
  },
  {
    id: "hero", n: "Banner / Hero", icon: "🖼️", step: 15, fields: [
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
    id: "placeholder", n: "Produto sem imagem", icon: "🚫", step: 16, fields: [
      { k: "placeholder_bg", n: "Fundo do placeholder" },
      { k: "placeholder_icon", n: "Ícone do placeholder" },
      { k: "placeholder_text", n: "Texto do placeholder" },
    ],
  },
  {
    id: "text", n: "Textos gerais", icon: "✍️", step: 17, fields: [
      { k: "text_primary", n: "Texto principal" },
      { k: "text_secondary", n: "Texto secundário" },
      { k: "text_tertiary", n: "Texto terciário" },
      { k: "text_muted", n: "Texto suave (muted)" },
    ],
  },
  {
    id: "state", n: "Estados de interação", icon: "⚡", step: 18, fields: [
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

  section_title: "#111111",

  toast_bg: "#111111",
  toast_text: "#FFFFFF",
  toast_button_bg: "#C9852B",
  toast_button_text: "#FFFFFF",

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
  filter_icon: "#444444",
  filter_active_bg: "#C9852B",
  filter_active_text: "#FFFFFF",
  filter_active_border: "#C9852B",
  filter_hover_bg: "#F0F0F0",
  filter_hover_text: "#111111",
  filter_hover_border: "#C9852B",
  filter_list_bg: "#FFFFFF",
  filter_list_text: "#444444",
  filter_list_check: "#C9852B",
  filter_list_selected_bg: "#C9852B",

  card_bg: "#F7F7F7",
  card_border: "#EEEEEE",
  card_shadow: "#000000",
  card_name: "#111111",
  card_subtitle: "#666666",
  card_price: "#111111",
  card_cart_icon: "#111111",
  card_cart_icon_hover: "#C9852B",
  card_button_bg: "#C9852B",
  card_button_text: "#FFFFFF",
  card_button_border: "#C9852B",
  card_gradient: "#000000",
  card_gradient_opacity: "0",
  card_gradient_fill: "0",

  product_title: "#111111",
  product_price: "#111111",
  product_description: "#444444",
  product_info_bg: "#F7F7F7",
  product_info_text: "#444444",
  product_cart_btn_bg: "#C9852B",
  product_cart_btn_text: "#FFFFFF",
  product_whats_btn_bg: "#25D366",
  product_whats_btn_text: "#FFFFFF",

  cart_card_bg: "#F7F7F7",
  cart_card_border: "#EEEEEE",
  cart_title: "#111111",

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

  section_title: "#F5F0EB",

  toast_bg: "#F5F0EB",
  toast_text: "#0A0A0A",
  toast_button_bg: "#C9852B",
  toast_button_text: "#FFFFFF",

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
  filter_icon: "#B8B0A8",
  filter_active_bg: "#C9852B",
  filter_active_text: "#FFFFFF",
  filter_active_border: "#C9852B",
  filter_hover_bg: "#222222",
  filter_hover_text: "#F5F0EB",
  filter_hover_border: "#C9852B",
  filter_list_bg: "#1A1A1A",
  filter_list_text: "#B8B0A8",
  filter_list_check: "#C9852B",
  filter_list_selected_bg: "#C9852B",

  card_bg: "#1A1A1A",
  card_border: "#2A2A2A",
  card_shadow: "#000000",
  card_name: "#F5F0EB",
  card_subtitle: "#B8B0A8",
  card_price: "#F5F0EB",
  card_cart_icon: "#F5F0EB",
  card_cart_icon_hover: "#C9852B",
  card_button_bg: "#C9852B",
  card_button_text: "#FFFFFF",
  card_button_border: "#C9852B",
  card_gradient: "#000000",
  card_gradient_opacity: "0",
  card_gradient_fill: "0",

  product_title: "#F5F0EB",
  product_price: "#F5F0EB",
  product_description: "#B8B0A8",
  product_info_bg: "#1A1A1A",
  product_info_text: "#B8B0A8",
  product_cart_btn_bg: "#C9852B",
  product_cart_btn_text: "#FFFFFF",
  product_whats_btn_bg: "#25D366",
  product_whats_btn_text: "#FFFFFF",

  cart_card_bg: "#1A1A1A",
  cart_card_border: "#2A2A2A",
  cart_title: "#F5F0EB",

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
