"use client";

import { useEffect, useRef, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoneyInput } from "@/components/money-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, ApiError } from "@/lib/api-client";
import { useHasModule } from "@/lib/modules-context";
import { CaixaReportTab } from "./caixa-report-tab";
import type {
  CashRegisterItem,
  CashRegisterOverview,
  CashRegisterPaymentMethod,
  CashRegisterSale,
  CashRegistersPage,
  DreReport,
  SalesByEmployeeRow,
  SalesByProductReport,
} from "./types";

const PAYMENT_LABELS: Record<CashRegisterPaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  PIX: "PIX",
};

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function monthAgoIso() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
}

export function FinanceiroScreen({
  canManageAllRegisters = false,
  canSeeCost = false,
}: {
  canManageAllRegisters?: boolean;
  canSeeCost?: boolean;
}) {
  const hasFinanceiro = useHasModule("financeiro");
  const showTabs = canManageAllRegisters || hasFinanceiro;
  const [tab, setTab] = useState("caixa");

  // --- Caixa (T5.1/T5.2) ---
  const [current, setCurrent] = useState<CashRegisterItem | null>(null);
  const [overview, setOverview] = useState<CashRegisterOverview | null>(null);
  const [history, setHistory] = useState<CashRegistersPage | null>(null);
  const [historyDetail, setHistoryDetail] = useState<CashRegisterItem | null>(
    null,
  );
  const [closingRegisterId, setClosingRegisterId] = useState<string | null>(null);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");
  const [cashError, setCashError] = useState<string | null>(null);
  const [cashSaving, setCashSaving] = useState(false);

  // Contador de sequência (achado escrevendo o e2e Playwright deste
  // fluxo, T5.2/T5.6): o efeito de montagem e as ações de abrir/fechar
  // caixa disparam `reloadCaixa()` em momentos diferentes, mas as
  // respostas podem chegar fora de ordem (mais visível em dev por causa
  // do double-invoke do Strict Mode, mas é uma corrida de verdade —
  // qualquer requisição lenta na montagem pode voltar DEPOIS de uma ação
  // do usuário e sobrescrever o estado recém-atualizado com dado velho).
  // Só a resposta da chamada mais recente é aplicada.
  const reloadSeq = useRef(0);

  async function reloadCaixa() {
    const seq = ++reloadSeq.current;
    const [currentData, historyData, overviewData] = await Promise.all([
      apiFetch<CashRegisterItem | null>("/cash-register/current"),
      apiFetch<CashRegistersPage>("/cash-register?pageSize=10"),
      canManageAllRegisters
        ? apiFetch<CashRegisterOverview>("/cash-register/overview")
        : Promise.resolve(null),
    ]);
    if (seq !== reloadSeq.current) return;
    setCurrent(currentData);
    setHistory(historyData);
    setOverview(overviewData);
    setHistoryDetail(null);
  }

  useEffect(() => {
    void reloadCaixa();
  }, []);

  async function handleOpenCaixa() {
    setCashSaving(true);
    setCashError(null);
    try {
      await apiFetch("/cash-register/open", {
        method: "POST",
        body: JSON.stringify({ openingAmount }),
      });
      setOpenDialogOpen(false);
      setOpeningAmount("");
      await reloadCaixa();
    } catch (err) {
      setCashError(err instanceof ApiError ? err.message : "Erro ao abrir caixa.");
    } finally {
      setCashSaving(false);
    }
  }

  async function handleCloseCaixa() {
    const targetId = closingRegisterId ?? current?.id;
    if (!targetId) return;
    setCashSaving(true);
    setCashError(null);
    try {
      await apiFetch(`/cash-register/${targetId}/close`, {
        method: "POST",
        body: JSON.stringify({ closingAmount }),
      });
      setCloseDialogOpen(false);
      setClosingAmount("");
      setClosingRegisterId(null);
      await reloadCaixa();
    } catch (err) {
      setCashError(err instanceof ApiError ? err.message : "Erro ao fechar caixa.");
    } finally {
      setCashSaving(false);
    }
  }

  function openCloseDialog(registerId: string) {
    setClosingRegisterId(registerId);
    setClosingAmount("");
    setCashError(null);
    setCloseDialogOpen(true);
  }

  // --- Demonstrativo / DRE (T5.5) ---
  const [dreFrom, setDreFrom] = useState(monthAgoIso());
  const [dreTo, setDreTo] = useState(todayIso());
  const [dre, setDre] = useState<DreReport | null>(null);

  useEffect(() => {
    if (tab !== "demonstrativo") return;
    void apiFetch<DreReport>(`/reports/dre?from=${dreFrom}&to=${dreTo}`).then(setDre);
  }, [tab, dreFrom, dreTo]);

  // --- Relatórios (T5.3/T5.4) ---
  const [reportFrom, setReportFrom] = useState(monthAgoIso());
  const [reportTo, setReportTo] = useState(todayIso());
  const [byProduct, setByProduct] = useState<SalesByProductReport | null>(null);
  const [byEmployee, setByEmployee] = useState<SalesByEmployeeRow[]>([]);

  useEffect(() => {
    if (tab !== "relatorios") return;
    void apiFetch<SalesByProductReport>(
      `/reports/sales-by-product?from=${reportFrom}&to=${reportTo}`,
    ).then(setByProduct);
    void apiFetch<SalesByEmployeeRow[]>(
      `/reports/sales-by-employee?from=${reportFrom}&to=${reportTo}`,
    ).then(setByEmployee);
  }, [tab, reportFrom, reportTo]);

  return (
    <div>
      <PageHeader
        title="Caixa"
        description={
          canManageAllRegisters
            ? "Abertura, fechamento e relatório de vendas do período."
            : hasFinanceiro
              ? "Caixa do dia, demonstrativo e relatórios de vendas."
              : "Abertura, fechamento e movimento do caixa do dia."
        }
      />

      <PageBody>
      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        {showTabs ? (
        <PageToolbar>
          <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
            <TabsTrigger value="caixa">Caixa</TabsTrigger>
            {canManageAllRegisters && (
              <TabsTrigger value="relatorio">Relatório</TabsTrigger>
            )}
            {hasFinanceiro && (
              <>
                <TabsTrigger value="demonstrativo">Demonstrativo</TabsTrigger>
                <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
              </>
            )}
          </TabsList>
        </PageToolbar>
        ) : null}

        <TabsContent value="caixa" className="mt-4">
          {canManageAllRegisters && overview && (
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Caixas abertos
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {overview.openCount}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Soma das aberturas
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCurrency(overview.openingTotal)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Vendido nos caixas
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCurrency(overview.salesTotal ?? overview.cashSalesTotal)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Dinheiro na gaveta
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCurrency(overview.cashSalesTotal)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">
                    Esperado nas gavetas
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCurrency(overview.expectedTotal)}
                </CardContent>
              </Card>
            </div>
          )}

          {canManageAllRegisters && overview && overview.registers.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 font-heading text-lg">Caixas abertos agora</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {overview.registers.map((register) => (
                  <Card key={register.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">
                        {register.responsavel.name}
                      </CardTitle>
                      <Badge className="bg-success text-success-foreground">
                        aberto
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-1 text-sm">
                      <p>Abertura: {formatCurrency(register.openingAmount)}</p>
                      <p>
                        Vendido: {formatCurrency(register.totalSales ?? "0")}{" "}
                        ({register.salesCount ?? 0}{" "}
                        {(register.salesCount ?? 0) === 1
                          ? "pedido"
                          : "pedidos"}
                        )
                      </p>
                      <p>Dinheiro: {formatCurrency(register.cashSales)}</p>
                      <p>
                        PIX: {formatCurrency(register.pixSales ?? "0")} · Cartão:{" "}
                        {formatCurrency(register.cardSales ?? "0")}
                      </p>
                      <p>Esperado na gaveta: {formatCurrency(register.expectedNow)}</p>
                      <p className="text-muted-foreground">
                        Aberto em{" "}
                        {new Date(register.openedAt).toLocaleString("pt-BR")}
                      </p>
                      <RegisterSalesTable sales={register.sales ?? []} />
                      <Button
                        className="mt-2 w-fit"
                        onClick={() => openCloseDialog(register.id)}
                      >
                        Fechar este caixa
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Meu caixa</CardTitle>
                {current && (
                  <Badge className="bg-success text-success-foreground">aberto</Badge>
                )}
              </CardHeader>
              <CardContent>
                {current ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <p>Responsável: {current.responsavel.name}</p>
                    <p>Abertura: {formatCurrency(current.openingAmount)}</p>
                    <p>
                      Vendido: {formatCurrency(current.totalSales ?? "0")}{" "}
                      ({current.salesCount ?? 0}{" "}
                      {(current.salesCount ?? 0) === 1 ? "pedido" : "pedidos"})
                    </p>
                    <p>
                      Dinheiro: {formatCurrency(current.cashSales ?? "0")} · PIX:{" "}
                      {formatCurrency(current.pixSales ?? "0")} · Cartão:{" "}
                      {formatCurrency(current.cardSales ?? "0")}
                    </p>
                    <p>
                      Aberto em: {new Date(current.openedAt).toLocaleString("pt-BR")}
                    </p>
                    <p className="text-muted-foreground">
                      Todo pedido cobrado neste caixa entra aqui, em qualquer
                      forma de pagamento. O esperado da gaveta soma só o
                      dinheiro.
                    </p>
                    <Button
                      className="mt-2 w-fit"
                      onClick={() => openCloseDialog(current.id)}
                    >
                      Fechar meu caixa
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 text-sm">
                    <p className="text-muted-foreground">
                      Seu caixa está fechado. Abra o caixa para cobrar pedidos
                      — cada pagamento fica registrado nesta gaveta.
                    </p>
                    <Button className="w-fit" onClick={() => setOpenDialogOpen(true)}>
                      Abrir meu caixa
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            {current && (
              <div>
                <h2 className="mb-3 font-heading text-lg">
                  Pedidos deste caixa
                </h2>
                <RegisterSalesTable sales={current.sales ?? []} />
              </div>
            )}
          </div>

          <h2 className="mt-6 mb-3 font-heading text-lg">Histórico</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Abertura</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Esperado</TableHead>
                <TableHead>Diferença</TableHead>
                <TableHead>Aberto em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history?.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => {
                    void apiFetch<CashRegisterItem>(
                      `/cash-register/${item.id}`,
                    ).then(setHistoryDetail);
                  }}
                >
                  <TableCell>
                    <Badge
                      className={
                        item.status === "ABERTO"
                          ? "bg-success text-success-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }
                    >
                      {item.status === "ABERTO" ? "aberto" : "fechado"}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.responsavel.name}</TableCell>
                  <TableCell>{formatCurrency(item.openingAmount)}</TableCell>
                  <TableCell>
                    {item.closingAmount ? formatCurrency(item.closingAmount) : "—"}
                  </TableCell>
                  <TableCell>
                    {item.expectedAmount ? formatCurrency(item.expectedAmount) : "—"}
                  </TableCell>
                  <TableCell>
                    {item.difference ? formatCurrency(item.difference) : "—"}
                  </TableCell>
                  <TableCell>
                    {new Date(item.openedAt).toLocaleString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {historyDetail && (
            <div className="mt-4">
              <h3 className="mb-2 font-heading text-base">
                Pedidos do caixa de {historyDetail.responsavel.name}
                {" · "}
                {new Date(historyDetail.openedAt).toLocaleString("pt-BR")}
              </h3>
              <RegisterSalesTable sales={historyDetail.sales ?? []} />
            </div>
          )}
        </TabsContent>

        {canManageAllRegisters && (
          <TabsContent value="relatorio" className="mt-4">
            <CaixaReportTab canSeeCost={canSeeCost} />
          </TabsContent>
        )}

        <TabsContent value="demonstrativo" className="mt-4">
          <PageToolbar>
            <div>
              <Label htmlFor="dre-from" className="text-sm">
                De
              </Label>
              <Input
                id="dre-from"
                type="date"
                value={dreFrom}
                onChange={(e) => setDreFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dre-to" className="text-sm">
                Até
              </Label>
              <Input
                id="dre-to"
                type="date"
                value={dreTo}
                onChange={(e) => setDreTo(e.target.value)}
              />
            </div>
          </PageToolbar>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Receita</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {dre ? formatCurrency(dre.revenue) : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                {/* CMV, não "despesas" (design handoff mostra um card
                    genérico de despesas — o sistema não modela despesas
                    gerais, só custo de produto vendido, T5.5). */}
                <CardTitle className="text-sm text-muted-foreground">CMV</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {dre ? formatCurrency(dre.cogs) : "—"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Margem</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {dre ? formatCurrency(dre.margin) : "—"}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="relatorios" className="mt-4">
          <PageToolbar>
            <div>
              <Label htmlFor="report-from" className="text-sm">
                De
              </Label>
              <Input
                id="report-from"
                type="date"
                value={reportFrom}
                onChange={(e) => setReportFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="report-to" className="text-sm">
                Até
              </Label>
              <Input
                id="report-to"
                type="date"
                value={reportTo}
                onChange={(e) => setReportTo(e.target.value)}
              />
            </div>
          </PageToolbar>

          <h2 className="mb-3 font-heading text-lg">Vendas por produto</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byProduct?.byProduct.map((row) => (
                <TableRow key={row.productId}>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{row.quantitySold}</TableCell>
                  <TableCell>{formatCurrency(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {byProduct && (
            <p className="mt-2 text-sm text-muted-foreground">
              Total do período: {formatCurrency(byProduct.totalRevenue)}
            </p>
          )}

          <h2 className="mt-6 mb-3 font-heading text-lg">Vendas por funcionário</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendedor</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byEmployee.map((row) => (
                <TableRow key={row.vendedorId}>
                  <TableCell>{row.vendedorName}</TableCell>
                  <TableCell>{row.salesCount}</TableCell>
                  <TableCell>{formatCurrency(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caixa</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 px-4">
            <Label htmlFor="opening-amount">Valor de abertura</Label>
            <MoneyInput
              id="opening-amount"
              value={openingAmount}
              onChange={setOpeningAmount}
            />
          </div>
          {cashError && (
            <p className="px-4 text-sm text-destructive">{cashError}</p>
          )}
          <DialogFooter>
            <Button
              onClick={() => void handleOpenCaixa()}
              disabled={cashSaving || !openingAmount}
            >
              Abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 px-4">
            <Label htmlFor="closing-amount">Valor contado na gaveta</Label>
            <MoneyInput
              id="closing-amount"
              value={closingAmount}
              onChange={setClosingAmount}
            />
          </div>
          {cashError && (
            <p className="px-4 text-sm text-destructive">{cashError}</p>
          )}
          <DialogFooter>
            <Button
              onClick={() => void handleCloseCaixa()}
              disabled={cashSaving || !closingAmount}
            >
              Confirmar fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </PageBody>
    </div>
  );
}

function RegisterSalesTable({ sales }: { sales: CashRegisterSale[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>Vendedor</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Pago em</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales.length ? (
          sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell>#{sale.number}</TableCell>
              <TableCell>{sale.vendedor.name}</TableCell>
              <TableCell>
                {sale.paymentMethod
                  ? PAYMENT_LABELS[sale.paymentMethod]
                  : "—"}
              </TableCell>
              <TableCell>{formatCurrency(sale.total)}</TableCell>
              <TableCell>
                {sale.paidAt
                  ? new Date(sale.paidAt).toLocaleString("pt-BR")
                  : "—"}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-muted-foreground">
              Nenhum pedido cobrado neste caixa.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
