# Nexus — Web

Frontend Next.js (painel administrativo + landing page institucional). Spec completa em
[`nexus-docs/begin/`](https://github.com/devigorgarcia/nexus-docs) —
este repo segue `constitution.md`/`spec.md`/`plan.md`/`tasks.md` de lá como fonte de
verdade. Fidelidade visual: `nexus-docs/design_handoff_nexus/`.

## Setup local

```bash
cp .env.example .env   # preencher NEXTAUTH_SECRET (openssl rand -base64 32)
npm install
npm run dev             # http://localhost:3000
```

Depende da API (`nexus-api`) rodando em `NEXT_PUBLIC_API_URL` (padrão
`http://localhost:3001`).

## Stack

Next.js (App Router) · NextAuth v4 (cookie httpOnly, ver `src/lib/auth.ts`) · Tailwind
CSS v4 · shadcn/ui · Playwright/Jest (testes, ver `spec.md` §16).
