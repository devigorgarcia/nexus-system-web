"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch, ApiError } from "@/lib/api-client";

interface ModuleCatalogItem {
  key: string;
  label: string;
}

interface CompanyListItem {
  id: string;
  name: string;
  contactEmail: string;
  enabledModules: string[];
  createdAt: string;
}

// Painel único da rota /plataforma: uma empresa por card, um checkbox por
// módulo do catálogo (module-catalog.ts na API, buscado aqui em vez de
// duplicado — mesma razão de `nav-sections.ts` centralizar a lista de
// seções). Mesmo padrão visual de pill-checkbox de `permissoes-tab.tsx`
// (matriz de permissão por papel), aqui é módulo por empresa.
export function CompaniesPanel() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [catalog, setCatalog] = useState<ModuleCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  async function reload() {
    const [companiesData, catalogData] = await Promise.all([
      apiFetch<CompanyListItem[]>("/platform/companies"),
      apiFetch<ModuleCatalogItem[]>("/platform/companies/module-catalog"),
    ]);
    setCompanies(companiesData);
    setCatalog(catalogData);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function toggleModule(company: CompanyListItem, moduleKey: string) {
    const nextModules = company.enabledModules.includes(moduleKey)
      ? company.enabledModules.filter((key) => key !== moduleKey)
      : [...company.enabledModules, moduleKey];

    setSavingKey(`${company.id}:${moduleKey}`);
    try {
      await apiFetch(`/platform/companies/${company.id}/modules`, {
        method: "PATCH",
        body: JSON.stringify({ enabledModules: nextModules }),
      });
      await reload();
    } catch (error) {
      alert(
        error instanceof ApiError ? error.message : "Erro ao atualizar módulos.",
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
    <div className="flex flex-col gap-4">
      {companies.map((company) => (
        <Card key={company.id} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="font-medium">{company.name}</span>
              <span className="block text-xs text-muted-foreground">
                {company.contactEmail}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {catalog.map((module) => {
              const enabled = company.enabledModules.includes(module.key);
              const isSaving = savingKey === `${company.id}:${module.key}`;
              return (
                <label
                  key={module.key}
                  className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm aria-disabled:opacity-60"
                  aria-disabled={isSaving}
                >
                  <Checkbox
                    checked={enabled}
                    disabled={isSaving}
                    onCheckedChange={() => void toggleModule(company, module.key)}
                  />
                  {module.label}
                </label>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
