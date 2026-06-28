import { createFileRoute, Link } from "@tanstack/react-router";
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
  Smartphone,
  Wallet,
  Bell,
  Activity,
  ChevronRight,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { daysUntil, useContracts } from "@/lib/contracts";

export const Route = createFileRoute("/prioridades")({
  head: () => ({
    meta: [
      { title: "Central de Prioridades — Marketing Hub" },
      {
        name: "description",
        content:
          "Centro operacional do Marketing OS: prioridades do dia, KPIs e alertas em tempo real.",
      },
    ],
  }),
  component: PrioridadesPage,
});

// ------------------------------ Data ------------------------------

const userName = "Bruno";

const kpis: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  to: string;
  tone: "primary" | "accent" | "success" | "warning";
}[] = [
  { label: "Campanhas ativas", value: "12", hint: "+3 esta semana", icon: Megaphone, to: "/campanhas", tone: "primary" },
  { label: "Projetos", value: "8", hint: "2 em risco", icon: FolderKanban, to: "/projetos", tone: "accent" },
  { label: "Tarefas pendentes", value: "27", hint: "5 atrasadas", icon: CheckCircle2, to: "/kanban", tone: "warning" },
  { label: "Eventos", value: "4", hint: "Próx. em 3 dias", icon: CalendarHeart, to: "/eventos", tone: "primary" },
  { label: "Parceiros", value: "36", hint: "2 novos", icon: Handshake, to: "/parceiros", tone: "accent" },
  { label: "Contratos", value: "14", hint: "3 vencendo", icon: ScrollText, to: "/contratos", tone: "warning" },
  { label: "Brindes", value: "1.240", hint: "2 itens baixos", icon: Gift, to: "/brindes", tone: "success" },
  { label: "Mídias offline", value: "9", hint: "1 retirada hoje", icon: Radio, to: "/midia-offline", tone: "primary" },
];

const toneRing: Record<string, string> = {
  primary: "from-[color:var(--color-primary)]/25 to-transparent",
  accent: "from-[color:var(--color-accent)]/25 to-transparent",
  success: "from-[color:var(--color-success)]/25 to-transparent",
  warning: "from-[color:var(--color-warning)]/25 to-transparent",
};

const priorities = [
  { title: "Aprovar artes – Campanha Crédito Rural", meta: "Vence hoje · Gestor", level: "alta" },
  { title: "Revisar roteiro vídeo institucional", meta: "Até 16h · Analista", level: "alta" },
  { title: "Enviar briefing fornecedor de brindes", meta: "Hoje · Operação", level: "media" },
  { title: "Validar contrato Rádio Cidade FM", meta: "Hoje · Jurídico", level: "media" },
];

const upcomingEvents = [
  { name: "Assembleia Geral Credibelo", date: "01 Jul", place: "Sede · Credibelo", tag: "Institucional" },
  { name: "Feira do Agronegócio", date: "08 Jul", place: "Parque de Exposições", tag: "Patrocínio" },
  { name: "Reunião Diretoria", date: "12 Jul", place: "Online", tag: "Interno" },
];

const runningCampaigns = [
  { name: "Crédito Rural 2026", progress: 72, owner: "Marketing", channel: "Multicanal" },
  { name: "Conta Digital Jovem", progress: 45, owner: "Digital", channel: "Social + Ads" },
  { name: "Campanha de Filiação", progress: 28, owner: "Comunicação", channel: "Offline" },
];

const expiringContracts = [
  { partner: "Rádio Cidade FM", days: 4 },
  { partner: "Agência Norte", days: 9 },
  { partner: "Outdoor Lemos", days: 15 },
];

const lowStock = [
  { item: "Caneta Metal Azul", stock: 32, min: 100 },
  { item: "Squeeze Térmico 500ml", stock: 18, min: 80 },
];

const outdoorPickup = [
  { spot: "Av. Brasil · OD-12", date: "Amanhã · 09h" },
  { spot: "BR-101 · OD-04", date: "30 Jun · 14h" },
];

const scheduledPosts = [
  { title: "Carrossel – Dia do Cooperativismo", when: "Hoje · 18h", channel: "Instagram" },
  { title: "Reels – Conta Jovem", when: "Amanhã · 12h", channel: "Instagram" },
  { title: "Post – Crédito Rural", when: "30 Jun · 09h", channel: "Facebook" },
];

const pendingFinance = [
  { desc: "NF Agência Norte · #2041", value: "R$ 12.400" },
  { desc: "Reembolso evento Feira", value: "R$ 2.180" },
];

const recentActivity = [
  { who: "Ana", action: "aprovou a arte", target: "Crédito Rural #03", when: "há 5 min" },
  { who: "Pedro", action: "criou tarefa em", target: "Conta Jovem", when: "há 22 min" },
  { who: "Marina", action: "comentou em", target: "Briefing Feira", when: "há 1 h" },
  { who: "Lucas", action: "subiu material em", target: "Banco de Conteúdo", when: "há 2 h" },
];

const notifications = [
  { title: "Contrato Rádio Cidade vence em 4 dias", tone: "warning" as const },
  { title: "Estoque baixo: Squeeze Térmico", tone: "warning" as const },
  { title: "Nova aprovação solicitada por Ana", tone: "primary" as const },
];

// ------------------------------ Helpers ------------------------------

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ------------------------------ UI ------------------------------

function Section({
  icon: Icon,
  title,
  hint,
  to,
  children,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  to?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group rounded-xl border border-border bg-surface/60 p-5 transition-all duration-200 hover:border-border-strong ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-elevated text-foreground/80">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
          {hint && <span className="text-xs text-muted-foreground">· {hint}</span>}
        </div>
        {to && (
          <Link
            to={to}
            className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver tudo <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function MiniCalendar() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const monthName = today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const marked = new Set([3, 8, 12, 18, 24]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-sm font-semibold capitalize">{monthName}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i} className="py-1">{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const isToday = d === today.getDate();
          const has = marked.has(d);
          return (
            <button
              key={i}
              type="button"
              className={`relative aspect-square rounded-md text-xs tabular transition-colors ${
                isToday
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "text-foreground/80 hover:bg-surface-elevated"
              }`}
            >
              {d}
              {has && !isToday && (
                <span className="absolute inset-x-0 bottom-1 mx-auto h-1 w-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrioridadesPage() {
  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {greeting()}, {userName} <span className="ml-1">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Seu centro operacional —{" "}
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
            .
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:-translate-y-0.5"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Plus className="h-4 w-4" />
          Nova ação
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            to={k.to}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]"
          >
            <div
              className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl ${toneRing[k.tone]}`}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {k.label}
              </span>
              <k.icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
            <div className="relative mt-3 flex items-end justify-between">
              <span className="tabular font-display text-2xl font-semibold tracking-tight">
                {k.value}
              </span>
              <span className="text-[11px] text-muted-foreground">{k.hint}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* LEFT — operational cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Section icon={Flame} title="🔥 Prioridades de hoje" hint={`${priorities.length} itens`} className="md:col-span-2">
            <ul className="space-y-2">
              {priorities.map((p) => (
                <li
                  key={p.title}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface-elevated/40 px-3 py-2.5 transition-colors hover:border-border-strong"
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      p.level === "alta"
                        ? "bg-[color:var(--color-destructive)] shadow-[0_0_8px_var(--color-destructive)]"
                        : "bg-[color:var(--color-warning)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.meta}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={CalendarDays} title="📅 Próximos eventos" to="/eventos">
            <ul className="space-y-2">
              {upcomingEvents.map((e) => (
                <li key={e.name} className="flex items-center gap-3">
                  <div className="flex h-11 w-11 flex-col items-center justify-center rounded-lg border border-border bg-surface-elevated text-center">
                    <span className="text-[9px] uppercase text-muted-foreground">
                      {e.date.split(" ")[1]}
                    </span>
                    <span className="tabular font-display text-sm font-semibold leading-none">
                      {e.date.split(" ")[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.place}</p>
                  </div>
                  <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {e.tag}
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Megaphone} title="📢 Campanhas em andamento" to="/campanhas">
            <ul className="space-y-3">
              {runningCampaigns.map((c) => (
                <li key={c.name}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <span className="tabular text-xs text-muted-foreground">{c.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${c.progress}%`,
                        backgroundImage: "var(--gradient-primary)",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {c.owner} · {c.channel}
                  </p>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={FileWarning} title="📄 Contratos vencendo" to="/contratos">
            <ul className="space-y-2">
              {expiringContracts.map((c) => (
                <li
                  key={c.partner}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-elevated/40 px-3 py-2"
                >
                  <span className="truncate text-sm">{c.partner}</span>
                  <span
                    className={`tabular rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      c.days <= 7
                        ? "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]"
                        : "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
                    }`}
                  >
                    {c.days}d
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={PackageMinus} title="🎁 Estoque baixo de brindes" to="/brindes">
            <ul className="space-y-3">
              {lowStock.map((s) => {
                const pct = Math.round((s.stock / s.min) * 100);
                return (
                  <li key={s.item}>
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm">{s.item}</span>
                      <span className="tabular text-xs text-muted-foreground">
                        {s.stock}/{s.min}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                      <div
                        className="h-full rounded-full bg-[color:var(--color-warning)]"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section icon={MapPin} title="📍 Outdoor com retirada próxima" to="/midia-offline">
            <ul className="space-y-2">
              {outdoorPickup.map((o) => (
                <li
                  key={o.spot}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-elevated/40 px-3 py-2"
                >
                  <span className="truncate text-sm">{o.spot}</span>
                  <span className="text-xs text-muted-foreground">{o.date}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Smartphone} title="📱 Publicações agendadas" to="/conteudos">
            <ul className="space-y-2">
              {scheduledPosts.map((p) => (
                <li key={p.title} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md border border-border bg-surface-elevated" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.channel} · {p.when}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Wallet} title="💰 Financeiro pendente" to="/financeiro" className="md:col-span-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pendingFinance.map((f) => (
                <div
                  key={f.desc}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-elevated/40 px-3 py-2.5"
                >
                  <span className="truncate text-sm">{f.desc}</span>
                  <span className="tabular text-sm font-semibold text-foreground">{f.value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* RIGHT — sidebar */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface/60 p-5">
            <MiniCalendar />
          </div>

          <div className="rounded-xl border border-border bg-surface/60 p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-elevated">
                <Activity className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <h2 className="font-display text-sm font-semibold">Atividade recente</h2>
            </div>
            <ul className="space-y-3">
              {recentActivity.map((a, i) => (
                <li key={i} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[11px] font-semibold">
                    {a.who[0]}
                  </div>
                  <div className="min-w-0 flex-1 text-xs leading-relaxed">
                    <span className="font-medium text-foreground">{a.who}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>{" "}
                    <span className="font-medium text-foreground">{a.target}</span>
                    <p className="text-[11px] text-muted-foreground">{a.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface/60 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-elevated">
                  <Bell className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                <h2 className="font-display text-sm font-semibold">Notificações</h2>
              </div>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {notifications.length}
              </span>
            </div>
            <ul className="space-y-2">
              {notifications.map((n, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-surface-elevated/40 px-3 py-2.5"
                >
                  <span
                    className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                      n.tone === "warning"
                        ? "bg-[color:var(--color-warning)]"
                        : "bg-primary shadow-[0_0_8px_var(--color-primary)]"
                    }`}
                  />
                  <p className="text-xs leading-relaxed">{n.title}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
