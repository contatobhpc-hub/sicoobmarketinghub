import { createFileRoute } from "@tanstack/react-router";
import {
  Megaphone,
  FolderKanban,
  CheckCircle2,
  CalendarHeart,
  Handshake,
  ScrollText,
  Gift,
  Radio,
  Flame,
  CalendarDays,
  FileWarning,
  PackageMinus,
  MapPin,
  Send,
  Wallet,
  Bell,
  ChevronRight,
  Plus,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/prioridades")({
  head: () => ({
    meta: [
      { title: "Central de Prioridades — Marketing Hub" },
      {
        name: "description",
        content:
          "Centro operacional do Departamento de Comunicação e Marketing.",
      },
    ],
  }),
  component: PrioridadesPage,
});

type Kpi = {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
};

const kpis: Kpi[] = [
  { label: "Campanhas ativas", value: "12", delta: "+3", icon: Megaphone },
  { label: "Projetos", value: "08", delta: "+1", icon: FolderKanban },
  { label: "Tarefas pendentes", value: "27", delta: "-5", icon: CheckCircle2, tone: "warning" },
  { label: "Eventos", value: "05", icon: CalendarHeart },
  { label: "Parceiros", value: "34", delta: "+2", icon: Handshake },
  { label: "Contratos", value: "18", icon: ScrollText },
  { label: "Brindes", value: "1.240", delta: "-120", icon: Gift, tone: "warning" },
  { label: "Mídias offline", value: "09", icon: Radio },
];

type PriorityItem = {
  title: string;
  meta: string;
  tag: string;
  tone: "danger" | "warning" | "default";
};

const prioridades: PriorityItem[] = [
  { title: "Aprovar arte — Campanha Crédito Rural", meta: "Vence hoje • 16h", tag: "Urgente", tone: "danger" },
  { title: "Revisar roteiro do vídeo institucional", meta: "Hoje • Designer aguardando", tag: "Hoje", tone: "warning" },
  { title: "Validar briefing — Ação Dia do Cooperativismo", meta: "Hoje • Gestão", tag: "Hoje", tone: "warning" },
  { title: "Confirmar fornecedor de brindes", meta: "Amanhã", tag: "Em breve", tone: "default" },
];

const eventos = [
  { date: "30 JUN", title: "Reunião Conselho Administrativo", place: "Sede • 14h" },
  { date: "02 JUL", title: "Lançamento Crédito Rural", place: "Auditório • 09h" },
  { date: "05 JUL", title: "Treinamento Atendimento", place: "Online • 10h" },
];

const campanhas = [
  { name: "Crédito Rural 2026", progress: 72, status: "Em produção", owner: "Ana" },
  { name: "Cooperativismo Jovem", progress: 45, status: "Aprovação", owner: "Bruno" },
  { name: "Educação Financeira", progress: 88, status: "Veiculação", owner: "Carla" },
];

const contratos = [
  { name: "Agência Norte Propaganda", days: 7 },
  { name: "Gráfica Belo Horizonte", days: 12 },
  { name: "Produtora Vídeo+", days: 21 },
];

const brindes = [
  { name: "Caneta institucional", qty: 120, min: 500 },
  { name: "Squeeze Sicoob", qty: 48, min: 200 },
  { name: "Bloco de notas", qty: 210, min: 300 },
];

const outdoors = [
  { local: "Av. Brasil, 1200", date: "30/06" },
  { local: "BR-381 km 45", date: "02/07" },
];

const posts = [
  { canal: "Instagram", title: "Carrossel — Dicas financeiras", hora: "Hoje 18h" },
  { canal: "LinkedIn", title: "Artigo — Cooperativismo", hora: "Amanhã 09h" },
  { canal: "Facebook", title: "Vídeo — Depoimento cooperado", hora: "Amanhã 12h" },
];

const financeiro = [
  { item: "NF Agência Norte", valor: "R$ 18.400", venc: "Vence em 3 dias" },
  { item: "Patrocínio Festival", valor: "R$ 25.000", venc: "Vence em 6 dias" },
];

const atividades = [
  { who: "Ana", what: "aprovou a arte", target: "Campanha Crédito Rural", when: "há 12min" },
  { who: "Carla", what: "publicou no Instagram", target: "Educação Financeira", when: "há 1h" },
  { who: "Bruno", what: "criou o evento", target: "Lançamento Crédito Rural", when: "há 3h" },
  { who: "Diego", what: "comentou em", target: "Briefing Jovem", when: "ontem" },
];

const notificacoes = [
  { title: "3 aprovações aguardando", desc: "Materiais em fila desde ontem", tone: "warning" as const },
  { title: "Estoque crítico", desc: "Squeeze Sicoob abaixo do mínimo", tone: "danger" as const },
  { title: "Novo comentário", desc: "Diretoria comentou em Briefing Jovem", tone: "default" as const },
];

function toneClasses(tone: PriorityItem["tone"]) {
  switch (tone) {
    case "danger":
      return "bg-destructive/10 text-destructive";
    case "warning":
      return "bg-warning/15 text-warning";
    default:
      return "bg-primary/10 text-primary";
  }
}

function PrioridadesPage() {
  return (
    <AppShell>
      {/* Greeting */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Bom dia, Bruno <span className="ml-1">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Veja o que precisa da sua atenção hoje no Departamento de Comunicação e Marketing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 rounded-lg">
            <CalendarDays className="mr-2 h-4 w-4" strokeWidth={1.75} />
            Hoje
          </Button>
          <Button className="h-9 rounded-lg">
            <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
            Nova campanha
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="card-hover rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-xs)]"
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  k.tone === "warning"
                    ? "bg-warning/15 text-warning"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <k.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              {k.delta && (
                <span className="text-[11px] font-medium tabular text-muted-foreground">
                  {k.delta}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="tabular text-2xl font-semibold tracking-tight text-foreground">
                {k.value}
              </div>
              <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {k.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1fr_320px]">
        {/* Smart cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <SmartCard icon={Flame} title="Prioridades de hoje" accent="danger" count={prioridades.length}>
            <ul className="space-y-3">
              {prioridades.map((p) => (
                <li
                  key={p.title}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface/40 p-3 transition-colors hover:border-border-strong"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{p.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{p.meta}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${toneClasses(p.tone)}`}
                  >
                    {p.tag}
                  </span>
                </li>
              ))}
            </ul>
          </SmartCard>

          <SmartCard icon={CalendarDays} title="Próximos eventos" count={eventos.length}>
            <ul className="space-y-3">
              {eventos.map((e) => (
                <li key={e.title} className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3">
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-[10px] font-semibold tracking-wide">{e.date.split(" ")[1]}</span>
                    <span className="tabular text-sm font-semibold leading-none">{e.date.split(" ")[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground">{e.place}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SmartCard>

          <SmartCard icon={Megaphone} title="Campanhas em andamento" count={campanhas.length}>
            <ul className="space-y-4">
              {campanhas.map((c) => (
                <li key={c.name}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.status} • {c.owner}
                      </div>
                    </div>
                    <span className="tabular text-xs font-semibold text-foreground">{c.progress}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </SmartCard>

          <SmartCard icon={FileWarning} title="Contratos vencendo" accent="warning" count={contratos.length}>
            <ul className="space-y-3">
              {contratos.map((c) => (
                <li key={c.name} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">Renovação contratual</div>
                  </div>
                  <span
                    className={`tabular shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      c.days <= 7 ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"
                    }`}
                  >
                    {c.days}d
                  </span>
                </li>
              ))}
            </ul>
          </SmartCard>

          <SmartCard icon={PackageMinus} title="Estoque baixo de brindes" accent="danger" count={brindes.length}>
            <ul className="space-y-4">
              {brindes.map((b) => {
                const pct = Math.min(100, Math.round((b.qty / b.min) * 100));
                return (
                  <li key={b.name}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{b.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Mín. {b.min.toLocaleString("pt-BR")} un
                        </div>
                      </div>
                      <span className="tabular text-xs font-semibold text-destructive">
                        {b.qty} un
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-destructive"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </SmartCard>

          <SmartCard icon={MapPin} title="Outdoor com retirada próxima" count={outdoors.length}>
            <ul className="space-y-3">
              {outdoors.map((o) => (
                <li key={o.local} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{o.local}</div>
                    <div className="text-xs text-muted-foreground">Retirada agendada</div>
                  </div>
                  <span className="tabular rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {o.date}
                  </span>
                </li>
              ))}
            </ul>
          </SmartCard>

          <SmartCard icon={Send} title="Publicações agendadas" count={posts.length}>
            <ul className="space-y-3">
              {posts.map((p) => (
                <li key={p.title} className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    {p.canal}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.hora}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SmartCard>

          <SmartCard icon={Wallet} title="Financeiro pendente" accent="warning" count={financeiro.length}>
            <ul className="space-y-3">
              {financeiro.map((f) => (
                <li key={f.item} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{f.item}</div>
                    <div className="text-xs text-muted-foreground">{f.venc}</div>
                  </div>
                  <span className="tabular text-sm font-semibold text-foreground">{f.valor}</span>
                </li>
              ))}
            </ul>
          </SmartCard>
        </div>

        {/* Right rail */}
        <aside className="flex flex-col gap-5">
          <MiniCalendar />

          <SideCard title="Atividades recentes">
            <ul className="space-y-4">
              {atividades.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground">
                    {a.who[0]}
                  </div>
                  <div className="min-w-0 text-sm leading-snug">
                    <span className="font-medium text-foreground">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.what}</span>{" "}
                    <span className="font-medium text-foreground">{a.target}</span>
                    <div className="text-xs text-muted-foreground">{a.when}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SideCard>

          <SideCard title="Notificações" icon={Bell}>
            <ul className="space-y-3">
              {notificacoes.map((n, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-3"
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      n.tone === "danger"
                        ? "bg-destructive"
                        : n.tone === "warning"
                          ? "bg-warning"
                          : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground">{n.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </SideCard>
        </aside>
      </div>
    </AppShell>
  );
}

function SmartCard({
  icon: Icon,
  title,
  count,
  accent = "default",
  children,
}: {
  icon: LucideIcon;
  title: string;
  count?: number;
  accent?: "default" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const accentBg =
    accent === "danger"
      ? "bg-destructive/10 text-destructive"
      : accent === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-primary/10 text-primary";

  return (
    <section className="card-hover flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentBg}`}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {typeof count === "number" && (
            <span className="tabular rounded-full bg-muted px-1.5 text-[11px] font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </div>
        <button
          type="button"
          className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ver tudo
          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function SideCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />}
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </header>
      {children}
    </section>
  );
}

function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // Monday start
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthLabel = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const dow = ["S", "T", "Q", "Q", "S", "S", "D"];
  const eventDays = new Set([2, 5, 12, 18, 24]);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight capitalize">{monthLabel}</h3>
        <CalendarDays className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </header>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dow.map((d, i) => (
          <div key={i} className="py-1 text-[10px] font-semibold uppercase text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const isToday = d === today.getDate();
          const hasEvent = eventDays.has(d);
          return (
            <button
              key={i}
              type="button"
              className={`tabular relative aspect-square rounded-lg text-xs font-medium transition-colors ${
                isToday
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {d}
              {hasEvent && !isToday && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
