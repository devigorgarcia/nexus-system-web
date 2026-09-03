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

  if (!response.ok) {
    const body: unknown = await parseJsonBody(response).catch(() => ({}));
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : "Erro na requisição.";
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return parseJsonBody<T>(response);
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

  if (!response.ok) {
    const body: unknown = await parseJsonBody(response).catch(() => ({}));
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : "Erro na requisição.";
    throw new ApiError(response.status, message);
  }

  return parseJsonBody<T>(response);
}
