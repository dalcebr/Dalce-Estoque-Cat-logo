import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Dalce Estoque";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: `${APP_NAME} · Gestão de vendas, estoque e catálogo`, template: `%s · ${APP_NAME}` },
  description: "PDV, controle de estoque, fiado, relatórios e catálogo online para pequenos negócios. Comece grátis.",
  applicationName: APP_NAME,
  keywords: ["estoque", "pdv", "catálogo online", "fiado", "gestão de vendas", "pequeno negócio"],
  openGraph: {
    title: `${APP_NAME} · Seu negócio mais organizado e lucrativo`,
    description: "Venda, controle o estoque e publique seu catálogo online em minutos.",
    type: "website",
    locale: "pt_BR",
    siteName: APP_NAME,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#1d4ed8" };

// Aplica o tema antes da primeira pintura (evita "piscar"): usa a escolha salva ou o tema do aparelho.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={font.className}>{children}</body>
    </html>
  );
}
