import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/campanhas")({
  head: () => ({
    meta: [
      { title: "Campanhas — Marketing Hub" },
      { name: "description", content: "N\u00facleo do Marketing OS \u2014 toda a\u00e7\u00e3o se vincula a uma campanha." },
    ],
  }),
  component: CampanhasPage,
});

function CampanhasPage() {
  return (
    <AppShell>
      <PageHeader title="Campanhas" description="N\u00facleo do Marketing OS \u2014 toda a\u00e7\u00e3o se vincula a uma campanha." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
