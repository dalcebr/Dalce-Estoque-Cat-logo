import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = { title: "Dalce Estoque", description: "Seu negócio mais organizado e lucrativo" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Aplica o tema antes da primeira pintura (evita "piscar"): usa a escolha salva ou o tema do aparelho.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

// Fonte carregada via Google Fonts (CSS) em vez de `next/font/google`, que
// baixa a fonte durante o build e pode falhar no ambiente do Cloudflare.
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_HREF} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body style={{ fontFamily: '"Plus Jakarta Sans", Arial, Helvetica, sans-serif' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
