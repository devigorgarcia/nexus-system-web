import type { Metadata } from "next";
import { AtSign, Clock, MapPin, MessageCircle, Phone } from "lucide-react";

// Landing institucional pública (T6.1) — recria a tela "Landing page" do
// design handoff (design_handoff_nexus/README.md §2 e Nexus Hi-Fi): header
// com nav âncora + CTA WhatsApp, hero, grade de produtos em destaque, seção
// de visita à loja em fundo accent e footer. Conteúdo ESTÁTICO de propósito:
// nenhum dado do catálogo/tenant é exposto publicamente (não existe endpoint
// público de produtos — promoções inclusive nunca valem aqui, decisions.md
// 2026-09-01). Tudo que a loja precisa ajustar (nome, contato, destaques)
// está nos objetos abaixo.
const STORE = {
  name: "Palácio das Velas",
  // Número no formato internacional, só dígitos — vira link wa.me.
  whatsappNumber: "5511988880000", // TODO: trocar pelo número real da loja
  phoneDisplay: "(11) 98888-0000", // TODO: idem
  address: "Rua das Flores, 128 — Centro", // TODO: endereço real
  hours: "Seg a Sáb, 9h às 18h",
  instagramUrl: "https://instagram.com/", // TODO: perfil real
} as const;

// TODO: fotos e preços reais — placeholders do handoff, nunca puxados do
// catálogo (ver comentário acima).
const FEATURED_PRODUCTS = [
  { name: "Vela de 7 dias", priceLabel: "a partir de R$ 12,00" },
  { name: "Guias e colares", priceLabel: "a partir de R$ 25,00" },
  { name: "Ervas e banhos", priceLabel: "a partir de R$ 8,00" },
  { name: "Defumadores e incensos", priceLabel: "a partir de R$ 6,00" },
] as const;

export const metadata: Metadata = {
  title: `${STORE.name} — Artigos religiosos`,
  description:
    "Velas, guias, ervas e defumadores selecionados com cuidado para o seu axé. Artigos religiosos com respeito às tradições de umbanda e candomblé.",
};

const whatsappHref = `https://wa.me/${STORE.whatsappNumber}`;

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-5 md:px-14">
        <span className="font-heading text-xl">{STORE.name}</span>
        <nav
          className="hidden gap-7 text-sm text-foreground/80 sm:flex"
          aria-label="Navegação principal"
        >
          <a href="#sobre" className="hover:text-foreground">
            Sobre
          </a>
          <a href="#produtos" className="hover:text-foreground">
            Produtos
          </a>
          <a href="#contato" className="hover:text-foreground">
            Contato
          </a>
        </nav>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <MessageCircle className="size-4" />
          Fale no WhatsApp
        </a>
      </header>

      <section
        id="sobre"
        className="flex flex-col items-center gap-5 px-6 py-16 text-center md:px-14 md:py-[72px]"
      >
        <h1 className="max-w-[680px] font-heading text-3xl leading-[1.2] md:text-[42px]">
          Artigos religiosos com respeito às tradições de umbanda e candomblé
        </h1>
        <p className="max-w-[520px] text-base text-muted-foreground">
          Velas, guias, ervas e defumadores selecionados com cuidado para o
          seu axé.
        </p>
        <a
          href="#produtos"
          className="rounded-[9px] bg-primary px-6 py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ver produtos
        </a>
        {/* Placeholder do handoff ("foto — loja / vitrine de produtos") —
            trocar por <Image> com foto real da loja quando houver. */}
        <div
          className="mt-3 flex h-56 w-full max-w-[960px] items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground md:h-80"
          role="img"
          aria-label="Foto da loja em breve"
        >
          foto — loja / vitrine de produtos
        </div>
      </section>

      <section id="produtos" className="px-6 pt-2 pb-16 md:px-14">
        <h2 className="mb-6 font-heading text-2xl md:text-[26px]">
          Produtos em destaque
        </h2>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {FEATURED_PRODUCTS.map((product) => (
            <div key={product.name} className="flex flex-col gap-2">
              <div
                className="flex h-[150px] items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground"
                role="img"
                aria-label={`Foto de ${product.name} em breve`}
              >
                foto
              </div>
              <span className="text-sm font-semibold">{product.name}</span>
              <span className="text-[13px] text-muted-foreground">
                {product.priceLabel}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="contato"
        className="flex flex-col justify-between gap-10 bg-accent px-6 py-12 md:flex-row md:items-center md:px-14"
      >
        <div className="flex-1">
          <h2 className="mb-3 font-heading text-2xl">Visite nossa loja</h2>
          <address className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80 not-italic">
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              {STORE.address}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              {STORE.hours}
            </span>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-foreground"
            >
              <Phone className="size-4 shrink-0" />
              {STORE.phoneDisplay}
            </a>
          </address>
        </div>
        {/* Placeholder do handoff ("mapa / localização") — trocar por embed
            do Google Maps quando o endereço real estiver definido. */}
        <div
          className="flex h-[180px] w-full max-w-[320px] items-center justify-center rounded-xl bg-background/60 text-sm text-muted-foreground"
          role="img"
          aria-label="Mapa da localização em breve"
        >
          mapa / localização
        </div>
      </section>

      <footer className="flex flex-col gap-2 border-t border-border px-6 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:px-14">
        <span>
          © {new Date().getFullYear()} {STORE.name}
        </span>
        <span className="inline-flex items-center gap-4">
          <a
            href={STORE.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <AtSign className="size-3.5" />
            Instagram
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <MessageCircle className="size-3.5" />
            WhatsApp
          </a>
          <a href="/login" className="hover:text-foreground">
            Acesso ao painel
          </a>
        </span>
      </footer>
    </div>
  );
}
