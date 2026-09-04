"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Star, X } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { QuantityInput } from "@/components/quantity-input";
import { SearchableSelect } from "@/components/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api-client";
import { searchCategories, searchCustomers } from "@/lib/search-options";
import { parseQuantity, quantityToApi, unitSuffix } from "@/lib/unit-type";
import type { UserListItem } from "../usuarios/types";
import type {
  CartLine,
  CreatedSale,
  SearchResultItem,
  TopProductItem,
} from "./types";

const SEARCH_DEBOUNCE_MS = 350;
// Leitor de código de barras emula teclado: rajada de teclas com gap
// <~30ms e Enter no final. Gap maior que isso = digitação humana, reseta o
// buffer. Mínimo de 4 chars evita capturar Enter solto na tela.
const SCAN_KEY_GAP_MS = 50;
const SCAN_MIN_LENGTH = 4;

interface GridItem {
  id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  imageUrl: string | null;
  unitType: "UNIDADE" | "METRO" | "PESO" | "VOLUME";
  regularPrice: string;
  effectivePrice: string;
  onPromotion: boolean;
}

function fromSearchResult(item: SearchResultItem): GridItem {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    barcode: item.barcode,
    imageUrl: item.imageUrl,
    unitType: item.unitType,
    regularPrice: item.regularPrice,
    effectivePrice: item.effectivePrice,
    onPromotion: item.priceSource !== "base",
  };
}

function fromTopProduct(row: TopProductItem): GridItem {
  const price =
    row.product.unitType === "UNIDADE"
      ? row.product.salePrice
      : (row.product.pricePerUnit ?? row.product.salePrice);
  return {
    id: row.product.id,
    name: row.product.name,
    imageUrl: row.product.imageUrl,
    unitType: row.product.unitType,
    regularPrice: price,
    effectivePrice: price,
    onPromotion: false,
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface PdvScreenProps {
  currentUserId: string;
  currentUserName: string;
  canSelectVendedor: boolean;
  canSelectCustomer: boolean;
}

export function PdvScreen({
  currentUserId,
  currentUserName,
  canSelectVendedor,
  canSelectCustomer,
}: PdvScreenProps) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categoryFilterLabel, setCategoryFilterLabel] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  // Grade começa em "Mais vendidos" (em vez de vazia até o usuário digitar):
  // o design mostra a grade de produtos já preenchida ao abrir o PDV. Uma
  // grade com o catálogo inteiro por padrão exigiria relaxar o contrato do
  // /products/search (hoje `q` obrigatório e resultado não paginado, T4.3 —
  // de propósito, pra nunca despejar o catálogo inteiro de uma vez), então
  // "mais vendidos" é o proxy mais próximo sem mexer nesse contrato.
  const [showTopProducts, setShowTopProducts] = useState(true);
  const [topPeriod, setTopPeriod] = useState<"dia" | "semana" | "mes">("dia");
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([]);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [employees, setEmployees] = useState<UserListItem[]>([]);
  const [selectedVendedorId, setSelectedVendedorId] = useState(currentUserId);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerLabel, setSelectedCustomerLabel] = useState("");

  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (canSelectVendedor) {
      void apiFetch<UserListItem[]>("/users").then((items) =>
        setEmployees(items.filter((item) => item.active)),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce (T4.3, spec.md §7 — nunca uma requisição por tecla digitada).
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      return;
    }
    const params = new URLSearchParams({ q: debouncedQuery });
    if (categoryFilter) params.set("categoryId", categoryFilter);
    void apiFetch<SearchResultItem[]>(
      `/products/search?${params.toString()}`,
    ).then((items) => {
      // Bip de leitor ou código digitado completo (2026-09-04): match exato
      // de SKU/EAN cai direto no carrinho, sem clique — fluxo de caixa.
      const typed = debouncedQuery.trim().toLowerCase();
      const exact = items.filter(
        (item) =>
          item.barcode === debouncedQuery.trim() ||
          item.sku?.toLowerCase() === typed,
      );
      if (exact.length === 1) {
        addToCart(fromSearchResult(exact[0]));
        setQuery("");
        setSearchResults([]);
        setShowTopProducts(true);
        return;
      }
      setSearchResults(items);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, categoryFilter]);

  // Captura global do bip (2026-09-04): funciona mesmo com o foco fora do
  // campo de busca (ex.: depois de mexer no carrinho). Se o foco está num
  // campo editável, o código vai pro campo e o fluxo normal resolve — o
  // auto-add acima pega do mesmo jeito.
  const scanBuffer = useRef({ text: "", lastKeyAt: 0 });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isEditable) return;

      const buffer = scanBuffer.current;
      const now = Date.now();
      if (now - buffer.lastKeyAt > SCAN_KEY_GAP_MS) buffer.text = "";
      buffer.lastKeyAt = now;

      if (event.key === "Enter") {
        const code = buffer.text;
        buffer.text = "";
        if (code.length >= SCAN_MIN_LENGTH) {
          event.preventDefault();
          // Pula o debounce: o leitor é instantâneo, a busca dispara já.
          setShowTopProducts(false);
          setQuery(code);
          setDebouncedQuery(code);
        }
        return;
      }
      if (event.key.length === 1) {
        buffer.text += event.key;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!showTopProducts) return;
    void apiFetch<TopProductItem[]>(
      `/sales/top-products?period=${topPeriod}`,
    ).then(setTopProducts);
  }, [showTopProducts, topPeriod]);

  const gridItems: GridItem[] = showTopProducts
    ? topProducts.map(fromTopProduct)
    : searchResults.map(fromSearchResult);

  function addToCart(item: GridItem) {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === item.id);
      if (existing) {
        // UI otimista (spec.md §7): incrementa localmente, sem round-trip.
        const step = item.unitType === "UNIDADE" ? 1 : 0;
        if (step === 0) return prev; // fração exige edição manual da quantidade
        return prev.map((line) =>
          line.productId === item.id
            ? {
                ...line,
                quantity: String((parseQuantity(line.quantity) ?? 0) + 1),
              }
            : line,
        );
      }
      return [
        ...prev,
        {
          productId: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          unitType: item.unitType,
          quantity: item.unitType === "UNIDADE" ? "1" : "",
          unitPrice: item.effectivePrice,
          onPromotion: item.onPromotion,
        },
      ];
    });
  }

  function updateQuantity(productId: string, quantity: string) {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity } : line,
      ),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  function lineSubtotal(line: CartLine) {
    const quantity = parseQuantity(line.quantity);
    if (quantity == null) return 0;
    return quantity * Number(line.unitPrice);
  }

  const cartReady = cart.every((line) => parseQuantity(line.quantity) != null);
  const cartTotal = cart.reduce((sum, line) => sum + lineSubtotal(line), 0);

  async function handleFinalize() {
    if (!cartReady) return;
    setFinalizing(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: quantityToApi(line.quantity),
        })),
      };
      if (canSelectVendedor && selectedVendedorId !== currentUserId) {
        body.vendedorId = selectedVendedorId;
      }
      if (canSelectCustomer && selectedCustomerId) {
        body.customerId = selectedCustomerId;
      }
      await apiFetch<CreatedSale>("/sales", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setCart([]);
      setSuccessMessage(
        "Pedido enviado pra fila de Pedidos — cobrança acontece lá.",
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao finalizar venda.");
    } finally {
      setFinalizing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="PDV"
        description="Monta o pedido no balcão. A cobrança acontece na fila de Pedidos."
      />

      <PageBody className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <div>
        <PageToolbar className="flex-col items-stretch sm:flex-col">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou bipar código…"
                value={query}
                onChange={(e) => {
                  setShowTopProducts(false);
                  setQuery(e.target.value);
                }}
                className="h-11 pl-9"
              />
            </div>
            <SearchableSelect
              className="h-11 w-full sm:w-44"
              aria-label="Filtrar por categoria"
              value={categoryFilter}
              valueLabel={categoryFilterLabel}
              fetchOptions={searchCategories}
              placeholder="Todas categorias"
              emptyOption={{ value: "", label: "Todas categorias" }}
              onChange={(value, option) => {
                setCategoryFilter(value);
                setCategoryFilterLabel(value ? (option?.label ?? "") : "");
              }}
            />
            <Button
              type="button"
              variant={showTopProducts ? "default" : "outline"}
              className="h-11"
              onClick={() => {
                setQuery("");
                setShowTopProducts((prev) => !prev);
              }}
            >
              <Star className="size-3.5" />
              Mais vendidos
            </Button>
          </div>

          {showTopProducts && (
            <div className="mt-3 flex gap-1 rounded-lg bg-muted p-1">
              {(["dia", "semana", "mes"] as const).map((period) => (
                <Button
                  key={period}
                  type="button"
                  size="sm"
                  variant={topPeriod === period ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setTopPeriod(period)}
                >
                  {period === "dia" ? "Hoje" : period === "semana" ? "Semana" : "Mês"}
                </Button>
              ))}
            </div>
          )}
        </PageToolbar>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gridItems.length === 0 && (
            <p className="col-span-full rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {showTopProducts
                ? "Nenhuma venda paga no período."
                : "Digite pra buscar um produto."}
            </p>
          )}
          {gridItems.map((item) => (
            <Card
              key={item.id}
              size="sm"
              className="cursor-pointer gap-0 py-0 transition-colors hover:border-primary"
              onClick={() => addToCart(item)}
            >
              <CardContent className="flex flex-col gap-2 p-0">
                <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted text-xs text-muted-foreground">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    "sem foto"
                  )}
                </div>
                <div className="flex flex-col gap-1 px-3 pb-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug">
                    {item.name}
                  </p>
                  {item.sku && (
                    <p className="text-xs text-muted-foreground">
                      SKU {item.sku}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.onPromotion && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(Number(item.regularPrice))}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(Number(item.effectivePrice))}
                      {item.unitType !== "UNIDADE" && (
                        <span className="text-xs font-normal text-muted-foreground">
                          /{unitSuffix(item.unitType)}
                        </span>
                      )}
                    </span>
                    {item.onPromotion && (
                      <Badge className="bg-success text-success-foreground">
                        promo
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="sticky top-3 self-start rounded-xl border border-border border-l-[3px] border-l-primary bg-card p-5 lg:top-[5.75rem]">
        <h2 className="mb-3 font-heading text-lg">Carrinho</h2>

        {canSelectVendedor ? (
          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={selectedVendedorId === currentUserId ? "default" : "outline"}
              onClick={() => setSelectedVendedorId(currentUserId)}
            >
              {currentUserName} (eu)
            </Button>
            {employees
              .filter((employee) => employee.id !== currentUserId)
              .map((employee) => (
                <Button
                  key={employee.id}
                  type="button"
                  size="sm"
                  variant={
                    selectedVendedorId === employee.id ? "default" : "outline"
                  }
                  onClick={() => setSelectedVendedorId(employee.id)}
                >
                  {employee.name}
                </Button>
              ))}
          </div>
        ) : (
          <p className="mb-3 text-sm text-muted-foreground">
            Vendedor: {currentUserName}
          </p>
        )}

        {canSelectCustomer && (
          <div className="mb-3">
            <SearchableSelect
              aria-label="Cliente"
              value={selectedCustomerId}
              valueLabel={selectedCustomerLabel}
              fetchOptions={searchCustomers}
              placeholder="Cliente avulso"
              emptyOption={{ value: "", label: "Cliente avulso" }}
              onChange={(value, option) => {
                setSelectedCustomerId(value);
                setSelectedCustomerLabel(value ? (option?.label ?? "") : "");
              }}
            />
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carrinho vazio.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cart.map((line) => (
              <li key={line.productId} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(Number(line.unitPrice))}
                    {line.unitType !== "UNIDADE" &&
                      `/${unitSuffix(line.unitType)}`}
                  </p>
                </div>
                <QuantityInput
                  className="w-24"
                  unitType={line.unitType}
                  value={line.quantity}
                  onChange={(quantity) =>
                    updateQuantity(line.productId, quantity)
                  }
                  aria-label={`Quantidade de ${line.name}`}
                />
                <span className="w-20 text-right text-sm">
                  {parseQuantity(line.quantity) == null
                    ? "—"
                    : formatCurrency(lineSubtotal(line))}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeFromCart(line.productId)}
                  aria-label={`Remover ${line.name}`}
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span className="font-medium">Total</span>
          <span className="font-heading text-lg">{formatCurrency(cartTotal)}</span>
        </div>

        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        {successMessage && (
          <p className="mt-2 text-sm text-success">{successMessage}</p>
        )}

        <Button
          type="button"
          className="mt-4 w-full"
          disabled={cart.length === 0 || !cartReady || finalizing}
          onClick={handleFinalize}
        >
          {finalizing ? "Finalizando..." : "Finalizar venda"}
        </Button>
      </div>
      </PageBody>
    </div>
  );
}
