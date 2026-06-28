import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Target,
  Plus,
  TrendingUp,
  Calendar as CalendarIcon,
  Sparkles,
  Activity,
  Wallet,
  CheckCircle2,
  ListChecks,
  BarChart3,
  ClipboardList,
  Trophy,
  Users,
  FileText,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useStrategicPlans,
  strategicStore,
  PLAN_MODULES,
  OBJECTIVE_PRESETS,
  COMMERCIAL_CALENDAR,
  planProgress,
  formatBRL,
  type PlanModuleKey,
  type StrategicPlan,
} from "@/lib/strategic-planning";

export const Route = createFileRoute("/planejamento")({
  head: () => ({
    meta: [
      { title: "Planejamento Estratégico — Marketing Hub" },
      { name: "description", content: "Planejamento estratégico anual: objetivos, metas, calendário comercial, orçamento e indicadores." },
    ],
  }),
  component: PlanejamentoPage,
});

type SectionKey = "visao" | "objetivos" | "metas" | "calendario" | "orcamento" | "indicadores" | "resultados";

const SECTIONS: { key: SectionKey; label: string; icon: typeof Target }[] = [
  { key: "visao", label: "Visão Geral", icon: Sparkles },
  { key: "objetivos", label: "Objetivos", icon: Target },
  { key: "metas", label: "Metas", icon: ListChecks },
  { key: "calendario", label: "Calendário Comercial", icon: CalendarIcon },
  { key: "orcamento", label: "Orçamento", icon: Wallet },
  { key: "indicadores", label: "Indicadores", icon: BarChart3 },
  { key: "resultados", label: "Resultados", icon: Trophy },
];

function PlanejamentoPage() {
  const plans = useStrategicPlans();
  const [activeId, setActiveId] = useState<string>(plans[0]?.id ?? "");
  const [section, setSection] = useState<SectionKey>("visao");
  const [dialogOpen, setDialogOpen] = useState(false);

  const plan = plans.find((p) => p.id === activeId) ?? plans[0];

  return (
    <AppShell>
      <PageHeader
        title="Planejamento Estratégico"
        description="O ponto inicial de toda a operação. Nenhuma campanha existe sem um planejamento."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Novo Planejamento
              </Button>
            </DialogTrigger>
            <NewPlanDialog onClose={() => setDialogOpen(false)} onCreated={(id) => { setActiveId(id); setSection("visao"); }} />
          </Dialog>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-surface/60 p-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planejamentos</p>
            <div className="space-y-1">
              {plans.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveId(p.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    p.id === plan?.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
                  )}
                >
                  <div className="font-medium">{p.year}</div>
                  <div className="truncate text-xs opacity-80">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {plan && (
            <nav className="rounded-xl border border-border bg-surface/60 p-2">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = section === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSection(s.key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          )}
        </aside>

        <section className="min-w-0 space-y-6">
          {!plan && (
            <div className="rounded-xl border border-dashed border-border bg-surface/40 p-12 text-center">
              <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Crie seu primeiro planejamento estratégico para começar.</p>
            </div>
          )}
          {plan && section === "visao" && <Overview plan={plan} />}
          {plan && section === "objetivos" && <Objectives plan={plan} />}
          {plan && section === "metas" && <Goals plan={plan} />}
          {plan && section === "calendario" && <CommercialCalendar plan={plan} />}
          {plan && section === "orcamento" && <Budget plan={plan} />}
          {plan && section === "indicadores" && <Indicators plan={plan} />}
          {plan && section === "resultados" && <Results plan={plan} />}
        </section>
      </div>
    </AppShell>
  );
}

// ───────── Sections ─────────

function Overview({ plan }: { plan: StrategicPlan }) {
  const progress = planProgress(plan);
  const budgetPct = plan.annualBudget > 0 ? Math.round((plan.realizedBudget / plan.annualBudget) * 100) : 0;
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-surface/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-2">{plan.status}</Badge>
            <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{plan.description}</p>
          </div>
          <div className="text-right text-sm">
            <div className="text-muted-foreground">Responsável</div>
            <div className="font-medium">{plan.owner}</div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span><CalendarIcon className="mr-1 inline h-3.5 w-3.5" />{plan.startDate} → {plan.endDate}</span>
          <span><Users className="mr-1 inline h-3.5 w-3.5" />{plan.team.length + 1} pessoas</span>
          <span><Wallet className="mr-1 inline h-3.5 w-3.5" />{formatBRL(plan.annualBudget)} aprovado</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Progresso Geral" value={`${progress}%`} icon={Activity} />
        <KpiCard label="Objetivos" value={String(plan.objectives.length)} icon={Target} />
        <KpiCard label="Metas" value={String(plan.goals.length)} icon={ListChecks} />
        <KpiCard label="Orçamento Utilizado" value={`${budgetPct}%`} icon={Wallet} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Módulos Gerados" icon={Sparkles}>
          <div className="flex flex-wrap gap-2">
            {plan.modules.map((m) => (
              <Badge key={m} variant="outline">{PLAN_MODULES.find((x) => x.key === m)?.label}</Badge>
            ))}
            {plan.modules.length === 0 && <p className="text-sm text-muted-foreground">Nenhum módulo gerado.</p>}
          </div>
        </Card>
        <Card title="Timeline" icon={Activity}>
          <ul className="space-y-2.5">
            {plan.timeline.slice(-6).reverse().map((t) => (
              <li key={t.id} className="flex gap-2.5 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-success)]" />
                <div className="min-w-0">
                  <div>{t.description}</div>
                  <div className="text-xs text-muted-foreground">{t.actor} · {new Date(t.at).toLocaleString("pt-BR")}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Objectives({ plan }: { plan: StrategicPlan }) {
  const [title, setTitle] = useState("");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Novo objetivo estratégico…" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Button
          onClick={() => {
            if (!title.trim()) return;
            strategicStore.addObjective(plan.id, title.trim());
            setTitle("");
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {plan.objectives.map((o) => {
          const goals = plan.goals.filter((g) => g.objectiveId === o.id);
          const avg = goals.length ? Math.round(goals.reduce((a, g) => a + Math.min(100, (g.current / Math.max(1, g.target)) * 100), 0) / goals.length) : 0;
          return (
            <div key={o.id} className="rounded-xl border border-border bg-surface/60 p-4">
              <div className="flex items-start gap-2">
                <Target className="mt-0.5 h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{o.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{goals.length} meta(s) · {o.campaignIds.length} campanha(s)</p>
                  <div className="mt-3">
                    <Progress value={avg} className="h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{avg}% atingido</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {plan.objectives.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">Adicione objetivos estratégicos para começar.</p>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-surface/40 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sugestões</p>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVE_PRESETS.filter((p) => !plan.objectives.some((o) => o.title === p)).map((p) => (
            <Button key={p} variant="outline" size="sm" onClick={() => strategicStore.addObjective(plan.id, p)}>
              <Plus className="mr-1 h-3.5 w-3.5" />{p}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Goals({ plan }: { plan: StrategicPlan }) {
  return (
    <div className="space-y-3">
      {plan.goals.map((g) => {
        const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
        const obj = plan.objectives.find((o) => o.id === g.objectiveId);
        return (
          <div key={g.id} className="rounded-xl border border-border bg-surface/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Badge variant="outline" className="mb-1.5">{obj?.title ?? "Sem objetivo"}</Badge>
                <p className="font-medium">{g.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{g.indicator} · {g.owner} · Prazo {g.deadline}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums">{g.current.toLocaleString("pt-BR")}<span className="text-sm text-muted-foreground"> / {g.target.toLocaleString("pt-BR")} {g.unit}</span></p>
                <Badge variant="outline" className="mt-1">{g.status}</Badge>
              </div>
            </div>
            <Progress value={pct} className="mt-3 h-1.5" />
          </div>
        );
      })}
      {plan.goals.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada ainda.</p>}
    </div>
  );
}

function CommercialCalendar({ plan }: { plan: StrategicPlan }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {plan.calendar.sort((a, b) => a.month - b.month).map((c) => {
        const monthLabel = COMMERCIAL_CALENDAR.find((m) => m.month === c.month)?.label ?? "";
        return (
          <div key={c.id} className="group relative overflow-hidden rounded-xl border border-border bg-surface/60 p-4 transition-colors hover:border-border-strong">
            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundImage: "var(--gradient-primary)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{monthLabel}</p>
            <p className="mt-1 font-display text-lg font-semibold">{c.theme}</p>
            {c.campaignName ? (
              <Badge variant="outline" className="mt-3 gap-1"><Sparkles className="h-3 w-3" />{c.campaignName}</Badge>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">Sem campanha vinculada</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Budget({ plan }: { plan: StrategicPlan }) {
  const remaining = plan.annualBudget - plan.realizedBudget;
  const pct = plan.annualBudget > 0 ? Math.round((plan.realizedBudget / plan.annualBudget) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Previsto" value={formatBRL(plan.annualBudget)} icon={Wallet} />
        <KpiCard label="Realizado" value={formatBRL(plan.realizedBudget)} icon={Activity} />
        <KpiCard label="Saldo" value={formatBRL(remaining)} icon={TrendingUp} />
      </div>
      <div className="rounded-xl border border-border bg-surface/60 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Execução Orçamentária</span>
          <span className="tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="mt-3 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">Cada campanha vinculada a este planejamento consome o orçamento anual.</p>
      </div>
    </div>
  );
}

function Indicators({ plan }: { plan: StrategicPlan }) {
  const data = plan.kpis.map((k) => ({
    name: k.name,
    Atingido: Math.min(100, Math.round((k.current / Math.max(1, k.target)) * 100)),
  }));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {plan.kpis.map((k) => {
          const pct = Math.min(100, Math.round((k.current / Math.max(1, k.target)) * 100));
          return (
            <div key={k.id} className="rounded-xl border border-border bg-surface/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{k.name}</p>
              <p className="mt-2 font-display text-2xl font-semibold tabular-nums">
                {k.current}{k.unit} <span className="text-sm text-muted-foreground">/ {k.target}{k.unit}</span>
              </p>
              <Progress value={pct} className="mt-3 h-1.5" />
            </div>
          );
        })}
        {plan.kpis.length === 0 && <p className="text-sm text-muted-foreground">Nenhum KPI cadastrado.</p>}
      </div>

      {data.length > 0 && (
        <div className="rounded-xl border border-border bg-surface/60 p-4">
          <p className="mb-3 text-sm font-medium">Performance dos KPIs</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Atingido" radius={[6, 6, 0, 0]}>
                  {data.map((_, i) => <Cell key={i} fill="var(--color-primary)" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function Results({ plan }: { plan: StrategicPlan }) {
  const progress = planProgress(plan);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface/60 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary"><Trophy className="h-5 w-5" /></div>
          <div>
            <h3 className="font-display text-lg font-semibold">Relatório Executivo {plan.year}</h3>
            <p className="text-sm text-muted-foreground">Gerado automaticamente com base na execução do planejamento.</p>
          </div>
        </div>
        <Separator className="my-5" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ResultStat label="Objetivos" value={String(plan.objectives.length)} />
          <ResultStat label="Metas" value={String(plan.goals.length)} />
          <ResultStat label="Progresso" value={`${progress}%`} />
          <ResultStat label="Investimento" value={formatBRL(plan.realizedBudget)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Lições Aprendidas" icon={FileText}>
          <p className="text-sm text-muted-foreground">
            Esta seção será populada conforme as campanhas vinculadas ao planejamento forem encerradas.
          </p>
        </Card>
        <Card title="Próximos Passos" icon={ClipboardList}>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Revisar metas com desempenho abaixo de 60%</li>
            <li>• Replicar campanhas com ROI superior à média</li>
            <li>• Iniciar planejamento do próximo ciclo</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ───────── Helpers ─────────

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Target }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: typeof Target; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ResultStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-elevated/40 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ───────── New Plan Dialog ─────────

function NewPlanDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear + 1);
  const [name, setName] = useState(`Planejamento Estratégico ${currentYear + 1}`);
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState("Bruno Ferreira");
  const [team, setTeam] = useState("Marina Souza, Carlos Lima");
  const [startDate, setStartDate] = useState(`${currentYear + 1}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear + 1}-12-31`);
  const [budget, setBudget] = useState(2000000);
  const [objectives, setObjectives] = useState<string[]>(["Aumentar Base de Cooperados", "Fortalecer Marca"]);
  const [modules, setModules] = useState<PlanModuleKey[]>(PLAN_MODULES.map((m) => m.key));

  const toggleObj = (t: string) => setObjectives((arr) => (arr.includes(t) ? arr.filter((x) => x !== t) : [...arr, t]));
  const toggleMod = (k: PlanModuleKey) => setModules((arr) => (arr.includes(k) ? arr.filter((x) => x !== k) : [...arr, k]));

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Novo Planejamento Estratégico</DialogTitle>
        <DialogDescription>Defina o ciclo anual e gere automaticamente os módulos relacionados.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <div>
            <Label className="text-xs">Ano</Label>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Responsável</Label>
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Equipe (separar por vírgula)</Label>
            <Input value={team} onChange={(e) => setTeam(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Início</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Término</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Orçamento Anual (R$)</Label>
            <Input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <Label className="text-xs">Objetivos Estratégicos</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {OBJECTIVE_PRESETS.map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm">
                <Checkbox checked={objectives.includes(o)} onCheckedChange={() => toggleObj(o)} />
                <span>{o}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs">Deseja gerar automaticamente?</Label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {PLAN_MODULES.map((m) => (
              <label key={m.key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm">
                <Checkbox checked={modules.includes(m.key)} onCheckedChange={() => toggleMod(m.key)} />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          onClick={() => {
            const plan = strategicStore.add({
              year, name, description, owner,
              team: team.split(",").map((t) => t.trim()).filter(Boolean),
              startDate, endDate, annualBudget: budget,
              objectives, modules,
            });
            onCreated(plan.id);
            onClose();
          }}
        >
          <Sparkles className="mr-1 h-4 w-4" /> Criar Planejamento
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
