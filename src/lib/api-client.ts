// Cliente fino pra falar direto com a API NestJS (palacio-velas-api) do
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
    const body: unknown = await response.json().catch(() => ({}));
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : "Erro na requisição.";
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
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
    const body: unknown = await response.json().catch(() => ({}));
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : "Erro na requisição.";
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}
