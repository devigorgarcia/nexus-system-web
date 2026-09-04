"use client";

import { useEffect, useState } from "react";
import { PageToolbar } from "@/components/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  CADASTROS_KEYS,
  cadastroKeysInCatalog,
  groupCadastroCatalog,
  type ModuleCatalogItem,
} from "@/lib/modules";

interface CompanyListItem {
  id: string;
  code: string;
  name: string;
  contactEmail: string;
  enabledModules: string[];
  createdAt: string;
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Painel único da rota /painel-admin: um select escolhe o cliente (nome +
// código curto, `Company.code`, migration 20260903050000 — o UUID não serve
// pro Admin da plataforma reconhecer o cliente de cabeça), e o card abaixo
// mostra só a empresa selecionada, com um switch por módulo do catálogo
// (module-catalog.ts na API, buscado aqui em vez de duplicado — mesma razão
// de `nav-sections.ts` centralizar a lista de seções). Antes disto (T2.1)
// listava toda empresa como card simultâneo — não escala visualmente com
// muitos clientes assinantes.
export function CompaniesPanel() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [catalog, setCatalog] = useState<ModuleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [companiesData, catalogData] = await Promise.all([
      apiFetch<CompanyListItem[]>("/platform/companies"),
      apiFetch<ModuleCatalogItem[]>("/platform/companies/module-catalog"),
    ]);
    setCompanies(companiesData);
    setCatalog(catalogData);
    setLoading(false);
    setSelectedId((current) =>
      current && companiesData.some((company) => company.id === current)
        ? current
        : (companiesData[0]?.id ?? null),
    );
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  const selected = companies.find((company) => company.id === selectedId) ?? null;
  const displayCatalog = groupCadastroCatalog(catalog);

  async function toggleModule(
    company: CompanyListItem,
    moduleKey: string,
    aliases: string[],
  ) {
    const enabled = aliases.some((key) => company.enabledModules.includes(key));
    let nextModules: string[];
    if (moduleKey === "cadastros") {
      const withoutFamily = company.enabledModules.filter(
        (key) => !(CADASTROS_KEYS as readonly string[]).includes(key),
      );
      nextModules = enabled
        ? withoutFamily
        : [...withoutFamily, ...cadastroKeysInCatalog(catalog)];
    } else {
      nextModules = enabled
        ? company.enabledModules.filter((key) => !aliases.includes(key))
        : [...company.enabledModules, moduleKey];
    }

    setError(null);
    setSavingKey(moduleKey);
    try {
      await apiFetch(`/platform/companies/${company.id}/modules`, {
        method: "PATCH",
        body: JSON.stringify({ enabledModules: nextModules }),
      });
      await reload();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao atualizar módulos.",
      );
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (companies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma empresa cadastrada ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageToolbar className="items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="company-select">
            Cliente
          </label>
          <Select
            value={selectedId ?? undefined}
            onValueChange={(value) => setSelectedId(value ?? null)}
          >
            <SelectTrigger id="company-select" className="w-full max-w-xl">
              <SelectValue placeholder="Selecione um cliente">
                {(value: string | null) => {
                  const company = companies.find((item) => item.id === value);
                  return company ? `${company.code} — ${company.name}` : null;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  <span className="font-mono text-xs text-muted-foreground">
                    {company.code}
                  </span>
                  <span>{company.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          {companies.length}{" "}
          {companies.length === 1 ? "cliente cadastrado" : "clientes cadastrados"}
        </p>
      </PageToolbar>

      {selected && (
        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-lg">{selected.name}</h2>
                <Badge variant="outline" className="font-mono">
                  {selected.code}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {selected.contactEmail}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Cliente desde</div>
              <div>{dateFormatter.format(new Date(selected.createdAt))}</div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">Módulos habilitados</h3>
            <span className="text-xs text-muted-foreground">
              {
                displayCatalog.filter((module) =>
                  module.aliases.some((key) =>
                    selected.enabledModules.includes(key),
                  ),
                ).length
              }{" "}
              de {displayCatalog.length}
            </span>
          </div>

          {error && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {displayCatalog.map((module) => {
              const enabled = module.aliases.some((key) =>
                selected.enabledModules.includes(key),
              );
              const isSaving = savingKey === module.key;
              return (
                <div
                  key={module.key}
                  className="rounded-lg border border-border px-3.5 py-2.5"
                >
                  <label
                    htmlFor={`module-${module.key}`}
                    className="flex items-center justify-between gap-3 text-sm aria-disabled:opacity-60"
                    aria-disabled={isSaving}
                  >
                    <span className="font-medium">{module.label}</span>
                    <Switch
                      id={`module-${module.key}`}
                      checked={enabled}
                      disabled={isSaving}
                      onCheckedChange={() =>
                        void toggleModule(selected, module.key, module.aliases)
                      }
                    />
                  </label>
                  {module.includes?.length ? (
                    <ul
                      className={`mt-2 space-y-0.5 text-xs ${
                        enabled
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {module.includes.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
