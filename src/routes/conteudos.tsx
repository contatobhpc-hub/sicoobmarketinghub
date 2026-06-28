import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/conteudos")({
  head: () => ({
    meta: [
      { title: "Conteúdos — Marketing Hub" },
      { name: "description", content: "Briefs, criativos e banco de conte\u00fado do departamento." },
    ],
  }),
  component: ConteudosPage,
});

function ConteudosPage() {
  return (
    <AppShell>
      <PageHeader title="Conteúdos" description="Briefs, criativos e banco de conte\u00fado do departamento." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
