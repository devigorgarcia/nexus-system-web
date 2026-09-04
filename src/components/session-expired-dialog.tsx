"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { setSessionExpiredHandler } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Modal global de sessão expirada — registrado como handler do api-client:
// qualquer 401 da API (cookie inválido/expirado) abre este dialog em vez de
// virar alert() nativo num catch de tela. Não-dismissível de propósito: sem
// sessão válida nada no painel funciona, a única saída é o login. Montado
// uma vez em cada shell autenticado (admin-shell e platform-shell).
export function SessionExpiredDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSessionExpiredHandler(() => setOpen(true));
    return () => setSessionExpiredHandler(null);
  }, []);

  return (
    // Controlado e sem `onOpenChange`: Esc/clique fora tentam fechar, mas o
    // state nunca muda — não-dismissível sem depender de prop da versão.
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Sessão expirada</DialogTitle>
          <DialogDescription>
            Sua sessão não é mais válida. Faça login novamente pra continuar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => void signOut({ callbackUrl: "/login" })}>
            Ir para o login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
