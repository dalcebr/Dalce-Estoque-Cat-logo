import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = { title: "Dalce Estoque", description: "Seu negócio mais organizado e lucrativo" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

// Aplica o tema antes da primeira pintura (evita "piscar"): usa a escolha salva ou o tema do aparelho.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className={font.className}><Providers>{children}</Providers></body>
    </html>
  );
}
