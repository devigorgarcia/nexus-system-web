"use client";

import { useEffect, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { AccountingSummary } from "./types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthAgoIso() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

function money(value: string) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ContabilScreen() {
  const [from, setFrom] = useState(monthAgoIso);
  const [to, setTo] = useState(todayIso);
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload(nextFrom = from, nextTo = to) {
    setError(null);
    try {
      const data = await apiFetch<AccountingSummary>(
        `/fiscal/accounting?from=${nextFrom}&to=${nextTo}`,
      );
      setSummary(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao carregar o período.",
      );
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // carga inicial só
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCsv() {
    if (!summary) return;
    const rows = [
      ["campo", "valor"],
      ["de", summary.from],
      ["ate", summary.to],
      ["receita", summary.revenue],
      ["cmv", summary.cogs],
      ["margem", summary.margin],
      ["contas_pagar_criadas", summary.payablesCreated],
      ["contas_pagar_pagas", summary.payablesPaid],
      ["contas_pagar_abertas", summary.payablesPending],
      ["contas_receber_abertas", summary.receivablesOpen],
      ["contas_receber_recebidas", summary.receivablesReceived],
    ];
    const csv = rows.map((row) => row.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contabil-${summary.from}-${summary.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Contábil"
        description="Resumo do período: DRE, contas a pagar e contas a receber."
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!summary}>
            Exportar CSV
          </Button>
        }
      />
      <PageToolbar className="items-end">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contabil-from">De</Label>
          <Input
            id="contabil-from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contabil-to">Até</Label>
          <Input
            id="contabil-to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
        <Button onClick={() => void reload()}>Aplicar</Button>
      </PageToolbar>
      <PageBody className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {error && (
          <p className="text-sm text-destructive md:col-span-3" role="alert">
            {error}
          </p>
        )}
        <Card>
          <CardHeader>
            <CardTitle>DRE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Receita" value={summary?.revenue} />
            <Row label="CMV" value={summary?.cogs} />
            <Row label="Margem" value={summary?.margin} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contas a pagar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Criadas no período" value={summary?.payablesCreated} />
            <Row label="Pagas no período" value={summary?.payablesPaid} />
            <Row label="Em aberto" value={summary?.payablesPending} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contas a receber</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Recebidas no período" value={summary?.receivablesReceived} />
            <Row label="Em aberto no período" value={summary?.receivablesOpen} />
          </CardContent>
        </Card>
      </PageBody>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ? money(value) : "—"}</span>
    </div>
  );
}
