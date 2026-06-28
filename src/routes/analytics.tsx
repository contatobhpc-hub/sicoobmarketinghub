import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Marketing Hub" },
      { name: "description", content: "Indicadores de campanha, alcance, engajamento e ROI." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell>
      <PageHeader title="Analytics" description="Indicadores de campanha, alcance, engajamento e ROI." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
