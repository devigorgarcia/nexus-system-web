import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { connection } from "next/server";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Palácio das Velas",
  description: "Painel administrativo — PDV, estoque, financeiro",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Opta a app inteira por renderização dinâmica (spec.md §14) — necessário
  // pro CSP com nonce (src/proxy.ts) funcionar em toda página; CloudFront não
  // cacheia HTML de qualquer forma (infraestrutura.md), então não há custo.
  await connection();

  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
