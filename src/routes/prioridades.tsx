import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/prioridades")({
  head: () => ({
    meta: [
      { title: "Central de Prioridades — Marketing Hub" },
      { name: "description", content: "Itens urgentes, aprova\u00e7\u00f5es pendentes e SLAs do dia." },
    ],
  }),
  component: PrioridadesPage,
});

function PrioridadesPage() {
  return (
    <AppShell>
      <PageHeader title="Central de Prioridades" description="Itens urgentes, aprova\u00e7\u00f5es pendentes e SLAs do dia." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
