import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Marketing Hub" },
      { name: "description", content: "Or\u00e7amento por campanha, realizado vs planejado." },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  return (
    <AppShell>
      <PageHeader title="Financeiro" description="Or\u00e7amento por campanha, realizado vs planejado." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
