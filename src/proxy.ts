import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// CSP com nonce por requisição (spec.md §14) — "middleware" foi renomeado pra
// "proxy" no Next 16 (ver AGENTS.md/node_modules/next/dist/docs). Nonce força
// renderização dinâmica em toda página, o que já era esperado aqui: o
// CloudFront (infraestrutura.md) nunca cacheia HTML de página (SSR/admin/API
// sempre "sem cache"), só asset estático — perder otimização estática não
// tem custo real na nossa arquitetura de infra.
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const mediaDomain = process.env.NEXT_PUBLIC_MEDIA_DOMAIN ?? "";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: ${mediaDomain};
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", cspHeader);
  // Redundante com frame-ancestors 'none' acima, mas alguns navegadores
  // antigos só respeitam o header dedicado (constitution.md §3.19).
  response.headers.set("X-Frame-Options", "DENY");

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
