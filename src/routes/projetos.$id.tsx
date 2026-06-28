import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  User,
  Users,
  Building2,
  Paperclip,
  Plus,
  CheckCircle2,
  Circle,
  Upload,
  MessageSquare,
  Activity,
  Send,
  Megaphone,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { campaignsStore } from "@/lib/campaigns";
import {
  KANBAN_COLUMNS,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  formatDate,
  formatRelative,
  priorityTone,
  projectsStore,
  statusTone,
  useProject,
  type KanbanColumn,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/projects";

export const Route = createFileRoute("/projetos/$id")({
  loader: ({ params }) => {
    const p = projectsStore.byId(params.id);
    if (!p) throw notFound();
    return { id: params.id };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Projeto — Marketing Hub`, name: "description", content: `Detalhes do projeto ${loaderData?.id ?? ""}` }],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
        <h2 className="font-display text-base font-semibold">Projeto não encontrado</h2>
        <Link to="/projetos" className="mt-3 inline-block text-sm text-primary hover:underline">
          ← Voltar para projetos
        </Link>
      </div>
    </AppShell>
  ),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const p = useProject(id);
  if (!p) return null;
  const campaign = p.campaignId ? campaignsStore.byId(p.campaignId) : undefined;

  return (
    <AppShell>
      <div className="mb-2">
        <Link to="/projetos" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Projetos
        </Link>
      </div>

      {/* Hero */}
      <div className="mb-6 rounded-2xl border border-border bg-surface/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-3 w-3" /> {p.client || "Sem cliente"}
              <span>·</span>
              <span>{p.area || "Sem área"}</span>
              {campaign && (
                <>
                  <span>·</span>
                  <Link
                    to="/campanhas/$id"
                    params={{ id: campaign.id }}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Megaphone className="h-3 w-3" /> {campaign.name}
                  </Link>
                </>
              )}
            </div>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">{p.name}</h1>
            {p.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{p.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={p.status} onValueChange={(v) => projectsStore.update(p.id, { status: v as ProjectStatus })}>
              <SelectTrigger className={`h-8 w-auto gap-2 border-0 px-2.5 text-[11px] font-semibold ${statusTone(p.status)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={p.priority} onValueChange={(v) => projectsStore.update(p.id, { priority: v as ProjectPriority })}>
              <SelectTrigger className={`h-8 w-auto gap-2 border-0 px-2.5 text-[11px] font-semibold ${priorityTone(p.priority)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_PRIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Calendar} label="Prazo" value={p.dueDate ? formatDate(p.dueDate) : "—"} />
          <Stat icon={User} label="Responsável" value={p.owner || "—"} />
          <Stat icon={Users} label="Equipe" value={`${p.team.length} membros`} />
          <Stat icon={Activity} label="Progresso" value={`${p.progress}%`} />
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
            <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundImage: "var(--gradient-primary)" }} />
          </div>
          <Slider
            value={[p.progress]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => projectsStore.update(p.id, { progress: v[0] })}
            className="max-w-sm"
          />
        </div>
      </div>

      <Tabs defaultValue="resumo">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
          {[
            { v: "resumo", l: "Resumo" },
            { v: "checklist", l: "Checklist" },
            { v: "kanban", l: "Kanban" },
            { v: "arquivos", l: "Arquivos" },
            { v: "comentarios", l: "Comentários" },
            { v: "timeline", l: "Timeline" },
          ].map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="rounded-lg border border-transparent px-3 py-1.5 text-xs data-[state=active]:border-border-strong data-[state=active]:bg-surface-elevated data-[state=active]:text-foreground"
            >
              {t.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumo">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card title="Sobre" className="lg:col-span-2">
              <Row label="Cliente interno" value={p.client || "—"} />
              <Row label="Área solicitante" value={p.area || "—"} />
              <Row label="Descrição" value={p.description || "—"} />
              <Row label="Criado em" value={formatDate(p.createdAt)} />
            </Card>
            <Card title="Equipe">
              {p.team.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum membro adicionado.</p>
              ) : (
                <ul className="space-y-2">
                  {p.team.map((m) => (
                    <li key={m} className="flex items-center gap-2.5 rounded-md border border-border bg-surface-elevated/40 px-2.5 py-1.5 text-xs">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                        {m.slice(0, 2).toUpperCase()}
                      </div>
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="checklist">
          <ChecklistTab projectId={p.id} items={p.checklist} />
        </TabsContent>

        <TabsContent value="kanban">
          <KanbanTab projectId={p.id} cards={p.kanban} />
        </TabsContent>

        <TabsContent value="arquivos">
          <FilesTab projectId={p.id} files={p.files} />
        </TabsContent>

        <TabsContent value="comentarios">
          <CommentsTab projectId={p.id} comments={p.comments} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab entries={p.timeline} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-elevated/40 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={1.75} /> {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface/60 p-5 ${className}`}>
      <h2 className="mb-4 font-display text-sm font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[160px_1fr]">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function ChecklistTab({ projectId, items }: { projectId: string; items: { id: string; text: string; done: boolean }[] }) {
  const [text, setText] = useState("");
  const done = items.filter((i) => i.done).length;
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold">Checklist</h2>
        <span className="text-xs text-muted-foreground tabular">{done} / {items.length}</span>
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              onClick={() => projectsStore.toggleChecklist(projectId, i.id)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-elevated/60"
            >
              {i.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={i.done ? "text-muted-foreground line-through" : ""}>{i.text}</span>
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          projectsStore.addChecklistItem(projectId, text.trim());
          setText("");
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Adicionar item…" className="h-9" />
        <Button type="submit" size="sm" variant="outline" className="h-9 gap-1"><Plus className="h-3.5 w-3.5" />Adicionar</Button>
      </form>
    </div>
  );
}

function KanbanTab({ projectId, cards }: { projectId: string; cards: { id: string; title: string; column: KanbanColumn; assignee?: string }[] }) {
  const [newCard, setNewCard] = useState<Record<string, string>>({});
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((col) => {
        const colCards = cards.filter((c) => c.column === col);
        return (
          <div
            key={col}
            className="flex min-h-[320px] flex-col rounded-xl border border-border bg-surface/40 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const cardId = e.dataTransfer.getData("text/card");
              if (cardId) projectsStore.moveKanban(projectId, cardId, col);
            }}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{col}</h3>
              <span className="rounded-md bg-surface-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground tabular">{colCards.length}</span>
            </div>
            <div className="flex-1 space-y-2">
              {colCards.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/card", c.id)}
                  className="cursor-grab rounded-lg border border-border bg-surface p-3 text-sm shadow-[var(--shadow-sm)] transition-colors hover:border-border-strong active:cursor-grabbing"
                >
                  <p>{c.title}</p>
                  {c.assignee && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <User className="h-3 w-3" /> {c.assignee}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <form
              className="mt-2 flex gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                const v = (newCard[col] || "").trim();
                if (!v) return;
                projectsStore.addKanbanCard(projectId, v, col);
                setNewCard((s) => ({ ...s, [col]: "" }));
              }}
            >
              <Input
                value={newCard[col] || ""}
                onChange={(e) => setNewCard((s) => ({ ...s, [col]: e.target.value }))}
                placeholder="Novo cartão"
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0"><Plus className="h-3.5 w-3.5" /></Button>
            </form>
          </div>
        );
      })}
    </div>
  );
}

function FilesTab({ projectId, files }: { projectId: string; files: { name: string; size: number }[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-elevated/40 px-4 py-8 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground">
        <Upload className="h-4 w-4" /> Anexar arquivos
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            for (const f of Array.from(e.target.files ?? [])) {
              projectsStore.addFile(projectId, { name: f.name, size: f.size });
            }
          }}
        />
      </label>
      {files.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
          <Paperclip className="h-4 w-4" /> Nenhum arquivo anexado.
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border/60">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between py-2 text-sm">
              <span className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-muted-foreground" /> {f.name}</span>
              <span className="tabular text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentsTab({ projectId, comments }: { projectId: string; comments: { id: string; author: string; text: string; createdAt: string }[] }) {
  const [text, setText] = useState("");
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          projectsStore.addComment(projectId, "Bruno Almeida", text.trim());
          setText("");
        }}
      >
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva um comentário…" rows={2} />
        <Button type="submit" className="h-auto gap-1 self-end"><Send className="h-3.5 w-3.5" />Enviar</Button>
      </form>
      {comments.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
          <MessageSquare className="h-4 w-4" /> Nenhum comentário ainda.
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                {c.author.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-border bg-surface-elevated/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{c.author}</span>
                  <span className="text-[10px] text-muted-foreground">{formatRelative(c.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-foreground/90">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TimelineTab({ entries }: { entries: { id: string; type: string; message: string; author?: string; createdAt: string }[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-5">
      <ol className="relative space-y-4 border-l border-border pl-6">
        {entries.map((e) => (
          <li key={e.id} className="relative">
            <span className="absolute -left-[27px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-surface ring-2 ring-primary/40">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{e.author ?? "Sistema"}</span>
              <span className="text-[10px] text-muted-foreground">{formatRelative(e.createdAt)}</span>
            </div>
            <p className="mt-0.5 text-sm">{e.message}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
