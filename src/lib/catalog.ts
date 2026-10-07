export const THEMES = [
  { k: "azul", n: "Azul", colors: ["#1d4ed8", "#93b4f5"] },
  { k: "noite", n: "Noite", colors: ["#16161d", "#facc15"] },
  { k: "vibrante", n: "Vibrante", colors: ["#ec4899", "#0891b2", "#10b981"] },
  { k: "floresta", n: "Floresta", colors: ["#15803d", "#bbf7d0"] },
] as const;
export type StockMode = "all" | "hide" | "unavailable";
export type CatalogSettings = {
  active: boolean; slug: string; logo: string; phone: string; email: string; stock_mode: StockMode;
  instagram: string; facebook: string; analytics_id: string; highlight: string; top_text: string; about: string; theme: string;
};
export const DEFAULTS: CatalogSettings = { active: false, slug: "", logo: "", phone: "", email: "", stock_mode: "all", instagram: "", facebook: "", analytics_id: "", highlight: "", top_text: "", about: "", theme: "azul" };
export const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
