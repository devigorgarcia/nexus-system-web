import { formatQuantityWithUnit } from "@/lib/unit-type";
import type { CashSalesReport } from "./types";

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatShare(value: string) {
  return `${Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

function formatRange(from: string, to: string) {
  return `${new Date(from).toLocaleDateString("pt-BR")} a ${new Date(to).toLocaleDateString("pt-BR")}`;
}

export async function downloadCashSalesReportPdf(
  report: CashSalesReport,
  canSeeCost: boolean,
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const rangeLabel = formatRange(report.from, report.to);
  const generatedAt = new Date().toLocaleString("pt-BR");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Relatório de caixa — ${rangeLabel}`, 14, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Gerado em ${generatedAt}`, 14, 20);

  const summaryHead = canSeeCost
    ? [["Vendido", "Custo", "Lucro"]]
    : [["Vendido"]];
  const summaryBody = [
    canSeeCost
      ? [
          formatCurrency(report.totals.revenue),
          formatCurrency(report.totals.cost ?? "0"),
          formatCurrency(report.totals.profit ?? "0"),
        ]
      : [formatCurrency(report.totals.revenue)],
  ];

  autoTable(doc, {
    startY: 26,
    head: summaryHead,
    body: summaryBody,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.2, lineColor: [180, 180, 180] },
    headStyles: {
      fillColor: [55, 48, 40],
      textColor: 255,
      fontStyle: "bold",
    },
  });

  const afterSummary = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  const abcRows = (["A", "B", "C"] as const).map((abcClass) => {
    const bucket = report.highlights.abc[abcClass];
    return [
      `Classe ${abcClass}`,
      String(bucket.productCount),
      formatCurrency(bucket.revenue),
      formatShare(bucket.share),
    ];
  });

  autoTable(doc, {
    startY: afterSummary + 8,
    head: [["Curva ABC", "Produtos", "Venda", "%"]],
    body: abcRows,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2.2, lineColor: [180, 180, 180] },
    headStyles: {
      fillColor: [55, 48, 40],
      textColor: 255,
      fontStyle: "bold",
    },
  });

  let cursorY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  if (canSeeCost) {
    autoTable(doc, {
      startY: cursorY + 8,
      head: [["Destaque", "Produto", "Valor"]],
      body: [
        [
          "Mais lucro",
          report.highlights.mostProfit?.productName ?? "—",
          report.highlights.mostProfit?.profit
            ? formatCurrency(report.highlights.mostProfit.profit)
            : "—",
        ],
        [
          "Menos lucro",
          report.highlights.leastProfit?.productName ?? "—",
          report.highlights.leastProfit?.profit
            ? formatCurrency(report.highlights.leastProfit.profit)
            : "—",
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.2, lineColor: [180, 180, 180] },
      headStyles: {
        fillColor: [55, 48, 40],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: { 0: { cellWidth: 40 }, 2: { cellWidth: 40 } },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } })
      .lastAutoTable.finalY;
  }

  const productHead = canSeeCost
    ? [["ABC", "Produto", "Saídas", "Faturamento", "%", "Acumulado", "Custo", "Lucro"]]
    : [["ABC", "Produto", "Saídas", "Faturamento", "%", "Acumulado"]];
  const productBody =
    report.products.length > 0
      ? report.products.map((row) =>
          canSeeCost
            ? [
                row.abcClass,
                row.productName,
                formatQuantityWithUnit(row.quantitySold, row.unitType),
                formatCurrency(row.revenue),
                formatShare(row.revenueShare),
                formatShare(row.cumulativeShare),
                formatCurrency(row.cost ?? "0"),
                formatCurrency(row.profit ?? "0"),
              ]
            : [
                row.abcClass,
                row.productName,
                formatQuantityWithUnit(row.quantitySold, row.unitType),
                formatCurrency(row.revenue),
                formatShare(row.revenueShare),
                formatShare(row.cumulativeShare),
              ],
        )
      : [
          canSeeCost
            ? ["", "Nenhuma venda paga neste período.", "", "", "", "", "", ""]
            : ["", "Nenhuma venda paga neste período.", "", "", "", ""],
        ];

  autoTable(doc, {
    startY: cursorY + 8,
    head: productHead,
    body: productBody,
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: 2, lineColor: [180, 180, 180] },
    headStyles: {
      fillColor: [55, 48, 40],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 242, 236] },
    columnStyles: canSeeCost
      ? {
          0: { cellWidth: 14, halign: "center" },
          2: { halign: "right", cellWidth: 24 },
          3: { halign: "right", cellWidth: 30 },
          4: { halign: "right", cellWidth: 20 },
          5: { halign: "right", cellWidth: 24 },
          6: { halign: "right", cellWidth: 28 },
          7: { halign: "right", cellWidth: 28 },
        }
      : {
          0: { cellWidth: 16, halign: "center" },
          2: { halign: "right", cellWidth: 28 },
          3: { halign: "right", cellWidth: 36 },
          4: { halign: "right", cellWidth: 22 },
          5: { halign: "right", cellWidth: 26 },
        },
  });

  const fromStamp = report.from.slice(0, 10);
  const toStamp = report.to.slice(0, 10);
  doc.save(`relatorio-caixa-${fromStamp}-a-${toStamp}.pdf`);
}
