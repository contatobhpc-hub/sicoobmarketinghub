import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageSquare,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  User as UserIcon,

} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PARTNER_CATEGORIES,
  partnerCategoriesStore,
  usePartnerCategories,
  PARTNER_STATUSES,
  type Partner,
  type PartnerCategory,
  type PartnerStatus,
  categoryTone,
  formatBRL,
  formatDate,
  formatRelative,
  partnerInitials,
  partnersStore,
  renewalAlert,
  statusTone,
  usePartner,
  usePartners,
} from "@/lib/partners";

export const Route = createFileRoute("/parceiros")({
  head: () => ({
    meta: [
      { title: "Parceiros — Marketing Hub" },
      { name: "description", content: "CRM de parceiros, agências e fornecedores estratégicos." },
    ],
  }),
  component: ParceirosPage,
});

function ParceirosPage() {
  const partners = usePartners();
  const categories = usePartnerCategories();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PartnerStatus | "todos">("todos");
  const [category, setCategory] = useState<PartnerCategory | "todas">("todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const filtered = useMemo(() => {
    return partners.filter((p) => {
      if (status !== "todos" && p.status !== status) return false;
      if (category !== "todas" && p.category !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.company.toLowerCase().includes(q) ||
        p.contact.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
      );
    });
  }, [partners, query, status, category]);

  const stats = useMemo(() => {
    const total = partners.length;
    const active = partners.filter((p) => p.status === "Ativo").length;
    const renewals = partners.filter((p) => {
      const r = renewalAlert(p);
      return r.level === "urgent" || r.level === "expired" || p.status === "Renovação";
    }).length;
    const invested = partners.reduce((acc, p) => acc + p.investmentMonth, 0);
    return { total, active, renewals, invested };
  }, [partners]);

  const selected = selectedId ? partners.find((p) => p.id === selectedId) ?? null : null;

  return (
    <AppShell>
      <PageHeader
        title="Parceiros"
        description="CRM de agências, fornecedores e patrocinadores."
        actions={
          <div className="flex items-center gap-2">
            <ModuleManagementButton
              module="parceiros"
              extraTabs={[
                {
                  value: "parceiro-categorias",
                  label: "Cat. Parceiros",
                  content: <PartnerCategoriesTab />,
                },
              ]}
            />
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Novo parceiro
                </Button>
              </DialogTrigger>
              <NewPartnerDialog onClose={() => setOpenNew(false)} />
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total" value={stats.total} icon={<Building2 className="size-4" />} />
        <StatCard label="Ativos" value={stats.active} icon={<CheckCircle2 className="size-4" />} tone="success" />
        <StatCard label="Renovações" value={stats.renewals} icon={<Bell className="size-4" />} tone="warning" />
        <StatCard label="Investimento/mês" value={formatBRL(stats.invested)} icon={<TrendingUp className="size-4" />} tone="primary" />
      </div>

      <Card className="p-3 surface-elevated">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresa, contato, cidade ou e-mail…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as PartnerStatus | "todos")}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {PARTNER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => setCategory(v as PartnerCategory | "todas")}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground surface-elevated">
            Nenhum parceiro encontrado com os filtros atuais.
          </Card>
        )}
        {filtered.map((p) => (
          <PartnerRow
            key={p.id}
            partner={p}
            onOpen={() => setSelectedId(p.id)}
            onDelete={() => {
              if (window.confirm(`Excluir o parceiro "${p.company}"? Esta ação não pode ser desfeita.`)) {
                partnersStore.remove(p.id);
                if (selectedId === p.id) setSelectedId(null);
                toast.success(`Parceiro "${p.company}" excluído.`);
              }
            }}
          />
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
          {selected && <PartnerDetail partner={selected} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function StatCard({ label, value, icon, tone = "default" }: { label: string; value: string | number; icon: React.ReactNode; tone?: "default" | "success" | "warning" | "primary" }) {
  const toneCls = {
    default: "text-muted-foreground",
    success: "text-[color:var(--color-success)]",
    warning: "text-[color:var(--color-warning)]",
    primary: "text-primary",
  }[tone];
  return (
    <Card className="p-4 surface-elevated">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={toneCls}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-display tracking-tight">{value}</div>
    </Card>
  );
}

function PartnerRow({ partner, onOpen, onDelete }: { partner: Partner; onOpen: () => void; onDelete: () => void }) {
  const renewal = renewalAlert(partner);
  const delivered = partner.expectedReturn > 0 ? Math.min(100, Math.round((partner.deliveredReturn / partner.expectedReturn) * 100)) : 0;

  return (
    <Card
      onClick={onOpen}
      className="p-4 surface-elevated hover:border-primary/40 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-12 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-display">
            {partnerInitials(partner.company)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base truncate">{partner.company}</h3>
            <Badge variant="secondary" className={cn("text-[10px]", categoryTone(partner.category))}>
              {partner.category}
            </Badge>
            <Badge variant="secondary" className={cn("text-[10px]", statusTone(partner.status))}>
              {partner.status}
            </Badge>
            {renewal.level !== "ok" && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-[10px] gap-1",
                  renewal.level === "expired" && "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]",
                  renewal.level === "urgent" && "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
                  renewal.level === "soon" && "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]",
                )}
              >
                <Bell className="size-3" /> {renewal.label}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1"><UserIcon className="size-3" /> {partner.contact}</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {partner.city}</span>
            <span className="inline-flex items-center gap-1"><Mail className="size-3" /> {partner.email}</span>
          </div>
        </div>

        <div className="hidden md:block w-40">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Retorno</div>
          <Progress value={delivered} className="h-1.5 mt-1" />
          <div className="text-[11px] text-muted-foreground mt-1">
            {formatBRL(partner.deliveredReturn)} / {formatBRL(partner.expectedReturn)}
          </div>
        </div>

        <div className="hidden md:block text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Investimento</div>
          <div className="text-sm font-display">{formatBRL(partner.investmentMonth)}</div>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Excluir ${partner.company}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Card>
  );
}

function PartnerDetail({ partner }: { partner: Partner }) {
  const fresh = usePartner(partner.id) ?? partner;
  const renewal = renewalAlert(fresh);
  const docs = fresh.files.filter((f) => f.kind === "doc");
  const photos = fresh.files.filter((f) => f.kind === "photo");
  const delivered = fresh.expectedReturn > 0 ? Math.min(100, Math.round((fresh.deliveredReturn / fresh.expectedReturn) * 100)) : 0;
  const [note, setNote] = useState("");
  const [newCheck, setNewCheck] = useState("");
  const [editOpen, setEditOpen] = useState(false);


  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-start gap-4">
          <Avatar className="size-14 rounded-xl">
            <AvatarFallback className="rounded-xl bg-primary/15 text-primary font-display text-lg">
              {partnerInitials(fresh.company)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl">{fresh.company}</h2>
              <Badge variant="secondary" className={cn("text-[10px]", categoryTone(fresh.category))}>{fresh.category}</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              <MapPin className="size-3" /> {fresh.city}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={fresh.status} onValueChange={(v) => partnersStore.update(fresh.id, { status: v as PartnerStatus })}>
              <SelectTrigger className={cn("w-[140px] h-8 text-xs", statusTone(fresh.status))}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_STATUSES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
              </SelectContent>
            </Select>
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8">
                  <Pencil className="size-3.5" /> Editar
                </Button>
              </DialogTrigger>
              <EditPartnerDialog partner={fresh} onClose={() => setEditOpen(false)} />
            </Dialog>
          </div>
        </div>


        {renewal.level !== "ok" && (
          <div
            className={cn(
              "mt-4 flex items-center gap-2 rounded-lg border p-3 text-xs",
              renewal.level === "expired" && "border-[color:var(--color-destructive)]/40 bg-[color:var(--color-destructive)]/5 text-[color:var(--color-destructive)]",
              renewal.level === "urgent" && "border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/5 text-[color:var(--color-warning)]",
              renewal.level === "soon" && "border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/5 text-[color:var(--color-accent)]",
            )}
          >
            <Bell className="size-4" />
            <div className="flex-1">
              <strong className="font-display">Lembrete de renovação:</strong> {renewal.label} ({formatDate(fresh.contractEnd)})
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3">
          <EditableStat
            label="Investimento/mês"
            value={fresh.investmentMonth}
            onSave={(v) => partnersStore.update(fresh.id, { investmentMonth: v })}
          />
          <EditableStat
            label="Esperado"
            value={fresh.expectedReturn}
            onSave={(v) => partnersStore.update(fresh.id, { expectedReturn: v })}
          />
          <EditableStat
            label="Entregue"
            value={fresh.deliveredReturn}
            onSave={(v) => partnersStore.update(fresh.id, { deliveredReturn: v })}
          />
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>Retorno entregue</span><span>{delivered}%</span>
          </div>
          <Progress value={delivered} className="h-1.5" />
        </div>
      </div>

      <Tabs defaultValue="resumo" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-4 border-b border-border/60">
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="docs">Documentos</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <TabsContent value="resumo" className="m-0 space-y-4">
              <InfoGrid>
                <InfoItem icon={<UserIcon className="size-3.5" />} label="Contato" value={fresh.contact} />
                <InfoItem icon={<Phone className="size-3.5" />} label="Telefone" value={fresh.phone || "—"} />
                <InfoItem icon={<MessageSquare className="size-3.5" />} label="WhatsApp" value={fresh.whatsapp || "—"} />
                <InfoItem icon={<Mail className="size-3.5" />} label="E-mail" value={fresh.email || "—"} />
                <InfoItem icon={<UserIcon className="size-3.5" />} label="Responsável interno" value={fresh.owner} />
                <InfoItem icon={<CalendarIcon className="size-3.5" />} label="Vencimento do contrato" value={formatDate(fresh.contractEnd)} />
              </InfoGrid>

              <Card className="p-4 surface-elevated">
                <h4 className="font-display text-sm mb-2">Contrapartidas</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {fresh.counterparts || "Sem contrapartidas registradas."}
                </p>
              </Card>

              <Card className="p-4 surface-elevated">
                <h4 className="font-display text-sm mb-2">Notas internas</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {fresh.notes || "Sem notas registradas."}
                </p>
                <Separator className="my-3" />
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Adicionar uma nota à timeline…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!note.trim()}
                    onClick={() => {
                      partnersStore.addNote(fresh.id, note.trim());
                      setNote("");
                      toast.success("Nota registrada na timeline.");
                    }}
                  >
                    Registrar
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="checklist" className="m-0 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Novo item do checklist…"
                  value={newCheck}
                  onChange={(e) => setNewCheck(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCheck.trim()) {
                      partnersStore.addChecklistItem(fresh.id, newCheck.trim());
                      setNewCheck("");
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (!newCheck.trim()) return;
                    partnersStore.addChecklistItem(fresh.id, newCheck.trim());
                    setNewCheck("");
                  }}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {fresh.checklist.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Sem itens no checklist.</p>
              )}
              {fresh.checklist.map((c) => (
                <button
                  key={c.id}
                  onClick={() => partnersStore.toggleChecklist(fresh.id, c.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg surface-elevated hover:border-primary/40 border border-transparent text-left"
                >
                  {c.done ? (
                    <CheckCircle2 className="size-4 text-[color:var(--color-success)]" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground" />
                  )}
                  <span className={cn("text-sm flex-1", c.done && "line-through text-muted-foreground")}>{c.text}</span>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="docs" className="m-0 space-y-3">
              <UploadButton partnerId={fresh.id} kind="doc" />
              {docs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum documento anexado.</p>
              )}
              {docs.map((f) => (
                <FileRow key={f.id} partnerId={fresh.id} name={f.name} size={f.size} icon={<FileText className="size-4" />} fileId={f.id} />
              ))}
            </TabsContent>

            <TabsContent value="fotos" className="m-0 space-y-3">
              <UploadButton partnerId={fresh.id} kind="photo" />
              {photos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma foto anexada.</p>
              )}
              {photos.map((f) => (
                <FileRow key={f.id} partnerId={fresh.id} name={f.name} size={f.size} icon={<ImageIcon className="size-4" />} fileId={f.id} />
              ))}
            </TabsContent>

            <TabsContent value="vinculos" className="m-0 space-y-4">
              <Card className="p-4 surface-elevated">
                <h4 className="font-display text-sm mb-2 inline-flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" /> Campanhas relacionadas
                </h4>
                {fresh.campaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma campanha vinculada.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {fresh.campaigns.map((c) => (
                      <Badge key={c} variant="secondary" className="bg-primary/10 text-primary">{c}</Badge>
                    ))}
                  </div>
                )}
              </Card>
              <Card className="p-4 surface-elevated">
                <h4 className="font-display text-sm mb-2 inline-flex items-center gap-2">
                  <CalendarIcon className="size-4 text-[color:var(--color-accent)]" /> Eventos
                </h4>
                {fresh.events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento vinculado.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {fresh.events.map((c) => (
                      <Badge key={c} variant="secondary" className="bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">{c}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="m-0 space-y-3">
              <div className="relative pl-5 border-l border-border/60 space-y-4">
                {fresh.timeline.map((t) => (
                  <div key={t.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 size-2 rounded-full bg-primary" />
                    <div className="text-sm">{t.message}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.author ?? "Sistema"} · {formatRelative(t.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-3 surface-elevated">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">{icon} {label}</div>
      <div className="text-sm mt-1 truncate">{value}</div>
    </Card>
  );
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg surface-elevated p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-display mt-1">{value}</div>
    </div>
  );
}

function EditableStat({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value ?? 0));

  const commit = () => {
    const n = Number(draft);
    onSave(Number.isFinite(n) ? n : 0);
    setEditing(false);
    toast.success(`${label} atualizado.`);
  };

  return (
    <div className="rounded-lg surface-elevated p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      {editing ? (
        <Input
          autoFocus
          type="number"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(String(value ?? 0));
              setEditing(false);
            }
          }}
          className="h-7 mt-1 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(value ?? 0));
            setEditing(true);
          }}
          className="text-sm font-display mt-1 text-left w-full hover:text-primary transition-colors"
          title="Clique para editar"
        >
          {formatBRL(value)}
        </button>
      )}
    </div>
  );
}

function FileRow({ partnerId, fileId, name, size, icon }: { partnerId: string; fileId: string; name: string; size: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg surface-elevated">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground">{(size / 1024).toFixed(0)} KB</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => partnersStore.removeFile(partnerId, fileId)}
      >
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

function UploadButton({ partnerId, kind }: { partnerId: string; kind: "doc" | "photo" }) {
  return (
    <label className="flex items-center justify-center gap-2 cursor-pointer rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
      <Paperclip className="size-4" />
      <span>{kind === "doc" ? "Anexar documento" : "Anexar foto"}</span>
      <input
        type="file"
        className="hidden"
        multiple
        accept={kind === "photo" ? "image/*" : undefined}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach((f) => partnersStore.addFile(partnerId, { name: f.name, size: f.size, kind }));
          if (files.length) toast.success(`${files.length} arquivo(s) anexado(s).`);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function NewPartnerDialog({ onClose }: { onClose: () => void }) {
  const categories = usePartnerCategories();
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<PartnerCategory>("Agência");
  const [city, setCity] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState("Bruno");
  const [contractEnd, setContractEnd] = useState("");
  const [counterparts, setCounterparts] = useState("");
  const [investmentMonth, setInvestmentMonth] = useState(0);
  const [expectedReturn, setExpectedReturn] = useState(0);
  const [status, setStatus] = useState<PartnerStatus>("Prospect");

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Novo parceiro</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Empresa"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
        <Field label="Categoria">
          <Select value={category} onValueChange={(v) => setCategory(v as PartnerCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Cidade"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <Field label="Contato"><Input value={contact} onChange={(e) => setContact(e.target.value)} /></Field>
        <Field label="Telefone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="WhatsApp"><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
        <Field label="E-mail"><Input value={email} type="email" onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Responsável interno"><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
        <Field label="Vencimento contrato"><Input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} /></Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as PartnerStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PARTNER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Investimento/mês (R$)"><Input type="number" value={investmentMonth} onChange={(e) => setInvestmentMonth(Number(e.target.value))} /></Field>
        <Field label="Retorno esperado (R$)"><Input type="number" value={expectedReturn} onChange={(e) => setExpectedReturn(Number(e.target.value))} /></Field>
        <div className="sm:col-span-2">
          <Field label="Contrapartidas"><Textarea rows={3} value={counterparts} onChange={(e) => setCounterparts(e.target.value)} /></Field>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!company.trim()}
          onClick={() => {
            partnersStore.add({
              company: company.trim(),
              category,
              city,
              contact,
              phone,
              whatsapp,
              email,
              owner,
              contractEnd: contractEnd || undefined,
              counterparts,
              investmentMonth: investmentMonth || 0,
              expectedReturn: expectedReturn || 0,
              deliveredReturn: 0,
              status,
              notes: "",
            });
            toast.success("Parceiro cadastrado.");
            onClose();
          }}
        >
          Cadastrar parceiro
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function EditPartnerDialog({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const categories = usePartnerCategories();
  const [company, setCompany] = useState(partner.company);
  const [category, setCategory] = useState<PartnerCategory>(partner.category);
  const [city, setCity] = useState(partner.city);
  const [contact, setContact] = useState(partner.contact);
  const [phone, setPhone] = useState(partner.phone);
  const [whatsapp, setWhatsapp] = useState(partner.whatsapp);
  const [email, setEmail] = useState(partner.email);
  const [owner, setOwner] = useState(partner.owner);
  const [contractEnd, setContractEnd] = useState(partner.contractEnd ?? "");
  const [counterparts, setCounterparts] = useState(partner.counterparts);
  const [notes, setNotes] = useState(partner.notes);
  const [investmentMonth, setInvestmentMonth] = useState(partner.investmentMonth);
  const [expectedReturn, setExpectedReturn] = useState(partner.expectedReturn);
  const [deliveredReturn, setDeliveredReturn] = useState(partner.deliveredReturn);
  const [status, setStatus] = useState<PartnerStatus>(partner.status);

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Editar parceiro</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Empresa"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
        <Field label="Categoria">
          <Select value={category} onValueChange={(v) => setCategory(v as PartnerCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Cidade"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
        <Field label="Contato"><Input value={contact} onChange={(e) => setContact(e.target.value)} /></Field>
        <Field label="Telefone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <Field label="WhatsApp"><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></Field>
        <Field label="E-mail"><Input value={email} type="email" onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Responsável interno"><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
        <Field label="Vencimento contrato"><Input type="date" value={contractEnd} onChange={(e) => setContractEnd(e.target.value)} /></Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as PartnerStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PARTNER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Investimento/mês (R$)"><Input type="number" value={investmentMonth} onChange={(e) => setInvestmentMonth(Number(e.target.value))} /></Field>
        <Field label="Retorno esperado (R$)"><Input type="number" value={expectedReturn} onChange={(e) => setExpectedReturn(Number(e.target.value))} /></Field>
        <Field label="Retorno entregue (R$)"><Input type="number" value={deliveredReturn} onChange={(e) => setDeliveredReturn(Number(e.target.value))} /></Field>
        <div className="sm:col-span-2">
          <Field label="Contrapartidas"><Textarea rows={3} value={counterparts} onChange={(e) => setCounterparts(e.target.value)} /></Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notas internas"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!company.trim()}
          onClick={() => {
            partnersStore.update(partner.id, {
              company: company.trim(),
              category,
              city,
              contact,
              phone,
              whatsapp,
              email,
              owner,
              contractEnd: contractEnd || undefined,
              counterparts,
              notes,
              investmentMonth: investmentMonth || 0,
              expectedReturn: expectedReturn || 0,
              deliveredReturn: deliveredReturn || 0,
              status,
            });
            toast.success("Parceiro atualizado.");
            onClose();
          }}
        >
          Salvar alterações
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}


function PartnerCategoriesTab() {
  const categories = usePartnerCategories();
  const [name, setName] = useState("");

  const add = () => {
    const v = name.trim();
    if (!v) return;
    const ok = partnerCategoriesStore.add(v);
    if (!ok) {
      toast.error("Categoria já existe");
      return;
    }
    toast.success(`Categoria "${v}" adicionada`);
    setName("");
  };
  const remove = (c: string) => {
    if (!window.confirm(`Remover categoria "${c}"?`)) return;
    partnerCategoriesStore.remove(c);
    toast.success(`Categoria "${c}" removida`);
  };

  return (
    <>
      <div className="flex gap-2">
        <Input
          placeholder="Nova categoria de parceiro"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma categoria.</p>
      ) : (
        <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
          {categories.map((c) => (
            <li key={c} className="flex items-center justify-between px-3 py-2">
              <Badge variant="secondary" className={cn("truncate", categoryTone(c))}>{c}</Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => remove(c)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
