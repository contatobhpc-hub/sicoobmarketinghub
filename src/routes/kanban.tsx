import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban — Marketing Hub" },
      { name: "description", content: "Quadro visual de tarefas por status." },
    ],
  }),
  component: KanbanPage,
});

function KanbanPage() {
  return (
    <AppShell>
      <PageHeader title="Kanban" description="Quadro visual de tarefas por status." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
