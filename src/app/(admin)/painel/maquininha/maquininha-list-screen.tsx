"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, alertApiError, ApiError } from "@/lib/api-client";
import {
  cardBrandLabel,
  interestFreeLabel,
  rateToDisplay,
} from "@/lib/card-machine";
import type { CardMachine } from "./types";

export function MaquininhaListScreen() {
  const [machines, setMachines] = useState<CardMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const list = await apiFetch<CardMachine[]>("/card-machine");
    setMachines(list);
    setLoading(false);
    return list;
  }

  useEffect(() => {
    void reload().catch((err) => {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar.");
      setLoading(false);
    });
  }, []);

  async function handleDelete(machine: CardMachine) {
    if (!confirm(`Apagar a maquininha "${machine.name}"?`)) return;
    try {
      await apiFetch(`/card-machine/${machine.id}`, { method: "DELETE" });
      await reload();
    } catch (err) {
      alertApiError(err, "Erro ao apagar.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Maquininhas"
        description="Cada máquina tem as próprias taxas e até onde o crédito é sem juros."
        actions={
          <Button render={<Link href="/painel/maquininha/nova" />}>
            <Plus className="size-3.5" />
            Nova maquininha
          </Button>
        }
      />
      <PageBody>
        {error ? (
          <p className="mb-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Bandeira</TableHead>
              <TableHead>Crédito</TableHead>
              <TableHead>Débito</TableHead>
              <TableHead>Antecipação</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && machines.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma maquininha ainda. Cadastre a primeira.
                </TableCell>
              </TableRow>
            )}
            {machines.map((machine) => (
              <TableRow key={machine.id}>
                <TableCell className="font-medium">{machine.name}</TableCell>
                <TableCell>{cardBrandLabel(machine.brand)}</TableCell>
                <TableCell>{interestFreeLabel(machine.creditPlans)}</TableCell>
                <TableCell className="tabular-nums">
                  {rateToDisplay(machine.debitRate)}%
                </TableCell>
                <TableCell className="tabular-nums">
                  {rateToDisplay(machine.anticipationRate)}%
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      render={<Link href={`/painel/maquininha/${machine.id}`} />}
                    >
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Apagar ${machine.name}`}
                      onClick={() => void handleDelete(machine)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PageBody>
    </div>
  );
}
