import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — Marketing Hub" },
      { name: "description", content: "Calend\u00e1rio unificado de posts, eventos, campanhas e prazos." },
    ],
  }),
  component: CalendarioPage,
});

function CalendarioPage() {
  return (
    <AppShell>
      <PageHeader title="Calendário" description="Calend\u00e1rio unificado de posts, eventos, campanhas e prazos." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
