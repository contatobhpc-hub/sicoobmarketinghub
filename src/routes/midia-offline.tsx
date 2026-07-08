import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CircleDollarSign,
  FileImage,
  LayoutGrid,
  List,
  MapPin,
  Megaphone,
  Plus,
  Search,
  Trash2,
  Truck,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  CATEGORY_TONE,
  OFFLINE_MEDIA_CATEGORIES,
  OFFLINE_MEDIA_STATUSES,
  STATUS_TONE,
  daysUntil,
  offlineMediaStore,
  removalAlert,
  useOfflineMedia,
  type OfflineMedia,
  type OfflineMediaCategory,
  type OfflineMediaStatus,
} from "@/lib/offline-media";

export const Route = createFileRoute("/midia-offline")({
  head: () => ({
    meta: [
      { title: "Mídia Offline — Marketing Hub" },
      { name: "description", content: "Outdoor, painéis, faixas e materiais físicos com mapa, calendário e alertas de retirada." },
    ],
  }),
  component: MidiaOfflinePage,
});

type ViewMode = "cards" | "map" | "list" | "calendar";

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const fmtDate = (d: string) =>
  new Date(d + (d.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function MidiaOfflinePage() {
  const items = useOfflineMedia();
  const [view, setView] = useState<ViewMode>("cards");
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | OfflineMediaCategory>("all");
  const [status, setStatus] = useState<"all" | OfflineMediaStatus>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (cat !== "all" && m.category !== cat) return false;
      if (status !== "all" && m.status !== status) return false;
      if (!q) return true;
      return [m.title, m.city, m.location, m.supplier, m.campaign ?? "", m.owner].join(" ").toLowerCase().includes(q);
    });
  }, [items, query, cat, status]);

  const totals = useMemo(() => {
    const active = items.filter((m) => m.status === "Instalado" || m.status === "Aguardando instalação");
    const value = items.reduce((acc, m) => acc + m.value, 0);
    const alerts = items.filter((m) => {
      const a = removalAlert(m);
      return a === "expired" || a === "urgent";
    });
    return { count: items.length, active: active.length, value, alerts: alerts.length };
  }, [items]);

  const selected = openId ? items.find((m) => m.id === openId) ?? null : null;

  return (
    <AppShell>
      <PageHeader
        title="Mídia Offline"
        description="Outdoor, painéis, faixas e materiais físicos. Mapa, calendário e alertas automáticos de retirada."
        actions={
          <div className="flex items-center gap-2">
            <ModuleManagementButton module="midia-offline" />
            <Dialog open={creating} onOpenChange={setCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Nova mídia
                </Button>
              </DialogTrigger>
              <NewMediaDialog onClose={() => setCreating(false)} />
            </Dialog>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard icon={Megaphone} label="Total de mídias" value={String(totals.count)} />
        <KpiCard icon={Truck} label="Ativas no momento" value={String(totals.active)} />
        <KpiCard icon={CircleDollarSign} label="Investimento total" value={fmtBRL(totals.value)} />
        <KpiCard icon={AlertTriangle} label="Retiradas alerta" value={String(totals.alerts)} tone={totals.alerts > 0 ? "danger" : "default"} />
      </div>

      {/* Alertas */}
      <RemovalAlerts items={items} onOpen={setOpenId} />

      {/* Filtros */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar título, cidade, local, fornecedor…" className="pl-9" />
          </div>
          <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {OFFLINE_MEDIA_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {OFFLINE_MEDIA_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as ViewMode)} className="ml-auto">
            <ToggleGroupItem value="cards" aria-label="Cards"><LayoutGrid className="size-4" /></ToggleGroupItem>
            <ToggleGroupItem value="map" aria-label="Mapa"><MapPin className="size-4" /></ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendário"><CalendarIcon className="size-4" /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Lista"><List className="size-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </Card>

      {view === "cards" && <CardsView items={filtered} onOpen={setOpenId} />}
      {view === "map" && <MapView items={filtered} onOpen={setOpenId} />}
      {view === "calendar" && <CalendarView items={filtered} onOpen={setOpenId} />}
      {view === "list" && <ListView items={filtered} onOpen={setOpenId} />}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {selected && <MediaDetail media={selected} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${tone === "danger" ? "text-red-400" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 font-display text-2xl font-semibold ${tone === "danger" ? "text-red-300" : ""}`}>{value}</div>
    </Card>
  );
}

function RemovalAlerts({ items, onOpen }: { items: OfflineMedia[]; onOpen: (id: string) => void }) {
  const alerts = items
    .map((m) => ({ m, level: removalAlert(m), days: daysUntil(m.removalDate) }))
    .filter((a) => a.level === "expired" || a.level === "urgent")
    .sort((a, b) => a.days - b.days);
  if (alerts.length === 0) return null;
  return (
    <Card className="border-red-500/30 bg-red-500/5 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-300">
        <AlertTriangle className="size-4" /> Retiradas com prazo crítico
      </div>
      <div className="flex flex-wrap gap-2">
        {alerts.map(({ m, days }) => (
          <button
            key={m.id}
            onClick={() => onOpen(m.id)}
            className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-left text-xs text-red-200 transition hover:bg-red-500/20"
          >
            <span className="font-medium">{m.title}</span>
            <span className="ml-2 text-red-300/80">
              {days < 0 ? `vencida há ${-days}d` : days === 0 ? "hoje" : `em ${days}d`}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function CardsView({ items, onOpen }: { items: OfflineMedia[]; onOpen: (id: string) => void }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((m) => (
        <MediaCard key={m.id} m={m} onClick={() => onOpen(m.id)} />
      ))}
    </div>
  );
}

function MediaCard({ m, onClick }: { m: OfflineMedia; onClick: () => void }) {
  const alert = removalAlert(m);
  const d = daysUntil(m.removalDate);
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={CATEGORY_TONE[m.category]}>{m.category}</Badge>
            <Badge variant="outline" className={STATUS_TONE[m.status]}>{m.status}</Badge>
          </div>
          <h3 className="mt-2 truncate font-medium">{m.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" /> {m.city} · {m.location}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-right text-xs text-muted-foreground">
          <Button
            size="icon"
            variant="ghost"
            className="size-7 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remover a mídia "${m.title}"?`)) {
                offlineMediaStore.remove(m.id);
                toast.success("Mídia removida.");
              }
            }}
            aria-label="Remover mídia"
          >
            <Trash2 className="size-4" />
          </Button>
          <div>{fmtBRL(m.value)}</div>
          <div>{m.supplier}</div>
        </div>

      </div>
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {fmtDate(m.installDate)} → {fmtDate(m.removalDate)}
        </span>
        {alert !== "ok" && (
          <span
            className={`rounded-full px-2 py-0.5 ${
              alert === "expired"
                ? "bg-red-500/15 text-red-300"
                : alert === "urgent"
                ? "bg-orange-500/15 text-orange-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {alert === "expired" ? `Retirada vencida ${-d}d` : `Retira em ${d}d`}
          </span>
        )}
      </div>
    </Card>
  );
}

function MapView({ items, onOpen }: { items: OfflineMedia[]; onOpen: (id: string) => void }) {
  // Group by coords to cluster pins for the same city
  const groups = useMemo(() => {
    const map = new Map<string, OfflineMedia[]>();
    items.forEach((m) => {
      const c = m.coords ?? { x: 50, y: 50 };
      const key = `${c.x.toFixed(0)}_${c.y.toFixed(0)}`;
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([key, arr]) => ({ key, items: arr, coords: arr[0].coords ?? { x: 50, y: 50 } }));
  }, [items]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="relative h-[520px] w-full bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(circle_at_70%_80%,rgba(56,189,248,0.14),transparent_55%)]">
        {/* grid */}
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute left-3 top-3 z-10 rounded-md border border-border/60 bg-background/70 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
          Mapa regional · {items.length} mídias
        </div>
        {groups.map((g) => {
          const first = g.items[0];
          const alert = g.items.some((m) => removalAlert(m) === "expired" || removalAlert(m) === "urgent");
          return (
            <div
              key={g.key}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${g.coords.x}%`, top: `${g.coords.y}%` }}
            >
              <button
                onClick={() => onOpen(first.id)}
                className={`group relative flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-lg backdrop-blur transition hover:scale-105 ${
                  alert
                    ? "border-red-500/40 bg-red-500/15 text-red-200"
                    : "border-primary/40 bg-primary/15 text-primary-foreground"
                }`}
              >
                <MapPin className="size-3.5" />
                <span className="font-medium">{first.city.split("/")[0]}</span>
                <span className="rounded-full bg-background/40 px-1.5 text-[10px]">{g.items.length}</span>
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full mt-2 hidden w-56 -translate-x-1/2 rounded-md border border-border/60 bg-popover p-2 text-xs shadow-xl group-hover:block">
                {g.items.slice(0, 3).map((m) => (
                  <div key={m.id} className="truncate">• {m.title}</div>
                ))}
                {g.items.length > 3 && <div className="mt-1 text-muted-foreground">+ {g.items.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function CalendarView({ items, onOpen }: { items: OfflineMedia[]; onOpen: (id: string) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const firstDow = (new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay() + 6) % 7; // mon-first
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: { date: Date | null }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), d) });

  function eventsOn(date: Date) {
    const iso = date.toISOString().slice(0, 10);
    return items.flatMap((m) => {
      const out: { m: OfflineMedia; kind: "install" | "removal" }[] = [];
      if (m.installDate.slice(0, 10) === iso) out.push({ m, kind: "install" });
      if (m.removalDate.slice(0, 10) === iso) out.push({ m, kind: "removal" });
      return out;
    });
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-lg font-semibold capitalize">{monthLabel}</div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            ←
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Hoje
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            →
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-muted-foreground">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (!c.date) return <div key={i} className="h-24 rounded-md bg-muted/10" />;
          const evs = eventsOn(c.date);
          const isToday = c.date.getTime() === today.getTime();
          return (
            <div
              key={i}
              className={`h-24 rounded-md border p-1 text-xs ${isToday ? "border-primary/50 bg-primary/5" : "border-border/40 bg-card/30"}`}
            >
              <div className={`mb-0.5 text-[11px] ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                {c.date.getDate()}
              </div>
              <div className="space-y-0.5 overflow-hidden">
                {evs.slice(0, 3).map(({ m, kind }, idx) => (
                  <button
                    key={`${m.id}-${kind}-${idx}`}
                    onClick={() => onOpen(m.id)}
                    title={`${kind === "install" ? "Instalação" : "Retirada"}: ${m.title}`}
                    className={`block w-full truncate rounded px-1 text-left text-[10px] leading-tight ${
                      kind === "install"
                        ? "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30"
                        : "bg-orange-500/20 text-orange-200 hover:bg-orange-500/30"
                    }`}
                  >
                    {kind === "install" ? "⬆" : "⬇"} {m.title}
                  </button>
                ))}
                {evs.length > 3 && <div className="text-[10px] text-muted-foreground">+ {evs.length - 3}</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-blue-500/60" /> Instalação</span>
        <span className="flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-orange-500/60" /> Retirada</span>
      </div>
    </Card>
  );
}

function ListView({ items, onOpen }: { items: OfflineMedia[]; onOpen: (id: string) => void }) {
  if (items.length === 0) return <EmptyState />;
  return (
    <Card className="divide-y divide-border/40 p-0">
      {items.map((m) => {
        const a = removalAlert(m);
        const d = daysUntil(m.removalDate);
        return (
          <div key={m.id} className="group flex items-center transition hover:bg-muted/30">
            <button
              onClick={() => onOpen(m.id)}
              className="flex flex-1 items-center gap-3 px-4 py-3 text-left text-sm"
            >
              <Badge variant="outline" className={`${CATEGORY_TONE[m.category]} shrink-0`}>{m.category}</Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{m.title}</div>
                <div className="truncate text-xs text-muted-foreground">{m.city} · {m.location} · {m.supplier}</div>
              </div>
              <div className="hidden w-32 text-xs text-muted-foreground md:block">
                {fmtDate(m.installDate)} → {fmtDate(m.removalDate)}
              </div>
              <Badge variant="outline" className={`${STATUS_TONE[m.status]} hidden md:inline-flex`}>{m.status}</Badge>
              <div className="w-20 text-right text-xs">{fmtBRL(m.value)}</div>
              {a !== "ok" && (
                <span
                  className={`hidden rounded-full px-2 py-0.5 text-[11px] md:inline ${
                    a === "expired" ? "bg-red-500/15 text-red-300" : a === "urgent" ? "bg-orange-500/15 text-orange-300" : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {a === "expired" ? `vencida ${-d}d` : `${d}d`}
                </span>
              )}
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="mr-2 size-8 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-red-400"
              onClick={() => {
                if (confirm(`Remover a mídia "${m.title}"?`)) {
                  offlineMediaStore.remove(m.id);
                  toast.success("Mídia removida.");
                }
              }}
              aria-label="Remover mídia"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );

      })}
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <Megaphone className="mx-auto size-8 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">Nenhuma mídia encontrada com os filtros atuais.</p>
    </Card>
  );
}

function MediaDetail({ media }: { media: OfflineMedia }) {
  const [notes, setNotes] = useState(media.notes);
  return (
    <>
      <SheetHeader className="space-y-2 pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={CATEGORY_TONE[media.category]}>{media.category}</Badge>
          <Badge variant="outline" className={STATUS_TONE[media.status]}>{media.status}</Badge>
        </div>
        <SheetTitle className="font-display text-xl">{media.title}</SheetTitle>
        <SheetDescription className="flex items-center gap-1 text-xs">
          <MapPin className="size-3" /> {media.city} · {media.location}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoRow label="Fornecedor" value={media.supplier} />
        <InfoRow label="Responsável" value={media.owner} icon={UserIcon} />
        <InfoRow label="Instalação" value={fmtDate(media.installDate)} icon={CalendarIcon} />
        <InfoRow label="Retirada" value={fmtDate(media.removalDate)} icon={CalendarIcon} />
        <InfoRow label="Valor" value={fmtBRL(media.value)} icon={CircleDollarSign} />
        <InfoRow label="Centro de custo" value={media.costCenter} />
        {media.campaign && <InfoRow label="Campanha" value={media.campaign} icon={Megaphone} />}
        {media.project && <InfoRow label="Projeto" value={media.project} />}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Status:</Label>
        <Select value={media.status} onValueChange={(v) => offlineMediaStore.setStatus(media.id, v as OfflineMediaStatus)}>
          <SelectTrigger className="h-8 w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {OFFLINE_MEDIA_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="resumo" className="mt-5">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="arte">Arte</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">Observações</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== media.notes && offlineMediaStore.update(media.id, { notes }, "Observações atualizadas.")}
              rows={4}
              className="mt-1"
              placeholder="Anotações internas, restrições, contato no local…"
            />
          </div>
        </TabsContent>

        <TabsContent value="arte" className="space-y-2">
          {media.artworkFile ? (
            <Card className="flex items-center gap-3 p-3 text-sm">
              <FileImage className="size-5 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{media.artworkFile.name}</div>
                <div className="text-xs text-muted-foreground">{(media.artworkFile.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => offlineMediaStore.update(media.id, { artworkFile: null }, "Arte removida.")}>Remover</Button>
            </Card>
          ) : (
            <Card className="flex items-center justify-between p-3 text-sm">
              <span className="text-muted-foreground">Nenhuma arte enviada.</span>
              <Button size="sm" variant="outline" onClick={() => {
                offlineMediaStore.update(media.id, { artworkFile: { id: "f", name: "Arte-final.pdf", size: 1200000 } }, "Arte anexada.");
                toast.success("Arte anexada");
              }}><Upload className="size-3.5" /> Enviar arte</Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fotos" className="space-y-2">
          {media.photos.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">Nenhuma foto enviada.</Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {media.photos.map((p) => (
                <Card key={p.id} className="flex h-24 flex-col items-center justify-center gap-1 p-2 text-xs">
                  <FileImage className="size-5 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                </Card>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" className="w-full" onClick={() => {
            const photo = { id: `ph-${Date.now()}`, name: `foto-${media.photos.length + 1}.jpg`, size: 1500000 };
            offlineMediaStore.update(media.id, { photos: [...media.photos, photo] }, "Foto adicionada.");
          }}><Upload className="size-3.5" /> Adicionar foto</Button>
        </TabsContent>

        <TabsContent value="timeline">
          <ScrollArea className="h-72 pr-2">
            <ol className="space-y-2">
              {media.timeline.map((t) => (
                <li key={t.id} className="rounded-md border border-border/40 bg-card/40 p-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t.author ?? "Sistema"}</span>
                    <span>{new Date(t.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="mt-1">{t.message}</p>
                </li>
              ))}
            </ol>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-card/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-center gap-1 truncate text-sm">
        {Icon && <Icon className="size-3.5 text-muted-foreground" />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function NewMediaDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: "",
    category: "Outdoor" as OfflineMediaCategory,
    city: "",
    location: "",
    supplier: "",
    campaign: "",
    installDate: new Date().toISOString().slice(0, 10),
    removalDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    owner: "",
    value: 0,
    costCenter: "CC-MKT-001",
  });

  function submit() {
    if (!form.title || !form.city || !form.location || !form.supplier || !form.owner) {
      toast.error("Preencha título, cidade, local, fornecedor e responsável.");
      return;
    }
    offlineMediaStore.add(form);
    toast.success("Mídia cadastrada");
    onClose();
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Nova mídia offline</DialogTitle>
        <DialogDescription>Cadastre uma nova peça física ou veiculação fora do digital.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Título</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex.: Outdoor BR-365 entrada" />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as OfflineMediaCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {OFFLINE_MEDIA_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Cidade</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Patos de Minas/MG" />
        </div>
        <div className="col-span-2">
          <Label>Local</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Endereço, ponto, número" />
        </div>
        <div>
          <Label>Fornecedor</Label>
          <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </div>
        <div>
          <Label>Campanha</Label>
          <Input value={form.campaign} onChange={(e) => setForm({ ...form, campaign: e.target.value })} placeholder="(opcional)" />
        </div>
        <div>
          <Label>Data de instalação</Label>
          <Input type="date" value={form.installDate} onChange={(e) => setForm({ ...form, installDate: e.target.value })} />
        </div>
        <div>
          <Label>Data de retirada</Label>
          <Input type="date" value={form.removalDate} onChange={(e) => setForm({ ...form, removalDate: e.target.value })} />
        </div>
        <div>
          <Label>Responsável</Label>
          <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
        </div>
        <div>
          <Label>Valor (R$)</Label>
          <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })} />
        </div>
        <div className="col-span-2">
          <Label>Centro de custo</Label>
          <Input value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Cadastrar mídia</Button>
      </DialogFooter>
    </DialogContent>
  );
}
