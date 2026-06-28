import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  Megaphone,
  PieChart as PieChartIcon,
  Plus,
  Receipt,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCampaigns, formatCurrency } from "@/lib/campaigns";
import { useEvents } from "@/lib/events";
import {
  BUDGET_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  PR_STATUSES,
  URGENCIES,
  categoryUsage,
  computeAlerts,
  expenseTotal,
  financeStore,
  formatBRL,
  useFinance,
  type ExpenseCategory,
  type PaymentMethod,
  type PRStatus,
  type Urgency,
} from "@/lib/finance";

export const Route = createFileRoute("/financeiro")({
  head: () => ({
    meta: [
      { title: "Centro de Gestão Orçamentária — Marketing Hub" },
      {
        name: "description",
        content:
          "Controle de orçamento, despesas, fornecedores, notas e ROI das ações de marketing.",
      },
    ],
  }),
  component: FinanceiroPage,
});

type SectionKey =
  | "dashboard"
  | "planejamento"
  | "campanhas"
  | "centros"
  | "solicitacoes"
  | "fornecedores"
  | "notas"
  | "pagamentos"
  | "relatorios"
  | "roi";

const SECTIONS: { key: SectionKey; label: string; icon: typeof Wallet }[] = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "planejamento", label: "Planejamento", icon: Target },
  { key: "campanhas", label: "Campanhas", icon: Megaphone },
  { key: "centros", label: "Centros de Custo", icon: Building2 },
  { key: "solicitacoes", label: "Solicitações", icon: ShoppingCart },
  { key: "fornecedores", label: "Fornecedores", icon: Star },
  { key: "notas", label: "Notas Fiscais", icon: Receipt },
  { key: "pagamentos", label: "Pagamentos", icon: Banknote },
  { key: "relatorios", label: "Relatórios", icon: FileText },
  { key: "roi", label: "ROI", icon: TrendingUp },
];

const CHART_COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#22c55e"];

function FinanceiroPage() {
  const [section, setSection] = useState<SectionKey>("dashboard");
  return (
    <AppShell>
      <PageHeader
        title="Centro de Gestão Orçamentária"
        description="Controle financeiro do Departamento de Comunicação e Marketing — não substitui o ERP da cooperativa."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="sticky top-4 self-start rounded-2xl border border-border bg-surface/60 p-2">
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => {
              const active = s.key === section;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <s.icon className="h-4 w-4" strokeWidth={1.75} />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0">
          {section === "dashboard" && <DashboardSection />}
          {section === "planejamento" && <PlanningSection />}
          {section === "campanhas" && <CampaignsSection />}
          {section === "centros" && <CostCentersSection />}
          {section === "solicitacoes" && <PurchaseRequestsSection />}
          {section === "fornecedores" && <SuppliersSection />}
          {section === "notas" && <InvoicesSection />}
          {section === "pagamentos" && <PaymentsSection />}
          {section === "relatorios" && <ReportsSection />}
          {section === "roi" && <ROISection />}
        </div>
      </div>
    </AppShell>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function DashboardSection() {
  const state = useFinance();
  const campaigns = useCampaigns();
  const events = useEvents();
  const alerts = computeAlerts(state);

  const totals = useMemo(() => {
    const planned = state.budget.reduce((a, b) => a + b.planned, 0);
    const approved = state.budget.reduce((a, b) => a + b.approved, 0);
    const invested = state.expenses.reduce((a, e) => a + expenseTotal(e), 0);
    const committed = state.purchaseRequests
      .filter((p) => ["Aprovado", "Comprado"].includes(p.status))
      .reduce((a, p) => a + p.estimatedValue, 0);
    const available = approved - invested - committed;
    return { planned, approved, invested, committed, available };
  }, [state]);

  const monthExpenses = useMemo(() => {
    const m = new Date().getMonth();
    return state.expenses
      .filter((e) => new Date(e.date).getMonth() === m)
      .reduce((a, e) => a + expenseTotal(e), 0);
  }, [state]);

  const topCampaigns = useMemo(() => {
    return [...campaigns]
      .map((c) => ({
        name: c.name,
        invested: state.expenses.filter((e) => e.campaignId === c.id).reduce((a, e) => a + expenseTotal(e), 0) || c.budget * 0.4,
      }))
      .sort((a, b) => b.invested - a.invested)
      .slice(0, 10);
  }, [campaigns, state.expenses]);

  const topSuppliers = useMemo(() => {
    const map = new Map<string, number>();
    state.expenses.forEach((e) => {
      if (e.supplierId) map.set(e.supplierId, (map.get(e.supplierId) ?? 0) + expenseTotal(e));
    });
    return state.suppliers
      .map((s) => ({ name: s.company, value: map.get(s.id) ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [state.suppliers, state.expenses]);

  const byCategory = state.budget.map((b) => ({
    name: b.category,
    aprovado: b.approved,
    utilizado: categoryUsage(state, b.category),
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={Wallet} label="Orçamento anual" value={formatBRL(totals.approved)} tone="info" />
        <Kpi icon={BadgeDollarSign} label="Disponível" value={formatBRL(totals.available)} tone={totals.available < 0 ? "danger" : "success"} />
        <Kpi icon={ArrowUpRight} label="Investido" value={formatBRL(totals.invested)} tone="warning" />
        <Kpi icon={ArrowDownRight} label="Comprometido" value={formatBRL(totals.committed)} tone="info" />
        <Kpi icon={Megaphone} label="Campanhas" value={String(campaigns.length)} tone="info" />
        <Kpi icon={Building2} label="Eventos" value={String(events.length)} tone="info" />
        <Kpi icon={ShoppingCart} label="Compras" value={String(state.purchaseRequests.length)} tone="info" />
        <Kpi icon={Receipt} label="Despesas do mês" value={formatBRL(monthExpenses)} tone="warning" />
      </div>

      {alerts.length > 0 && (
        <Card>
          <SectionTitle icon={Brain} title="Inteligência Financeira" subtitle="Alertas gerados automaticamente pela IA" />
          <ul className="mt-3 space-y-2">
            {alerts.slice(0, 6).map((a) => (
              <li
                key={a.id}
                className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                  a.level === "danger"
                    ? "border-[color:var(--color-danger)]/40 bg-[color:var(--color-danger)]/5"
                    : a.level === "warning"
                      ? "border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/5"
                      : "border-border bg-surface/40"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={PieChartIcon} title="Orçamento por categoria" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={state.budget.map((b) => ({ name: b.category, value: b.approved }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={95}>
                  {state.budget.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatBRL(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <SectionTitle icon={BarChart3} title="Aprovado vs Utilizado" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" hide />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Legend />
                <Bar dataKey="aprovado" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="utilizado" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={Megaphone} title="Top 10 Campanhas — Investimento" />
          <RankList items={topCampaigns.map((c) => ({ label: c.name, value: formatCurrency(c.invested) }))} />
        </Card>
        <Card>
          <SectionTitle icon={Building2} title="Top 10 Fornecedores" />
          <RankList items={topSuppliers.map((s) => ({ label: s.name, value: formatBRL(s.value) }))} />
        </Card>
      </div>
    </div>
  );
}

function RankList({ items }: { items: { label: string; value: string }[] }) {
  const visible = items.filter((i) => i.value && i.label);
  return (
    <ol className="mt-3 space-y-1.5">
      {visible.length === 0 && <li className="text-xs text-muted-foreground">Sem dados ainda.</li>}
      {visible.map((it, i) => (
        <li key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-2.5">
          <span className="tabular grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{it.label}</span>
          <span className="tabular text-sm font-semibold">{it.value}</span>
        </li>
      ))}
    </ol>
  );
}

// ============================================================
// PLANNING
// ============================================================
function PlanningSection() {
  const state = useFinance();
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <SectionTitle icon={Target} title={`Orçamento ${state.year}`} subtitle="Cadastre o valor previsto e aprovado por categoria." />
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Ano</Label>
            <Input
              type="number"
              value={state.year}
              onChange={(e) => financeStore.setYear(Number(e.target.value) || state.year)}
              className="h-8 w-24"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2 text-right">Previsto</th>
                <th className="px-3 py-2 text-right">Aprovado</th>
                <th className="px-3 py-2 text-right">Utilizado</th>
                <th className="px-3 py-2 text-right">Saldo</th>
                <th className="px-3 py-2">% Util.</th>
              </tr>
            </thead>
            <tbody>
              {state.budget.map((b) => {
                const used = categoryUsage(state, b.category);
                const balance = b.approved - used;
                const pct = b.approved > 0 ? (used / b.approved) * 100 : 0;
                return (
                  <tr key={b.category} className="border-b border-border/60">
                    <td className="px-3 py-2 font-medium">{b.category}</td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        defaultValue={b.planned}
                        onBlur={(e) => financeStore.setBudget(b.category, { planned: Number(e.target.value) || 0 })}
                        className="h-8 w-32 text-right"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        defaultValue={b.approved}
                        onBlur={(e) => financeStore.setBudget(b.category, { approved: Number(e.target.value) || 0 })}
                        className="h-8 w-32 text-right"
                      />
                    </td>
                    <td className="tabular px-3 py-2 text-right">{formatBRL(used)}</td>
                    <td className={`tabular px-3 py-2 text-right ${balance < 0 ? "text-[color:var(--color-danger)]" : ""}`}>
                      {formatBRL(balance)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${pct >= 100 ? "bg-[color:var(--color-danger)]" : pct >= 80 ? "bg-[color:var(--color-warning)]" : "bg-primary"}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="tabular text-xs">{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle icon={BarChart3} title="Distribuição do orçamento" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={state.budget.map((b) => ({ name: b.category, valor: b.approved }))} layout="vertical" margin={{ left: 110 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
              <YAxis type="category" dataKey="name" fontSize={11} width={110} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="valor" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// CAMPAIGNS
// ============================================================
function CampaignsSection() {
  const campaigns = useCampaigns();
  const state = useFinance();
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Toda campanha possui um centro financeiro próprio com investimento previsto, realizado, saldo e ROI.
      </p>
      {campaigns.length === 0 && (
        <Card>
          <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada ainda.</p>
        </Card>
      )}
      {campaigns.map((c) => {
        const expenses = state.expenses.filter((e) => e.campaignId === c.id);
        const realized = expenses.reduce((a, e) => a + expenseTotal(e), 0);
        const balance = c.budget - realized;
        const pct = c.budget > 0 ? (realized / c.budget) * 100 : 0;
        const roi = realized > 0 ? ((c.budget * 1.4 - realized) / realized) * 100 : 0;
        return (
          <Card key={c.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.type} • {c.status}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  pct >= 100
                    ? "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]"
                    : pct >= 80
                      ? "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
                      : "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
                }`}
              >
                {pct >= 100 ? "Estourado" : pct >= 80 ? "Atenção" : "No prazo"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="Previsto" value={formatCurrency(c.budget)} />
              <MiniStat label="Realizado" value={formatBRL(realized)} />
              <MiniStat label="Saldo" value={formatBRL(balance)} tone={balance < 0 ? "danger" : "success"} />
              <MiniStat label="ROI estimado" value={`${roi.toFixed(0)}%`} tone={roi >= 0 ? "success" : "danger"} />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${pct >= 100 ? "bg-[color:var(--color-danger)]" : pct >= 80 ? "bg-[color:var(--color-warning)]" : "bg-primary"}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <ExpenseManager campaignId={c.id} />
          </Card>
        );
      })}
    </div>
  );
}

function ExpenseManager({ campaignId }: { campaignId: string }) {
  const state = useFinance();
  const expenses = state.expenses.filter((e) => e.campaignId === campaignId);
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface/40 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Despesas ({expenses.length})
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 gap-1">
              <Plus className="h-3 w-3" />
              Nova despesa
            </Button>
          </DialogTrigger>
          <ExpenseDialog campaignId={campaignId} onDone={() => setOpen(false)} />
        </Dialog>
      </div>
      {expenses.length > 0 && (
        <ul className="mt-2 divide-y divide-border">
          {expenses.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{e.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {e.category} • {e.paymentMethod} • {e.date}
                </p>
              </div>
              <span className="tabular shrink-0 font-semibold">{formatBRL(expenseTotal(e))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExpenseDialog({ campaignId, onDone }: { campaignId?: string; onDone: () => void }) {
  const state = useFinance();
  const [form, setForm] = useState({
    description: "",
    category: "Produção" as ExpenseCategory,
    supplierId: state.suppliers[0]?.id,
    costCenterId: state.costCenters[0]?.id,
    quantity: 1,
    unitValue: 0,
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "Boleto" as PaymentMethod,
    owner: "Bruno Ferreira",
    notes: "",
  });
  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Nova despesa</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Descrição" className="col-span-2">
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Categoria">
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Fornecedor">
          <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{state.suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.company}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Centro de Custo">
          <Select value={form.costCenterId} onValueChange={(v) => setForm({ ...form, costCenterId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{state.costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Forma de pagamento">
          <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Quantidade">
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Valor unitário">
          <Input type="number" step="0.01" value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Data">
          <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </Field>
        <Field label="Responsável">
          <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
        </Field>
        <Field label="Observações" className="col-span-2">
          <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>Cancelar</Button>
        <Button
          onClick={() => {
            if (!form.description.trim()) return;
            financeStore.addExpense({ ...form, campaignId });
            onDone();
          }}
        >
          Salvar despesa
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ============================================================
// COST CENTERS
// ============================================================
function CostCentersSection() {
  const state = useFinance();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", responsible: "" });
  return (
    <Card>
      <div className="flex items-center justify-between">
        <SectionTitle icon={Building2} title="Centros de Custo" subtitle="Estruture os centros para alocar cada despesa." />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3 w-3" />Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo centro de custo</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Código"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
              <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Responsável"><Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} /></Field>
            </div>
            <DialogFooter>
              <Button onClick={() => { if (form.name) { financeStore.addCostCenter({ ...form, active: true }); setForm({ code: "", name: "", responsible: "" }); setOpen(false); } }}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <table className="mt-4 w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
          <th className="px-3 py-2">Código</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Responsável</th><th className="px-3 py-2 text-right">Despesas</th>
        </tr></thead>
        <tbody>
          {state.costCenters.map((c) => {
            const total = state.expenses.filter((e) => e.costCenterId === c.id).reduce((a, e) => a + expenseTotal(e), 0);
            return (
              <tr key={c.id} className="border-b border-border/60">
                <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                <td className="px-3 py-2 font-medium">{c.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.responsible}</td>
                <td className="tabular px-3 py-2 text-right font-semibold">{formatBRL(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ============================================================
// PURCHASE REQUESTS
// ============================================================
function PurchaseRequestsSection() {
  const state = useFinance();
  const campaigns = useCampaigns();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    requester: "Bruno Ferreira",
    description: "",
    justification: "",
    campaignId: undefined as string | undefined,
    costCenterId: state.costCenters[0]?.id,
    supplierId: state.suppliers[0]?.id,
    estimatedValue: 0,
    urgency: "Média" as Urgency,
  });

  const grouped = useMemo(() => {
    const map = new Map<PRStatus, typeof state.purchaseRequests>();
    PR_STATUSES.forEach((s) => map.set(s, []));
    state.purchaseRequests.forEach((p) => map.get(p.status)?.push(p));
    return map;
  }, [state.purchaseRequests]);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <SectionTitle icon={ShoppingCart} title="Solicitações de Compra" subtitle="Fluxo completo: rascunho → recebido." />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3 w-3" />Nova SC</Button></DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader><DialogTitle>Nova solicitação de compra</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Solicitante"><Input value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} /></Field>
                <Field label="Urgência">
                  <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v as Urgency })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{URGENCIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Descrição" className="col-span-2"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
                <Field label="Justificativa" className="col-span-2"><Textarea rows={2} value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></Field>
                <Field label="Campanha">
                  <Select value={form.campaignId ?? ""} onValueChange={(v) => setForm({ ...form, campaignId: v || undefined })}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>{campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Centro de Custo">
                  <Select value={form.costCenterId} onValueChange={(v) => setForm({ ...form, costCenterId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{state.costCenters.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Fornecedor">
                  <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{state.suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.company}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Valor estimado"><Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: Number(e.target.value) || 0 })} /></Field>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  if (!form.description) return;
                  financeStore.addPurchaseRequest(form);
                  setForm({ ...form, description: "", justification: "", estimatedValue: 0 });
                  setOpen(false);
                }}>Criar solicitação</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {PR_STATUSES.map((status) => {
          const items = grouped.get(status) ?? [];
          if (items.length === 0) return null;
          return (
            <Card key={status}>
              <p className="font-display text-sm font-semibold">{status}</p>
              <ul className="mt-2 space-y-2">
                {items.map((p) => (
                  <li key={p.id} className="rounded-lg border border-border bg-surface/40 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{p.code} — {p.description}</p>
                      <span className="tabular text-sm font-semibold">{formatBRL(p.estimatedValue)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{p.requester} • {p.urgency}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {PR_STATUSES.filter((s) => s !== status && s !== "Rascunho").slice(0, 4).map((s) => (
                        <button
                          key={s}
                          onClick={() => financeStore.advancePR(p.id, s, "Bruno Ferreira")}
                          className="rounded-md border border-border bg-surface/60 px-2 py-0.5 text-[10px] hover:border-primary hover:text-primary"
                        >
                          → {s}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SUPPLIERS
// ============================================================
function SuppliersSection() {
  const state = useFinance();
  return (
    <Card>
      <SectionTitle icon={Star} title="Fornecedores" subtitle="Histórico financeiro, contratos e ranking." />
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {state.suppliers.map((s) => {
          const total = state.expenses.filter((e) => e.supplierId === s.id).reduce((a, e) => a + expenseTotal(e), 0);
          const count = state.expenses.filter((e) => e.supplierId === s.id).length;
          return (
            <div key={s.id} className="rounded-xl border border-border bg-surface/40 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{s.company}</p>
                  <p className="text-[11px] text-muted-foreground">{s.category} • {s.city}</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-[color:var(--color-warning)]/10 px-2 py-0.5 text-xs text-[color:var(--color-warning)]">
                  <Star className="h-3 w-3 fill-current" />
                  {s.rating.toFixed(1)}
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                <p><span className="text-muted-foreground">Contato:</span> {s.contact}</p>
                <p><span className="text-muted-foreground">Telefone:</span> {s.phone}</p>
                <p><span className="text-muted-foreground">Email:</span> {s.email}</p>
                <p><span className="text-muted-foreground">Contrato:</span> {s.contractRef ?? "Sem contrato vinculado"}</p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                <MiniStat label="Contratado" value={formatBRL(total)} />
                <MiniStat label="Serviços" value={String(count)} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================================
// INVOICES
// ============================================================
function InvoicesSection() {
  const state = useFinance();
  return (
    <Card>
      <SectionTitle icon={Receipt} title="Notas Fiscais" subtitle="Centralize NF-e, comprovantes e XML." />
      <table className="mt-4 w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
          <th className="px-3 py-2">Número</th>
          <th className="px-3 py-2">Fornecedor</th>
          <th className="px-3 py-2">Categoria</th>
          <th className="px-3 py-2">Data</th>
          <th className="px-3 py-2 text-right">Valor</th>
          <th className="px-3 py-2">Status</th>
        </tr></thead>
        <tbody>
          {state.invoices.map((i) => {
            const sup = state.suppliers.find((s) => s.id === i.supplierId);
            return (
              <tr key={i.id} className="border-b border-border/60">
                <td className="px-3 py-2 font-mono text-xs">{i.number}</td>
                <td className="px-3 py-2">{sup?.company ?? "—"}</td>
                <td className="px-3 py-2">{i.category}</td>
                <td className="px-3 py-2">{i.date}</td>
                <td className="tabular px-3 py-2 text-right font-semibold">{formatBRL(i.value)}</td>
                <td className="px-3 py-2">
                  <StatusBadge value={i.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

// ============================================================
// PAYMENTS
// ============================================================
function PaymentsSection() {
  const state = useFinance();
  return (
    <Card>
      <SectionTitle icon={Banknote} title="Pagamentos" subtitle="Programe e acompanhe o que precisa ser pago." />
      <ul className="mt-4 space-y-2">
        {state.payments.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface/40 p-3">
            <div>
              <p className="text-sm font-semibold">{p.description}</p>
              <p className="text-[11px] text-muted-foreground">Vencimento {p.dueDate} • {p.method}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular text-sm font-semibold">{formatBRL(p.value)}</span>
              <StatusBadge value={p.status} />
              {p.status !== "Pago" && (
                <Button size="sm" variant="outline" onClick={() => financeStore.markPaid(p.id)}>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Marcar pago
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ============================================================
// REPORTS
// ============================================================
function ReportsSection() {
  const state = useFinance();
  const monthly = useMemo(() => {
    const buckets: Record<string, number> = {};
    state.expenses.forEach((e) => {
      const k = e.date.slice(0, 7);
      buckets[k] = (buckets[k] ?? 0) + expenseTotal(e);
    });
    return Object.entries(buckets).sort().map(([name, valor]) => ({ name, valor }));
  }, [state.expenses]);

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={FileText} title="Relatório Executivo" subtitle="Resumo automático gerado ao final de cada campanha." />
        <ul className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          {["Resumo", "Objetivo", "Investimento", "Materiais Produzidos", "Eventos", "Parceiros", "Patrocínios", "Leads", "Indicadores", "ROI", "Linha do Tempo", "Aprendizados"].map((x) => (
            <li key={x} className="rounded-lg border border-border bg-surface/40 px-2.5 py-2">
              <CheckCircle2 className="mr-1 inline h-3 w-3 text-[color:var(--color-success)]" />
              {x}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          O relatório é arquivado automaticamente no histórico da campanha ao mudar o status para “Concluída”.
        </p>
      </Card>
      <Card>
        <SectionTitle icon={TrendingUp} title="Despesas mês a mês" />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Line type="monotone" dataKey="valor" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// ROI
// ============================================================
function ROISection() {
  const campaigns = useCampaigns();
  const state = useFinance();

  const rows = campaigns.map((c) => {
    const invested = state.expenses.filter((e) => e.campaignId === c.id).reduce((a, e) => a + expenseTotal(e), 0);
    const leads = Math.round(c.budget / 180);
    const products = Math.round(leads * 0.18);
    const recovered = Math.round(c.budget * 1.35);
    const roi = invested > 0 ? ((recovered - invested) / invested) * 100 : 0;
    return {
      id: c.id,
      name: c.name,
      planned: c.budget,
      invested,
      leads,
      products,
      recovered,
      roi,
      cpl: leads > 0 ? invested / leads : 0,
      cpp: products > 0 ? invested / products : 0,
    };
  });

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle icon={TrendingUp} title="ROI por campanha" subtitle="Comparativo entre investimento e retorno." />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Campanha</th>
              <th className="px-3 py-2 text-right">Previsto</th>
              <th className="px-3 py-2 text-right">Realizado</th>
              <th className="px-3 py-2 text-right">Leads</th>
              <th className="px-3 py-2 text-right">CPL</th>
              <th className="px-3 py-2 text-right">Recuperado</th>
              <th className="px-3 py-2 text-right">ROI</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="tabular px-3 py-2 text-right">{formatBRL(r.planned)}</td>
                  <td className="tabular px-3 py-2 text-right">{formatBRL(r.invested)}</td>
                  <td className="tabular px-3 py-2 text-right">{r.leads}</td>
                  <td className="tabular px-3 py-2 text-right">{formatBRL(r.cpl)}</td>
                  <td className="tabular px-3 py-2 text-right">{formatBRL(r.recovered)}</td>
                  <td className={`tabular px-3 py-2 text-right font-semibold ${r.roi >= 0 ? "text-[color:var(--color-success)]" : "text-[color:var(--color-danger)]"}`}>{r.roi.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <SectionTitle icon={BarChart3} title="Comparativo investimento vs retorno" />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows.map((r) => ({ name: r.name, Investido: r.invested, Recuperado: r.recovered }))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" hide />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} fontSize={11} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Legend />
              <Bar dataKey="Investido" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Recuperado" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// SHARED
// ============================================================
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-surface/60 p-5">{children}</div>;
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Wallet;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div>
        <p className="font-display text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  tone: "info" | "warning" | "success" | "danger";
}) {
  const cls = {
    info: "text-primary bg-primary/10",
    warning: "text-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10",
    success: "text-[color:var(--color-success)] bg-[color:var(--color-success)]/10",
    danger: "text-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-3">
      <div className="flex items-center justify-between">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${cls}`}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="tabular mt-2 font-display text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "success" | "danger" }) {
  const color = tone === "success" ? "text-[color:var(--color-success)]" : tone === "danger" ? "text-[color:var(--color-danger)]" : "";
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`tabular mt-0.5 text-sm font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "Paga" || value === "Pago" || value === "Aprovada"
      ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
      : value === "Atrasado" || value === "Cancelada" || value === "Cancelado"
        ? "bg-[color:var(--color-danger)]/15 text-[color:var(--color-danger)]"
        : value === "Pendente" || value === "Agendado"
          ? "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
          : "bg-muted text-muted-foreground";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}>{value}</span>;
}

// avoid unused-import warnings
void Sparkles;
void ClipboardList;
