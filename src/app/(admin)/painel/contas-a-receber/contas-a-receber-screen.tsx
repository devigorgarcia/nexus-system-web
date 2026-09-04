"use client";

import { useEffect, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, alertApiError } from "@/lib/api-client";
import type { ReceivablesPage } from "./types";

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

const PAYMENT_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_DEBITO: "Débito",
  CARTAO_CREDITO: "Crédito",
};

export function ContasAReceberScreen() {
  const [page, setPage] = useState<ReceivablesPage | null>(null);

  async function reload() {
    const data = await apiFetch<ReceivablesPage>(
      "/accounts-receivable?page=1&pageSize=50",
    );
    setPage(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function confirmReceipt(id: string) {
    try {
      await apiFetch(`/accounts-receivable/${id}/receive`, { method: "POST" });
      await reload();
    } catch (error) {
      alertApiError(error, "Erro ao confirmar recebimento.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Contas a receber"
        description="O valor cobrado, a taxa da maquininha e o que deve cair na conta. PIX e dinheiro não têm taxa."
      />
      <PageBody>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Venda</TableHead>
              <TableHead>Vendedor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Cobrado</TableHead>
              <TableHead>Taxa</TableHead>
              <TableHead>A cair</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page && page.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma conta a receber. Elas aparecem depois que um pedido é
                  cobrado.
                </TableCell>
              </TableRow>
            )}
            {page?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">
                  {item.sale.id.slice(0, 8)}
                </TableCell>
                <TableCell>{item.sale.vendedor.name}</TableCell>
                <TableCell>
                  {item.sale.paymentMethod
                    ? `${PAYMENT_LABEL[item.sale.paymentMethod] ?? item.sale.paymentMethod}${
                        item.sale.paymentMethod === "CARTAO_CREDITO" &&
                        item.sale.installments &&
                        item.sale.installments > 1
                          ? ` ${item.sale.installments}x`
                          : ""
                      }`
                    : "—"}
                </TableCell>
                <TableCell>
                  {item.sale.installments && item.sale.installments > 1
                    ? formatCurrency(
                        Number(item.amount) / item.sale.installments,
                      )
                    : "—"}
                </TableCell>
                <TableCell>{formatCurrency(item.amount)}</TableCell>
                <TableCell>
                  {Number(item.feeAmount) > 0
                    ? formatCurrency(item.feeAmount)
                    : "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(item.netAmount || item.amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      item.status === "RECEBIDO" ? "secondary" : "outline"
                    }
                  >
                    {item.status === "RECEBIDO" ? "Recebida" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {item.status === "PENDENTE" ? (
                    <Button size="sm" onClick={() => void confirmReceipt(item.id)}>
                      Confirmar recebimento
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {item.receivedAt
                        ? new Date(item.receivedAt).toLocaleDateString("pt-BR")
                        : "—"}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PageBody>
    </div>
  );
}
