import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Flame,
  Radar,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useCommandCenter, type PriorityItem, type Recommendation } from "@/lib/command-center";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marketing Command Center — Marketing Hub" },
      {
        name: "description",
        content:
          "Centro de controle operacional com priorização inteligente de demandas, prazos e recomendações da IA.",
      },
    ],
  }),
  component: CommandCenterPage,
});

const KIND_LABEL: Record<PriorityItem["kind"], string> = {
  campaign: "Campanha",
  contract: "Contrato",
  event: "Evento",
  inventory: "Estoque",
  partner: "Parceiro",
  project: "Projeto",
  sponsorship: "Patrocínio",
  media: "Mídia Offline",
  meeting: "Agenda",
};

const TONE_RING: Record<PriorityItem["tone"], string> = {
  critical:
    "border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5 hover:border-[color:var(--color-danger)]/70",
  warning:
    "border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/5 hover:border-[color:var(--color-warning)]/70",
  info: "border-border bg-surface/60 hover:border-border-strong",
  success:
    "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/5 hover:border-[color:var(--color-success)]/60",
};

const TONE_DOT: Record<PriorityItem["tone"], string> = {
  critical: "bg-[color:var(--color-danger)]",
  warning: "bg-[color:var(--color-warning)]",
  info: "bg-[color:var(--color-info,theme(colors.primary.DEFAULT))]",
  success: "bg-[color:var(--color-success)]",
};

const REC_TONE: Record<Recommendation["tone"], string> = {
  insight: "from-primary/10 to-transparent border-primary/30",
  action: "from-[color:var(--color-success)]/10 to-transparent border-[color:var(--color-success)]/30",
  risk: "from-[color:var(--color-danger)]/10 to-transparent border-[color:var(--color-danger)]/30",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Bom dia", Icon: Sunrise };
  if (h < 18) return { text: "Boa tarde", Icon: Sun };
  return { text: "Boa noite", Icon: Sunset };
}

const FILTERS: { key: "todas" | PriorityItem["kind"]; label: string }[] = [
  { key: "todas", label: "Tudo" },
  { key: "campaign", label: "Campanhas" },
  { key: "contract", label: "Contratos" },
  { key: "event", label: "Eventos" },
  { key: "inventory", label: "Estoque" },
  { key: "partner", label: "Parceiros" },
  { key: "project", label: "Projetos" },
  { key: "media", label: "Mídia" },
];

function CommandCenterPage() {
  const { items, recommendations, kpis } = useCommandCenter();
  const [greet, setGreet] = useState<ReturnType<typeof greeting> | null>(null);
  useEffect(() => setGreet(greeting()), []);
  const { text: hi, Icon: HiIcon } = greet ?? { text: "Olá", Icon: Sun };
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("todas");

  const filtered = useMemo(
    () => (filter === "todas" ? items : items.filter((i) => i.kind === filter)),
    [items, filter],
  );

  const top = filtered.slice(0, 8);
  const radar = items.slice(0, 6);

  return (
    <AppShell>
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-surface/40 to-transparent p-6 sm:p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-[color:var(--color-info,theme(colors.primary.DEFAULT))]/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-success)]" />
              </span>
              Marketing Command Center · Tempo real
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              <HiIcon className="mr-2 inline h-7 w-7 text-primary" strokeWidth={1.75} />
              {hi}, Bruno 👋
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              A IA reorganizou {kpis.total} demandas por urgência, impacto e dependências.
              Estes são os movimentos que precisam da sua atenção hoje.
            </p>
          </div>

          {/* Pulse KPIs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
            <PulseKpi icon={Flame} label="Críticas" value={kpis.critical} tone="critical" />
            <PulseKpi icon={Zap} label="Hoje" value={kpis.today} tone="warning" />
            <PulseKpi icon={Target} label="Em 7 dias" value={kpis.week} tone="info" />
            <PulseKpi icon={Activity} label="Monitoradas" value={kpis.total} tone="success" />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        {/* Priority feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <h2 className="font-display text-sm font-semibold uppercase tracking-wider">
                Priorização inteligente
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    filter === f.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface/40 text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {top.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="space-y-2.5">
              {top.map((item, idx) => (
                <PriorityRow key={item.id} item={item} rank={idx + 1} />
              ))}
            </ul>
          )}
        </section>

        {/* Right rail */}
        <aside className="space-y-6">
          {/* AI Recommendations */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5">
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-12 translate-x-12 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Brain className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">Recomendações da IA</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Sugestões geradas a partir do contexto operacional.
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2.5">
                {recommendations.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                    Sem recomendações ativas. A IA continua monitorando.
                  </li>
                ) : (
                  recommendations.map((r) => (
                    <li
                      key={r.id}
                      className={`group rounded-xl border bg-gradient-to-br p-3 transition-all hover:-translate-y-0.5 ${REC_TONE[r.tone]}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg leading-none">{r.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug">{r.title}</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                            {r.detail}
                          </p>
                          {r.action && (
                            <Link
                              to={r.action.href}
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                            >
                              {r.action.label}
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          {/* Radar feed */}
          <div className="rounded-2xl border border-border bg-surface/60 p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <h3 className="font-display text-sm font-semibold">Radar Operacional</h3>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Sinais detectados nas últimas 24h em todos os módulos.
            </p>
            <ul className="mt-4 space-y-3">
              {radar.map((r) => (
                <li key={`radar-${r.id}`} className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[r.tone]}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{r.title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {KIND_LABEL[r.kind]} · score {r.score}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* AI capability hint */}
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <p className="mt-2 text-xs font-medium">Central IA conectada</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A priorização e as recomendações são reavaliadas a cada nova alteração em
              campanhas, contratos, eventos, estoque, parceiros e mídia offline.
            </p>
            <Link
              to="/central-ia"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80"
            >
              Conversar com a IA
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function PulseKpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  tone: "critical" | "warning" | "info" | "success";
}) {
  const toneClass = {
    critical: "text-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10",
    warning: "text-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10",
    info: "text-primary bg-primary/10",
    success: "text-[color:var(--color-success)] bg-[color:var(--color-success)]/10",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-surface/70 p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-2 tabular font-display text-2xl font-semibold tracking-tight">
        {value}
      </div>
    </div>
  );
}

function PriorityRow({ item, rank }: { item: PriorityItem; rank: number }) {
  return (
    <li>
      <Link
        to={item.href}
        className={`group relative flex items-center gap-3 rounded-xl border p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${TONE_RING[item.tone]}`}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="tabular text-[10px] font-semibold text-muted-foreground">
            #{rank.toString().padStart(2, "0")}
          </span>
          <span className="text-xl leading-none">{item.icon}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-border bg-surface/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {KIND_LABEL[item.kind]}
            </span>
            {item.tone === "critical" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[color:var(--color-danger)]">
                <AlertTriangle className="h-3 w-3" />
                Urgente
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-semibold">{item.title}</p>
          <p className="truncate text-[11px] text-muted-foreground">{item.context}</p>
        </div>

        <div className="hidden flex-col items-end gap-1 sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</span>
            <span className="tabular text-sm font-semibold">{item.score}</span>
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface">
            <div
              className={`h-full ${TONE_DOT[item.tone]}`}
              style={{ width: `${Math.min(100, item.score)}%` }}
            />
          </div>
          {item.due && (
            <span className="text-[10px] text-muted-foreground">{item.due}</span>
          )}
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-10 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-primary" strokeWidth={1.75} />
      <p className="mt-3 text-sm font-semibold">Tudo sob controle por aqui.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Nenhuma demanda crítica para este filtro. A IA continuará monitorando em segundo plano.
      </p>
    </div>
  );
}
