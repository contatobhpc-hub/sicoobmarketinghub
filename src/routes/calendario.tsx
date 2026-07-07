import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  X,
  Calendar as CalIcon,
  User,
  Paperclip,
  MessageSquare,
  CheckCircle2,
  Circle,
  Upload,
  Send,
  Activity,
  Megaphone,
  FolderKanban,
  Trello,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

import {
  CATEGORY_STYLE,
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  EVENT_STATUSES,
  calendarStore,
  formatLongDate,
  formatRelative,
  isoDate,
  useCalendar,
  type CalendarEvent,
  type EventCategory,
  type EventPriority,
  type EventStatus,
} from "@/lib/calendar";
import { useCampaigns } from "@/lib/campaigns";
import { useProjects } from "@/lib/projects";
import { useKanban } from "@/lib/kanban";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — Marketing Hub" },
      { name: "description", content: "Calendário unificado de campanhas, eventos e entregas." },
    ],
  }),
  component: CalendarPage,
});

type ViewMode = "mes" | "semana" | "dia";

const WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function startOfWeek(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isSameDay(a: Date, b: Date) { return isoDate(a) === isoDate(b); }
function monthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

function CalendarPage() {
  const events = useCalendar();
  const [view, setView] = useState<ViewMode>("mes");
  const [anchor, setAnchor] = useState(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // filters
  const [fOwner, setFOwner] = useState("all");
  const [fAgency, setFAgency] = useState("all");
  const [fCategory, setFCategory] = useState<"all" | EventCategory>("all");
  const [fStatus, setFStatus] = useState<"all" | EventStatus>("all");
  const [fPriority, setFPriority] = useState<"all" | EventPriority>("all");
  const [fCampaign, setFCampaign] = useState("all");
  const [fProject, setFProject] = useState("all");

  const campaigns = useCampaigns();
  const projects = useProjects();

  const owners = useMemo(() => Array.from(new Set(events.flatMap((e) => e.owners))).sort(), [events]);
  const agencies = useMemo(() => Array.from(new Set(events.map((e) => e.agency).filter(Boolean) as string[])).sort(), [events]);

  const filtered = useMemo(() => events.filter((e) => {
    if (fOwner !== "all" && !e.owners.includes(fOwner)) return false;
    if (fAgency !== "all" && e.agency !== fAgency) return false;
    if (fCategory !== "all" && e.category !== fCategory) return false;
    if (fStatus !== "all" && e.status !== fStatus) return false;
    if (fPriority !== "all" && e.priority !== fPriority) return false;
    if (fCampaign !== "all" && e.campaignId !== fCampaign) return false;
    if (fProject !== "all" && e.projectId !== fProject) return false;
    return true;
  }), [events, fOwner, fAgency, fCategory, fStatus, fPriority, fCampaign, fProject]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of filtered) {
      const arr = m.get(e.date) ?? [];
      arr.push(e);
      m.set(e.date, arr);
    }
    return m;
  }, [filtered]);

  const activeFilters =
    (fOwner !== "all" ? 1 : 0) + (fAgency !== "all" ? 1 : 0) + (fCategory !== "all" ? 1 : 0) +
    (fStatus !== "all" ? 1 : 0) + (fPriority !== "all" ? 1 : 0) +
    (fCampaign !== "all" ? 1 : 0) + (fProject !== "all" ? 1 : 0);

  function clearFilters() {
    setFOwner("all"); setFAgency("all"); setFCategory("all"); setFStatus("all");
    setFPriority("all"); setFCampaign("all"); setFProject("all");
  }

  function navigate(direction: -1 | 0 | 1) {
    if (direction === 0) return setAnchor(new Date());
    const x = new Date(anchor);
    if (view === "mes") x.setMonth(x.getMonth() + direction);
    else if (view === "semana") x.setDate(x.getDate() + 7 * direction);
    else x.setDate(x.getDate() + direction);
    setAnchor(x);
  }

  const headerLabel = view === "mes"
    ? anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : view === "semana"
      ? `Semana de ${startOfWeek(anchor).toLocaleDateString("pt-BR")}`
      : anchor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <AppShell>
      <PageHeader
        title="Calendário"
        description="Visão unificada de todas as iniciativas — arraste para reagendar."
        actions={<NewEventDialog defaultDate={isoDate(anchor)} />}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface/60 p-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate(0)}>Hoje</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <h2 className="font-display text-sm font-semibold capitalize tracking-tight">{headerLabel}</h2>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface/60 p-0.5">
            {(["mes", "semana", "dia"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-3 py-1 text-xs capitalize transition-colors ${
                  view === v ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "mes" ? "Mês" : v}
              </button>
            ))}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Filter className="h-3.5 w-3.5" /> Filtros
                {activeFilters > 0 && (
                  <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{activeFilters}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 p-3">
              <FilterRow label="Responsável" value={fOwner} onChange={setFOwner} options={owners} />
              <FilterRow label="Agência" value={fAgency} onChange={setFAgency} options={agencies} />
              <FilterRow label="Categoria" value={fCategory} onChange={(v) => setFCategory(v as never)} options={[...EVENT_CATEGORIES]} />
              <FilterRow label="Status" value={fStatus} onChange={(v) => setFStatus(v as never)} options={[...EVENT_STATUSES]} />
              <FilterRow label="Prioridade" value={fPriority} onChange={(v) => setFPriority(v as never)} options={[...EVENT_PRIORITIES]} />
              <FilterRow label="Campanha" value={fCampaign} onChange={setFCampaign} options={campaigns.map((c) => ({ value: c.id, label: c.name }))} />
              <FilterRow label="Projeto" value={fProject} onChange={setFProject} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" onClick={clearFilters}>
                  <X className="h-3 w-3" /> Limpar filtros
                </Button>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {EVENT_CATEGORIES.map((c) => {
          const s = CATEGORY_STYLE[c];
          const active = fCategory === c;
          return (
            <button
              key={c}
              onClick={() => setFCategory((curr) => (curr === c ? "all" : c))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-all ${
                active ? `${s.bg} ${s.text} border-transparent ring-1 ${s.ring}` : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {c}
            </button>
          );
        })}
      </div>

      {view === "mes" && <MonthView anchor={anchor} byDay={byDay} onOpen={setSelectedId} />}
      {view === "semana" && <WeekView anchor={anchor} byDay={byDay} onOpen={setSelectedId} />}
      {view === "dia" && <DayView anchor={anchor} byDay={byDay} onOpen={setSelectedId} />}

      <EventDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </AppShell>
  );
}

function FilterRow({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="grid gap-1.5">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ---------- Event chips & drop targets ---------- */

function EventChip({ e, onOpen, compact = true }: { e: CalendarEvent; onOpen: (id: string) => void; compact?: boolean }) {
  const s = CATEGORY_STYLE[e.category];
  return (
    <button
      draggable
      onDragStart={(ev) => { ev.dataTransfer.setData("text/event", e.id); ev.dataTransfer.effectAllowed = "move"; }}
      onClick={() => onOpen(e.id)}
      className={`group flex w-full items-center gap-1.5 truncate rounded-md ${s.bg} ${s.text} px-1.5 ${compact ? "py-0.5" : "py-1"} text-left text-[11px] transition-all hover:translate-x-0.5 hover:ring-1 ${s.ring}`}
      title={e.title}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
      {e.time && <span className="shrink-0 tabular text-[10px] opacity-80">{e.time}</span>}
      <span className="truncate">{e.title}</span>
    </button>
  );
}

function DayCell({
  date, items, dim, isToday, onOpen,
}: {
  date: Date; items: CalendarEvent[]; dim: boolean; isToday: boolean; onOpen: (id: string) => void;
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        const id = e.dataTransfer.getData("text/event");
        if (id) calendarStore.moveDate(id, isoDate(date));
        setOver(false);
      }}
      className={`flex min-h-[110px] flex-col gap-1 border-b border-r border-border/60 p-1.5 transition-colors ${
        dim ? "bg-background/40 text-muted-foreground" : "bg-surface/30"
      } ${over ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : ""}`}
    >
      <div className="flex items-center justify-between px-0.5 text-[10px]">
        <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 ${
          isToday ? "bg-primary font-semibold text-primary-foreground" : ""
        }`}>
          {date.getDate()}
        </span>
        {items.length > 3 && <span className="text-[10px] text-muted-foreground">+{items.length - 3}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {items.slice(0, 3).map((e) => <EventChip key={e.id} e={e} onOpen={onOpen} />)}
      </div>
    </div>
  );
}

function MonthView({ anchor, byDay, onOpen }: { anchor: Date; byDay: Map<string, CalendarEvent[]>; onOpen: (id: string) => void }) {
  const days = monthGrid(anchor);
  const today = new Date();
  return (
    <div className="animate-fade-in overflow-hidden rounded-xl border border-border bg-surface/40">
      <div className="grid grid-cols-7 border-b border-border bg-surface-elevated/40">
        {WEEK.map((d) => (
          <div key={d} className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => (
          <DayCell
            key={isoDate(d)}
            date={d}
            items={byDay.get(isoDate(d)) ?? []}
            dim={d.getMonth() !== anchor.getMonth()}
            isToday={isSameDay(d, today)}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

function WeekView({ anchor, byDay, onOpen }: { anchor: Date; byDay: Map<string, CalendarEvent[]>; onOpen: (id: string) => void }) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const today = new Date();
  return (
    <div className="animate-fade-in grid grid-cols-7 gap-2">
      {days.map((d) => {
        const items = byDay.get(isoDate(d)) ?? [];
        return (
          <div key={isoDate(d)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { const id = e.dataTransfer.getData("text/event"); if (id) calendarStore.moveDate(id, isoDate(d)); }}
            className="flex min-h-[420px] flex-col rounded-xl border border-border bg-surface/40 p-2"
          >
            <div className="mb-2 flex items-center justify-between border-b border-border/60 px-1 pb-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{WEEK[d.getDay()]}</span>
              <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${
                isSameDay(d, today) ? "bg-primary font-semibold text-primary-foreground" : "text-foreground"
              }`}>
                {d.getDate()}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              {items.length === 0 ? (
                <span className="px-1 text-[10px] text-muted-foreground">—</span>
              ) : items.map((e) => <EventChip key={e.id} e={e} onOpen={onOpen} compact={false} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayView({ anchor, byDay, onOpen }: { anchor: Date; byDay: Map<string, CalendarEvent[]>; onOpen: (id: string) => void }) {
  const items = (byDay.get(isoDate(anchor)) ?? []).slice().sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7h–19h
  return (
    <div className="animate-fade-in grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border border-border bg-surface/40 p-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { const id = e.dataTransfer.getData("text/event"); if (id) calendarStore.moveDate(id, isoDate(anchor)); }}
      >
        <div className="mb-3 flex items-center gap-2 text-sm">
          <CalIcon className="h-4 w-4 text-primary" />
          <span className="font-display capitalize">{formatLongDate(isoDate(anchor))}</span>
        </div>
        <div className="divide-y divide-border/40">
          {hours.map((h) => {
            const slot = items.filter((e) => e.time && Number(e.time.split(":")[0]) === h);
            return (
              <div key={h} className="flex gap-3 py-2">
                <span className="w-12 shrink-0 text-[10px] tabular text-muted-foreground">{String(h).padStart(2, "0")}:00</span>
                <div className="flex flex-1 flex-col gap-1.5">
                  {slot.length === 0 ? <span className="text-[10px] text-muted-foreground/60">—</span> :
                    slot.map((e) => <EventChip key={e.id} e={e} onOpen={onOpen} compact={false} />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface/40 p-3">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sem horário</h3>
        <div className="flex flex-col gap-1.5">
          {items.filter((e) => !e.time).map((e) => <EventChip key={e.id} e={e} onOpen={onOpen} compact={false} />)}
          {items.filter((e) => !e.time).length === 0 && <span className="text-[10px] text-muted-foreground">Nada por aqui.</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Drawer ---------- */

function EventDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const event = useCalendar().find((e) => e.id === id) ?? null;
  const campaigns = useCampaigns();
  const projects = useProjects();
  const kanban = useKanban();

  return (
    <Sheet open={!!event} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[480px]">
        {event && <DrawerContent event={event} campaigns={campaigns} projects={projects} kanban={kanban} />}
      </SheetContent>
    </Sheet>
  );
}

function DrawerContent({
  event, campaigns, projects, kanban,
}: {
  event: CalendarEvent;
  campaigns: ReturnType<typeof useCampaigns>;
  projects: ReturnType<typeof useProjects>;
  kanban: ReturnType<typeof useKanban>;
}) {
  const s = CATEGORY_STYLE[event.category];
  const campaign = event.campaignId ? campaigns.find((c) => c.id === event.campaignId) : undefined;
  const project = event.projectId ? projects.find((p) => p.id === event.projectId) : undefined;
  const task = event.kanbanTaskId ? kanban.find((k) => k.id === event.kanbanTaskId) : undefined;

  const [comment, setComment] = useState("");
  const [newCheck, setNewCheck] = useState("");

  return (
    <>
      <SheetHeader className={`border-b border-border ${s.bg} px-6 py-5`}>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          <span className={s.text}>{event.category}</span>
        </div>
        <SheetTitle className="text-left font-display text-xl">{event.title}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><CalIcon className="h-3 w-3" />{formatLongDate(event.date)}</span>
          {event.time && <span className="tabular">· {event.time}</span>}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Select value={event.status} onValueChange={(v) => calendarStore.update(event.id, { status: v as EventStatus })}>
            <SelectTrigger className="h-7 w-auto gap-1 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>{EVENT_STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={event.priority} onValueChange={(v) => calendarStore.update(event.id, { priority: v as EventPriority })}>
            <SelectTrigger className="h-7 w-auto gap-1 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>{EVENT_PRIORITIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </SheetHeader>

      <div className="space-y-5 p-6">
        {/* Resumo */}
        <Section title="Resumo">
          <DLRow label="Responsáveis" value={
            event.owners.length === 0 ? "—" : (
              <div className="flex flex-wrap gap-1">
                {event.owners.map((o) => (
                  <span key={o} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 text-[11px]">
                    <User className="h-3 w-3" />{o}
                  </span>
                ))}
              </div>
            )
          } />
          {event.agency && <DLRow label="Agência" value={event.agency} />}
          {event.durationMin && <DLRow label="Duração" value={`${event.durationMin} min`} />}
        </Section>

        {event.description && (
          <Section title="Descrição">
            <p className="text-sm text-foreground/90">{event.description}</p>
          </Section>
        )}

        {/* Relacionados */}
        {(campaign || project || task) && (
          <Section title="Relacionados">
            <div className="space-y-1.5">
              {campaign && (
                <RelatedLink to="/campanhas/$id" params={{ id: campaign.id }} icon={Megaphone} label="Campanha" name={campaign.name} />
              )}
              {project && (
                <RelatedLink to="/projetos/$id" params={{ id: project.id }} icon={FolderKanban} label="Projeto" name={project.name} />
              )}
              {task && (
                <RelatedLink to="/kanban" icon={Trello} label="Kanban" name={task.title} />
              )}
            </div>
          </Section>
        )}

        <Tabs defaultValue="checklist">
          <TabsList className="grid grid-cols-4 bg-surface-elevated/60">
            <TabsTrigger value="checklist" className="text-[11px]">Checklist</TabsTrigger>
            <TabsTrigger value="arquivos" className="text-[11px]">Arquivos</TabsTrigger>
            <TabsTrigger value="comentarios" className="text-[11px]">Comentários</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[11px]">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="pt-4">
            <ul className="space-y-1">
              {event.checklist.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => calendarStore.toggleChecklist(event.id, c.id)}
                    className="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1 text-left text-sm transition-colors hover:bg-surface-elevated/60"
                  >
                    {c.done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.text}</span>
                  </button>
                </li>
              ))}
              {event.checklist.length === 0 && <p className="text-xs text-muted-foreground">Sem itens.</p>}
            </ul>
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (!newCheck.trim()) return; calendarStore.addChecklist(event.id, newCheck.trim()); setNewCheck(""); }}
            >
              <Input value={newCheck} onChange={(e) => setNewCheck(e.target.value)} placeholder="Adicionar item…" className="h-8 text-xs" />
              <Button type="submit" size="sm" variant="outline" className="h-8 gap-1"><Plus className="h-3 w-3" /></Button>
            </form>
          </TabsContent>

          <TabsContent value="arquivos" className="pt-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-elevated/40 px-4 py-6 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground">
              <Upload className="h-4 w-4" /> Anexar
              <input type="file" multiple className="hidden"
                onChange={(e) => { for (const f of Array.from(e.target.files ?? [])) calendarStore.addFile(event.id, { name: f.name, size: f.size }); }}
              />
            </label>
            <ul className="mt-3 divide-y divide-border/60">
              {event.files.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between py-2 text-sm">
                  <span className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-muted-foreground" />{f.name}</span>
                  <span className="text-[10px] tabular text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                </li>
              ))}
              {event.files.length === 0 && <li className="py-3 text-xs text-muted-foreground">Nenhum arquivo.</li>}
            </ul>
          </TabsContent>

          <TabsContent value="comentarios" className="pt-4">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; calendarStore.addComment(event.id, "Bruno", comment.trim()); setComment(""); }}>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Escreva um comentário…" />
              <Button type="submit" size="sm" className="h-auto gap-1 self-end"><Send className="h-3 w-3" /></Button>
            </form>
            <ul className="mt-4 space-y-3">
              {event.comments.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {c.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated/40 p-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold">{c.author}</span>
                      <span className="text-muted-foreground">{formatRelative(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm">{c.text}</p>
                  </div>
                </li>
              ))}
              {event.comments.length === 0 && (
                <li className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" /> Sem comentários.
                </li>
              )}
            </ul>
          </TabsContent>

          <TabsContent value="timeline" className="pt-4">
            <ol className="relative space-y-3 border-l border-border pl-5">
              {event.timeline.map((t) => (
                <li key={t.id} className="relative">
                  <span className="absolute -left-[23px] top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-primary/30" />
                  <div className="flex items-baseline justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="uppercase tracking-wide">{t.author ?? "Sistema"}</span>
                    <span>{formatRelative(t.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm">{t.message}</p>
                </li>
              ))}
              {event.timeline.length === 0 && (
                <li className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" /> Sem atividade.
                </li>
              )}
            </ol>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}
function DLRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <div>{value}</div>
    </div>
  );
}
function RelatedLink({ to, params, icon: Icon, label, name }: { to: string; params?: Record<string, string>; icon: typeof Megaphone; label: string; name: string }) {
  return (
    <Link
      to={to as never}
      params={params as never}
      className="group flex items-center justify-between rounded-md border border-border bg-surface-elevated/40 px-2.5 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <span className="flex items-center gap-2 truncate">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="truncate">{name}</span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ---------- New event ---------- */

function NewEventDialog({ defaultDate }: { defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const campaigns = useCampaigns();
  const projects = useProjects();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("Reunião");
  const [status, setStatus] = useState<EventStatus>("Planejado");
  const [priority, setPriority] = useState<EventPriority>("Média");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [owners, setOwners] = useState("");
  const [agency, setAgency] = useState("");
  const [campaignId, setCampaignId] = useState("none");
  const [projectId, setProjectId] = useState("none");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    calendarStore.add({
      title: title.trim(),
      category, status, priority,
      date, time: time || undefined,
      description: description.trim(),
      owners: owners.split(",").map((s) => s.trim()).filter(Boolean),
      agency: agency.trim() || undefined,
      campaignId: campaignId === "none" ? undefined : campaignId,
      projectId: projectId === "none" ? undefined : projectId,
    });
    setOpen(false); setTitle(""); setDescription(""); setOwners(""); setAgency(""); setTime("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 gap-2 text-primary-foreground shadow-[var(--shadow-glow)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4" /> Novo evento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader><DialogTitle className="font-display text-xl">Novo evento</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as EventPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Horário</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EventStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Agência</Label>
              <Input value={agency} onChange={(e) => setAgency(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Responsáveis <span className="text-[10px] text-muted-foreground">(separe por vírgula)</span></Label>
            <Input value={owners} onChange={(e) => setOwners(e.target.value)} placeholder="Bruno, Marina" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Campanha</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Projeto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="text-primary-foreground shadow-[var(--shadow-glow)]" style={{ backgroundImage: "var(--gradient-primary)" }}>Criar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
