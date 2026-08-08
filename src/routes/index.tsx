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
  ssr: false,
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
  critical: "border-destructive/35 bg-destructive/5 hover:border-destructive/60",
  warning: "border-warning/35 bg-warning/5 hover:border-warning/60",
  info: "border-border bg-surface/55 hover:border-primary/45",
  success: "border-success/30 bg-success/5 hover:border-success/55",
};

const TONE_DOT: Record<PriorityItem["tone"], string> = {
  critical: "bg-destructive",
  warning: "bg-warning",
  info: "bg-primary",
  success: "bg-success",
};

const REC_TONE: Record<Recommendation["tone"], string> = {
  insight: "from-primary/12 to-transparent border-primary/25 hover:border-primary/50",
  action: "from-success/12 to-transparent border-success/25 hover:border-success/50",
  risk: "from-destructive/12 to-transparent border-destructive/25 hover:border-destructive/50",
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

/** Staggered entrance wrapper — 8pt rhythm, natural easing. */
function Reveal({
  delay = 0,
  className = "",
  children,
}: {
  delay?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`stagger ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

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
      {/* ── Hero ─────────────────────────────────────────────── */}
      <Reveal>
        <section className="relative overflow-hidden rounded-3xl border border-border bg-surface/45 p-6 shadow-[var(--shadow-md)] backdrop-blur-xl sm:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{ backgroundImage: "var(--gradient-mesh)" }}
          />
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/15 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-accent/12 blur-[100px]" />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-primary) 55%, transparent), transparent)",
            }}
          />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Marketing Command Center · Tempo real
              </div>

              <h1 className="font-display text-[clamp(1.9rem,4.2vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.035em]">
                <HiIcon
                  className="mr-3 inline h-[0.85em] w-[0.85em] align-[-0.08em] text-primary"
                  strokeWidth={1.5}
                />
                {hi}, Bruno
              </h1>

              <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                A IA reorganizou <span className="font-semibold text-foreground">{kpis.total}</span>{" "}
                demandas por urgência, impacto e dependências. Estes são os movimentos que precisam
                da sua atenção hoje.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
              {[
                { icon: Flame, label: "Críticas", value: kpis.critical, tone: "critical" as const },
                { icon: Zap, label: "Hoje", value: kpis.today, tone: "warning" as const },
                { icon: Target, label: "Em 7 dias", value: kpis.week, tone: "info" as const },
                { icon: Activity, label: "Monitoradas", value: kpis.total, tone: "success" as const },
              ].map((k, i) => (
                <Reveal key={k.label} delay={120 + i * 70}>
                  <PulseKpi {...k} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Bento ────────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Priority feed */}
        <section className="min-w-0 space-y-5">
          <Reveal delay={200}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                  <Radar className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h2 className="eyebrow truncate text-foreground">Priorização inteligente</h2>
              </div>
              <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`press rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300 [transition-timing-function:var(--ease-premium)] ${
                      filter === f.key
                        ? "border-primary/60 bg-primary/12 text-primary shadow-[var(--shadow-xs)]"
                        : "border-border bg-surface/40 text-muted-foreground hover:border-primary/35 hover:text-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {top.length === 0 ? (
            <Reveal delay={260}>
              <EmptyState />
            </Reveal>
          ) : (
            <ul className="space-y-3">
              {top.map((item, idx) => (
                <Reveal key={item.id} delay={240 + idx * 55}>
                  <PriorityRow item={item} rank={idx + 1} />
                </Reveal>
              ))}
            </ul>
          )}
        </section>

        {/* Right rail */}
        <aside className="min-w-0 space-y-6">
          <Reveal delay={280}>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/55 p-6 shadow-[var(--shadow-sm)] backdrop-blur-xl">
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 -translate-y-16 translate-x-16 rounded-full bg-primary/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                    <Brain className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold tracking-tight">
                      Recomendações da IA
                    </h3>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Sugestões geradas a partir do contexto operacional.
                    </p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {recommendations.length === 0 ? (
                    <li className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                      Sem recomendações ativas. A IA continua monitorando.
                    </li>
                  ) : (
                    recommendations.map((r) => (
                      <li
                        key={r.id}
                        className={`group lift rounded-xl border bg-gradient-to-br p-3.5 ${REC_TONE[r.tone]}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg leading-none">{r.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold leading-snug">{r.title}</p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                              {r.detail}
                            </p>
                            {r.action && (
                              <Link
                                to={r.action.href}
                                className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary transition-colors hover:text-primary/80"
                              >
                                {r.action.label}
                                <ArrowRight className="h-3 w-3 transition-transform duration-300 [transition-timing-function:var(--ease-premium)] group-hover:translate-x-1" />
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
          </Reveal>

          <Reveal delay={340}>
            <div className="rounded-2xl border border-border bg-surface/55 p-6 shadow-[var(--shadow-sm)] backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />
                <h3 className="font-display text-sm font-semibold tracking-tight">
                  Radar Operacional
                </h3>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                Sinais detectados nas últimas 24h em todos os módulos.
              </p>
              <ul className="mt-5 space-y-3.5">
                {radar.map((r) => (
                  <li key={`radar-${r.id}`} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[r.tone]}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{r.title}</p>
                      <p className="eyebrow mt-0.5 text-[10px]">
                        {KIND_LABEL[r.kind]} · score {r.score}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.75} />
              <p className="mt-2.5 text-xs font-semibold">Central IA conectada</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                A priorização e as recomendações são reavaliadas a cada nova alteração em campanhas,
                contratos, eventos, estoque, parceiros e mídia offline.
              </p>
              <Link
                to="/central-ia"
                className="group mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80"
              >
                Conversar com a IA
                <ArrowRight className="h-3 w-3 transition-transform duration-300 [transition-timing-function:var(--ease-premium)] group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>
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
    critical: "text-destructive bg-destructive/10 ring-destructive/20",
    warning: "text-warning bg-warning/10 ring-warning/20",
    info: "text-primary bg-primary/10 ring-primary/20",
    success: "text-success bg-success/10 ring-success/20",
  }[tone];

  return (
    <div className="lift group relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-4 shadow-[var(--shadow-xs)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundImage: "var(--gradient-sheen)" }}
      />
      <div className="relative flex items-center justify-between gap-2">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 ${toneClass}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="eyebrow truncate text-[10px]">{label}</span>
      </div>
      <div className="tabular relative mt-3 font-display text-[1.75rem] font-semibold leading-none tracking-[-0.03em]">
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
        className={`group lift press relative flex items-center gap-4 rounded-2xl border p-4 backdrop-blur-sm ${TONE_RING[item.tone]}`}
      >
        <div className="flex w-8 shrink-0 flex-col items-center gap-1">
          <span className="tabular text-[10px] font-semibold tracking-wider text-muted-foreground">
            #{rank.toString().padStart(2, "0")}
          </span>
          <span className="text-xl leading-none transition-transform duration-400 [transition-timing-function:var(--ease-premium)] group-hover:scale-115">
            {item.icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow rounded-md border border-border bg-surface/80 px-1.5 py-0.5 text-[9px]">
              {KIND_LABEL[item.kind]}
            </span>
            {item.tone === "critical" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-destructive">
                <AlertTriangle className="h-3 w-3" />
                Urgente
              </span>
            )}
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold tracking-[-0.01em]">{item.title}</p>
          <p className="truncate text-[11px] leading-relaxed text-muted-foreground">
            {item.context}
          </p>
        </div>

        <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
          <div className="flex items-center gap-1.5">
            <span className="eyebrow text-[9px]">Score</span>
            <span className="tabular text-sm font-semibold">{item.score}</span>
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-elevated">
            <div
              className={`h-full rounded-full transition-[width] duration-700 [transition-timing-function:var(--ease-emphasis)] ${TONE_DOT[item.tone]}`}
              style={{ width: `${Math.min(100, item.score)}%` }}
            />
          </div>
          {item.due && <span className="text-[10px] text-muted-foreground">{item.due}</span>}
        </div>

        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 [transition-timing-function:var(--ease-premium)] group-hover:translate-x-1 group-hover:text-primary" />
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/40 p-12 text-center backdrop-blur-sm">
      <Sparkles className="mx-auto h-6 w-6 text-primary" strokeWidth={1.75} />
      <p className="mt-4 text-sm font-semibold">Tudo sob controle por aqui.</p>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
        Nenhuma demanda crítica para este filtro. A IA continuará monitorando em segundo plano.
      </p>
    </div>
  );
}
