import { apiFetch } from "./api-client";

// Regressão do achado ao vivo em T5.2 (docs/tasks-log.md): NestJS devolve
// `Content-Length: 0` (corpo vazio, 200 OK) pra handler que retorna `null`
// (ex.: `GET /cash-register/current` sem nenhum caixa aberto) — nunca o
// JSON literal `"null"`. `response.json()` numa string vazia lança
// `SyntaxError`; `apiFetch` precisa tratar corpo vazio como sucesso com
// valor `undefined`, não quebrar a chamada inteira.
// Mock mínimo — só o que `apiFetch` realmente lê da `Response` (jsdom, o
// ambiente de teste, não expõe o construtor `Response` global do fetch
// nativo).
function fakeResponse(status: number, text: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(text),
  } as Response;
}

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("resolve com undefined quando a resposta é 200 com corpo vazio", async () => {
    global.fetch = jest.fn().mockResolvedValue(fakeResponse(200, ""));

    const result = await apiFetch<{ id: string } | null>("/cash-register/current");

    expect(result).toBeUndefined();
  });

  it("continua fazendo parse normal de um corpo JSON não vazio", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(fakeResponse(200, JSON.stringify({ id: "abc" })));

    const result = await apiFetch<{ id: string }>("/products/abc");

    expect(result).toEqual({ id: "abc" });
  });
});
