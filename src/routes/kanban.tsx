import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Paperclip,
  MessageSquare,
  Plus,
  Megaphone,
  FolderKanban,
  Search,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KANBAN_STATUSES,
  TASK_PRIORITIES,
  kanbanStore,
  priorityDot,
  statusTone,
  useKanban,
  type KanbanStatus,
  type KanbanTask,
  type TaskPriority,
} from "@/lib/kanban";
import { useCampaigns } from "@/lib/campaigns";
import { useProjects, formatDate } from "@/lib/projects";

export const Route = createFileRoute("/kanban")({
  head: () => ({
    meta: [
      { title: "Kanban — Marketing Hub" },
      { name: "description", content: "Quadro Kanban com fluxo das demandas do departamento." },
    ],
  }),
  component: KanbanPage,
});

function KanbanPage() {
  const tasks = useKanban();
  const [query, setQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<KanbanStatus | null>(null);

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !query ||
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          (t.assignee ?? "").toLowerCase().includes(query.toLowerCase()) ||
          t.labels.some((l) => l.toLowerCase().includes(query.toLowerCase())),
      ),
    [tasks, query],
  );

  return (
    <AppShell>
      <PageHeader
        title="Kanban"
        description="Arraste cartões entre as colunas para atualizar o status."
        actions={<div className="flex items-center gap-2"><ModuleManagementButton module="kanban" /><NewTaskDialog /></div>}
      />

      <div className="mb-5 max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tarefas, responsáveis ou etiquetas…"
            className="h-9 pl-9"
          />
        </div>
      </div>

      <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pb-4">
        {KANBAN_STATUSES.map((col) => {
          const colTasks = filtered.filter((t) => t.status === col);
          const isOver = overCol === col;
          return (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
              onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/task");
                if (id) kanbanStore.move(id, col);
                setOverCol(null);
                setDraggingId(null);
              }}
              className={`flex w-[300px] shrink-0 flex-col rounded-xl border bg-surface/40 p-2 transition-all duration-200 ${
                isOver ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30" : "border-border"
              }`}
            >
              <div className="mb-2 flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusTone(col).replace("text-", "bg-")}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wide">{col}</h3>
                  <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 text-[10px] tabular text-muted-foreground">
                    {colTasks.length}
                  </span>
                </div>
                <NewTaskDialog
                  defaultStatus={col}
                  trigger={
                    <button className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Adicionar">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  }
                />
              </div>

              <div className="flex min-h-[60px] flex-1 flex-col gap-2">
                {colTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    dragging={draggingId === t.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/task", t.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(t.id);
                    }}
                    onDragEnd={() => { setDraggingId(null); setOverCol(null); }}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 px-3 py-6 text-center text-[10px] text-muted-foreground">
                    Solte um cartão aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}

function TaskCard({
  task,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  task: KanbanTask;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const campaigns = useCampaigns();
  const projects = useProjects();
  const campaign = task.campaignId ? campaigns.find((c) => c.id === task.campaignId) : undefined;
  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined;
  const overdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "Concluído";

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group animate-fade-in cursor-grab rounded-xl border border-border bg-surface p-3 text-sm shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)] active:cursor-grabbing ${
        dragging ? "rotate-1 opacity-50" : ""
      }`}
    >
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l) => (
            <span key={l} className="rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {l}
            </span>
          ))}
        </div>
      )}

      <h4 className="text-[13px] font-medium leading-snug">{task.title}</h4>

      {(campaign || project) && (
        <div className="mt-2 flex flex-col gap-0.5 text-[10px] text-muted-foreground">
          {campaign && (
            <span className="inline-flex items-center gap-1 truncate">
              <Megaphone className="h-3 w-3" /> {campaign.name}
            </span>
          )}
          {project && (
            <span className="inline-flex items-center gap-1 truncate">
              <FolderKanban className="h-3 w-3" /> {project.name}
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-surface-elevated">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${task.progress}%`, backgroundImage: "var(--gradient-primary)" }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1" title={`Prioridade ${task.priority}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(task.priority)}`} />
            {task.priority}
          </span>
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 ${overdue ? "text-[color:var(--color-destructive)]" : ""}`}>
              <Calendar className="h-3 w-3" /> {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {task.attachments > 0 && (
            <span className="inline-flex items-center gap-0.5"><Paperclip className="h-3 w-3" />{task.attachments}</span>
          )}
          {task.comments > 0 && (
            <span className="inline-flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{task.comments}</span>
          )}
          {task.assignee && (
            <span
              title={task.assignee}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary"
            >
              {task.assignee.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function NewTaskDialog({
  defaultStatus = "Backlog",
  trigger,
}: {
  defaultStatus?: KanbanStatus;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const campaigns = useCampaigns();
  const projects = useProjects();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<KanbanStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>("Média");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [campaignId, setCampaignId] = useState("none");
  const [projectId, setProjectId] = useState("none");
  const [labels, setLabels] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    kanbanStore.add({
      title: title.trim(),
      status,
      priority,
      assignee: assignee.trim() || undefined,
      dueDate: dueDate || undefined,
      campaignId: campaignId === "none" ? undefined : campaignId,
      projectId: projectId === "none" ? undefined : projectId,
      labels: labels.split(",").map((s) => s.trim()).filter(Boolean),
      progress: 0,
      attachments: 0,
      comments: 0,
    });
    setTitle(""); setAssignee(""); setDueDate(""); setLabels("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="h-9 gap-2 text-primary-foreground shadow-[var(--shadow-glow)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <Plus className="h-4 w-4" /> Nova tarefa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader><DialogTitle className="font-display text-xl">Nova tarefa</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as KanbanStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KANBAN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Responsável</Label>
              <Input value={assignee} onChange={(e) => setAssignee(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Prazo</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
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
            <Label>Etiquetas <span className="text-[10px] text-muted-foreground">(separe por vírgula)</span></Label>
            <Input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="Design, Social, Vídeo" />
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
