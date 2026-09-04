"use client";

import { useEffect, useState } from "react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, ApiError } from "@/lib/api-client";
import type { FiscalConfig, FiscalDocument, TaxRegime } from "./types";

const REGIME_LABEL: Record<TaxRegime, string> = {
  SIMPLES: "Simples Nacional",
  PRESUMIDO: "Lucro presumido",
  REAL: "Lucro real",
};

export function FiscalScreen() {
  const [config, setConfig] = useState<FiscalConfig | null>(null);
  const [documents, setDocuments] = useState<FiscalDocument[]>([]);
  const [cnpj, setCnpj] = useState("");
  const [ie, setIe] = useState("");
  const [taxRegime, setTaxRegime] = useState<TaxRegime>("SIMPLES");
  const [estimatedRate, setEstimatedRate] = useState("6");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function reload() {
    const [configData, documentData] = await Promise.all([
      apiFetch<FiscalConfig | null>("/fiscal/config"),
      apiFetch<FiscalDocument[]>("/fiscal/documents"),
    ]);
    setConfig(configData);
    setDocuments(documentData);
    if (configData) {
      setCnpj(configData.cnpj);
      setIe(configData.ie);
      setTaxRegime(configData.taxRegime);
      setEstimatedRate(String(configData.estimatedRate));
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiFetch("/fiscal/config", {
        method: "PUT",
        body: JSON.stringify({
          cnpj,
          ie,
          taxRegime,
          estimatedRate: estimatedRate.replace(",", "."),
        }),
      });
      setSaved(true);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function retry(id: string) {
    try {
      await apiFetch(`/fiscal/documents/${id}/retry`, { method: "POST" });
      await reload();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao reemitir.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Fiscal"
        description="Configuração da loja e NFC-e simulada. Nenhuma nota real é enviada à SEFAZ."
      />
      <PageBody className="flex flex-col gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-heading text-lg">Dados da loja</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fiscal-cnpj">CNPJ</Label>
              <Input
                id="fiscal-cnpj"
                value={cnpj}
                onChange={(event) => setCnpj(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fiscal-ie">Inscrição estadual</Label>
              <Input
                id="fiscal-ie"
                value={ie}
                onChange={(event) => setIe(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Regime</Label>
              <Select
                value={taxRegime}
                onValueChange={(value) => {
                  if (value) setTaxRegime(value as TaxRegime);
                }}
              >
                <SelectTrigger aria-label="Regime tributário">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REGIME_LABEL) as TaxRegime[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {REGIME_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fiscal-rate">Alíquota estimada (%)</Label>
              <Input
                id="fiscal-rate"
                value={estimatedRate}
                onChange={(event) => setEstimatedRate(event.target.value)}
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="mt-3 text-sm text-success">Configuração salva.</p>
          )}
          <Button className="mt-4" onClick={() => void handleSave()} disabled={saving}>
            Salvar configuração
          </Button>
          {!config && (
            <p className="mt-3 text-sm text-muted-foreground">
              Sem CNPJ e IE, a venda paga gera documento em erro — dá pra
              reemitir depois de preencher.
            </p>
          )}
        </div>

        <div>
          <h2 className="mb-3 font-heading text-lg">Documentos</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Chave / protocolo</TableHead>
                <TableHead>Imposto</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma NFC-e gerada ainda. Elas nascem ao cobrar um pedido.
                  </TableCell>
                </TableRow>
              )}
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-mono text-xs">
                    {document.sale.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>{document.sale.customer?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        document.status === "EMITIDO"
                          ? "default"
                          : document.status === "ERRO"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {document.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-56 truncate font-mono text-xs">
                    {document.accessKey ?? document.errorMessage ?? "—"}
                    {document.protocol ? (
                      <div className="text-muted-foreground">
                        prot. {document.protocol}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {document.estimatedTax
                      ? Number(document.estimatedTax).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {document.status === "ERRO" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void retry(document.id)}
                      >
                        Reemitir
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageBody>
    </div>
  );
}
