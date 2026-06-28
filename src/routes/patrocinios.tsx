import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/patrocinios")({
  head: () => ({
    meta: [
      { title: "Patrocínios — Marketing Hub" },
      { name: "description", content: "Patroc\u00ednios concedidos, ROI e contrapartidas." },
    ],
  }),
  component: PatrociniosPage,
});

function PatrociniosPage() {
  return (
    <AppShell>
      <PageHeader title="Patrocínios" description="Patroc\u00ednios concedidos, ROI e contrapartidas." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
