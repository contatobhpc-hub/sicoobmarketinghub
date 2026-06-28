import { createFileRoute } from "@tanstack/react-router";
import {
  Megaphone,
  CheckCircle2,
  CalendarClock,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Marketing Hub" },
      {
        name: "description",
        content: "Visão geral do Marketing OS do Sicoob Credibelo.",
      },
    ],
  }),
  component: DashboardPage,
});

const kpis = [
  { label: "Campanhas ativas", value: "12", delta: "+3", icon: Megaphone },
  { label: "Tarefas no prazo", value: "87%", delta: "+4%", icon: CheckCircle2 },
  { label: "Posts agendados", value: "34", delta: "+8", icon: CalendarClock },
  { label: "Orçamento usado", value: "62%", delta: "—", icon: Wallet },
];

function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Visão geral do Departamento de Comunicação e Marketing."
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="card-hover rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {k.label}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <k.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <span className="tabular text-3xl font-semibold tracking-tight text-foreground">
                {k.value}
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <ArrowUpRight className="h-3 w-3" />
                {k.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] lg:col-span-2">
          <h2 className="text-base font-semibold tracking-tight">Campanhas em andamento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista de campanhas será exibida aqui.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-sm)]">
          <h2 className="text-base font-semibold tracking-tight">Atividade recente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Eventos do time aparecerão aqui.
          </p>
        </div>
      </div>

    </AppShell>
  );
}
