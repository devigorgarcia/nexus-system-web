"use client";

import { useEffect, useMemo, useState } from "react";
import { PageToolbar } from "@/components/page-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DEFAULT_PISO_MENSAL,
  DEFAULT_SALARIO_MINIMO,
  DEFAULT_WEIGHTS,
  PRICING_MODULES,
  calculateMonthlyPrice,
  dependentsOf,
  formatBRL,
  migrateStoredWeights,
  missingDependencies,
  pricingIdsFromCompanyModules,
  type PricingModuleId,
} from "@/lib/module-pricing";

interface CompanyListItem {
  id: string;
  code: string;
  name: string;
  enabledModules: string[];
}

const STORAGE_KEY = "nexus-pricing-sim";

type StoredPricing = {
  salarioMinimo: number;
  piso: number;
  weights: Record<PricingModuleId, number>;
};

function loadStored(): StoredPricing | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPricing>;
    return {
      salarioMinimo: Number(parsed.salarioMinimo) || DEFAULT_SALARIO_MINIMO,
      piso: Number(parsed.piso) || 0,
      weights: migrateStoredWeights(parsed.weights),
    };
  } catch {
    return null;
  }
}

export function SimulacaoPanel() {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [salarioMinimo, setSalarioMinimo] = useState(DEFAULT_SALARIO_MINIMO);
  const [piso, setPiso] = useState(DEFAULT_PISO_MENSAL);
  const [weights, setWeights] =
    useState<Record<PricingModuleId, number>>(DEFAULT_WEIGHTS);
  const [active, setActive] = useState<PricingModuleId[]>(["cadastros"]);
  const [warning, setWarning] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored) {
      setSalarioMinimo(stored.salarioMinimo);
      setPiso(stored.piso);
      setWeights(stored.weights);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ salarioMinimo, piso, weights }),
    );
  }, [ready, salarioMinimo, piso, weights]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<CompanyListItem[]>("/platform/companies");
        setCompanies(data);
        setSelectedId((current) =>
          current && data.some((company) => company.id === current)
            ? current
            : (data[0]?.id ?? null),
        );
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Erro ao carregar clientes.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = companies.find((company) => company.id === selectedId);

  function applyClientModules(company: CompanyListItem) {
    setActive(pricingIdsFromCompanyModules(company.enabledModules));
    setWarning(null);
  }

  useEffect(() => {
    if (selected) applyClientModules(selected);
    // Só reaplica quando o cliente muda — a simulação pode divergir depois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function toggleModule(id: PricingModuleId, nextOn: boolean) {
    const def = PRICING_MODULES.find((module) => module.id === id);
    if (!def || def.alwaysOn) return;

    if (nextOn) {
      const missing = missingDependencies(id, active);
      if (missing.length > 0) {
        const labels = missing
          .map(
            (dep) =>
              PRICING_MODULES.find((module) => module.id === dep)?.label ?? dep,
          )
          .join(", ");
        setWarning(`Ligue primeiro: ${labels}.`);
        return;
      }
      setActive((current) => [...current, id]);
      setWarning(null);
      return;
    }

    const drop = new Set<PricingModuleId>([id, ...dependentsOf(id)]);
    const cascade = [...drop].filter((item) => item !== id);
    setActive((current) => current.filter((item) => !drop.has(item)));
    setWarning(
      cascade.length > 0
        ? `Desligou também: ${cascade
            .map(
              (dep) =>
                PRICING_MODULES.find((module) => module.id === dep)?.label ??
                dep,
            )
            .join(", ")}.`
        : null,
    );
  }

  function setWeight(id: PricingModuleId, value: string) {
    const parsed = Number(value.replace(",", "."));
    const next = Number.isFinite(parsed)
      ? Math.min(100, Math.max(0, parsed))
      : 0;
    setWeights((current) => ({ ...current, [id]: next }));
  }

  const result = useMemo(
    () => calculateMonthlyPrice(active, weights, salarioMinimo, piso),
    [active, weights, salarioMinimo, piso],
  );

  const maxWeight = PRICING_MODULES.reduce(
    (sum, module) => sum + (weights[module.id] ?? 0),
    0,
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageToolbar className="items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label className="text-sm font-medium" htmlFor="sim-company">
            Cliente
          </label>
          <Select
            value={selectedId ?? undefined}
            onValueChange={(value) => setSelectedId(value ?? null)}
          >
            <SelectTrigger id="sim-company" className="w-full max-w-xl">
              <SelectValue placeholder="Selecione um cliente">
                {(value: string | null) => {
                  const company = companies.find((item) => item.id === value);
                  return company
                    ? `${company.code} — ${company.name}`
                    : null;
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
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={!selected}
            onClick={() => selected && applyClientModules(selected)}
          >
            Usar módulos do cliente
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setWeights(DEFAULT_WEIGHTS);
              setSalarioMinimo(DEFAULT_SALARIO_MINIMO);
              setPiso(DEFAULT_PISO_MENSAL);
            }}
          >
            Restaurar pesos
          </Button>
        </div>
      </PageToolbar>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="p-5">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salario-minimo">Salário mínimo vigente</Label>
              <Input
                id="salario-minimo"
                type="number"
                min={0}
                step={1}
                value={salarioMinimo}
                onChange={(event) =>
                  setSalarioMinimo(Number(event.target.value) || 0)
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="piso-mensal">Piso da mensalidade (R$)</Label>
              <Input
                id="piso-mensal"
                type="number"
                min={0}
                step={1}
                value={piso}
                onChange={(event) => setPiso(Number(event.target.value) || 0)}
              />
            </div>
          </div>

          {warning ? (
            <p className="mb-3 text-sm text-muted-foreground">{warning}</p>
          ) : null}

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {PRICING_MODULES.map((module) => {
              const on = active.includes(module.id);
              const depLabels = module.dependsOn
                .map(
                  (dep) =>
                    PRICING_MODULES.find((item) => item.id === dep)?.label ??
                    dep,
                )
                .join(", ");
              return (
                <div
                  key={module.id}
                  className="rounded-lg border border-border px-3.5 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{module.label}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        aria-label={`Peso de ${module.label}`}
                        className="h-8 w-16 text-right"
                        value={weights[module.id] ?? 0}
                        onChange={(event) =>
                          setWeight(module.id, event.target.value)
                        }
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                      <Switch
                        checked={on}
                        disabled={module.alwaysOn}
                        onCheckedChange={(checked) =>
                          toggleModule(module.id, checked)
                        }
                      />
                    </div>
                  </div>
                  {module.includes.length ? (
                    <ul
                      className={`mt-2 space-y-0.5 text-xs ${
                        on
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {module.includes.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {module.alwaysOn ? (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Sempre ativo — não entra na cobrança
                    </p>
                  ) : depLabels ? (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Depende de {depLabels}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Soma de todos os pesos (tabela): {maxWeight}%. A mensalidade usa
            só os módulos ligados. Porcentagens ficam salvas neste navegador.
          </p>
        </Card>

        <Card className="h-fit p-5">
          <p className="text-xs text-muted-foreground">Mensalidade simulada</p>
          <p className="mt-1 font-heading text-4xl leading-none">
            {formatBRL(result.monthlyPrice)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {result.percentOfMinWage}% de {formatBRL(salarioMinimo)}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {salarioMinimo} × {result.percentOfMinWage} / 100
          </p>
          {piso > 0 && result.monthlyPrice === Math.round(piso) && result.percentOfMinWage > 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Piso de {formatBRL(piso)} aplicado.
            </p>
          ) : null}

          <ul className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
            {PRICING_MODULES.filter((module) => active.includes(module.id)).map(
              (module) => (
                <li
                  key={module.id}
                  className="flex justify-between gap-3 text-muted-foreground"
                >
                  <span>{module.label}</span>
                  <span className="tabular-nums">
                    {weights[module.id] ?? 0}%
                  </span>
                </li>
              ),
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
