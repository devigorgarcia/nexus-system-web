"use client";

import { FileDown } from "lucide-react";
import { useEffect, useState } from "react";
import { PageToolbar } from "@/components/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import { formatQuantityWithUnit } from "@/lib/unit-type";
import { downloadCashSalesReportPdf } from "./export-cash-report-pdf";
import type {
  AbcClass,
  CashSalesReport,
  CashSalesReportAbcBucket,
} from "./types";

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function toLocalDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftLocalDate(iso: string, days: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return toLocalDateInput(date);
}

function shiftLocalMonth(iso: string, months: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setMonth(date.getMonth() + months);
  return toLocalDateInput(date);
}

type ReportPreset = "dia" | "semana" | "mes" | "trimestre" | "semestre";

const PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "dia", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "trimestre", label: "3 meses" },
  { value: "semestre", label: "6 meses" },
];

const ABC_META: Record<
  AbcClass,
  {
    title: string;
    shareLabel: string;
    description: string;
    badge: "default" | "secondary" | "outline";
  }
> = {
  A: {
    title: "Classe A",
    shareLabel: "~80% do faturamento",
    description:
      "Poucos produtos. Controle rigoroso e reposição constante para não faltar.",
    badge: "default",
  },
  B: {
    title: "Classe B",
    shareLabel: "~15% a 18% do faturamento",
    description:
      "Importância intermediária. Monitoramento regular, sem o rigor da A.",
    badge: "secondary",
  },
  C: {
    title: "Classe C",
    shareLabel: "~2% a 5% do faturamento",
    description:
      "Maior quantidade de itens. Controle simples para não deixar capital parado.",
    badge: "outline",
  },
};

function formatPercent(value: string) {
  return `${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function rangeForPreset(value: ReportPreset) {
  const now = toLocalDateInput(new Date());
  if (value === "dia") return { from: now, to: now };
  if (value === "semana") return { from: shiftLocalDate(now, -7), to: now };
  if (value === "mes") return { from: shiftLocalMonth(now, -1), to: now };
  if (value === "trimestre") return { from: shiftLocalMonth(now, -3), to: now };
  return { from: shiftLocalMonth(now, -6), to: now };
}

export function CaixaReportTab({ canSeeCost }: { canSeeCost: boolean }) {
  const initialRange = rangeForPreset("trimestre");
  const [preset, setPreset] = useState<ReportPreset | null>("trimestre");
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [report, setReport] = useState<CashSalesReport | null>(null);

  function applyPreset(value: ReportPreset) {
    const range = rangeForPreset(value);
    setPreset(value);
    setFrom(range.from);
    setTo(range.to);
  }

  useEffect(() => {
    if (!from || !to || from > to) return;
    void apiFetch<CashSalesReport>(
      `/cash-register/sales-report?from=${from}&to=${to}`,
    ).then(setReport);
  }, [from, to]);

  return (
    <div className="flex flex-col gap-4">
      <PageToolbar>
        <div className="flex w-full gap-1 rounded-lg bg-muted p-1 sm:w-fit">
          {PRESETS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={preset === item.value ? "default" : "ghost"}
              className="flex-1 sm:flex-none"
              onClick={() => applyPreset(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div>
          <Label htmlFor="caixa-report-from" className="text-sm">
            De
          </Label>
          <Input
            id="caixa-report-from"
            type="date"
            value={from}
            onChange={(event) => {
              setPreset(null);
              setFrom(event.target.value);
            }}
          />
        </div>
        <div>
          <Label htmlFor="caixa-report-to" className="text-sm">
            Até
          </Label>
          <Input
            id="caixa-report-to"
            type="date"
            value={to}
            onChange={(event) => {
              setPreset(null);
              setTo(event.target.value);
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="sm:ml-auto"
          disabled={!report}
          onClick={() => {
            if (report) void downloadCashSalesReportPdf(report, canSeeCost);
          }}
        >
          <FileDown data-icon="inline-start" />
          Exportar PDF
        </Button>
      </PageToolbar>

      <div
        className={`grid grid-cols-1 gap-3 ${canSeeCost ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Vendido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {report ? formatCurrency(report.totals.revenue) : "—"}
          </CardContent>
        </Card>
        {canSeeCost && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Custo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {report?.totals.cost
                  ? formatCurrency(report.totals.cost)
                  : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Lucro
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {report?.totals.profit
                  ? formatCurrency(report.totals.profit)
                  : "—"}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["A", "B", "C"] as const).map((abcClass) => (
          <AbcCard
            key={abcClass}
            abcClass={abcClass}
            bucket={report?.highlights.abc[abcClass]}
          />
        ))}
      </div>

      {canSeeCost && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <HighlightCard
            title="Mais lucro"
            name={report?.highlights.mostProfit?.productName}
            detail={
              report?.highlights.mostProfit?.profit
                ? formatCurrency(report.highlights.mostProfit.profit)
                : null
            }
          />
          <HighlightCard
            title="Menos lucro"
            name={report?.highlights.leastProfit?.productName}
            detail={
              report?.highlights.leastProfit?.profit
                ? formatCurrency(report.highlights.leastProfit.profit)
                : null
            }
          />
        </div>
      )}

      <div>
        <h2 className="mb-1 font-heading text-lg">Curva ABC</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Faturamento do período (quantidade × preço), do maior para o menor.
          A classe segue o percentual acumulado: A até 80%, B até 95% e C até
          100%.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ABC</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Saídas</TableHead>
              <TableHead>Faturamento</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Acumulado</TableHead>
              {canSeeCost && <TableHead>Custo</TableHead>}
              {canSeeCost && <TableHead>Lucro</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.products.length ? (
              report.products.map((row) => (
                <TableRow key={row.productId}>
                  <TableCell>
                    <Badge variant={ABC_META[row.abcClass].badge}>
                      {row.abcClass}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>
                    {formatQuantityWithUnit(row.quantitySold, row.unitType)}
                  </TableCell>
                  <TableCell>{formatCurrency(row.revenue)}</TableCell>
                  <TableCell>{formatPercent(row.revenueShare)}</TableCell>
                  <TableCell>{formatPercent(row.cumulativeShare)}</TableCell>
                  {canSeeCost && (
                    <TableCell>
                      {row.cost ? formatCurrency(row.cost) : "—"}
                    </TableCell>
                  )}
                  {canSeeCost && (
                    <TableCell>
                      {row.profit ? formatCurrency(row.profit) : "—"}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canSeeCost ? 8 : 6}
                  className="text-muted-foreground"
                >
                  Nenhuma venda paga neste período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AbcCard({
  abcClass,
  bucket,
}: {
  abcClass: AbcClass;
  bucket?: CashSalesReportAbcBucket;
}) {
  const meta = ABC_META[abcClass];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={meta.badge}>{abcClass}</Badge>
          {meta.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">
          {bucket ? formatCurrency(bucket.revenue) : "—"}
        </p>
        <p className="text-sm text-muted-foreground">
          {bucket
            ? `${bucket.productCount} ${bucket.productCount === 1 ? "produto" : "produtos"} · ${formatPercent(bucket.itemShare)} dos itens · ${formatPercent(bucket.share)} da receita`
            : meta.shareLabel}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{meta.description}</p>
      </CardContent>
    </Card>
  );
}

function HighlightCard({
  title,
  name,
  detail,
}: {
  title: string;
  name?: string;
  detail: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-medium">{name ?? "—"}</p>
        {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  );
}
