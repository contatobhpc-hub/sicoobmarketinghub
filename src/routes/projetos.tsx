import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, FolderKanban, Calendar, User, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import {
  PROJECT_STATUSES,
  formatDate,
  priorityTone,
  projectsStore,
  statusTone,
  useProjects,
} from "@/lib/projects";

export const Route = createFileRoute("/projetos")({
  head: () => ({
    meta: [
      { title: "Projetos — Marketing Hub" },
      { name: "description", content: "Iniciativas de médio e longo prazo do departamento." },
    ],
  }),
  component: ProjetosPage,
});

function ProjetosPage() {
  const projects = useProjects();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesQ =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.owner.toLowerCase().includes(query.toLowerCase()) ||
        p.client.toLowerCase().includes(query.toLowerCase());
      const matchesS = statusFilter === "all" || p.status === statusFilter;
      return matchesQ && matchesS;
    });
  }, [projects, query, statusFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Projetos"
        description="Iniciativas estruturadas — manuais ou geradas a partir de campanhas."
        actions={<div className="flex items-center gap-2"><ModuleManagementButton module="projetos" /><NewProjectDialog /></div>}
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, cliente ou responsável…"
            className="h-9 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <FolderKanban className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="font-display text-base font-semibold">Nenhum projeto encontrado</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Crie um novo projeto ou ajuste os filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/projetos/$id"
              params={{ id: p.id }}
              className="group flex flex-col rounded-xl border border-border bg-surface/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {p.area || "Sem área"}
                  </span>
                  <h3 className="mt-0.5 truncate font-display text-base font-semibold tracking-tight">
                    {p.name}
                  </h3>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusTone(p.status)}`}>
                  {p.status}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {p.description || "Sem descrição."}
              </p>

              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Progresso</span>
                  <span className="tabular">{p.progress}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.progress}%`, backgroundImage: "var(--gradient-primary)" }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                <Meta icon={Calendar} label={p.dueDate ? formatDate(p.dueDate) : "Sem prazo"} />
                <Meta icon={User} label={p.owner || "—"} />
                <Meta icon={Users} label={`${p.team.length} membros`} />
                <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-semibold ${priorityTone(p.priority)}`}>
                  {p.priority}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Calendar; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 truncate">
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </span>
  );
}
