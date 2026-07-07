import { useMemo, useState, useSyncExternalStore } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Archive,
  ArchiveRestore,
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type NotificationCategory,
  addNotification,
  getNotifications,
  getPrefs,
  markAllRead,
  markRead,
  relativeTime,
  removeNotification,
  requestPushPermission,
  setCategoryPref,
  setPrefs,
  subscribeNotifications,
  toggleArchive,
  toggleStar,
} from "@/lib/notifications";

export const Route = createFileRoute("/notificacoes")({
  component: NotificacoesPage,
});

type Tab = "todas" | "nao-lidas" | "favoritas" | "arquivadas";

function useNotificationsStore() {
  const items = useSyncExternalStore(subscribeNotifications, getNotifications, getNotifications);
  const prefs = useSyncExternalStore(subscribeNotifications, getPrefs, getPrefs);
  return { items, prefs };
}

function NotificacoesPage() {
  const { items, prefs } = useNotificationsStore();
  const [tab, setTab] = useState<Tab>("todas");
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (tab === "nao-lidas" && n.read) return false;
      if (tab === "favoritas" && !n.starred) return false;
      if (tab === "arquivadas" && !n.archived) return false;
      if (tab !== "arquivadas" && n.archived) return false;
      if (category !== "all" && n.category !== category) return false;
      if (query && !`${n.title} ${n.message}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [items, tab, category, query]);

  const counts = useMemo(() => {
    const active = items.filter((n) => !n.archived);
    return {
      unread: active.filter((n) => !n.read).length,
      starred: active.filter((n) => n.starred).length,
      archived: items.filter((n) => n.archived).length,
      total: active.length,
    };
  }, [items]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.filter((n) => !n.archived).forEach((n) => { map[n.category] = (map[n.category] ?? 0) + 1; });
    return map;
  }, [items]);

  const handlePushToggle = async (next: boolean) => {
    if (next) {
      const perm = await requestPushPermission();
      if (perm !== "granted") {
        toast.error("Permissão de notificações negada pelo navegador.");
        return;
      }
      toast.success("Notificações push ativadas.");
    }
    setPrefs({ push: next });
  };

  const triggerSample = () => {
    addNotification({
      category: "sistema",
      title: "Nova notificação de teste",
      message: "Esta é uma notificação inteligente gerada agora.",
      priority: "media",
    });
    toast("Notificação criada");
  };

  return (
    <AppShell>
      <PageHeader
        title="Central de Notificações"
        description="Alertas inteligentes do Marketing OS. Tudo o que precisa da sua atenção, em um só lugar."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={triggerSample}>
              <Plus className="mr-2 h-4 w-4" />Simular
            </Button>
            <Button size="sm" onClick={markAllRead} disabled={!counts.unread}>
              <CheckCheck className="mr-2 h-4 w-4" />Marcar todas como lidas
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_300px]">
        {/* Left: categories */}
        <Card className="h-fit p-3">
          <div className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Caixas</div>
          <nav className="space-y-1">
            {([
              { key: "todas", label: "Todas", count: counts.total, icon: Bell },
              { key: "nao-lidas", label: "Não lidas", count: counts.unread, icon: BellRing },
              { key: "favoritas", label: "Favoritas", count: counts.starred, icon: Star },
              { key: "arquivadas", label: "Arquivadas", count: counts.archived, icon: Archive },
            ] as const).map((b) => (
              <button
                key={b.key}
                onClick={() => setTab(b.key)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition ${
                  tab === b.key ? "bg-muted font-medium" : "hover:bg-muted/60"
                }`}
              >
                <span className="flex items-center gap-2"><b.icon className="h-4 w-4 text-muted-foreground" />{b.label}</span>
                <span className="text-xs text-muted-foreground">{b.count}</span>
              </button>
            ))}
          </nav>

          <Separator className="my-3" />
          <div className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Categorias</div>
          <nav className="space-y-1">
            <button
              onClick={() => setCategory("all")}
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                category === "all" ? "bg-muted font-medium" : "hover:bg-muted/60"
              }`}
            >
              <span>Todas categorias</span>
            </button>
            {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm ${
                  category === c ? "bg-muted font-medium" : "hover:bg-muted/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[c] }} />
                  {CATEGORY_LABELS[c]}
                </span>
                <span className="text-xs text-muted-foreground">{categoryCounts[c] ?? 0}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Center: list */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar notificações…" className="h-9 pl-8" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="px-6 py-16 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => (
                <Card
                  key={n.id}
                  className={`group flex items-start gap-3 p-3 transition-all hover:shadow-md ${!n.read ? "border-l-2" : ""}`}
                  style={!n.read ? { borderLeftColor: CATEGORY_COLORS[n.category] } : undefined}
                >
                  <div
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    style={{ background: `${CATEGORY_COLORS[n.category]} / 0.15`, backgroundColor: `color-mix(in oklch, ${CATEGORY_COLORS[n.category]} 18%, transparent)` }}
                  >
                    <Bell className="h-4 w-4" style={{ color: CATEGORY_COLORS[n.category] }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`truncate text-sm ${n.read ? "font-normal" : "font-semibold"}`}>{n.title}</h3>
                          {n.priority === "alta" && (
                            <Badge variant="destructive" className="h-4 px-1.5 text-[10px]">Alta</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{CATEGORY_LABELS[n.category]}</Badge>
                          <span>{relativeTime(n.createdAt)}</span>
                          {n.link && <a href={n.link} className="text-primary hover:underline">Abrir</a>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={n.starred ? "Desfavoritar" : "Favoritar"} onClick={() => toggleStar(n.id)}>
                          <Star className={`h-3.5 w-3.5 ${n.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Marcar como lida" onClick={() => markRead(n.id, !n.read)}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={n.archived ? "Desarquivar" : "Arquivar"} onClick={() => toggleArchive(n.id)}>
                          {n.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Excluir" onClick={() => removeNotification(n.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right: preferences */}
        <Card className="h-fit p-4">
          <h3 className="font-display text-sm font-semibold">Canais</h3>
          <p className="text-xs text-muted-foreground">Como você quer receber alertas.</p>
          <div className="mt-3 space-y-3">
            <PrefRow icon={<BellRing className="h-4 w-4" />} label="Push do navegador" hint="Notificações em tempo real" checked={prefs.push} onChange={handlePushToggle} />
            <PrefRow icon={<Mail className="h-4 w-4" />} label="Email" hint="Em breve" checked={prefs.email} onChange={(v) => { setPrefs({ email: v }); toast("Integração de email em breve."); }} disabled />
            <PrefRow icon={<MessageCircle className="h-4 w-4" />} label="WhatsApp" hint="Em breve" checked={prefs.whatsapp} onChange={(v) => { setPrefs({ whatsapp: v }); toast("Integração de WhatsApp em breve."); }} disabled />
          </div>

          <Separator className="my-4" />
          <h3 className="font-display text-sm font-semibold">Categorias</h3>
          <p className="text-xs text-muted-foreground">Receber alertas por tipo.</p>
          <div className="mt-3 space-y-2">
            {(Object.keys(CATEGORY_LABELS) as NotificationCategory[]).map((c) => (
              <div key={c} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[c] }} />
                  {CATEGORY_LABELS[c]}
                </span>
                <Switch checked={prefs.perCategory[c]} onCheckedChange={(v) => setCategoryPref(c, v)} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function PrefRow({
  icon, label, hint, checked, onChange, disabled,
}: {
  icon: React.ReactNode; label: string; hint?: string; checked: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint && <div className="text-[11px] text-muted-foreground">{hint}</div>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
