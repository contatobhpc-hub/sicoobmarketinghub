import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — Marketing Hub" },
      { name: "description", content: "Iniciativas de m\u00e9dio e longo prazo do departamento." },
    ],
  }),
  component: ProjetosPage,
});

function ProjetosPage() {
  return (
    <AppShell>
      <PageHeader title="Projetos" description="Iniciativas de m\u00e9dio e longo prazo do departamento." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
