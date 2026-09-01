// Placeholder do painel administrativo (T1.3) em /painel — só prova que a
// rota está protegida por sessão. Home real do painel (provavelmente redirect
// pra /pdv, prioridade nº1 do produto) entra quando a Fase 4 existir.
export default function AdminHomePage() {
  return (
    <div className="p-10">
      <h1 className="font-heading text-2xl">Painel administrativo</h1>
      <p className="mt-2 text-muted-foreground">
        Área protegida — você está autenticado.
      </p>
    </div>
  );
}
