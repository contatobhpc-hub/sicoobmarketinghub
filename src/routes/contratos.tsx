import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos — Marketing Hub" },
      { name: "description", content: "Vig\u00eancia, valores, renova\u00e7\u00f5es e anexos." },
    ],
  }),
  component: ContratosPage,
});

function ContratosPage() {
  return (
    <AppShell>
      <PageHeader title="Contratos" description="Vig\u00eancia, valores, renova\u00e7\u00f5es e anexos." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
