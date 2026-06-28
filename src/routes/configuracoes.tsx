import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Marketing Hub" },
      { name: "description", content: "Usu\u00e1rios, pap\u00e9is, integra\u00e7\u00f5es e prefer\u00eancias." },
    ],
  }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <AppShell>
      <PageHeader title="Configurações" description="Usu\u00e1rios, pap\u00e9is, integra\u00e7\u00f5es e prefer\u00eancias." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
