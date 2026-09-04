"use client";

import { useEffect, useMemo, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, ApiError } from "@/lib/api-client";
import {
  brandRate,
  chargeToReceive,
  formatBRL,
  netFromSale,
  parseRate,
  totalFeePercent,
} from "@/lib/card-machine";
import type { CardMachineConfig } from "./types";

const EMPTY: CardMachineConfig = {
  id: null,
  acquirerName: "InterPag",
  anticipationRate: "1,90",
  debitRate: "1,35",
  credit1xRate: "1,46",
  credit2to6Rate: "2,98",
  credit7to12Rate: "2,45",
};

/** API devolve `"1.90"` — exibe `"1,90"` (pt-BR). */
function rateToDisplay(value: string): string {
  return value.replace(".", ",");
}

/** Volta pro formato da API (`"1,90"` → `"1.90"`). */
function rateToApi(value: string): string {
  return value.replace(",", ".");
}

function formatPercent(value: number): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function MaquininhaScreen() {
  const [form, setForm] = useState<CardMachineConfig>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"sale" | "net">("sale");
  const [kind, setKind] = useState<"debit" | string>("1");

  useEffect(() => {
    void apiFetch<CardMachineConfig>("/card-machine").then((config) =>
      setForm({
        ...config,
        anticipationRate: rateToDisplay(config.anticipationRate),
        debitRate: rateToDisplay(config.debitRate),
        credit1xRate: rateToDisplay(config.credit1xRate),
        credit2to6Rate: rateToDisplay(config.credit2to6Rate),
        credit7to12Rate: rateToDisplay(config.credit7to12Rate),
      }),
    );
  }, []);

  function setRate(field: keyof CardMachineConfig, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const savedConfig = await apiFetch<CardMachineConfig>("/card-machine", {
        method: "PUT",
        body: JSON.stringify({
          acquirerName: form.acquirerName,
          anticipationRate: rateToApi(form.anticipationRate),
          debitRate: rateToApi(form.debitRate),
          credit1xRate: rateToApi(form.credit1xRate),
          credit2to6Rate: rateToApi(form.credit2to6Rate),
          credit7to12Rate: rateToApi(form.credit7to12Rate),
        }),
      });
      setForm({
        ...savedConfig,
        anticipationRate: rateToDisplay(savedConfig.anticipationRate),
        debitRate: rateToDisplay(savedConfig.debitRate),
        credit1xRate: rateToDisplay(savedConfig.credit1xRate),
        credit2to6Rate: rateToDisplay(savedConfig.credit2to6Rate),
        credit7to12Rate: rateToDisplay(savedConfig.credit7to12Rate),
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao salvar as taxas.",
      );
    } finally {
      setSaving(false);
    }
  }

  const kindKey: "debit" | number = kind === "debit" ? "debit" : Number(kind);
  const feePercent = totalFeePercent(form, kindKey);
  const saleValue = Number(amount) || 0;
  const result = useMemo(() => {
    if (saleValue <= 0) return null;
    if (mode === "net") {
      const { charge, fee } = chargeToReceive(saleValue, feePercent);
      return { charge, fee, net: saleValue };
    }
    const { fee, net } = netFromSale(saleValue, feePercent);
    return { charge: saleValue, fee, net };
  }, [saleValue, mode, feePercent]);

  return (
    <div>
      <PageHeader
        title="Maquininha"
        description="Taxas da operadora e o que sobra depois do desconto — pra conferir se o cartão bateu com o combinado."
        actions={
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Salvando…" : "Salvar taxas"}
          </Button>
        }
      />
      <PageBody className="flex flex-col gap-6">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="text-sm text-muted-foreground">Taxas salvas.</p>
        ) : null}

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium">Taxas da operadora</h2>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acquirer">Operadora</Label>
              <Input
                id="acquirer"
                value={form.acquirerName}
                onChange={(event) =>
                  setRate("acquirerName", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="anticipation">Antecipação (%)</Label>
              <Input
                id="anticipation"
                inputMode="decimal"
                value={form.anticipationRate}
                onChange={(event) =>
                  setRate("anticipationRate", event.target.value)
                }
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RateField
              id="debit"
              label="Débito (%)"
              value={form.debitRate}
              onChange={(value) => setRate("debitRate", value)}
            />
            <RateField
              id="c1"
              label="Crédito 1x (%)"
              value={form.credit1xRate}
              onChange={(value) => setRate("credit1xRate", value)}
            />
            <RateField
              id="c26"
              label="Crédito 2x a 6x (%)"
              value={form.credit2to6Rate}
              onChange={(value) => setRate("credit2to6Rate", value)}
            />
            <RateField
              id="c712"
              label="Crédito 7x a 12x (%)"
              value={form.credit7to12Rate}
              onChange={(value) => setRate("credit7to12Rate", value)}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Visa, Mastercard e Elo usam a mesma faixa. Antecipação entra em
            toda venda no cartão. Amex não tem débito.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-medium">Calculadora</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="calc-mode">Eu sei o</Label>
              <Select
                value={mode}
                onValueChange={(value) => setMode((value ?? "sale") as "sale" | "net")}
              >
                <SelectTrigger id="calc-mode">
                  <SelectValue>
                    {(value: "sale" | "net") =>
                      value === "net" ? "Valor a receber" : "Valor cobrado"}
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
                      value === "debit" ? "Débito" : `Crédito ${value}x`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Débito</SelectItem>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (n) => (
                      <SelectItem key={n} value={String(n)}>
                        Crédito {n}x
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
                    ({formatPercent(brandRate(form, kindKey))} +{" "}
                    {formatPercent(parseRate(form.anticipationRate))})
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Operadora leva</dt>
                <dd className="text-lg font-medium tabular-nums">
                  {formatBRL(result.fee)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {mode === "net" ? "Cobrar na maquininha" : "Cai na conta"}
                </dt>
                <dd className="font-heading text-2xl leading-none tabular-nums">
                  {formatBRL(mode === "net" ? result.charge : result.net)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Informe um valor para ver o desconto da operadora.
            </p>
          )}
        </Card>
      </PageBody>
    </div>
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
