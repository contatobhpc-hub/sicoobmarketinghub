import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

export const PROJECT_STATUSES = [
  "Backlog",
  "Em andamento",
  "Em revisão",
  "Bloqueado",
  "Concluído",
] as const;
export const PROJECT_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

export type ProjectFile = { name: string; size: number };

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ProjectComment = {
  id: string;
  author: string;
  text: string;
  createdAt: string;
};

export type TimelineEntry = {
  id: string;
  type: "created" | "status" | "priority" | "progress" | "team" | "comment" | "checklist" | "file" | "kanban" | "field";
  message: string;
  author?: string;
  createdAt: string;
};

export const KANBAN_COLUMNS = ["A fazer", "Em execução", "Revisão", "Concluído"] as const;
export type KanbanColumn = (typeof KANBAN_COLUMNS)[number];

export type KanbanCard = {
  id: string;
  title: string;
  column: KanbanColumn;
  assignee?: string;
};

export type Project = {
  id: string;
  name: string;
  client: string; // cliente interno
  area: string; // área solicitante
  owner: string; // responsável
  team: string[];
  dueDate: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  description: string;
  files: ProjectFile[];
  checklist: ChecklistItem[];
  comments: ProjectComment[];
  timeline: TimelineEntry[];
  kanban: KanbanCard[];
  campaignId?: string;
  createdAt: string;
};

const KEY = "mhub.projects.v1";

function uid(prefix = "p") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function now() {
  return new Date().toISOString();
}

const seed: Project[] = [
  {
    id: "p-rural-26",
    name: "Lançamento Crédito Rural 2026",
    client: "Diretoria de Negócios",
    area: "Crédito",
    owner: "Bruno Almeida",
    team: ["Marina Sousa", "Pedro Lima", "Carla Reis"],
    dueDate: "2026-09-20",
    status: "Em andamento",
    priority: "Alta",
    progress: 45,
    description: "Projeto operacional vinculado à campanha Crédito Rural 2026.",
    files: [],
    checklist: [
      { id: uid("ck"), text: "Briefing aprovado pela Diretoria", done: true },
      { id: uid("ck"), text: "Aprovação das peças gráficas", done: true },
      { id: uid("ck"), text: "Veiculação de mídia offline", done: false },
      { id: uid("ck"), text: "Disparo de e-mail marketing", done: false },
    ],
    comments: [
      {
        id: uid("cm"),
        author: "Marina Sousa",
        text: "Recebemos retorno positivo das agências piloto.",
        createdAt: "2026-06-18T13:10:00.000Z",
      },
    ],
    timeline: [
      {
        id: uid("t"),
        type: "created",
        message: "Projeto criado a partir da campanha Crédito Rural 2026.",
        author: "Sistema",
        createdAt: "2026-05-12T10:00:00.000Z",
      },
      {
        id: uid("t"),
        type: "status",
        message: "Status alterado para Em andamento.",
        author: "Bruno Almeida",
        createdAt: "2026-05-20T09:00:00.000Z",
      },
    ],
    kanban: [
      { id: uid("k"), title: "Definir mix de mídia", column: "Concluído", assignee: "Bruno" },
      { id: uid("k"), title: "Criar peças para redes sociais", column: "Em execução", assignee: "Carla" },
      { id: uid("k"), title: "Roteiro vídeo institucional", column: "Revisão", assignee: "Marina" },
      { id: uid("k"), title: "Plano de mídia OOH", column: "A fazer", assignee: "Pedro" },
    ],
    campaignId: "c-1",
    createdAt: "2026-05-12T10:00:00.000Z",
  },
  {
    id: "p-conta-jovem",
    name: "Go-to-market Conta Jovem",
    client: "Produtos PF",
    area: "Marketing de Produto",
    owner: "Marina Sousa",
    team: ["Bruno Almeida", "Carla Reis"],
    dueDate: "2026-10-05",
    status: "Backlog",
    priority: "Crítica",
    progress: 10,
    description: "Estruturação do lançamento da Conta Digital Jovem.",
    files: [],
    checklist: [
      { id: uid("ck"), text: "Definir KPIs do lançamento", done: false },
      { id: uid("ck"), text: "Validar identidade visual", done: false },
    ],
    comments: [],
    timeline: [
      {
        id: uid("t"),
        type: "created",
        message: "Projeto criado manualmente.",
        author: "Marina Sousa",
        createdAt: "2026-06-02T14:30:00.000Z",
      },
    ],
    kanban: [
      { id: uid("k"), title: "Pesquisa de público", column: "Em execução", assignee: "Marina" },
      { id: uid("k"), title: "Briefing de campanha", column: "A fazer" },
    ],
    campaignId: "c-2",
    createdAt: "2026-06-02T14:30:00.000Z",
  },
];

function load(): Project[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as Project[];
  } catch {
    return seed;
  }
}

let state: Project[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<Project[]>("projects", () => state, (s) => { state = s; listeners.forEach((l) => l()); });

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
function emit() {
  persist();
  cloudPush();
  listeners.forEach((l) => l());
}

function pushTimeline(p: Project, entry: Omit<TimelineEntry, "id" | "createdAt">): Project {
  return {
    ...p,
    timeline: [
      { id: uid("t"), createdAt: now(), ...entry },
      ...p.timeline,
    ],
  };
}

export const projectsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  byId(id: string) {
    return state.find((p) => p.id === id);
  },
  add(input: Omit<Project, "id" | "createdAt" | "timeline" | "comments" | "checklist" | "kanban"> & {
    checklist?: ChecklistItem[];
    kanban?: KanbanCard[];
  }): Project {
    const p: Project = {
      id: uid("p"),
      createdAt: now(),
      comments: [],
      checklist: input.checklist ?? [],
      kanban: input.kanban ?? [],
      timeline: [
        {
          id: uid("t"),
          type: "created",
          message: input.campaignId
            ? "Projeto criado a partir de uma campanha."
            : "Projeto criado manualmente.",
          author: input.owner || "Sistema",
          createdAt: now(),
        },
      ],
      ...input,
    } as Project;
    state = [p, ...state];
    emit();
    return p;
  },
  update(id: string, patch: Partial<Project>, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      let next: Project = { ...p, ...patch };
      const entries: Omit<TimelineEntry, "id" | "createdAt">[] = [];
      if (patch.status && patch.status !== p.status) {
        entries.push({ type: "status", author, message: `Status alterado de ${p.status} para ${patch.status}.` });
      }
      if (patch.priority && patch.priority !== p.priority) {
        entries.push({ type: "priority", author, message: `Prioridade alterada para ${patch.priority}.` });
      }
      if (typeof patch.progress === "number" && patch.progress !== p.progress) {
        entries.push({ type: "progress", author, message: `Progresso atualizado para ${patch.progress}%.` });
      }
      if (patch.team && patch.team.join(",") !== p.team.join(",")) {
        entries.push({ type: "team", author, message: `Equipe atualizada (${patch.team.length} membros).` });
      }
      for (const e of entries) next = pushTimeline(next, e);
      return next;
    });
    emit();
  },
  remove(id: string) {
    state = state.filter((p) => p.id !== id);
    emit();
  },
  addComment(id: string, author: string, text: string) {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const next = {
        ...p,
        comments: [
          { id: uid("cm"), author, text, createdAt: now() },
          ...p.comments,
        ],
      };
      return pushTimeline(next, { type: "comment", author, message: `Comentou: "${text.slice(0, 60)}${text.length > 60 ? "…" : ""}"` });
    });
    emit();
  },
  toggleChecklist(id: string, itemId: string, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const item = p.checklist.find((c) => c.id === itemId);
      if (!item) return p;
      const next = {
        ...p,
        checklist: p.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
      };
      return pushTimeline(next, {
        type: "checklist",
        author,
        message: `${!item.done ? "Concluiu" : "Reabriu"} "${item.text}"`,
      });
    });
    emit();
  },
  addChecklistItem(id: string, text: string, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, checklist: [...p.checklist, { id: uid("ck"), text, done: false }] };
      return pushTimeline(next, { type: "checklist", author, message: `Adicionou item ao checklist: "${text}"` });
    });
    emit();
  },
  addFile(id: string, file: ProjectFile, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, files: [...p.files, file] };
      return pushTimeline(next, { type: "file", author, message: `Anexou o arquivo "${file.name}"` });
    });
    emit();
  },
  moveKanban(id: string, cardId: string, column: KanbanColumn, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const card = p.kanban.find((k) => k.id === cardId);
      if (!card || card.column === column) return p;
      const next = {
        ...p,
        kanban: p.kanban.map((k) => (k.id === cardId ? { ...k, column } : k)),
      };
      return pushTimeline(next, { type: "kanban", author, message: `Moveu "${card.title}" para ${column}.` });
    });
    emit();
  },
  addKanbanCard(id: string, title: string, column: KanbanColumn, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, kanban: [...p.kanban, { id: uid("k"), title, column }] };
      return pushTimeline(next, { type: "kanban", author, message: `Criou cartão "${title}" em ${column}.` });
    });
    emit();
  },
};

export function useProjects() {
  return useSyncExternalStore(projectsStore.subscribe, projectsStore.get, projectsStore.get);
}
export function useProject(id: string) {
  return useProjects().find((p) => p.id === id);
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`;
  return formatDate(iso);
}

export function statusTone(s: ProjectStatus) {
  switch (s) {
    case "Em andamento":
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]";
    case "Em revisão":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]";
    case "Bloqueado":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
    case "Concluído":
      return "bg-primary/15 text-primary";
    default:
      return "bg-surface-elevated text-muted-foreground";
  }
}
export function priorityTone(p: ProjectPriority) {
  switch (p) {
    case "Crítica":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
    case "Alta":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]";
    case "Média":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]";
    default:
      return "bg-surface-elevated text-muted-foreground";
  }
}
