import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/parceiros")({
  head: () => ({
    meta: [
      { title: "Parceiros — Marketing Hub" },
      { name: "description", content: "Fornecedores, ag\u00eancias e parceiros estrat\u00e9gicos." },
    ],
  }),
  component: ParceirosPage,
});

function ParceirosPage() {
  return (
    <AppShell>
      <PageHeader title="Parceiros" description="Fornecedores, ag\u00eancias e parceiros estrat\u00e9gicos." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
