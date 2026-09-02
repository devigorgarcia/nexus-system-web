"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PermissoesTab } from "./permissoes-tab";
import { UsuariosTab } from "./usuarios-tab";

interface UsuariosScreenProps {
  canManageUsers: boolean;
  canManageRoles: boolean;
}

// Tela de gestão de usuários e papéis (T2.5, design handoff §9) — duas abas,
// cada uma só visível/habilitada pra quem tem a permissão correspondente
// (spec.md §5). `page.tsx` já bloqueou quem não tem nenhuma das duas.
export function UsuariosScreen({
  canManageUsers,
  canManageRoles,
}: UsuariosScreenProps) {
  const [tab, setTab] = useState(canManageUsers ? "usuarios" : "permissoes");

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 font-heading text-2xl">Usuários</h1>
      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        <TabsList>
          {canManageUsers && (
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          )}
          {canManageRoles && (
            <TabsTrigger value="permissoes">Permissões</TabsTrigger>
          )}
        </TabsList>
        {canManageUsers && (
          <TabsContent value="usuarios" className="mt-4">
            <UsuariosTab />
          </TabsContent>
        )}
        {canManageRoles && (
          <TabsContent value="permissoes" className="mt-4">
            <PermissoesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
