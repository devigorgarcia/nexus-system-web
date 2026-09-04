"use client";

import { useEffect, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, ApiError } from "@/lib/api-client";
import type {
  ConfirmPaymentResult,
  PaymentMethod,
  SaleItemRecord,
  SalesPage,
} from "./types";

const PAGE_SIZE = 10;
const TODOS_STATUS = "__todos__";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusBadgeClass(status: "PENDENTE" | "PAGO") {
  return status === "PAGO"
    ? "bg-success text-success-foreground"
    : "bg-warning text-warning-foreground";
}

function saleTotal(sale: SaleItemRecord): number {
  return sale.items.reduce((sum, item) => sum + Number(item.subtotal), 0);
}

// Espelho client-side de `SalesService.installmentSurchargeRate()` — só pra
// mostrar o acréscimo "calculado e devolvido antes da confirmação final"
// (PRD §4.13) ANTES de confirmar; o valor final autoritativo sempre vem do
// backend na resposta de `confirm-payment`, nunca deste cálculo local.
function surchargeRate(installments: number): number {
  return installments <= 2 ? 0 : 0.03 * installments;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  PIX: "PIX",
};

export function PedidosScreen() {
  const [salesPage, setSalesPage] = useState<SalesPage | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const [chargeSale, setChargeSale] = useState<SaleItemRecord | null>(null);
  const [paymentKind, setPaymentKind] = useState<"DINHEIRO" | "CARTAO" | "PIX">(
    "DINHEIRO",
  );
  const [cardType, setCardType] = useState<"CREDITO" | "DEBITO">("DEBITO");
  const [installments, setInstallments] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<ConfirmPaymentResult | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<string | null>(null);

  // Reemissão de cupom (T4.9): pedido pago pode reabrir o cupom a qualquer
  // momento — os totais vêm prontos do `GET /sales/:id`, nunca recalculados
  // aqui.
  async function openReceipt(saleId: string) {
    setLoadingReceiptId(saleId);
    try {
      const data = await apiFetch<ConfirmPaymentResult>(`/sales/${saleId}`);
      setReceipt(data);
    } finally {
      setLoadingReceiptId(null);
    }
  }

  async function reload() {
    const params = new URLSearchParams({
      page: String(pageNum),
      pageSize: String(PAGE_SIZE),
    });
    if (statusFilter) params.set("status", statusFilter);
    const data = await apiFetch<SalesPage>(`/sales?${params.toString()}`);
    setSalesPage(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, statusFilter]);

  function openCharge(sale: SaleItemRecord) {
    setChargeSale(sale);
    setPaymentKind("DINHEIRO");
    setCardType("DEBITO");
    setInstallments(1);
    setConfirmError(null);
  }

  function resolvedPaymentMethod(): PaymentMethod {
    if (paymentKind === "PIX") return "PIX";
    if (paymentKind === "DINHEIRO") return "DINHEIRO";
    return cardType === "CREDITO" ? "CARTAO_CREDITO" : "CARTAO_DEBITO";
  }

  const chargeTotal = chargeSale ? saleTotal(chargeSale) : 0;
  const allowsInstallments = chargeTotal > 100;

  async function handleConfirmPayment() {
    if (!chargeSale) return;
    setConfirming(true);
    setConfirmError(null);
    try {
      const paymentMethod = resolvedPaymentMethod();
      const body: Record<string, unknown> = { paymentMethod };
      if (paymentMethod === "CARTAO_CREDITO") {
        body.installments = installments;
      }
      const result = await apiFetch<ConfirmPaymentResult>(
        `/sales/${chargeSale.id}/confirm-payment`,
        { method: "POST", body: JSON.stringify(body) },
      );
      setChargeSale(null);
      setReceipt(result);
      await reload();
    } catch (err) {
      setConfirmError(
        err instanceof ApiError ? err.message : "Erro ao confirmar pagamento.",
      );
    } finally {
      setConfirming(false);
    }
  }

  const totalPages = salesPage
    ? Math.max(1, Math.ceil(salesPage.total / salesPage.pageSize))
    : 1;

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Cobrar pedidos pendentes e conferir o histórico."
      />

      <PageBody>
      <PageToolbar>
        <Select
          value={statusFilter || undefined}
          onValueChange={(value) =>
            setStatusFilter(!value || value === TODOS_STATUS ? "" : value)
          }
        >
          <SelectTrigger
            size="sm"
            className="w-full sm:w-40"
            aria-label="Filtrar por status"
          >
            <SelectValue placeholder="Status">
              {(value: string | null) =>
                value === "PENDENTE"
                  ? "Pendente"
                  : value === "PAGO"
                    ? "Pago"
                    : value === TODOS_STATUS
                      ? "Todos"
                      : "Status"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_STATUS}>Todos</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="PAGO">Pago</SelectItem>
          </SelectContent>
        </Select>
      </PageToolbar>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Itens</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Horário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {salesPage?.items.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-mono text-xs">
                {sale.id.slice(0, 8)}
              </TableCell>
              <TableCell>{sale.items.length}</TableCell>
              <TableCell>{formatCurrency(saleTotal(sale))}</TableCell>
              <TableCell>{sale.customer?.name ?? "—"}</TableCell>
              <TableCell>{sale.vendedor.name}</TableCell>
              <TableCell>
                {sale.paymentMethod ? PAYMENT_LABELS[sale.paymentMethod] : "—"}
              </TableCell>
              <TableCell>
                {new Date(sale.createdAt).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(sale.status)}>
                  {sale.status === "PAGO" ? "pago" : "pendente"}
                </Badge>
              </TableCell>
              <TableCell>
                {sale.status === "PENDENTE" ? (
                  <Button size="sm" onClick={() => openCharge(sale)}>
                    Cobrar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={loadingReceiptId === sale.id}
                    onClick={() => openReceipt(sale.id)}
                  >
                    {loadingReceiptId === sale.id ? "Abrindo..." : "Cupom"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {salesPage && salesPage.total === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhum pedido encontrado.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={pageNum <= 1}
          onClick={() => setPageNum((p) => p - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {pageNum} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={pageNum >= totalPages}
          onClick={() => setPageNum((p) => p + 1)}
        >
          Próxima
        </Button>
      </div>

      <Sheet
        open={chargeSale !== null}
        onOpenChange={(open) => !open && setChargeSale(null)}
      >
        <SheetContent className="sm:max-w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Cobrar pedido</SheetTitle>
          </SheetHeader>

          {chargeSale && (
            <div className="flex flex-col gap-4 px-4">
              <ul className="flex flex-col gap-1 text-sm">
                {chargeSale.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>{formatCurrency(Number(item.subtotal))}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t pt-2 font-medium">
                <span>Total</span>
                <span>{formatCurrency(chargeTotal)}</span>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Forma de pagamento</p>
                <div className="flex gap-2">
                  {(["DINHEIRO", "CARTAO", "PIX"] as const).map((kind) => (
                    <Button
                      key={kind}
                      type="button"
                      size="sm"
                      variant={paymentKind === kind ? "default" : "outline"}
                      onClick={() => setPaymentKind(kind)}
                    >
                      {kind === "CARTAO" ? "Cartão" : kind === "PIX" ? "PIX" : "Dinheiro"}
                    </Button>
                  ))}
                </div>
              </div>

              {paymentKind === "CARTAO" && (
                <div>
                  <p className="mb-2 text-sm font-medium">Tipo de cartão</p>
                  <div className="flex gap-2">
                    {(["DEBITO", "CREDITO"] as const).map((type) => (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={cardType === type ? "default" : "outline"}
                        onClick={() => {
                          setCardType(type);
                          setInstallments(1);
                        }}
                      >
                        {type === "CREDITO" ? "Crédito" : "Débito"}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {paymentKind === "CARTAO" && cardType === "CREDITO" && (
                <div>
                  <p className="mb-2 text-sm font-medium">Parcelas</p>
                  <Select
                    value={String(installments)}
                    onValueChange={(value) => setInstallments(Number(value))}
                  >
                    <SelectTrigger aria-label="Número de parcelas">
                      <SelectValue>
                        {(value: string) => `${value}x`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(
                        { length: allowsInstallments ? 12 : 1 },
                        (_, i) => i + 1,
                      ).map((n) => {
                        const totalN =
                          chargeTotal * (1 + surchargeRate(n));
                        return (
                          <SelectItem key={n} value={String(n)}>
                            {n}x de {formatCurrency(totalN / n)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {!allowsInstallments && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Parcelamento só é permitido pra venda acima de R$100,00.
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {installments}x de{" "}
                    {formatCurrency(
                      (chargeTotal * (1 + surchargeRate(installments))) /
                        installments,
                    )}
                    {" — total "}
                    {formatCurrency(
                      chargeTotal * (1 + surchargeRate(installments)),
                    )}
                  </p>
                </div>
              )}

              {confirmError && (
                <p className="text-sm text-destructive">{confirmError}</p>
              )}
            </div>
          )}

          <SheetFooter>
            <Button onClick={handleConfirmPayment} disabled={confirming}>
              {confirming ? "Confirmando..." : "Confirmar pagamento"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={receipt !== null} onOpenChange={(open) => !open && setReceipt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cupom de venda</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div id="receipt-cupom" className="flex flex-col gap-4 font-mono text-xs">
              {["Via Cliente", "Via Loja"].map((copy) => (
                <div key={copy} className="border-b border-dashed pb-4 last:border-b-0">
                  <p className="mb-1 text-center font-semibold">
                    Nexus — {copy}
                  </p>
                  <p className="mb-2 text-center">
                    {new Date(receipt.paidAt ?? receipt.createdAt).toLocaleString(
                      "pt-BR",
                    )}
                  </p>
                  <div className="border-t border-dashed py-2">
                    {receipt.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.product.name} × {item.quantity}
                        </span>
                        <span>{formatCurrency(Number(item.subtotal))}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-dashed pt-2">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>{formatCurrency(Number(receipt.total))}</span>
                    </div>
                    {Number(receipt.totalWithSurcharge) !==
                      Number(receipt.total) && (
                      <div className="flex justify-between">
                        <span>Total c/ parcelamento</span>
                        <span>
                          {formatCurrency(Number(receipt.totalWithSurcharge))}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Pagamento</span>
                      <span>
                        {receipt.paymentMethod
                          ? PAYMENT_LABELS[receipt.paymentMethod]
                          : "—"}
                        {receipt.installments && receipt.installments > 1
                          ? ` ${receipt.installments}x de ${formatCurrency(
                              Number(receipt.totalWithSurcharge) /
                                receipt.installments,
                            )}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vendedor</span>
                      <span>{receipt.vendedor.name}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[10px] leading-tight text-muted-foreground">
                    *** Este documento não é um cupom fiscal ***
                  </p>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceipt(null)}>
              Fechar
            </Button>
            <Button onClick={() => window.print()}>Imprimir 2 vias</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </PageBody>
    </div>
  );
}
