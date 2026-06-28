import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Copy,
  Folder,
  FolderKanban,
  Globe,
  History,
  ListChecks,
  Mail,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trello,
  UserPlus,
  Workflow as WorkflowIcon,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  WORKFLOW_ACTIONS,
  WORKFLOW_TRIGGERS,
  actionLabel,
  triggerLabel,
  useWorkflows,
  workflowsStore,
  type Workflow,
  type WorkflowActionId,
  type WorkflowStep,
  type WorkflowTriggerId,
} from "@/lib/workflows";

export const Route = createFileRoute("/workflows")({
  head: () => ({
    meta: [
      { title: "Workflow Engine — Marketing Hub" },
      { name: "description", content: "Automatize processos com gatilhos e ações entre todos os módulos." },
    ],
  }),
  component: WorkflowsPage,
});

const ACTION_ICONS: Record<WorkflowActionId, React.ComponentType<{ className?: string }>> = {
  notify: Bell,
  create_task: CheckSquare,
  update_status: RefreshCw,
  create_project: FolderKanban,
  send_email: Mail,
  move_kanban: Trello,
  add_owner: UserPlus,
  create_checklist: ListChecks,
  create_calendar_event: Calendar,
  create_folder: Folder,
  create_approval: ShieldCheck,
  create_indicator: BarChart3,
  create_timeline: History,
  webhook: Globe,
};

function WorkflowsPage() {
  const workflows = useWorkflows();
  const [query, setQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const modules = useMemo(() => Array.from(new Set(workflows.map((w) => w.module))), [workflows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workflows.filter((w) => {
      if (moduleFilter !== "all" && w.module !== moduleFilter) return false;
      if (statusFilter === "active" && !w.active) return false;
      if (statusFilter === "paused" && w.active) return false;
      if (!q) return true;
      return [w.name, w.description, w.module, triggerLabel(w.trigger)].join(" ").toLowerCase().includes(q);
    });
  }, [workflows, query, moduleFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalSuccess = workflows.reduce((s, w) => s + w.stats.success, 0);
    const totalError = workflows.reduce((s, w) => s + w.stats.error, 0);
    const active = workflows.filter((w) => w.active).length;
    return { total: workflows.length, active, success: totalSuccess, error: totalError };
  }, [workflows]);

  const selected = openId ? workflows.find((w) => w.id === openId) ?? null : null;

  return (
    <AppShell>
      <PageHeader
        title="Workflow Engine"
        description="Automatize qualquer processo do Marketing OS. Gatilhos, condições e ações conectando todos os módulos."
        actions={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Novo workflow</Button>
            </DialogTrigger>
            <NewWorkflowDialog onClose={() => setCreating(false)} onCreated={(id) => setOpenId(id)} />
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={WorkflowIcon} label="Workflows" value={String(stats.total)} />
        <Kpi icon={Zap} label="Ativos" value={String(stats.active)} tone="primary" />
        <Kpi icon={CheckCircle2} label="Execuções OK" value={String(stats.success)} tone="success" />
        <Kpi icon={AlertCircle} label="Execuções com erro" value={String(stats.error)} tone={stats.error > 0 ? "danger" : "default"} />
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar workflow, módulo ou gatilho…" className="pl-9" />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Módulo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {modules.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhum workflow encontrado.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((w) => (
            <WorkflowCard key={w.id} w={w} onOpen={() => setOpenId(w.id)} />
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {selected && <WorkflowDetail workflow={selected} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "danger" | "success" | "primary";
}) {
  const color =
    tone === "danger" ? "text-red-400" :
    tone === "success" ? "text-emerald-400" :
    tone === "primary" ? "text-primary" :
    "text-muted-foreground";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${color}`} />
      </div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
    </Card>
  );
}

function WorkflowCard({ w, onOpen }: { w: Workflow; onOpen: () => void }) {
  const lastRun = w.runs[0];
  const successRate = w.stats.success + w.stats.error > 0
    ? Math.round((w.stats.success / (w.stats.success + w.stats.error)) * 100)
    : null;

  return (
    <Card className="group p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">{w.module}</Badge>
            {w.active ? (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">Ativo</Badge>
            ) : (
              <Badge variant="outline" className="border-slate-500/30 bg-slate-500/15 text-slate-300">Pausado</Badge>
            )}
          </div>
          <h3 className="mt-2 truncate font-medium">{w.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{w.description || "Sem descrição."}</p>
        </button>
        <div className="flex items-center gap-1">
          <Switch checked={w.active} onCheckedChange={() => workflowsStore.toggle(w.id)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-7"><MoreVertical className="size-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}><Pencil className="size-4" /> Editar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { workflowsStore.run(w.id); toast.success("Execução disparada"); }}>
                <Play className="size-4" /> Executar agora
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { workflowsStore.duplicate(w.id); toast.success("Workflow duplicado"); }}>
                <Copy className="size-4" /> Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => workflowsStore.toggle(w.id)}>
                <Power className="size-4" /> {w.active ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-300 focus:text-red-200"
                onClick={() => { workflowsStore.remove(w.id); toast.success("Workflow removido"); }}
              >
                <Trash2 className="size-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-border/40 bg-muted/10 p-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Zap className="size-3 text-amber-400" /> Quando <span className="font-medium text-foreground">{triggerLabel(w.trigger)}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {w.steps.slice(0, 5).map((s) => {
            const Icon = ACTION_ICONS[s.action];
            return (
              <div key={s.id} className="flex items-center gap-1 rounded-md border border-border/40 bg-card/60 px-1.5 py-0.5 text-[11px]">
                <Icon className="size-3 text-primary" />
                <span className="truncate max-w-32">{actionLabel(s.action)}</span>
              </div>
            );
          })}
          {w.steps.length > 5 && (
            <span className="text-[11px] text-muted-foreground">+ {w.steps.length - 5}</span>
          )}
          {w.steps.length === 0 && (
            <span className="text-[11px] text-muted-foreground">Nenhuma ação configurada.</span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {lastRun
            ? `Última execução · ${new Date(lastRun.startedAt).toLocaleString("pt-BR")}`
            : "Nunca executado"}
        </span>
        {successRate !== null && (
          <span className={successRate >= 90 ? "text-emerald-300" : successRate >= 60 ? "text-amber-300" : "text-red-300"}>
            {successRate}% sucesso
          </span>
        )}
      </div>
    </Card>
  );
}

function WorkflowDetail({ workflow }: { workflow: Workflow }) {
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [trigger, setTrigger] = useState<WorkflowTriggerId>(workflow.trigger);
  const [steps, setSteps] = useState<WorkflowStep[]>(workflow.steps);

  const dirty =
    name !== workflow.name ||
    description !== workflow.description ||
    trigger !== workflow.trigger ||
    JSON.stringify(steps) !== JSON.stringify(workflow.steps);

  function addStep() {
    setSteps((s) => [...s, { id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, action: "notify", config: {} }]);
  }
  function removeStep(id: string) {
    setSteps((s) => s.filter((x) => x.id !== id));
  }
  function moveStep(id: string, dir: -1 | 1) {
    setSteps((s) => {
      const idx = s.findIndex((x) => x.id === id);
      if (idx < 0) return s;
      const ni = idx + dir;
      if (ni < 0 || ni >= s.length) return s;
      const copy = [...s];
      [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
      return copy;
    });
  }
  function save() {
    workflowsStore.update(workflow.id, { name, description, trigger, steps });
    toast.success("Workflow atualizado");
  }

  return (
    <>
      <SheetHeader className="space-y-2 pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">{workflow.module}</Badge>
          {workflow.active ? (
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/15 text-emerald-300">Ativo</Badge>
          ) : (
            <Badge variant="outline" className="border-slate-500/30 bg-slate-500/15 text-slate-300">Pausado</Badge>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => { workflowsStore.run(workflow.id); toast.success("Execução disparada"); }}>
              <Play className="size-3.5" /> Executar
            </Button>
            <Button size="sm" variant="outline" onClick={() => workflowsStore.toggle(workflow.id)}>
              <Power className="size-3.5" /> {workflow.active ? "Desativar" : "Ativar"}
            </Button>
          </div>
        </div>
        <SheetTitle className="font-display text-xl">{workflow.name}</SheetTitle>
        <SheetDescription>Editor visual de gatilho, condições e ações.</SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="builder" className="mt-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="runs">Execuções ({workflow.runs.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs de erro</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <Card className="border-amber-500/30 bg-amber-500/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-amber-300">
              <Zap className="size-4" /> Quando…
            </div>
            <Select value={trigger} onValueChange={(v) => setTrigger(v as WorkflowTriggerId)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORKFLOW_TRIGGERS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="text-muted-foreground">[{t.module}]</span> {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-muted-foreground">Então… (passos executados em ordem)</div>
              <Button size="sm" variant="outline" onClick={addStep}><Plus className="size-3.5" /> Passo</Button>
            </div>
            {steps.length === 0 && (
              <Card className="p-4 text-center text-xs text-muted-foreground">
                Nenhum passo. Adicione ações para compor o fluxo.
              </Card>
            )}
            {steps.map((s, i) => {
              const Icon = ACTION_ICONS[s.action];
              return (
                <Card key={s.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-4 text-primary" />
                        <Select
                          value={s.action}
                          onValueChange={(v) => setSteps((arr) => arr.map((x) => (x.id === s.id ? { ...x, action: v as WorkflowActionId } : x)))}
                        >
                          <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WORKFLOW_ACTIONS.map((a) => <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder='Configuração rápida (ex.: "Notificar Bruno", "Coluna: Backlog")'
                        value={s.config.note ?? ""}
                        onChange={(e) =>
                          setSteps((arr) => arr.map((x) => (x.id === s.id ? { ...x, config: { ...x.config, note: e.target.value } } : x)))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="size-6" onClick={() => moveStep(s.id, -1)}>↑</Button>
                      <Button size="icon" variant="ghost" className="size-6" onClick={() => moveStep(s.id, 1)}>↓</Button>
                      <Button size="icon" variant="ghost" className="size-6 text-red-300" onClick={() => removeStep(s.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {dirty && (
            <div className="sticky bottom-0 flex items-center justify-between rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs">
              <span>Alterações não salvas</span>
              <Button size="sm" onClick={save}>Salvar workflow</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="runs">
          <ScrollArea className="h-[60vh] pr-2">
            {workflow.runs.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                <Activity className="mx-auto mb-2 size-5" />
                Nenhuma execução registrada.
              </Card>
            ) : (
              <ol className="space-y-2">
                {workflow.runs.map((r) => (
                  <li key={r.id}>
                    <Card className="p-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {r.status === "success" ? (
                            <CheckCircle2 className="size-4 text-emerald-400" />
                          ) : r.status === "error" ? (
                            <AlertCircle className="size-4 text-red-400" />
                          ) : (
                            <RefreshCw className="size-4 text-blue-400 animate-spin" />
                          )}
                          <span className="font-medium capitalize">{r.status}</span>
                          <span className="text-muted-foreground">{new Date(r.startedAt).toLocaleString("pt-BR")}</span>
                        </div>
                        <span className="text-muted-foreground">{r.durationMs ? `${r.durationMs}ms` : ""}</span>
                      </div>
                      <div className="mt-2 space-y-0.5 text-[11px]">
                        {r.log.map((l, i) => (
                          <div
                            key={i}
                            className={`flex gap-2 rounded px-2 py-1 ${
                              l.level === "error" ? "bg-red-500/10 text-red-200" : "text-muted-foreground"
                            }`}
                          >
                            <span className="font-mono text-[10px]">{new Date(l.at).toLocaleTimeString("pt-BR")}</span>
                            <span className="flex-1">{l.message}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </li>
                ))}
              </ol>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="logs">
          <ScrollArea className="h-[60vh] pr-2">
            {(() => {
              const errors = workflow.runs.flatMap((r) =>
                r.log.filter((l) => l.level === "error").map((l) => ({ runId: r.id, at: l.at, message: l.message })),
              );
              if (errors.length === 0) {
                return (
                  <Card className="p-6 text-center text-sm text-muted-foreground">
                    <CheckCircle2 className="mx-auto mb-2 size-5 text-emerald-400" />
                    Nenhum erro registrado.
                  </Card>
                );
              }
              return (
                <ol className="space-y-2">
                  {errors.map((e, i) => (
                    <li key={i} className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                      <div className="flex justify-between text-[10px] opacity-80">
                        <span>Run {e.runId}</span>
                        <span>{new Date(e.at).toLocaleString("pt-BR")}</span>
                      </div>
                      <p className="mt-1">{e.message}</p>
                    </li>
                  ))}
                </ol>
              );
            })()}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </>
  );
}

function NewWorkflowDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<WorkflowTriggerId>("campaign.created");
  const [description, setDescription] = useState("");

  function submit() {
    if (!name) {
      toast.error("Informe um nome.");
      return;
    }
    const module = WORKFLOW_TRIGGERS.find((t) => t.id === trigger)?.module ?? "Geral";
    const wf = workflowsStore.add({ name, trigger, module, description });
    toast.success("Workflow criado");
    onClose();
    onCreated(wf.id);
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Novo workflow</DialogTitle>
        <DialogDescription>Defina o gatilho. Depois adicione passos no builder.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Onboarding de Campanha" />
        </div>
        <div>
          <Label>Gatilho</Label>
          <Select value={trigger} onValueChange={(v) => setTrigger(v as WorkflowTriggerId)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {WORKFLOW_TRIGGERS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="text-muted-foreground">[{t.module}]</span> {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Criar workflow</Button>
      </DialogFooter>
    </DialogContent>
  );
}
