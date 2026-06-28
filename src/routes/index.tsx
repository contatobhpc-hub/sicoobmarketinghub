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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="group rounded-xl border border-border bg-surface/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {k.label}
              </span>
              <k.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="tabular font-display text-3xl font-semibold tracking-tight">
                {k.value}
              </span>
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-[color:var(--color-success)]">
                <ArrowUpRight className="h-3 w-3" />
                {k.delta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/60 p-5 lg:col-span-2">
          <h2 className="font-display text-sm font-semibold">Campanhas em andamento</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Lista de campanhas será exibida aqui.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface/60 p-5">
          <h2 className="font-display text-sm font-semibold">Atividade recente</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Eventos do time aparecerão aqui.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
