"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { CategoryListItem } from "../produtos/categorias/types";
import type { UserListItem } from "../usuarios/types";
import type {
  CartLine,
  CreatedSale,
  SearchResultItem,
  TopProductItem,
} from "./types";

const TODAS_CATEGORIAS = "__todas__";
const SEARCH_DEBOUNCE_MS = 350;

interface GridItem {
  id: string;
  name: string;
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
}

export function PdvScreen({
  currentUserId,
  currentUserName,
  canSelectVendedor,
}: PdvScreenProps) {
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
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

  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    void apiFetch<CategoryListItem[]>("/categories?active=true").then(
      setCategories,
    );
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
    ).then(setSearchResults);
  }, [debouncedQuery, categoryFilter]);

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
            ? { ...line, quantity: String(Number(line.quantity) + 1) }
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
          quantity: "1",
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

  const cartTotal = cart.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice),
    0,
  );

  async function handleFinalize() {
    setFinalizing(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      };
      if (canSelectVendedor && selectedVendedorId !== currentUserId) {
        body.vendedorId = selectedVendedorId;
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
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <h1 className="mb-4 font-heading text-2xl">PDV</h1>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Buscar produto pelo nome..."
            value={query}
            onChange={(e) => {
              setShowTopProducts(false);
              setQuery(e.target.value);
            }}
            className="flex-1"
          />
          <Select
            value={categoryFilter || undefined}
            onValueChange={(value) =>
              setCategoryFilter(!value || value === TODAS_CATEGORIAS ? "" : value)
            }
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por categoria">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS_CATEGORIAS}>Todas categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant={showTopProducts ? "default" : "outline"}
            onClick={() => {
              setQuery("");
              setShowTopProducts((prev) => !prev);
            }}
          >
            ★ Mais vendidos
          </Button>
        </div>

        {showTopProducts && (
          <div className="mb-4 flex gap-2">
            {(["dia", "semana", "mes"] as const).map((period) => (
              <Button
                key={period}
                type="button"
                size="sm"
                variant={topPeriod === period ? "default" : "outline"}
                onClick={() => setTopPeriod(period)}
              >
                {period === "dia" ? "Hoje" : period === "semana" ? "Semana" : "Mês"}
              </Button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {gridItems.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              {showTopProducts
                ? "Nenhuma venda paga no período."
                : "Digite pra buscar um produto."}
            </p>
          )}
          {gridItems.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-colors hover:border-primary"
              onClick={() => addToCart(item)}
            >
              <CardContent className="flex flex-col gap-1 p-3">
                <div className="flex h-16 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full rounded object-cover"
                    />
                  ) : (
                    "sem foto"
                  )}
                </div>
                <p className="text-sm font-medium">{item.name}</p>
                <div className="flex items-center gap-2">
                  {item.onPromotion && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatCurrency(Number(item.regularPrice))}
                    </span>
                  )}
                  <span className="text-sm font-semibold">
                    {formatCurrency(Number(item.effectivePrice))}
                    {item.unitType !== "UNIDADE" && (
                      <span className="text-xs font-normal text-muted-foreground">
                        /{item.unitType.toLowerCase()}
                      </span>
                    )}
                  </span>
                  {item.onPromotion && (
                    <Badge className="bg-success text-success-foreground">
                      promo
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="sticky top-8 self-start rounded-xl border border-border bg-card p-5">
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
                    {line.unitType !== "UNIDADE" && `/${line.unitType.toLowerCase()}`}
                  </p>
                </div>
                <Input
                  className="w-20"
                  value={line.quantity}
                  onChange={(e) => updateQuantity(line.productId, e.target.value)}
                  aria-label={`Quantidade de ${line.name}`}
                />
                <span className="w-20 text-right text-sm">
                  {formatCurrency(
                    Number(line.quantity || 0) * Number(line.unitPrice),
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(line.productId)}
                  aria-label={`Remover ${line.name}`}
                >
                  ✕
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
          disabled={cart.length === 0 || finalizing}
          onClick={handleFinalize}
        >
          {finalizing ? "Finalizando..." : "Finalizar venda"}
        </Button>
      </div>
    </div>
  );
}
