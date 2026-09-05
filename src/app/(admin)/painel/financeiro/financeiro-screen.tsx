"use client";

import { useEffect, useRef, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
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
import { apiFetch, ApiError } from "@/lib/api-client";
import { useHasModule } from "@/lib/modules-context";
import {
  formatCurrency,
  MyRegisterPanel,
  OpenRegisterCard,
  OverviewKpis,
  RegisterHistoryTable,
  RegisterSalesTable,
} from "./caixa-panels";
import { CaixaReportTab } from "./caixa-report-tab";
import type {
  CashRegisterItem,
  CashRegisterOverview,
  CashRegistersPage,
  DreReport,
} from "./types";

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
  const [tab, setTab] = useState(
    canManageAllRegisters ? "monitoramento" : "caixa",
  );

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

  return (
    <div>
      <PageHeader
        title="Caixa"
        description={
          canManageAllRegisters
            ? "Opere o seu caixa ou acompanhe os caixas abertos da loja."
            : hasFinanceiro
              ? "Caixa do dia e demonstrativo."
              : "Abertura, fechamento e movimento do seu caixa."
        }
      />

      <PageBody>
      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        {showTabs ? (
        <PageToolbar>
          <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
            <TabsTrigger value="caixa">Meu caixa</TabsTrigger>
            {canManageAllRegisters && (
              <>
                <TabsTrigger value="monitoramento">Monitoramento</TabsTrigger>
                <TabsTrigger value="relatorio">Relatório</TabsTrigger>
              </>
            )}
            {hasFinanceiro && (
              <TabsTrigger value="demonstrativo">Demonstrativo</TabsTrigger>
            )}
          </TabsList>
        </PageToolbar>
        ) : null}

        <TabsContent value="caixa" className="mt-4">
          <MyRegisterPanel
            current={current}
            onOpen={() => setOpenDialogOpen(true)}
            onClose={() => current && openCloseDialog(current.id)}
          />

          {!canManageAllRegisters && (
            <>
              <h2 className="mt-6 mb-3 font-heading text-lg">Histórico</h2>
              <RegisterHistoryTable
                items={history?.items ?? []}
                onSelect={(id) => {
                  void apiFetch<CashRegisterItem>(`/cash-register/${id}`).then(
                    setHistoryDetail,
                  );
                }}
              />
              {historyDetail && (
                <div className="mt-4">
                  <h3 className="mb-2 font-heading text-base">
                    Pedidos de {historyDetail.responsavel.name}, abertos em{" "}
                    {new Date(historyDetail.openedAt).toLocaleString("pt-BR")}
                  </h3>
                  <RegisterSalesTable sales={historyDetail.sales ?? []} />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {canManageAllRegisters && (
          <TabsContent value="monitoramento" className="mt-4">
            {overview ? <OverviewKpis overview={overview} /> : null}

            <section className="mt-8">
              <h2 className="font-heading text-xl">Quem está com caixa aberto</h2>
              {overview && overview.registers.length > 0 ? (
                <div className="mt-4 flex flex-col gap-4">
                  {overview.registers.map((register) => (
                    <OpenRegisterCard
                      key={register.id}
                      register={register}
                      onClose={() => openCloseDialog(register.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Ninguém abriu caixa ainda. Quem for cobrar pedidos abre o
                  próprio na aba Meu caixa.
                </p>
              )}
            </section>

            <section className="mt-10">
              <h2 className="mb-3 font-heading text-xl">Fechamentos anteriores</h2>
              <RegisterHistoryTable
                items={history?.items ?? []}
                onSelect={(id) => {
                  void apiFetch<CashRegisterItem>(`/cash-register/${id}`).then(
                    setHistoryDetail,
                  );
                }}
              />
              {historyDetail && (
                <div className="mt-4">
                  <h3 className="mb-2 font-heading text-base">
                    Pedidos de {historyDetail.responsavel.name}, abertos em{" "}
                    {new Date(historyDetail.openedAt).toLocaleString("pt-BR")}
                  </h3>
                  <RegisterSalesTable sales={historyDetail.sales ?? []} />
                </div>
              )}
            </section>
          </TabsContent>
        )}

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

          <div
            className={`grid grid-cols-1 gap-4 ${canSeeCost ? "sm:grid-cols-3" : "sm:grid-cols-1"}`}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">Receita</CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {dre ? formatCurrency(dre.revenue) : "—"}
              </CardContent>
            </Card>
            {canSeeCost && (
              <Card>
                <CardHeader>
                  {/* CMV, não "despesas" (design handoff mostra um card
                      genérico de despesas — o sistema não modela despesas
                      gerais, só custo de produto vendido, T5.5). */}
                  <CardTitle className="text-sm text-muted-foreground">CMV</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {dre?.cogs != null ? formatCurrency(dre.cogs) : "—"}
                </CardContent>
              </Card>
            )}
            {canSeeCost && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">Margem</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {dre?.margin != null ? formatCurrency(dre.margin) : "—"}
                </CardContent>
              </Card>
            )}
          </div>
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
