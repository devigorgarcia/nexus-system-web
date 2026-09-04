"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money-input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  applyFeeCutoff,
  brandRate,
  CARD_BRANDS,
  chargeToReceive,
  emptyCreditPlans,
  formatBRL,
  interestFreeLabel,
  netFromSale,
  parseRate,
  passesFeeToCustomer,
  rateToApi,
  rateToDisplay,
  totalFeePercent,
} from "@/lib/card-machine";
import type { CardMachine, CardMachineForm } from "./types";

function emptyForm(): CardMachineForm {
  return {
    id: null,
    name: "",
    brand: "TODAS",
    anticipationRate: "0,00",
    debitRate: "0,00",
    creditPlans: emptyCreditPlans(),
  };
}

function fromApi(machine: CardMachine): CardMachineForm {
  return {
    id: machine.id,
    name: machine.name,
    brand: machine.brand ?? "TODAS",
    anticipationRate: rateToDisplay(machine.anticipationRate),
    debitRate: rateToDisplay(machine.debitRate),
    creditPlans: machine.creditPlans.map((plan) => ({
      rate: rateToDisplay(plan.rate),
      passFeeToCustomer: plan.passFeeToCustomer,
    })),
  };
}

function formatPercent(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MaquininhaFormScreen({ machineId }: { machineId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<CardMachineForm>(emptyForm());
  const [loading, setLoading] = useState(Boolean(machineId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"sale" | "net">("sale");
  const [kind, setKind] = useState<"debit" | string>("1");

  useEffect(() => {
    if (!machineId) return;
    void apiFetch<CardMachine[]>("/card-machine")
      .then((list) => {
        const machine = list.find((item) => item.id === machineId);
        if (!machine) {
          setError("Maquininha não encontrada.");
          return;
        }
        setForm(fromApi(machine));
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Erro ao carregar."),
      )
      .finally(() => setLoading(false));
  }, [machineId]);

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Dê um nome pra maquininha (ex.: Stone balcão).");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      brand: form.brand,
      anticipationRate: rateToApi(form.anticipationRate),
      debitRate: rateToApi(form.debitRate),
      creditPlans: form.creditPlans.map((plan) => ({
        rate: rateToApi(plan.rate),
        passFeeToCustomer: plan.passFeeToCustomer,
      })),
    };
    try {
      if (form.id) {
        await apiFetch<CardMachine>(`/card-machine/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch<CardMachine>("/card-machine", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      router.push("/painel/maquininha");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao salvar a maquininha.",
      );
    } finally {
      setSaving(false);
    }
  }

  const calcRates = {
    anticipationRate: form.anticipationRate,
    debitRate: form.debitRate,
    creditPlans: form.creditPlans,
  };
  const kindKey: "debit" | number = kind === "debit" ? "debit" : Number(kind);
  const feePercent = totalFeePercent(calcRates, kindKey);
  const feeOnCustomer = passesFeeToCustomer(calcRates, kindKey);
  const saleValue = Number(amount) || 0;
  const result = useMemo(() => {
    if (saleValue <= 0) return null;
    if (feeOnCustomer || mode === "net") {
      const { charge, fee } = chargeToReceive(saleValue, feePercent);
      return { charge, fee, net: saleValue };
    }
    const { fee, net } = netFromSale(saleValue, feePercent);
    return { charge: saleValue, fee, net };
  }, [saleValue, mode, feePercent, feeOnCustomer]);

  const title = machineId ? "Editar maquininha" : "Nova maquininha";

  return (
    <div>
      <PageHeader
        title={title}
        description="Taxa de 1x a 12x e quem paga o juros em cada parcela."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href="/painel/maquininha" />}
            >
              Voltar
            </Button>
            <Button
              onClick={() => void handleSave()}
              disabled={saving || loading}
            >
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </div>
        }
      />
      <PageBody className="flex flex-col gap-6">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : (
          <>
            <Card className="p-5">
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="machine-name">Nome</Label>
                  <Input
                    id="machine-name"
                    placeholder="Stone balcão, InterPag delivery…"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="machine-brand">Bandeira</Label>
                  <Select
                    value={form.brand}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        brand: (value ?? "TODAS") as CardMachineForm["brand"],
                      }))
                    }
                  >
                    <SelectTrigger id="machine-brand">
                      <SelectValue>
                        {(value: string) =>
                          CARD_BRANDS.find((item) => item.value === value)
                            ?.label ?? "Todas"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CARD_BRANDS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="anticipation">Antecipação (%)</Label>
                  <Input
                    id="anticipation"
                    inputMode="decimal"
                    value={form.anticipationRate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        anticipationRate: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="mb-4">
                <RateField
                  id="debit"
                  label="Débito (%)"
                  value={form.debitRate}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, debitRate: value }))
                  }
                />
              </div>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Crédito 1x a 12x</p>
                  <p className="text-xs text-muted-foreground">
                    Sem juros numa parcela marca as anteriores. No cliente marca
                    as seguintes.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Esta máquina: {interestFreeLabel(form.creditPlans)}
                </p>
              </div>
              <CreditPlansTable
                plans={form.creditPlans}
                onRateChange={(index, rate) =>
                  setForm((current) => ({
                    ...current,
                    creditPlans: current.creditPlans.map((item, i) =>
                      i === index ? { ...item, rate } : item,
                    ),
                  }))
                }
                onFeeChange={(index, passFeeToCustomer) =>
                  setForm((current) => ({
                    ...current,
                    creditPlans: applyFeeCutoff(
                      current.creditPlans,
                      index,
                      passFeeToCustomer,
                    ),
                  }))
                }
              />
            </Card>

            <Card className="p-5">
              <h2 className="mb-4 text-sm font-medium">Calculadora</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="calc-mode">Eu sei o</Label>
                  <Select
                    value={mode}
                    onValueChange={(value) =>
                      setMode((value ?? "sale") as "sale" | "net")
                    }
                  >
                    <SelectTrigger id="calc-mode">
                      <SelectValue>
                        {(value: "sale" | "net") =>
                          value === "net" ? "Valor a receber" : "Valor cobrado"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">Valor cobrado</SelectItem>
                      <SelectItem value="net">Valor a receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="calc-amount">Valor</Label>
                  <MoneyInput
                    id="calc-amount"
                    value={amount}
                    onChange={setAmount}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="calc-kind">Forma</Label>
                  <Select
                    value={kind}
                    onValueChange={(value) => setKind(value ?? "1")}
                  >
                    <SelectTrigger id="calc-kind">
                      <SelectValue>
                        {(value: string) =>
                          value === "debit" ? "Débito" : `Crédito ${value}x`
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Débito</SelectItem>
                      {Array.from({ length: 12 }, (_, index) => index + 1).map(
                        (n) => (
                          <SelectItem key={n} value={String(n)}>
                            Crédito {n}x ·{" "}
                            {form.creditPlans[n - 1]?.passFeeToCustomer
                              ? "taxa no cliente"
                              : "sem juros"}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {result ? (
                <dl className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Taxa total</dt>
                    <dd className="text-lg font-medium tabular-nums">
                      {formatPercent(feePercent)}%
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        ({formatPercent(brandRate(calcRates, kindKey))} +{" "}
                        {formatPercent(parseRate(form.anticipationRate))})
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Operadora leva
                    </dt>
                    <dd className="text-lg font-medium tabular-nums">
                      {formatBRL(result.fee)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {feeOnCustomer || mode === "net"
                        ? "Cobrar na maquininha"
                        : "Cai na conta"}
                    </dt>
                    <dd className="font-heading text-2xl leading-none tabular-nums">
                      {formatBRL(
                        feeOnCustomer || mode === "net"
                          ? result.charge
                          : result.net,
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Informe um valor para ver o desconto da operadora.
                </p>
              )}
            </Card>
          </>
        )}
      </PageBody>
    </div>
  );
}

function CreditPlansTable({
  plans,
  onRateChange,
  onFeeChange,
}: {
  plans: CardMachineForm["creditPlans"];
  onRateChange: (index: number, rate: string) => void;
  onFeeChange: (index: number, passFeeToCustomer: boolean) => void;
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-2">
      <PlanSlice
        plans={plans}
        start={0}
        end={6}
        onRateChange={onRateChange}
        onFeeChange={onFeeChange}
      />
      <PlanSlice
        plans={plans}
        start={6}
        end={12}
        onRateChange={onRateChange}
        onFeeChange={onFeeChange}
      />
    </div>
  );
}

function PlanSlice({
  plans,
  start,
  end,
  onRateChange,
  onFeeChange,
}: {
  plans: CardMachineForm["creditPlans"];
  start: number;
  end: number;
  onRateChange: (index: number, rate: string) => void;
  onFeeChange: (index: number, passFeeToCustomer: boolean) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Parcela</TableHead>
          <TableHead className="w-28">Taxa (%)</TableHead>
          <TableHead>Juros</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.slice(start, end).map((plan, offset) => {
          const index = start + offset;
          const n = index + 1;
          return (
            <TableRow key={n} className="hover:bg-transparent">
              <TableCell className="py-1.5 font-medium tabular-nums">
                {n}x
              </TableCell>
              <TableCell className="py-1.5">
                <Input
                  id={`c${n}`}
                  inputMode="decimal"
                  aria-label={`Taxa da ${n}x`}
                  value={plan.rate}
                  onChange={(event) => onRateChange(index, event.target.value)}
                  className="h-8 w-20 text-right tabular-nums"
                />
              </TableCell>
              <TableCell className="py-1.5">
                <div
                  className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
                  role="group"
                  aria-label={`Quem paga o juros da ${n}x`}
                >
                  <button
                    type="button"
                    aria-pressed={!plan.passFeeToCustomer}
                    onClick={() => onFeeChange(index, false)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      !plan.passFeeToCustomer
                        ? "bg-success text-success-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    Sem juros
                  </button>
                  <button
                    type="button"
                    aria-pressed={plan.passFeeToCustomer}
                    onClick={() => onFeeChange(index, true)}
                    className={cn(
                      "rounded-md px-2 py-1 text-xs transition-colors",
                      plan.passFeeToCustomer
                        ? "bg-warning text-warning-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    No cliente
                  </button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function RateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
