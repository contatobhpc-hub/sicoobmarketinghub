import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CalendarDays,
  FileText,
  Image as ImageIcon,
  MapPin,
  Paperclip,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  SPONSORSHIP_CATEGORIES,
  SPONSORSHIP_STATUSES,
  SPONSORSHIP_TYPES,
  type Sponsorship,
  type SponsorshipCategory,
  type SponsorshipStatus,
  type SponsorshipType,
  alertTone,
  computeAlerts,
  formatBRL,
  formatDate,
  sponsorshipsStore,
  statusTone,
  typeTone,
  useSponsorship,
  useSponsorships,
} from "@/lib/sponsorships";
import { useEvents } from "@/lib/events";
import { useCampaigns } from "@/lib/campaigns";
import { importSponsorshipsFromSheet } from "@/lib/sponsorships-import";
import { Download } from "lucide-react";

export const Route = createFileRoute("/patrocinios")({
  head: () => ({
    meta: [
      { title: "Patrocínios — Marketing Hub" },
      { name: "description", content: "Gestão de patrocínios, contrapartidas e ROI." },
    ],
  }),
  component: PatrociniosPage,
});

const CHART_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#ef4444", "#a855f7", "#ec4899"];

function PatrociniosPage() {
  const items = useSponsorships();
  const events = useEvents();
  const campaigns = useCampaigns();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((s) => {
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return [s.institution, s.event, s.city, s.owner, s.campaign ?? ""].some((v) => v.toLowerCase().includes(q));
    });
  }, [items, search, categoryFilter, statusFilter]);

  const allAlerts = useMemo(() => items.flatMap((s) => computeAlerts(s)), [items]);
  const criticalAlerts = useMemo(
    () => allAlerts.filter((a) => a.level === "expired" || a.level === "urgent"),
    [allAlerts],
  );

  const dashboard = useMemo(() => {
    const totalInvest = items.reduce((a, s) => a + s.value, 0);
    const totalReturn = items.reduce((a, s) => a + s.deliveredReturn, 0);
    const active = items.filter((s) => s.status === "Em execução" || s.status === "Confirmado").length;
    const concluded = items.filter((s) => s.status === "Concluído").length;
    const roi = totalInvest > 0 ? totalReturn / totalInvest : 0;

    const byCity: Record<string, number> = {};
    items.forEach((s) => (byCity[s.city] = (byCity[s.city] ?? 0) + s.value));
    const cityData = Object.entries(byCity)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const byCategory: Record<string, number> = {};
    items.forEach((s) => (byCategory[s.category] = (byCategory[s.category] ?? 0) + s.value));
    const categoryData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    const byType: Record<string, number> = {};
    items.forEach((s) => (byType[s.type] = (byType[s.type] ?? 0) + 1));
    const typeData = Object.entries(byType).map(([name, value]) => ({ name, value }));

    return { totalInvest, totalReturn, active, concluded, roi, cityData, categoryData, typeData };
  }, [items]);

  return (
    <AppShell>
      <PageHeader
        title="Patrocínios"
        description="Investimentos, contrapartidas, ROI e relacionamento com eventos e campanhas."
        actions={
          <div className="flex items-center gap-2">
            <ModuleManagementButton module="patrocinios" />
            <Button size="sm" variant="outline" className="gap-2" onClick={() => {
              const { added, skipped } = importSponsorshipsFromSheet();
              toast.success(`Importação concluída: ${added} adicionados, ${skipped} já existentes.`);
            }}>
              <Download className="h-4 w-4" /> Importar planilha
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Novo patrocínio
                </Button>
              </DialogTrigger>
              <NewSponsorshipDialog
                onClose={() => setCreateOpen(false)}
                events={events.map((e) => ({ id: e.id, name: e.name, city: e.city, campaign: e.campaign }))}
                campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
              />
            </Dialog>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Investimento anual" value={formatBRL(dashboard.totalInvest)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Retorno entregue" value={formatBRL(dashboard.totalReturn)} tone="success" />
        <StatCard label="ROI médio" value={`${dashboard.roi.toFixed(2)}x`} tone="primary" />
        <StatCard label="Em execução" value={`${dashboard.active} / ${items.length}`} />
      </div>

      {criticalAlerts.length > 0 && (
        <div className="mb-6 rounded-xl border border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[color:var(--color-warning)]" />
            <div className="font-display text-sm font-semibold">
              {criticalAlerts.length} alerta{criticalAlerts.length > 1 ? "s" : ""} crítico{criticalAlerts.length > 1 ? "s" : ""}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
            {criticalAlerts.slice(0, 6).map((a, i) => {
              const s = items.find((x) => x.id === a.sponsorshipId)!;
              return (
                <button
                  key={i}
                  onClick={() => setOpenId(s.id)}
                  className={cn("rounded-lg border px-3 py-2 text-left text-xs transition hover:translate-y-[-1px]", alertTone(a.level))}
                >
                  <div className="font-medium">{a.label}</div>
                  <div className="mt-0.5 truncate opacity-80">
                    {s.institution} · {a.days < 0 ? `vencido há ${Math.abs(a.days)}d` : `em ${a.days}d`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Investimento por cidade">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboard.cityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(from var(--color-border) l c h / 0.4)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(from var(--color-muted-foreground) l c h)" />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(from var(--color-muted-foreground) l c h)" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                cursor={{ fill: "oklch(from var(--color-primary) l c h / 0.1)" }}
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatBRL(v)}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {dashboard.cityData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Investimento por categoria">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={dashboard.categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                {dashboard.categoryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => formatBRL(v)}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2 px-2 text-xs">
            {dashboard.categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar instituição, evento, cidade…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {SPONSORSHIP_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {SPONSORSHIP_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((s) => (
          <SponsorshipCard key={s.id} s={s} onOpen={() => setOpenId(s.id)} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center text-sm text-muted-foreground">
            Nenhum patrocínio encontrado.
          </div>
        )}
      </div>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-hidden p-0 sm:max-w-2xl">
          {openId && <SponsorshipDetail id={openId} onClose={() => setOpenId(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: "primary" | "success";
}) {
  const toneCls = tone === "primary" ? "text-primary" : tone === "success" ? "text-[color:var(--color-success)]" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className={cn("mt-1 font-display text-2xl font-semibold", toneCls)}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="mb-2 font-display text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}

function SponsorshipCard({ s, onOpen }: { s: Sponsorship; onOpen: () => void }) {
  const alerts = computeAlerts(s);
  const cpDone = s.counterparts.filter((c) => c.delivered).length;
  const cpTotal = s.counterparts.length;
  const cpPct = cpTotal === 0 ? 0 : Math.round((cpDone / cpTotal) * 100);
  const roi = s.value > 0 ? s.deliveredReturn / s.value : 0;
  return (
    <button
      onClick={onOpen}
      className="group rounded-xl border border-border bg-surface/60 p-4 text-left transition hover:border-primary/40 hover:bg-surface/80"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold">{s.institution}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Award className="h-3 w-3" />
            <span className="truncate">{s.event}</span>
          </div>
        </div>
        <span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-medium", typeTone(s.type))}>{s.type}</span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>{s.city}</span>
        <span>·</span>
        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{s.category}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-muted-foreground">Investimento</div>
          <div className="font-medium">{formatBRL(s.value)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">ROI</div>
          <div className={cn("font-medium", roi >= 1 ? "text-[color:var(--color-success)]" : "text-foreground")}>{roi.toFixed(2)}x</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Contrapartidas</span>
          <span>{cpDone}/{cpTotal}</span>
        </div>
        <Progress value={cpPct} className="h-1.5" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", statusTone(s.status))}>{s.status}</span>
        {alerts.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-[color:var(--color-warning)]">
            <AlertTriangle className="h-3 w-3" /> {alerts.length}
          </span>
        )}
      </div>
    </button>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function NewSponsorshipDialog({
  onClose,
  events,
  campaigns,
}: {
  onClose: () => void;
  events: { id: string; name: string; city: string; campaign?: string }[];
  campaigns: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({
    institution: "",
    event: "",
    eventId: "",
    campaign: "",
    campaignId: "",
    city: "",
    category: "Esportivo" as SponsorshipCategory,
    type: "Apoio" as SponsorshipType,
    value: 0,
    contractRef: "",
    owner: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    materialsDeadline: "",
    counterpartsDeadline: "",
    accountingDeadline: "",
    expectedReturn: 0,
    notes: "",
  });

  function pickEvent(eventId: string) {
    const e = events.find((x) => x.id === eventId);
    if (!e) return;
    setForm((f) => ({
      ...f,
      eventId,
      event: e.name,
      city: e.city || f.city,
      campaign: e.campaign ?? f.campaign,
    }));
  }
  function pickCampaign(campaignId: string) {
    const c = campaigns.find((x) => x.id === campaignId);
    if (!c) return;
    setForm((f) => ({ ...f, campaignId, campaign: c.name }));
  }

  function submit() {
    if (!form.institution.trim() || !form.event.trim()) {
      toast.error("Informe a instituição e o evento.");
      return;
    }
    sponsorshipsStore.add({
      ...form,
      status: "Em negociação",
    });
    toast.success("Patrocínio criado com checklist automática.");
    onClose();
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Novo patrocínio</DialogTitle></DialogHeader>
      <ScrollArea className="max-h-[60vh] pr-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Instituição" full>
            <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
          </Field>
          <Field label="Evento existente">
            <Select value={form.eventId} onValueChange={pickEvent}>
              <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
              <SelectContent>
                {events.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Ou digite o evento">
            <Input value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value, eventId: "" })} />
          </Field>
          <Field label="Campanha relacionada">
            <Select value={form.campaignId} onValueChange={pickCampaign}>
              <SelectTrigger><SelectValue placeholder="Selecionar…" /></SelectTrigger>
              <SelectContent>
                {campaigns.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Categoria">
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as SponsorshipCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SPONSORSHIP_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
            </Select>
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as SponsorshipType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SPONSORSHIP_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}</SelectContent>
            </Select>
          </Field>
          <Field label="Valor (R$)"><Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></Field>
          <Field label="Retorno esperado (R$)"><Input type="number" value={form.expectedReturn} onChange={(e) => setForm({ ...form, expectedReturn: Number(e.target.value) })} /></Field>
          <Field label="Contrato (ref.)"><Input value={form.contractRef} onChange={(e) => setForm({ ...form, contractRef: e.target.value })} /></Field>
          <Field label="Responsável"><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></Field>
          <Field label="Início"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="Término"><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <Field label="Prazo: materiais"><Input type="date" value={form.materialsDeadline} onChange={(e) => setForm({ ...form, materialsDeadline: e.target.value })} /></Field>
          <Field label="Prazo: contrapartidas"><Input type="date" value={form.counterpartsDeadline} onChange={(e) => setForm({ ...form, counterpartsDeadline: e.target.value })} /></Field>
          <Field label="Prazo: prestação de contas" full><Input type="date" value={form.accountingDeadline} onChange={(e) => setForm({ ...form, accountingDeadline: e.target.value })} /></Field>
          <Field label="Observações" full><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Criar patrocínio</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function SponsorshipDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useSponsorship(id);
  const [newCp, setNewCp] = useState("");
  const [newMaterial, setNewMaterial] = useState("");
  const [newCheck, setNewCheck] = useState("");
  const [reportText, setReportText] = useState(s?.reportSummary ?? "");
  const [reportReturn, setReportReturn] = useState(s?.deliveredReturn ?? 0);
  if (!s) return null;
  const alerts = computeAlerts(s);
  const roi = s.value > 0 ? s.deliveredReturn / s.value : 0;
  const cpDone = s.counterparts.filter((c) => c.delivered).length;

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium", typeTone(s.type))}>{s.type}</span>
              <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", statusTone(s.status))}>{s.status}</span>
              <Badge variant="secondary" className="text-[10px]">{s.category}</Badge>
            </div>
            <SheetTitle className="mt-2 truncate font-display text-xl">{s.institution}</SheetTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              <Award className="mr-1 inline h-3 w-3" /> {s.event}
              <span className="mx-2">·</span>
              <MapPin className="mr-1 inline h-3 w-3" /> {s.city}
              <span className="mx-2">·</span>
              <CalendarDays className="mr-1 inline h-3 w-3" /> {formatDate(s.startDate)} → {formatDate(s.endDate)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Select value={s.status} onValueChange={(v) => sponsorshipsStore.update(s.id, { status: v as SponsorshipStatus })}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{SPONSORSHIP_STATUSES.map((x) => (<SelectItem key={x} value={x}>{x}</SelectItem>))}</SelectContent>
          </Select>
          <Button size="sm" variant="ghost" className="text-[color:var(--color-destructive)]" onClick={() => { sponsorshipsStore.remove(s.id); toast.success("Removido"); onClose(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetHeader>

      <Tabs defaultValue="resumo" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-6 mt-3 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {[
            ["resumo", "Resumo"],
            ["contrapartidas", "Contrapartidas"],
            ["materiais", "Materiais"],
            ["checklist", "Checklist"],
            ["alertas", `Alertas${alerts.length ? ` (${alerts.length})` : ""}`],
            ["relatorio", "Relatório / ROI"],
            ["arquivos", "Arquivos"],
            ["timeline", "Timeline"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-surface-elevated text-xs">{l}</TabsTrigger>
          ))}
        </TabsList>
        <ScrollArea className="flex-1 px-6 py-4">
          <TabsContent value="resumo" className="mt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Investimento" value={formatBRL(s.value)} />
              <InfoCard label="Retorno entregue" value={formatBRL(s.deliveredReturn)} />
              <InfoCard label="ROI" value={`${roi.toFixed(2)}x`} />
              <InfoCard label="Retorno esperado" value={formatBRL(s.expectedReturn)} />
              <InfoCard label="Responsável" value={s.owner} />
              <InfoCard label="Contrato" value={s.contractRef || "—"} />
              <InfoCard label="Campanha" value={s.campaign ?? "—"} />
              <InfoCard label="Contrapartidas" value={`${cpDone}/${s.counterparts.length}`} />
            </div>
            {s.notes && (
              <div className="rounded-lg border border-border bg-surface/40 p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Observações</div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{s.notes}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contrapartidas" className="mt-0 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nova contrapartida…"
                value={newCp}
                onChange={(e) => setNewCp(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newCp.trim()) { sponsorshipsStore.addCounterpart(s.id, newCp.trim()); setNewCp(""); } }}
              />
              <Button size="sm" onClick={() => { if (newCp.trim()) { sponsorshipsStore.addCounterpart(s.id, newCp.trim()); setNewCp(""); } }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-surface/40">
              {s.counterparts.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhuma contrapartida cadastrada.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {s.counterparts.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                      <Checkbox checked={c.delivered} onCheckedChange={() => sponsorshipsStore.toggleCounterpart(s.id, c.id)} />
                      <span className={cn("flex-1 text-sm", c.delivered && "text-muted-foreground line-through")}>{c.text}</span>
                      {c.delivered && <Badge variant="secondary" className="text-[10px]">Entregue</Badge>}
                      <Button size="sm" variant="ghost" onClick={() => sponsorshipsStore.removeCounterpart(s.id, c.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="materiais" className="mt-0 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Material entregue (ex: 100 banners)…"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newMaterial.trim()) { sponsorshipsStore.addMaterial(s.id, newMaterial.trim()); setNewMaterial(""); } }}
              />
              <Button size="sm" onClick={() => { if (newMaterial.trim()) { sponsorshipsStore.addMaterial(s.id, newMaterial.trim()); setNewMaterial(""); } }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-surface/40">
              {s.materialsDelivered.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">Nenhum material entregue ainda.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {s.materialsDelivered.map((m, i) => (
                    <li key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="flex-1">{m}</span>
                      <Button size="sm" variant="ghost" onClick={() => sponsorshipsStore.removeMaterial(s.id, i)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="checklist" className="mt-0 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar item…"
                value={newCheck}
                onChange={(e) => setNewCheck(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && newCheck.trim()) { sponsorshipsStore.addChecklistItem(s.id, newCheck.trim()); setNewCheck(""); } }}
              />
              <Button size="sm" onClick={() => { if (newCheck.trim()) { sponsorshipsStore.addChecklistItem(s.id, newCheck.trim()); setNewCheck(""); } }}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-surface/40">
              <ul className="divide-y divide-border">
                {s.checklist.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                    <Checkbox checked={c.done} onCheckedChange={() => sponsorshipsStore.toggleChecklist(s.id, c.id)} />
                    <span className={cn("flex-1 text-sm", c.done && "text-muted-foreground line-through")}>{c.text}</span>
                    <Button size="sm" variant="ghost" onClick={() => sponsorshipsStore.removeChecklistItem(s.id, c.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="alertas" className="mt-0 space-y-2">
            {alerts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface/30 px-3 py-8 text-center text-sm text-muted-foreground">
                Nenhum alerta pendente.
              </div>
            ) : (
              alerts.map((a, i) => (
                <div key={i} className={cn("rounded-lg border px-3 py-2 text-sm", alertTone(a.level))}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.label}</div>
                    <span className="text-xs">{a.days < 0 ? `vencido há ${Math.abs(a.days)}d` : `em ${a.days}d`}</span>
                  </div>
                  <div className="mt-0.5 text-xs opacity-80">Prazo: {formatDate(a.date)}</div>
                </div>
              ))
            )}
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <InfoCard label="Prazo materiais" value={formatDate(s.materialsDeadline)} />
              <InfoCard label="Prazo contrapartidas" value={formatDate(s.counterpartsDeadline)} />
              <InfoCard label="Prestação de contas" value={formatDate(s.accountingDeadline)} />
            </div>
          </TabsContent>

          <TabsContent value="relatorio" className="mt-0 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <InfoCard label="Investido" value={formatBRL(s.value)} />
              <InfoCard label="Retorno" value={formatBRL(s.deliveredReturn)} />
              <InfoCard label="ROI" value={`${roi.toFixed(2)}x`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resumo do relatório</Label>
              <Textarea rows={4} value={reportText} onChange={(e) => setReportText(e.target.value)} placeholder="Resultados, métricas, observações…" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Retorno entregue (R$)</Label>
              <Input type="number" value={reportReturn} onChange={(e) => setReportReturn(Number(e.target.value))} />
            </div>
            <Button size="sm" onClick={() => { sponsorshipsStore.setReport(s.id, reportText, reportReturn); toast.success("Relatório atualizado."); }}>
              Salvar relatório
            </Button>
          </TabsContent>

          <TabsContent value="arquivos" className="mt-0">
            <FilesPanel s={s} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0 space-y-2">
            {s.timeline.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="text-sm">{t.message}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{t.author ?? "Sistema"} · {new Date(t.createdAt).toLocaleString("pt-BR")}</div>
                </div>
              </div>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface/40 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function FilesPanel({ s }: { s: Sponsorship }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"doc" | "photo" | "report">("doc");
  const icon = (k: string) => k === "photo" ? <ImageIcon className="h-4 w-4" /> : k === "report" ? <TrendingUp className="h-4 w-4" /> : <FileText className="h-4 w-4" />;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface/40 p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto]">
          <Input placeholder="Nome do arquivo" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="doc">Documento</SelectItem>
              <SelectItem value="photo">Foto</SelectItem>
              <SelectItem value="report">Relatório</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => { if (!name.trim()) return; sponsorshipsStore.addFile(s.id, { name: name.trim(), size: 100000, kind }); setName(""); }}>
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {s.files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/30 px-3 py-8 text-center text-sm text-muted-foreground">
          Sem arquivos, fotos ou relatórios.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {s.files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">{icon(f.kind)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => sponsorshipsStore.removeFile(s.id, f.id)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
