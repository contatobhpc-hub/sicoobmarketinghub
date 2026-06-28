import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/brindes")({
  head: () => ({
    meta: [
      { title: "Brindes — Marketing Hub" },
      { name: "description", content: "Estoque, distribui\u00e7\u00e3o e kits institucionais." },
    ],
  }),
  component: BrindesPage,
});

function BrindesPage() {
  return (
    <AppShell>
      <PageHeader title="Brindes" description="Estoque, distribui\u00e7\u00e3o e kits institucionais." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
