import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  FileSignature,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ALERT_DAYS,
  CONTRACT_CATEGORIES,
  CONTRACT_STATUSES,
  type Contract,
  type ContractCategory,
  type ContractStatus,
  alertLevel,
  alertTone,
  contractsStore,
  daysUntil,
  formatBRL,
  formatDate,
  formatRelative,
  statusTone,
  useContract,
  useContracts,
} from "@/lib/contracts";
import { usePartnerCategories } from "@/lib/partners";

export const Route = createFileRoute("/contratos")({
  head: () => ({
    meta: [
      { title: "Contratos — Marketing Hub" },
      { name: "description", content: "Vigência, valores, renovações e alertas automáticos." },
    ],
  }),
  component: ContratosPage,
});

function ContratosPage() {
  const contracts = useContracts();
  const partnerCategories = usePartnerCategories();
  const allCategories = useMemo(
    () => Array.from(new Set([...CONTRACT_CATEGORIES, ...partnerCategories])),
    [partnerCategories],
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContractStatus | "todos">("todos");
  const [category, setCategory] = useState<ContractCategory | "todas">("todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      if (status !== "todos" && c.status !== status) return false;
      if (category !== "todas" && c.category !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.company.toLowerCase().includes(q) ||
        c.object.toLowerCase().includes(q) ||
        c.costCenter.toLowerCase().includes(q)
      );
    });
  }, [contracts, query, status, category]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const valueYear = contracts.reduce((acc, c) => acc + c.value, 0);
    const expiring = contracts.filter((c) => {
      const d = daysUntil(c.endDate);
      return d !== null && d <= 90 && d >= 0 && c.status !== "Encerrado" && c.status !== "Cancelado";
    }).length;
    const expired = contracts.filter((c) => {
      const d = daysUntil(c.endDate);
      return d !== null && d < 0 && c.status !== "Encerrado" && c.status !== "Cancelado";
    }).length;
    return { total, valueYear, expiring, expired };
  }, [contracts]);

  const expiringList = useMemo(
    () =>
      contracts
        .filter((c) => c.status !== "Encerrado" && c.status !== "Cancelado")
        .map((c) => ({ c, days: daysUntil(c.endDate) ?? 9999 }))
        .filter((x) => x.days <= 90)
        .sort((a, b) => a.days - b.days),
    [contracts],
  );

  const selected = selectedId ? contracts.find((c) => c.id === selectedId) ?? null : null;

  return (
    <AppShell>
      <PageHeader
        title="Contratos"
        description="Vigência, valores, renovações e alertas automáticos."
        actions={
          <div className="flex items-center gap-2">
            <ModuleManagementButton module="contratos" />
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Novo contrato
                </Button>
              </DialogTrigger>
              <NewContractDialog onClose={() => setOpenNew(false)} />
            </Dialog>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Contratos" value={stats.total} icon={<FileSignature className="size-4" />} />
        <Stat label="Valor anual" value={formatBRL(stats.valueYear)} icon={<Wallet className="size-4" />} tone="primary" />
        <Stat label="Vencendo em 90 dias" value={stats.expiring} icon={<Bell className="size-4" />} tone="warning" />
        <Stat label="Vencidos" value={stats.expired} icon={<AlertTriangle className="size-4" />} tone="destructive" />
      </div>

      {expiringList.length > 0 && (
        <Card className="p-4 surface-elevated border-[color:var(--color-warning)]/30">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="size-4 text-[color:var(--color-warning)]" />
            <h3 className="font-display text-sm">Contratos próximos do vencimento</h3>
            <Badge variant="secondary" className="ml-auto text-[10px]">{expiringList.length}</Badge>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {expiringList.slice(0, 6).map(({ c }) => {
              const a = alertLevel(c);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "text-left flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-surface-elevated transition-colors",
                    alertTone(a.level),
                  )}
                >
                  <Bell className="size-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-display truncate">{c.company}</div>
                    <div className="text-[11px] opacity-80 truncate">{c.object}</div>
                  </div>
                  <div className="text-xs font-mono whitespace-nowrap">{a.label}</div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-3 surface-elevated">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar empresa, objeto ou centro de custo…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus | "todos")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => setCategory(v as ContractCategory | "todas")}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-muted-foreground surface-elevated">
            Nenhum contrato encontrado.
          </Card>
        )}
        {filtered.map((c) => (
          <ContractRow key={c.id} contract={c} onOpen={() => setSelectedId(c.id)} />
        ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
          {selected && <ContractDetail contract={selected} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function Stat({ label, value, icon, tone = "default" }: { label: string; value: string | number; icon: React.ReactNode; tone?: "default" | "primary" | "warning" | "destructive" }) {
  const toneCls = {
    default: "text-muted-foreground",
    primary: "text-primary",
    warning: "text-[color:var(--color-warning)]",
    destructive: "text-[color:var(--color-destructive)]",
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

function ContractRow({ contract, onOpen }: { contract: Contract; onOpen: () => void }) {
  const a = alertLevel(contract);
  return (
    <Card
      onClick={onOpen}
      className="p-4 surface-elevated hover:border-primary/40 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="size-10 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center">
          <FileSignature className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-base truncate">{contract.company}</h3>
            <Badge variant="secondary" className="text-[10px]">{contract.category}</Badge>
            <Badge variant="secondary" className={cn("text-[10px]", statusTone(contract.status))}>{contract.status}</Badge>
            {contract.autoRenewal && (
              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Auto-renovação</Badge>
            )}
            {a.level !== "ok" && (
              <Badge variant="secondary" className={cn("text-[10px] gap-1 border", alertTone(a.level))}>
                <Bell className="size-3" /> {a.label}
              </Badge>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground truncate">{contract.object}</div>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1"><Building2 className="size-3" /> {contract.costCenter}</span>
            <span className="inline-flex items-center gap-1"><CalendarIcon className="size-3" /> {formatDate(contract.startDate)} → {formatDate(contract.endDate)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Valor</div>
            <div className="font-display">{formatBRL(contract.value)}</div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-[color:var(--color-destructive)]"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Remover contrato "${contract.company}"?`)) {
                contractsStore.remove(contract.id);
                toast.success("Contrato removido.");
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ContractDetail({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const fresh = useContract(contract.id) ?? contract;
  const a = alertLevel(fresh);
  const pdf = fresh.files.find((f) => f.id === fresh.pdfFileId);
  const attachments = fresh.files.filter((f) => f.id !== fresh.pdfFileId);
  const [note, setNote] = useState("");
  const [newCheck, setNewCheck] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b border-border/60 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-xl bg-primary/15 text-primary inline-flex items-center justify-center">
            <FileSignature className="size-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-xl">{fresh.company}</h2>
              <Badge variant="secondary" className="text-[10px]">{fresh.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{fresh.object}</p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Select value={fresh.status} onValueChange={(v) => contractsStore.update(fresh.id, { status: v as ContractStatus })}>
              <SelectTrigger className={cn("w-[140px] h-8 text-xs", statusTone(fresh.status))}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-8" onClick={() => setEditOpen(true)}>
                <Pencil className="size-3.5 mr-1" /> Editar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[color:var(--color-destructive)] hover:text-[color:var(--color-destructive)]"
                onClick={() => {
                  if (confirm(`Remover contrato "${fresh.company}"? Esta ação não pode ser desfeita.`)) {
                    contractsStore.remove(fresh.id);
                    toast.success("Contrato removido.");
                    onClose();
                  }
                }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <EditContractDialog contract={fresh} onDone={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>


        {a.level !== "ok" && (
          <div className={cn("mt-4 flex items-center gap-2 rounded-lg border p-3 text-xs", alertTone(a.level))}>
            <Bell className="size-4" />
            <div className="flex-1">
              <strong className="font-display">Alerta automático:</strong> {a.label} ({formatDate(fresh.endDate)})
              {a.matchedDay && <span className="ml-1 opacity-80">· gatilho {a.matchedDay}d</span>}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-3">
          <Mini label="Valor" value={formatBRL(fresh.value)} />
          <Mini label="Centro de custo" value={fresh.costCenter || "—"} />
          <Mini label="Vigência" value={`${formatDate(fresh.startDate)} → ${formatDate(fresh.endDate)}`} className="col-span-2" />
        </div>
      </div>

      <Tabs defaultValue="resumo" className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-4 border-b border-border/60">
          <TabsList className="bg-transparent p-0 h-auto gap-1">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <TabsContent value="resumo" className="m-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Info label="Responsável" value={fresh.owner} />
                <Info label="Renovação" value={fresh.renewalDate ? formatDate(fresh.renewalDate) : "—"} />
                <Card className="p-3 surface-elevated flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Renovação automática</div>
                    <div className="text-sm mt-1">{fresh.autoRenewal ? "Ativada" : "Desativada"}</div>
                  </div>
                  <Switch
                    checked={fresh.autoRenewal}
                    onCheckedChange={(v) => contractsStore.update(fresh.id, { autoRenewal: v })}
                  />
                </Card>
                <Info label="Status" value={fresh.status} />
              </div>

              <Card className="p-4 surface-elevated">
                <h4 className="font-display text-sm mb-2">Observações</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{fresh.notes || "Sem observações."}</p>
                <Separator className="my-3" />
                <div className="flex gap-2">
                  <Textarea rows={2} placeholder="Registrar observação na timeline…" value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button
                    size="sm"
                    disabled={!note.trim()}
                    onClick={() => {
                      contractsStore.addNote(fresh.id, note.trim());
                      setNote("");
                      toast.success("Observação registrada.");
                    }}
                  >
                    Registrar
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="alertas" className="m-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                Alertas automáticos com base na data de vencimento ({formatDate(fresh.endDate)}).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALERT_DAYS.map((day) => {
                  const d = daysUntil(fresh.endDate) ?? 0;
                  const triggered = fresh.alertsTriggered.includes(day);
                  const active = d <= day && d >= 0;
                  return (
                    <Card
                      key={day}
                      className={cn(
                        "p-3 surface-elevated border",
                        active && !triggered && "border-[color:var(--color-warning)]/50",
                        triggered && "border-[color:var(--color-success)]/40 bg-[color:var(--color-success)]/5",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">{day} dia(s)</div>
                        {triggered ? (
                          <CheckCircle2 className="size-4 text-[color:var(--color-success)]" />
                        ) : active ? (
                          <Bell className="size-4 text-[color:var(--color-warning)]" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-2 text-sm">
                        {triggered ? "Enviado" : active ? "Pendente" : "Programado"}
                      </div>
                      {active && !triggered && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 w-full"
                          onClick={() => {
                            contractsStore.acknowledgeAlert(fresh.id, day);
                            toast.success(`Alerta de ${day} dias registrado.`);
                          }}
                        >
                          Marcar como enviado
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="m-0 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Novo item…"
                  value={newCheck}
                  onChange={(e) => setNewCheck(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCheck.trim()) {
                      contractsStore.addChecklistItem(fresh.id, newCheck.trim());
                      setNewCheck("");
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (!newCheck.trim()) return;
                    contractsStore.addChecklistItem(fresh.id, newCheck.trim());
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
                  onClick={() => contractsStore.toggleChecklist(fresh.id, c.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg surface-elevated hover:border-primary/40 border border-transparent text-left"
                >
                  {c.done
                    ? <CheckCircle2 className="size-4 text-[color:var(--color-success)]" />
                    : <Circle className="size-4 text-muted-foreground" />}
                  <span className={cn("text-sm flex-1", c.done && "line-through text-muted-foreground")}>{c.text}</span>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="arquivos" className="m-0 space-y-4">
              <Card className="p-4 surface-elevated">
                <h4 className="font-display text-sm mb-3 inline-flex items-center gap-2">
                  <FileText className="size-4 text-primary" /> PDF do contrato
                </h4>
                {pdf ? (
                  <FileLine name={pdf.name} size={pdf.size} onRemove={() => contractsStore.removeFile(fresh.id, pdf.id)} />
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum PDF anexado.</p>
                )}
                <UploadInput partnerId={fresh.id} kind="pdf" label="Anexar PDF do contrato" />
              </Card>

              <Card className="p-4 surface-elevated">
                <h4 className="font-display text-sm mb-3 inline-flex items-center gap-2">
                  <Paperclip className="size-4" /> Anexos
                </h4>
                {attachments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum anexo.</p>
                )}
                <div className="space-y-2">
                  {attachments.map((f) => (
                    <FileLine
                      key={f.id}
                      name={f.name}
                      size={f.size}
                      onRemove={() => contractsStore.removeFile(fresh.id, f.id)}
                    />
                  ))}
                </div>
                <UploadInput partnerId={fresh.id} kind="attachment" label="Anexar arquivo" />
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="m-0">
              <div className="relative pl-5 border-l border-border/60 space-y-4">
                {fresh.timeline.map((t) => (
                  <div key={t.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 size-2 rounded-full bg-primary" />
                    <div className="text-sm">{t.message}</div>
                    <div className="text-[11px] text-muted-foreground inline-flex items-center gap-2 mt-0.5">
                      <span>{t.author ?? "Sistema"} · {formatRelative(t.createdAt)}</span>
                      {t.signature && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-elevated text-muted-foreground">
                          <Shield className="size-3" /> {t.signature}
                        </span>
                      )}
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

function Mini({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("rounded-lg surface-elevated p-3", className)}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-display mt-1 truncate">{value}</div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 surface-elevated">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm mt-1">{value}</div>
    </Card>
  );
}

function FileLine({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg surface-elevated">
      <FileText className="size-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground">{(size / 1024).toFixed(0)} KB</div>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </div>
  );
}

function UploadInput({ partnerId, kind, label }: { partnerId: string; kind: "pdf" | "attachment"; label: string }) {
  return (
    <label className="mt-3 flex items-center justify-center gap-2 cursor-pointer rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors">
      <Paperclip className="size-4" />
      <span>{label}</span>
      <input
        type="file"
        className="hidden"
        multiple={kind === "attachment"}
        accept={kind === "pdf" ? "application/pdf" : undefined}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          files.forEach((f) => contractsStore.addFile(partnerId, { name: f.name, size: f.size, kind }));
          if (files.length) toast.success(`${files.length} arquivo(s) anexado(s).`);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function NewContractDialog({ onClose }: { onClose: () => void }) {
  const partnerCategories = usePartnerCategories();
  const allCategories = useMemo(
    () => Array.from(new Set([...CONTRACT_CATEGORIES, ...partnerCategories])),
    [partnerCategories],
  );
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState<ContractCategory>("Agência");
  const [object, setObject] = useState("");
  const [value, setValue] = useState(0);
  const [costCenter, setCostCenter] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [renewalDate, setRenewalDate] = useState("");
  const [autoRenewal, setAutoRenewal] = useState(false);
  const [owner, setOwner] = useState("Bruno");
  const [status, setStatus] = useState<ContractStatus>("Rascunho");
  const [notes, setNotes] = useState("");

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Novo contrato</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Empresa"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
        <Field label="Categoria">
          <Select value={category} onValueChange={(v) => setCategory(v as ContractCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Objeto"><Textarea rows={2} value={object} onChange={(e) => setObject(e.target.value)} /></Field>
        </div>
        <Field label="Valor (R$)"><Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} /></Field>
        <Field label="Centro de custo"><Input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} /></Field>
        <Field label="Data início"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="Data término"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
        <Field label="Data de renovação"><Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} /></Field>
        <Field label="Responsável"><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Card className="sm:col-span-2 p-3 surface-elevated flex items-center justify-between">
          <div>
            <div className="text-sm font-display">Renovação automática</div>
            <div className="text-xs text-muted-foreground">Quando ativada, o contrato é renovado ao final da vigência.</div>
          </div>
          <Switch checked={autoRenewal} onCheckedChange={setAutoRenewal} />
        </Card>
        <div className="sm:col-span-2">
          <Field label="Observações"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!company.trim() || !endDate}
          onClick={() => {
            contractsStore.add({
              company: company.trim(),
              category,
              object,
              value: value || 0,
              costCenter,
              startDate,
              endDate,
              renewalDate: renewalDate || undefined,
              autoRenewal,
              owner,
              status,
              notes,
            });
            toast.success("Contrato cadastrado.");
            onClose();
          }}
        >
          Cadastrar contrato
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

function EditContractDialog({ contract, onDone }: { contract: Contract; onDone: () => void }) {
  const partnerCategories = usePartnerCategories();
  const allCategories = useMemo(
    () => Array.from(new Set([...CONTRACT_CATEGORIES, ...partnerCategories, contract.category])),
    [partnerCategories, contract.category],
  );
  const [company, setCompany] = useState(contract.company);
  const [category, setCategory] = useState<ContractCategory>(contract.category);
  const [object, setObject] = useState(contract.object);
  const [value, setValue] = useState(String(contract.value));
  const [costCenter, setCostCenter] = useState(contract.costCenter);
  const [startDate, setStartDate] = useState(contract.startDate);
  const [endDate, setEndDate] = useState(contract.endDate);
  const [owner, setOwner] = useState(contract.owner);
  const [status, setStatus] = useState<ContractStatus>(contract.status);
  const [autoRenewal, setAutoRenewal] = useState(contract.autoRenewal);
  const [notes, setNotes] = useState(contract.notes);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar contrato</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3 py-2">
        <Field label="Empresa"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
        <Field label="Categoria">
          <Select value={category} onValueChange={(v) => setCategory(v as ContractCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CONTRACT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="col-span-2"><Field label="Objeto"><Textarea rows={2} value={object} onChange={(e) => setObject(e.target.value)} /></Field></div>
        <Field label="Valor (R$)"><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} /></Field>
        <Field label="Centro de custo"><Input value={costCenter} onChange={(e) => setCostCenter(e.target.value)} /></Field>
        <Field label="Início"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
        <Field label="Vencimento"><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
        <Field label="Responsável"><Input value={owner} onChange={(e) => setOwner(e.target.value)} /></Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as ContractStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="col-span-2 flex items-center justify-between rounded-md border border-border/60 p-3">
          <div>
            <div className="text-xs text-muted-foreground">Renovação automática</div>
            <div className="text-sm">{autoRenewal ? "Ativada" : "Desativada"}</div>
          </div>
          <Switch checked={autoRenewal} onCheckedChange={setAutoRenewal} />
        </div>
        <div className="col-span-2"><Field label="Observações"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field></div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>Cancelar</Button>
        <Button
          onClick={() => {
            contractsStore.update(contract.id, {
              company: company.trim() || contract.company,
              category,
              object,
              value: Number(value) || 0,
              costCenter,
              startDate,
              endDate,
              owner,
              status,
              autoRenewal,
              notes,
            });
            toast.success("Contrato atualizado.");
            onDone();
          }}
        >
          Salvar
        </Button>
      </DialogFooter>
    </>
  );
}
