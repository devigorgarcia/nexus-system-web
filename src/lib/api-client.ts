// Cliente fino pra falar direto com a API NestJS (nexus-api) do
// browser — o cookie de sessão do NextAuth vai junto automaticamente
// (`credentials: "include"`), porque frontend e API são "same-site" mesmo em
// portas diferentes em dev (docs/decisions.md, T2.4).
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// 401 em qualquer chamada = cookie de sessão inválido/expirado (a API só
// devolve 401 do SessionGuard). Em vez de deixar cada tela tratar como erro
// genérico (antes virava `alert()` nativo), dispara um handler global —
// `SessionExpiredDialog` (montado nos shells admin/plataforma) abre o modal
// e leva pro login. As telas reconhecem o tipo e não alertam por cima.
export class SessionExpiredError extends ApiError {}

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function setSessionExpiredHandler(
  handler: SessionExpiredHandler | null,
): void {
  sessionExpiredHandler = handler;
}

function sessionExpired(): SessionExpiredError {
  sessionExpiredHandler?.();
  return new SessionExpiredError(401, "Sessão expirada.");
}

// Alert padrão dos catch de tela — silencia quando a sessão expirou, porque
// o modal global já é a UX inteira nesse caso (alert nativo por cima do
// modal era exatamente o que não podia acontecer).
export function alertApiError(error: unknown, fallback: string): void {
  if (error instanceof SessionExpiredError) return;
  alert(error instanceof ApiError ? error.message : fallback);
}

// NestJS trata handler que devolve `null`/`undefined` como "sem corpo" —
// manda a resposta com `Content-Length: 0` (200 OK, sem nenhum byte),
// nunca o JSON literal `"null"` (achado ao vivo construindo T5.2:
// `GET /cash-register/current` sem nenhum caixa aberto devolve exatamente
// isso). `response.json()` numa string vazia lança `SyntaxError:
// Unexpected end of JSON input` — lida aqui uma vez, protege toda chamada
// de `apiFetch`/`apiUpload`, não só quem sabe desse detalhe.
async function parseJsonBody<T>(response: Response): Promise<T> {
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function apiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object" || !("message" in body)) {
    return fallback;
  }
  const raw = (body as { message: unknown }).message;
  if (Array.isArray(raw)) {
    return raw.map(String).filter(Boolean).join(" ");
  }
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      // CSRF (T2.6): a API exige isso em toda rota de escrita — só uma
      // requisição same-origin feita via fetch/axios consegue setar esse
      // header, uma tag HTML forjada por outro site não consegue.
      "X-Requested-With": "XMLHttpRequest",
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    throw sessionExpired();
  }

  if (!response.ok) {
    const body: unknown = await parseJsonBody(response).catch(() => ({}));
    throw new ApiError(response.status, apiErrorMessage(body, "Erro na requisição."));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return parseJsonBody<T>(response);
}

// Download de arquivo gerado na API (ex.: modelo de planilha de importação,
// 2026-09-04) — fetch com cookie de sessão → blob → clique numa âncora
// temporária. Não dá pra usar um `<a href>` direto porque a API exige o
// cookie de sessão e o header CSRF, que só um fetch consegue mandar.
export async function apiDownload(path: string, filename: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "X-Requested-With": "XMLHttpRequest" },
  });

  if (response.status === 401) {
    throw sessionExpired();
  }

  if (!response.ok) {
    const body: unknown = await parseJsonBody(response).catch(() => ({}));
    throw new ApiError(
      response.status,
      apiErrorMessage(body, "Erro ao baixar arquivo."),
    );
  }

  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

// Upload de arquivo (multipart/form-data, T3.8) — variante de `apiFetch` sem
// `Content-Type` fixo: o browser define o boundary certo sozinho quando o
// body é `FormData`. Setar `Content-Type: application/json` na mão (como
// `apiFetch` faz) quebraria o multipart.
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "X-Requested-With": "XMLHttpRequest" },
    body: formData,
  });

  if (response.status === 401) {
    throw sessionExpired();
  }

  if (!response.ok) {
    const body: unknown = await parseJsonBody(response).catch(() => ({}));
    throw new ApiError(response.status, apiErrorMessage(body, "Erro na requisição."));
  }

  return parseJsonBody<T>(response);
}
