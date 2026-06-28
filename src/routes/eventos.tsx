import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Marketing Hub" },
      { name: "description", content: "Ativa\u00e7\u00f5es, feiras e eventos pr\u00f3prios." },
    ],
  }),
  component: EventosPage,
});

function EventosPage() {
  return (
    <AppShell>
      <PageHeader title="Eventos" description="Ativa\u00e7\u00f5es, feiras e eventos pr\u00f3prios." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
