import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Image as ImageIcon,
  ListChecks,
  MapPin,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CHECKLIST_GROUPS,
  EVENT_PRIORITIES,
  EVENT_STATUSES,
  EVENT_TYPES,
  type EventItem,
  type EventKanbanTask,
  type EventPriority,
  type EventStatus,
  type EventType,
  eventsStore,
  formatBRL,
  formatDate,
  daysUntil,
  priorityTone,
  statusTone,
  useEvent,
  useEvents,
} from "@/lib/events";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos — Marketing Hub" },
      { name: "description", content: "Gestão completa de eventos como projetos." },
    ],
  }),
  component: EventosPage,
});

const KANBAN_COLUMNS: EventKanbanTask["column"][] = ["Backlog", "Fazendo", "Revisão", "Pronto"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function EventosPage() {
  const events = useEvents();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!q) return true;
      return [e.name, e.city, e.venue, e.agency, e.owner, e.campaign ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
  }, [events, search, typeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<EventStatus, EventItem[]>();
    EVENT_STATUSES.forEach((s) => map.set(s, []));
    filtered.forEach((e) => map.get(e.status)?.push(e));
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => {
      const d = daysUntil(e.date);
      return d !== null && d >= 0 && e.status !== "Cancelado" && e.status !== "Concluído";
    }).length;
    const inProduction = events.filter((e) => e.status === "Em produção" || e.status === "Planejamento").length;
    const totalBudget = events.reduce((a, e) => a + e.budget, 0);
    return { total, upcoming, inProduction, totalBudget };
  }, [events]);

  return (
    <AppShell>
      <PageHeader
        title="Eventos"
        description="Cada evento é um projeto completo. Cronograma, checklist, kanban e lista de presença — tudo conectado."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Novo evento
              </Button>
            </DialogTrigger>
            <NewEventDialog onClose={() => setCreateOpen(false)} />
          </Dialog>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Eventos totais" value={stats.total} />
        <StatCard label="Próximos" value={stats.upcoming} tone="primary" />
        <StatCard label="Em produção" value={stats.inProduction} tone="warning" />
        <StatCard label="Orçamento total" value={formatBRL(stats.totalBudget)} small />
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, cidade, agência, campanha…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {EVENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {EVENT_STATUSES.map((status) => {
          const rows = grouped.get(status) ?? [];
          if (rows.length === 0) return null;
          const isCollapsed = collapsed[status];
          return (
            <div key={status} className="rounded-xl border border-border bg-surface/40 overflow-hidden">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [status]: !c[status] }))}
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-surface-elevated/40 transition"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <span className={cn("rounded-md border px-2 py-0.5 text-xs font-medium", statusTone(status))}>
                  {status}
                </span>
                <span className="text-sm text-muted-foreground">{rows.length} evento{rows.length > 1 ? "s" : ""}</span>
              </button>
              {!isCollapsed && (
                <div className="border-t border-border">
                  <div className="hidden grid-cols-[2fr_1fr_1fr_140px_140px_120px_120px] gap-3 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
                    <div>Evento</div>
                    <div>Cidade / Local</div>
                    <div>Campanha</div>
                    <div>Data</div>
                    <div>Responsável</div>
                    <div>Prioridade</div>
                    <div>Progresso</div>
                  </div>
                  <div className="divide-y divide-border">
                    {rows.map((e) => (
                      <EventRow key={e.id} ev={e} onOpen={() => setOpenId(e.id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">Nenhum evento encontrado com os filtros atuais.</p>
          </div>
        )}
      </div>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-hidden p-0 sm:max-w-2xl">
          {openId && <EventDetail id={openId} onClose={() => setOpenId(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string | number;
  tone?: "primary" | "warning";
  small?: boolean;
}) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
        ? "text-[color:var(--color-warning)]"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display font-semibold", toneCls, small ? "text-lg" : "text-2xl")}>{value}</div>
    </div>
  );
}

function EventRow({ ev, onOpen }: { ev: EventItem; onOpen: () => void }) {
  const d = daysUntil(ev.date);
  const dateLabel = d === null ? "—" : d === 0 ? "Hoje" : d > 0 ? `em ${d}d` : `há ${Math.abs(d)}d`;
  return (
    <button
      onClick={onOpen}
      className="grid w-full grid-cols-1 gap-3 px-4 py-3 text-left transition hover:bg-surface-elevated/40 md:grid-cols-[2fr_1fr_1fr_140px_140px_120px_120px] md:items-center"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ background: "var(--gradient-primary)" }} />
          <div className="truncate font-medium">{ev.name}</div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{ev.type}</Badge>
          <span className="truncate">{ev.agency}</span>
        </div>
      </div>
      <div className="min-w-0 text-sm">
        <div className="flex items-center gap-1.5 text-foreground">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="truncate">{ev.city}</span>
        </div>
        <div className="truncate text-xs text-muted-foreground">{ev.venue}</div>
      </div>
      <div className="truncate text-sm text-muted-foreground">{ev.campaign ?? "—"}</div>
      <div className="text-sm">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{formatDate(ev.date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {ev.time} · <span className="font-medium">{dateLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-primary/15 text-[10px] text-primary">{initials(ev.owner)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm">{ev.owner}</span>
      </div>
      <div>
        <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", priorityTone(ev.priority))}>
          {ev.priority}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={ev.progress} className="h-1.5 flex-1" />
        <span className="w-9 text-right text-xs text-muted-foreground">{ev.progress}%</span>
      </div>
    </button>
  );
}

function NewEventDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    type: "Lançamento" as EventType,
    city: "",
    agency: "",
    venue: "",
    date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    time: "19:00",
    owner: "",
    description: "",
    objective: "",
    campaign: "",
    sponsorship: "",
    budget: 0,
    notes: "",
    status: "Planejamento" as EventStatus,
    priority: "Média" as EventPriority,
  });

  function submit() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do evento.");
      return;
    }
    eventsStore.add({ ...form });
    toast.success("Evento criado com checklist padrão.");
    onClose();
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Novo evento</DialogTitle>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh] pr-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Nome" full>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Tipo">
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as EventType })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Prioridade">
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as EventPriority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_PRIORITIES.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cidade"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
          <Field label="Agência"><Input value={form.agency} onChange={(e) => setForm({ ...form, agency: e.target.value })} /></Field>
          <Field label="Local" full><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></Field>
          <Field label="Data"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Horário"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></Field>
          <Field label="Responsável"><Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} /></Field>
          <Field label="Campanha relacionada"><Input value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} /></Field>
          <Field label="Orçamento (R$)"><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></Field>
          <Field label="Patrocínio" full><Input value={form.sponsorship} onChange={(e) => setForm({ ...form, sponsorship: e.target.value })} /></Field>
          <Field label="Descrição" full><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Objetivo" full><Textarea rows={2} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></Field>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-surface/40 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ListChecks className="h-4 w-4 text-primary" /> Checklist padrão será criada automaticamente
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEFAULT_CHECKLIST_GROUPS.map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>
            ))}
          </div>
        </div>
      </ScrollArea>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Criar evento</Button>
      </DialogFooter>
    </DialogContent>
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

function EventDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const ev = useEvent(id);
  if (!ev) return null;
  const d = daysUntil(ev.date);

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{ev.type}</Badge>
              <span className={cn("rounded-md border px-2 py-0.5 text-xs font-medium", statusTone(ev.status))}>
                {ev.status}
              </span>
              <span className={cn("rounded-md px-2 py-0.5 text-xs", priorityTone(ev.priority))}>{ev.priority}</span>
            </div>
            <SheetTitle className="mt-2 truncate font-display text-xl">{ev.name}</SheetTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              <CalendarDays className="mr-1 inline h-3 w-3" />
              {formatDate(ev.date)} · {ev.time}
              {d !== null && <> · {d >= 0 ? `daqui ${d}d` : `há ${Math.abs(d)}d`}</>}
              <span className="mx-2">·</span>
              <MapPin className="mr-1 inline h-3 w-3" />
              {ev.venue}, {ev.city}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Select value={ev.status} onValueChange={(v) => eventsStore.update(ev.id, { status: v as EventStatus })}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            className="text-[color:var(--color-destructive)]"
            onClick={() => {
              eventsStore.remove(ev.id);
              toast.success("Evento removido");
              onClose();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetHeader>

      <Tabs defaultValue="resumo" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="mx-6 mt-3 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {[
            ["resumo", "Resumo"],
            ["checklist", "Checklist"],
            ["cronograma", "Cronograma"],
            ["kanban", "Kanban"],
            ["lista", "Lista de presença"],
            ["arquivos", "Arquivos"],
            ["timeline", "Timeline"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="data-[state=active]:bg-surface-elevated text-xs">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollArea className="flex-1 px-6 py-4">
          <TabsContent value="resumo" className="mt-0 space-y-4">
            <Section title="Descrição">{ev.description || <em className="text-muted-foreground">Sem descrição.</em>}</Section>
            <Section title="Objetivo">{ev.objective || <em className="text-muted-foreground">—</em>}</Section>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Responsável" value={ev.owner} />
              <InfoCard label="Agência" value={ev.agency} />
              <InfoCard label="Campanha" value={ev.campaign ?? "—"} />
              <InfoCard label="Orçamento" value={formatBRL(ev.budget)} />
              <InfoCard label="Patrocínio" value={ev.sponsorship || "—"} />
              <InfoCard label="Progresso" value={`${ev.progress}%`} />
            </div>
            <Section title="Equipe">
              {ev.team.length === 0 ? (
                <em className="text-muted-foreground">Sem equipe.</em>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ev.team.map((m) => (
                    <div key={m} className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-1 text-xs">
                      <Avatar className="h-5 w-5"><AvatarFallback className="bg-primary/15 text-[9px] text-primary">{initials(m)}</AvatarFallback></Avatar>
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </Section>
            <Section title="Parceiros">
              {ev.partners.length === 0 ? <em className="text-muted-foreground">—</em> : (
                <div className="flex flex-wrap gap-1.5">{ev.partners.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}</div>
              )}
            </Section>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Section title="Brindes">
                {ev.gifts.length === 0 ? <em className="text-muted-foreground">—</em> : (
                  <ul className="space-y-1 text-sm">
                    {ev.gifts.map((g) => (<li key={g.id} className="flex justify-between"><span>{g.name}</span><span className="text-muted-foreground">{g.quantity}x</span></li>))}
                  </ul>
                )}
              </Section>
              <Section title="Fornecedores">
                {ev.suppliers.length === 0 ? <em className="text-muted-foreground">—</em> : (
                  <ul className="space-y-1 text-sm">
                    {ev.suppliers.map((s) => (<li key={s.id}><div>{s.name}</div><div className="text-xs text-muted-foreground">{s.service}</div></li>))}
                  </ul>
                )}
              </Section>
            </div>
            {ev.notes && <Section title="Observações"><p className="whitespace-pre-wrap text-sm">{ev.notes}</p></Section>}
          </TabsContent>

          <TabsContent value="checklist" className="mt-0">
            <ChecklistPanel ev={ev} />
          </TabsContent>

          <TabsContent value="cronograma" className="mt-0">
            <SchedulePanel ev={ev} />
          </TabsContent>

          <TabsContent value="kanban" className="mt-0">
            <KanbanPanel ev={ev} />
          </TabsContent>

          <TabsContent value="lista" className="mt-0">
            <AttendeesPanel ev={ev} />
          </TabsContent>

          <TabsContent value="arquivos" className="mt-0">
            <FilesPanel ev={ev} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-0 space-y-2">
            {ev.timeline.map((t) => (
              <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="text-sm">{t.message}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {t.author ?? "Sistema"} · {new Date(t.createdAt).toLocaleString("pt-BR")}
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="text-sm">{children}</div>
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

function ChecklistPanel({ ev }: { ev: EventItem }) {
  const [newText, setNewText] = useState("");
  const [newGroup, setNewGroup] = useState<string>(DEFAULT_CHECKLIST_GROUPS[0]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof ev.checklist>();
    ev.checklist.forEach((c) => {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    });
    return Array.from(map.entries());
  }, [ev.checklist]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface/40 p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={newGroup} onValueChange={setNewGroup}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from(new Set([...DEFAULT_CHECKLIST_GROUPS, ...ev.checklist.map((c) => c.group)])).map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Adicionar item personalizado…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newText.trim()) {
                eventsStore.addChecklistItem(ev.id, newText.trim(), newGroup);
                setNewText("");
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!newText.trim()) return;
              eventsStore.addChecklistItem(ev.id, newText.trim(), newGroup);
              setNewText("");
            }}
          >
            Adicionar
          </Button>
        </div>
      </div>
      {groups.map(([group, items]) => {
        const done = items.filter((i) => i.done).length;
        return (
          <div key={group} className="rounded-lg border border-border bg-surface/40">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <div className="font-medium text-sm">{group}</div>
              <span className="text-xs text-muted-foreground">{done}/{items.length}</span>
            </div>
            <ul className="divide-y divide-border">
              {items.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox checked={c.done} onCheckedChange={() => eventsStore.toggleChecklist(ev.id, c.id)} />
                  <span className={cn("flex-1 text-sm", c.done && "text-muted-foreground line-through")}>{c.text}</span>
                  <Button size="sm" variant="ghost" onClick={() => eventsStore.removeChecklistItem(ev.id, c.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function SchedulePanel({ ev }: { ev: EventItem }) {
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface/40 p-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[100px_1fr_140px_auto]">
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <Input placeholder="Atividade" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Responsável" value={owner} onChange={(e) => setOwner(e.target.value)} />
          <Button
            size="sm"
            onClick={() => {
              if (!time || !title.trim()) return;
              eventsStore.addScheduleItem(ev.id, { time, title: title.trim(), owner: owner.trim() || undefined });
              setTime(""); setTitle(""); setOwner("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface/40">
        {ev.schedule.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">Sem itens no cronograma.</div>
        ) : (
          <ul className="divide-y divide-border">
            {ev.schedule.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="w-14 font-mono text-sm text-primary">{s.time}</div>
                <div className="flex-1">
                  <div className="text-sm">{s.title}</div>
                  {s.owner && <div className="text-xs text-muted-foreground">{s.owner}</div>}
                </div>
                <Button size="sm" variant="ghost" onClick={() => eventsStore.removeScheduleItem(ev.id, s.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function KanbanPanel({ ev }: { ev: EventItem }) {
  const [newTitle, setNewTitle] = useState("");
  const [newCol, setNewCol] = useState<EventKanbanTask["column"]>("Backlog");
  const [dragId, setDragId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface/40 p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Nova tarefa…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                eventsStore.addKanbanTask(ev.id, newTitle.trim(), newCol);
                setNewTitle("");
              }
            }}
          />
          <Select value={newCol} onValueChange={(v) => setNewCol(v as EventKanbanTask["column"])}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{KANBAN_COLUMNS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              if (!newTitle.trim()) return;
              eventsStore.addKanbanTask(ev.id, newTitle.trim(), newCol);
              setNewTitle("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {KANBAN_COLUMNS.map((col) => {
          const tasks = ev.kanban.filter((k) => k.column === col);
          return (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragId) eventsStore.moveKanban(ev.id, dragId, col);
                setDragId(null);
              }}
              className="rounded-lg border border-border bg-surface/40 p-2"
            >
              <div className="mb-2 flex items-center justify-between px-1 text-xs font-medium">
                <span>{col}</span>
                <span className="text-muted-foreground">{tasks.length}</span>
              </div>
              <div className="space-y-1.5">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragId(t.id)}
                    className="cursor-grab rounded-md border border-border bg-surface p-2 text-xs active:cursor-grabbing"
                  >
                    <div className="font-medium">{t.title}</div>
                    {t.owner && <div className="mt-1 text-[10px] text-muted-foreground">{t.owner}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AttendeesPanel({ ev }: { ev: EventItem }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const confirmed = ev.attendees.filter((a) => a.confirmed).length;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-surface/40 p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{ev.attendees.length} convidados</span>
          <span className="font-medium text-[color:var(--color-success)]">{confirmed} confirmados</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Função / Empresa" value={role} onChange={(e) => setRole(e.target.value)} />
          <Button
            size="sm"
            onClick={() => {
              if (!name.trim()) return;
              eventsStore.addAttendee(ev.id, name.trim(), role.trim() || undefined);
              setName(""); setRole("");
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface/40">
        {ev.attendees.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            <Users className="mx-auto mb-2 h-5 w-5" />
            Sem convidados ainda.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {ev.attendees.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                <Checkbox checked={a.confirmed} onCheckedChange={() => eventsStore.toggleAttendee(ev.id, a.id)} />
                <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/15 text-[10px] text-primary">{initials(a.name)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="text-sm">{a.name}</div>
                  {a.role && <div className="text-xs text-muted-foreground">{a.role}</div>}
                </div>
                {a.confirmed && <Badge variant="secondary" className="text-[10px]">Confirmado</Badge>}
                <Button size="sm" variant="ghost" onClick={() => eventsStore.removeAttendee(ev.id, a.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FilesPanel({ ev }: { ev: EventItem }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"doc" | "photo" | "video">("doc");

  const icon = (k: string) =>
    k === "photo" ? <ImageIcon className="h-4 w-4" /> : k === "video" ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />;

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
              <SelectItem value="video">Vídeo</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => {
              if (!name.trim()) return;
              eventsStore.addFile(ev.id, { name: name.trim(), size: 100000, kind });
              setName("");
            }}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {ev.files.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/30 px-3 py-8 text-center text-sm text-muted-foreground">
          Sem arquivos, fotos ou vídeos.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ev.files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">{icon(f.kind)}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{f.name}</div>
                <div className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => eventsStore.removeFile(ev.id, f.id)}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
