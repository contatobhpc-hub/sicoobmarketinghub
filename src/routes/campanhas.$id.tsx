import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Wallet,
  User,
  Target,
  Tag,
  Paperclip,
  Activity,
  CheckCircle2,
  Clock,
  FileText,
  Trello,
  LineChart,
  Users,
  ListChecks,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CAMPAIGN_MODULES,
  campaignProgress,
  campaignsStore,
  formatCurrency,
  formatDate,
  priorityTone,
  statusTone,
  useCampaign,
} from "@/lib/campaigns";

export const Route = createFileRoute("/campanhas/$id")({
  loader: ({ params }) => {
    const c = campaignsStore.byId(params.id);
    if (!c) throw notFound();
    return { id: params.id };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Campanha — Marketing Hub` },
      { name: "description", content: `Detalhes da campanha ${loaderData?.id ?? ""}` },
    ],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <h2 className="font-display text-base font-semibold">Campanha não encontrada</h2>
        <Link to="/campanhas" className="mt-3 inline-block text-sm text-primary hover:underline">
          ← Voltar para campanhas
        </Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <h2 className="font-display text-base font-semibold">Erro ao carregar</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </AppShell>
  ),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { id } = Route.useParams();
  const c = useCampaign(id);
  if (!c) return null;

  const progress = campaignProgress(c);

  return (
    <AppShell>
      <div className="mb-2">
        <Link
          to="/campanhas"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Campanhas
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-6 rounded-2xl border border-border bg-surface/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Tag className="h-3 w-3" /> {c.type}
              <span>·</span>
              <Target className="h-3 w-3" /> {c.objective}
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">
              {c.name}
            </h1>
            {c.description && (
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{c.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${statusTone(c.status)}`}>
              {c.status}
            </span>
            <span className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${priorityTone(c.priority)}`}>
              {c.priority}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Calendar} label="Período" value={`${formatDate(c.startDate)} → ${formatDate(c.endDate)}`} />
          <Stat icon={User} label="Responsável" value={c.owner || "—"} />
          <Stat icon={Wallet} label="Orçamento" value={formatCurrency(c.budget)} />
          <Stat icon={Activity} label="Progresso" value={`${progress}%`} />
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, backgroundImage: "var(--gradient-primary)" }}
          />
        </div>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {[
            { v: "resumo", l: "Resumo" },
            { v: "cronograma", l: "Cronograma" },
            { v: "arquivos", l: "Arquivos" },
            { v: "equipe", l: "Equipe" },
            { v: "timeline", l: "Timeline" },
            { v: "kanban", l: "Kanban" },
            { v: "resultados", l: "Resultados" },
            { v: "financeiro", l: "Financeiro" },
            { v: "atividades", l: "Atividades" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-lg border border-transparent px-3 py-1.5 text-xs data-[state=active]:border-border-strong data-[state=active]:bg-surface-elevated data-[state=active]:text-foreground"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Sobre" className="lg:col-span-2">
              <Row label="Descrição" value={c.description || "—"} />
              <Row label="Observações" value={c.notes || "—"} />
              <Row
                label="Produtos relacionados"
                value={
                  c.products.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {c.products.map((p) => (
                        <span key={p} className="rounded-md border border-border bg-surface-elevated px-2 py-0.5 text-[11px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )
                }
              />
            </Card>
            <Card title="Módulos vinculados">
              <ul className="space-y-1.5">
                {CAMPAIGN_MODULES.map((m) => {
                  const on = c.modules.includes(m.key);
                  return (
                    <li
                      key={m.key}
                      className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs ${
                        on
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border bg-surface-elevated/40 text-muted-foreground"
                      }`}
                    >
                      <span>{m.label}</span>
                      {on ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <span className="text-[10px]">não gerado</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cronograma">
          <Empty icon={Calendar} title="Cronograma" desc="Visualização Gantt e marcos da campanha aparecerão aqui." />
        </TabsContent>
        <TabsContent value="arquivos">
          <Card title="Arquivos">
            {c.files.length === 0 ? (
              <EmptyInline icon={Paperclip} text="Nenhum arquivo anexado ainda." />
            ) : (
              <ul className="divide-y divide-border/60">
                {c.files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {f.name}</span>
                    <span className="tabular text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="equipe">
          <Empty icon={Users} title="Equipe" desc="Membros, papéis e responsabilidades da campanha." />
        </TabsContent>
        <TabsContent value="timeline">
          <Empty icon={Clock} title="Timeline" desc="Linha do tempo de eventos e marcos." />
        </TabsContent>
        <TabsContent value="kanban">
          <Empty icon={Trello} title="Kanban" desc="Quadro de tarefas da campanha por status." />
        </TabsContent>
        <TabsContent value="resultados">
          <Empty icon={LineChart} title="Resultados" desc="KPIs e indicadores de performance da campanha." />
        </TabsContent>
        <TabsContent value="financeiro">
          <Empty icon={Wallet} title="Financeiro" desc="Orçamento, despesas e contratos vinculados." />
        </TabsContent>
        <TabsContent value="atividades">
          <Empty icon={ListChecks} title="Atividades" desc="Histórico de ações da equipe nesta campanha." />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-elevated/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={1.75} /> {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface/60 p-5 ${className}`}>
      <h2 className="mb-4 font-display text-sm font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[160px_1fr]">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function Empty({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Calendar;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <Icon className="mx-auto mb-3 h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function EmptyInline({ icon: Icon, text }: { icon: typeof Calendar; text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
      <Icon className="h-4 w-4" strokeWidth={1.5} /> {text}
    </div>
  );
}
