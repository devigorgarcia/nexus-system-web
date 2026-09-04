"use client";

import { useEffect, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useHasModule } from "@/lib/modules-context";
import type { OnlineProduct, OnlineStoreConfig } from "./types";

function money(value: string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function VendaOnlineScreen() {
  const hasEstoque = useHasModule("estoque");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [active, setActive] = useState(false);
  const [products, setProducts] = useState<OnlineProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function reload() {
    const [config, catalog] = await Promise.all([
      apiFetch<OnlineStoreConfig | null>("/online/config"),
      apiFetch<OnlineProduct[]>("/online/products"),
    ]);
    if (config) {
      setName(config.name);
      setSlug(config.slug);
      setActive(config.active);
    }
    setProducts(catalog);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiFetch("/online/config", {
        method: "PUT",
        body: JSON.stringify({ name, slug, active }),
      });
      setSaved(true);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Venda online"
        description="Configuração da loja e catálogo que será publicado."
      />
      <PageBody className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg">Loja</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-name">Nome da loja</Label>
              <Input
                id="online-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="online-slug">Endereço (slug)</Label>
              <Input
                id="online-slug"
                value={slug}
                onChange={(event) =>
                  setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                placeholder="palacio-velas"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Switch
              id="online-active"
              checked={active}
              onCheckedChange={setActive}
            />
            <Label htmlFor="online-active">Loja ativa</Label>
          </div>
          {error && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {saved && <p className="mt-3 text-sm text-success">Loja salva.</p>}
          <Button
            className="mt-4"
            onClick={() => void handleSave()}
            disabled={saving || !name || !slug}
          >
            Salvar loja
          </Button>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-lg">Catálogo publicado</h2>
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum produto ativo no catálogo.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} size="sm" className="gap-0 py-0">
                <CardContent className="p-0">
                  <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-muted text-xs text-muted-foreground">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      "sem foto"
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-3 py-3">
                    <p className="line-clamp-2 text-sm font-medium">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-primary">
                        {money(product.salePrice)}
                      </span>
                      {hasEstoque ? (
                        <Badge variant="secondary">
                          estoque {product.stock}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageBody>
    </div>
  );
}
