import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { PageHeader, PagePlaceholder } from "@/components/page-header";

export const Route = createFileRoute("/midia-offline")({
  head: () => ({
    meta: [
      { title: "Mídia Offline — Marketing Hub" },
      { name: "description", content: "Outdoor, r\u00e1dio, jornal e m\u00eddia tradicional." },
    ],
  }),
  component: MidiaOfflinePage,
});

function MidiaOfflinePage() {
  return (
    <AppShell>
      <PageHeader title="Mídia Offline" description="Outdoor, r\u00e1dio, jornal e m\u00eddia tradicional." />
      <PagePlaceholder
        title="Módulo em construção"
        description="A estrutura desta página está pronta. As funcionalidades serão implementadas nas próximas fases."
      />
    </AppShell>
  );
}
