"use client";

import { useEffect, useState } from "react";
import { PageToolbar } from "@/components/page-toolbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api-client";
import type { CashSalesReport, CashSalesReportPeriod } from "./types";

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatQty(value: string) {
  return Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

const PERIODS: { value: CashSalesReportPeriod; label: string }[] = [
  { value: "dia", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

export function CaixaReportTab({ canSeeCost }: { canSeeCost: boolean }) {
  const [period, setPeriod] = useState<CashSalesReportPeriod>("dia");
  const [report, setReport] = useState<CashSalesReport | null>(null);

  useEffect(() => {
    void apiFetch<CashSalesReport>(
      `/cash-register/sales-report?period=${period}`,
    ).then(setReport);
  }, [period]);

  return (
    <div className="flex flex-col gap-4">
      <PageToolbar>
        <div className="flex w-full gap-1 rounded-lg bg-muted p-1 sm:w-fit">
          {PERIODS.map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={period === item.value ? "default" : "ghost"}
              className="flex-1 sm:flex-none"
              onClick={() => setPeriod(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <HighlightCard
          title="Mais saídas"
          name={report?.highlights.mostSold?.productName}
          detail={
            report?.highlights.mostSold
              ? `${formatQty(report.highlights.mostSold.quantitySold ?? "0")} un.`
              : null
          }
        />
        <HighlightCard
          title="Menos saídas"
          name={report?.highlights.leastSold?.productName}
          detail={
            report?.highlights.leastSold
              ? `${formatQty(report.highlights.leastSold.quantitySold ?? "0")} un.`
              : null
          }
        />
        {canSeeCost && (
          <>
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
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-heading text-lg">Tudo que foi vendido</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Saídas</TableHead>
              <TableHead>Venda</TableHead>
              {canSeeCost && <TableHead>Custo</TableHead>}
              {canSeeCost && <TableHead>Lucro</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {report?.products.length ? (
              report.products.map((row) => (
                <TableRow key={row.productId}>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{formatQty(row.quantitySold)}</TableCell>
                  <TableCell>{formatCurrency(row.revenue)}</TableCell>
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
                  colSpan={canSeeCost ? 5 : 3}
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
        {detail && (
          <p className="text-sm text-muted-foreground">{detail}</p>
        )}
      </CardContent>
    </Card>
  );
}
