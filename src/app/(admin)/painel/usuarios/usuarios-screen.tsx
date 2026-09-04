"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageBody } from "@/components/page-body";
import { PageHeader } from "@/components/page-header";
import { PageToolbar } from "@/components/page-toolbar";
import { Button } from "@/components/ui/button";
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
  const [createRequest, setCreateRequest] = useState(0);

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Funcionários, papéis e permissões."
        actions={
          tab === "usuarios" ? (
            <Button onClick={() => setCreateRequest((n) => n + 1)}>
              <Plus className="size-3.5" />
              Novo usuário
            </Button>
          ) : null
        }
      />
      <PageBody>
      <Tabs value={tab} onValueChange={(value) => setTab(value as string)}>
        <PageToolbar>
          <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
            {canManageUsers && (
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            )}
            {canManageRoles && (
              <TabsTrigger value="permissoes">Permissões</TabsTrigger>
            )}
          </TabsList>
        </PageToolbar>
        {canManageUsers && (
          <TabsContent value="usuarios" className="mt-4">
            <UsuariosTab createRequest={createRequest} />
          </TabsContent>
        )}
        {canManageRoles && (
          <TabsContent value="permissoes" className="mt-4">
            <PermissoesTab />
          </TabsContent>
        )}
      </Tabs>
      </PageBody>
    </div>
  );
}
