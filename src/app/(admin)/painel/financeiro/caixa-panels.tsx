import { Badge } from "@/components/ui/badge";
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
import type {
  CashRegisterItem,
  CashRegisterOverview,
  CashRegisterOverviewItem,
  CashRegisterPaymentMethod,
  CashRegisterSale,
} from "./types";

export const PAYMENT_LABELS: Record<CashRegisterPaymentMethod, string> = {
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  PIX: "PIX",
};

export function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function ordersLabel(count: number) {
  return count === 1 ? "1 pedido" : `${count} pedidos`;
}

export function RegisterSalesTable({ sales }: { sales: CashRegisterSale[] }) {
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
              Ainda não cobrou nenhum pedido neste caixa.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export function OverviewKpis({ overview }: { overview: CashRegisterOverview }) {
  const figures = [
    {
      label: "Abertos",
      value: String(overview.openCount),
    },
    {
      label: "Deve ter nas gavetas",
      value: formatCurrency(overview.expectedTotal),
      emphasize: true,
    },
    {
      label: "Vendido",
      value: formatCurrency(overview.salesTotal ?? overview.cashSalesTotal),
    },
    {
      label: "Em dinheiro",
      value: formatCurrency(overview.cashSalesTotal),
    },
    {
      label: "Nas aberturas",
      value: formatCurrency(overview.openingTotal),
    },
  ];

  return (
    <div className="flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-8 sm:gap-y-4">
      {figures.map((figure, index) => (
        <div
          key={figure.label}
          className={
            index === 0
              ? undefined
              : "sm:border-l sm:border-border sm:pl-8"
          }
        >
          <p className="text-sm text-muted-foreground">{figure.label}</p>
          <p
            className={
              figure.emphasize
                ? "font-heading text-3xl leading-none tabular-nums"
                : "font-heading text-2xl leading-none tabular-nums"
            }
          >
            {figure.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function OpenRegisterCard({
  register,
  onClose,
}: {
  register: CashRegisterOverviewItem;
  onClose: () => void;
}) {
  const salesCount = register.salesCount ?? 0;

  return (
    <article className="border-t border-border pt-6">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl leading-none">
            {register.responsavel.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Abriu {new Date(register.openedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <Badge className="bg-success text-success-foreground">aberto</Badge>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div>
          <p className="text-sm text-muted-foreground">Deve ter na gaveta</p>
          <p className="font-heading text-4xl leading-none tabular-nums">
            {formatCurrency(register.expectedNow)}
          </p>
          <p className="mt-2 max-w-[22ch] text-sm text-muted-foreground">
            {formatCurrency(register.openingAmount)} de abertura mais{" "}
            {formatCurrency(register.cashSales)} em dinheiro.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md bg-border sm:grid-cols-2">
          <div className="bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">Ainda na gaveta</p>
            <p className="mt-1 font-heading text-2xl leading-none tabular-nums">
              {formatCurrency(register.cashSales)}
            </p>
            <p className="mt-1 text-sm">Dinheiro das vendas</p>
          </div>
          <div className="bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">Já saiu da gaveta</p>
            <dl className="mt-1 space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt>PIX</dt>
                <dd className="tabular-nums">
                  {formatCurrency(register.pixSales ?? "0")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Cartão</dt>
                <dd className="tabular-nums">
                  {formatCurrency(register.cardSales ?? "0")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm text-muted-foreground">
          {ordersLabel(salesCount)} neste caixa
        </p>
        <RegisterSalesTable sales={register.sales ?? []} />
      </div>

      <div className="mt-4">
        <Button onClick={onClose}>Fechar este caixa</Button>
      </div>
    </article>
  );
}

export function MyRegisterPanel({
  current,
  onOpen,
  onClose,
}: {
  current: CashRegisterItem | null;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-2xl">Meu caixa</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {current
                ? `Abriu ${new Date(current.openedAt).toLocaleString("pt-BR")}`
                : "Abra o caixa antes de cobrar um pedido."}
            </p>
          </div>
          {current ? (
            <Badge className="bg-success text-success-foreground">aberto</Badge>
          ) : (
            <Badge variant="secondary">fechado</Badge>
          )}
        </CardHeader>
        <CardContent>
          {current ? (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  Deve ter na gaveta
                </p>
                <p className="font-heading text-4xl leading-none tabular-nums">
                  {formatCurrency(
                    Number(current.openingAmount) +
                      Number(current.cashSales ?? 0),
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatCurrency(current.openingAmount)} de abertura mais{" "}
                  {formatCurrency(current.cashSales ?? "0")} em dinheiro.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md bg-border sm:grid-cols-2">
                <div className="bg-card px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Ainda na gaveta
                  </p>
                  <p className="mt-1 font-heading text-2xl leading-none tabular-nums">
                    {formatCurrency(current.cashSales ?? "0")}
                  </p>
                  <p className="mt-1 text-sm">Dinheiro das vendas</p>
                </div>
                <div className="bg-card px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Já saiu da gaveta
                  </p>
                  <dl className="mt-1 space-y-1 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt>PIX</dt>
                      <dd className="tabular-nums">
                        {formatCurrency(current.pixSales ?? "0")}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt>Cartão</dt>
                      <dd className="tabular-nums">
                        {formatCurrency(current.cardSales ?? "0")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              <Button className="w-fit" onClick={onClose}>
                Fechar meu caixa
              </Button>
            </div>
          ) : (
            <Button className="w-fit" onClick={onOpen}>
              Abrir meu caixa
            </Button>
          )}
        </CardContent>
      </Card>

      {current ? (
        <div>
          <h2 className="mb-2 font-heading text-lg">
            {ordersLabel(current.salesCount ?? current.sales?.length ?? 0)} neste
            caixa
          </h2>
          <RegisterSalesTable sales={current.sales ?? []} />
        </div>
      ) : null}
    </div>
  );
}

export function RegisterHistoryTable({
  items,
  onSelect,
}: {
  items: CashRegisterItem[];
  onSelect: (id: string) => void;
}) {
  return (
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
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer"
            onClick={() => onSelect(item.id)}
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
  );
}
