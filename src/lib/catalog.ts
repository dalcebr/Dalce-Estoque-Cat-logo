export const THEMES = [
  { k: "azul", n: "Azul", colors: ["#1d4ed8", "#93b4f5"] },
  { k: "noite", n: "Noite", colors: ["#16161d", "#facc15"] },
  { k: "vibrante", n: "Vibrante", colors: ["#ec4899", "#0891b2", "#10b981"] },
  { k: "floresta", n: "Floresta", colors: ["#15803d", "#bbf7d0"] },
] as const;
export type StockMode = "all" | "hide" | "unavailable";

export type Benefit = {
  icon: string;
  title: string;
  description: string;
};

export type CatalogSettings = {
  active: boolean;
  slug: string;
  logo: string;
  phone: string;
  email: string;
  stock_mode: StockMode;
  instagram: string;
  facebook: string;
  analytics_id: string;
  highlight: string;
  top_text: string;
  about: string;
  theme: string;
  // New customization fields
  primary_color: string;
  font_family: string;
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_image: string;
  hero_button_text: string;
  benefits: Benefit[];
  dark_mode_enabled: boolean;
  footer_text: string;
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

export const DEFAULT_BENEFITS: Benefit[] = [
  { icon: "headphones", title: "Atendimento 24h", description: "De qualidade" },
  { icon: "truck", title: "Envio rápido", description: "Para todo brasil" },
];

export const DEFAULTS: CatalogSettings = {
  active: false, slug: "", logo: "", phone: "", email: "", stock_mode: "all",
  instagram: "", facebook: "", analytics_id: "", highlight: "", top_text: "", about: "", theme: "azul",
  primary_color: "#C9852B", font_family: "Inter",
  hero_title: "", hero_subtitle: "", hero_description: "", hero_image: "", hero_button_text: "VER PRODUTOS",
  benefits: DEFAULT_BENEFITS,
  dark_mode_enabled: true, footer_text: "", whatsapp_message: "Olá! Gostaria de fazer um pedido:",
};

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
