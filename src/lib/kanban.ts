import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

export const KANBAN_STATUSES = [
  "Backlog",
  "Planejamento",
  "Em andamento",
  "Aguardando Aprovação",
  "Concluído",
  "Cancelado",
] as const;
export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

export const TASK_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export type KanbanTask = {
  id: string;
  title: string;
  status: KanbanStatus;
  assignee?: string;
  dueDate?: string;
  priority: TaskPriority;
  campaignId?: string;
  projectId?: string;
  labels: string[];
  progress: number;
  attachments: number;
  comments: number;
  createdAt: string;
};

const KEY = "mhub.kanban.v1";

function uid() {
  return `k-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const seed: KanbanTask[] = [
  {
    id: uid(), title: "Briefing — Crédito Rural 2026", status: "Backlog",
    assignee: "Bruno", dueDate: "2026-07-05", priority: "Alta",
    campaignId: "c-1", projectId: "p-rural-26",
    labels: ["Briefing", "Estratégia"], progress: 0, attachments: 2, comments: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Peças redes sociais — semana 1", status: "Planejamento",
    assignee: "Carla", dueDate: "2026-07-12", priority: "Média",
    campaignId: "c-1", labels: ["Social", "Design"],
    progress: 20, attachments: 5, comments: 3, createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Roteiro vídeo institucional", status: "Em andamento",
    assignee: "Marina", dueDate: "2026-07-10", priority: "Crítica",
    campaignId: "c-2", projectId: "p-conta-jovem",
    labels: ["Vídeo", "Roteiro"], progress: 60, attachments: 1, comments: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Plano de mídia OOH", status: "Em andamento",
    assignee: "Pedro", dueDate: "2026-07-18", priority: "Alta",
    campaignId: "c-1", labels: ["Mídia", "Offline"],
    progress: 40, attachments: 0, comments: 2, createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Aprovar artes finais — filiação", status: "Aguardando Aprovação",
    assignee: "Diretoria", dueDate: "2026-07-08", priority: "Alta",
    campaignId: "c-3", labels: ["Aprovação"], progress: 90,
    attachments: 4, comments: 6, createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Landing page Conta Jovem", status: "Concluído",
    assignee: "Carla", dueDate: "2026-06-25", priority: "Média",
    campaignId: "c-2", projectId: "p-conta-jovem",
    labels: ["Web"], progress: 100, attachments: 3, comments: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: uid(), title: "Campanha aniversário (descontinuada)", status: "Cancelado",
    priority: "Baixa", labels: ["Institucional"], progress: 0,
    attachments: 0, comments: 1, createdAt: new Date().toISOString(),
  },
];

function load(): KanbanTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KanbanTask[];
  } catch {
    return [];
  }
}

let state = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<KanbanTask[]>("kanban", () => state, (s) => { state = s; listeners.forEach((l) => l()); });
function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
function emit() { persist(); cloudPush(); listeners.forEach((l) => l()); }

export const kanbanStore = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  add(task: Omit<KanbanTask, "id" | "createdAt">) {
    state = [{ ...task, id: uid(), createdAt: new Date().toISOString() }, ...state];
    emit();
  },
  move(id: string, status: KanbanStatus) {
    state = state.map((t) => (t.id === id ? { ...t, status } : t));
    emit();
  },
  remove(id: string) {
    state = state.filter((t) => t.id !== id);
    emit();
  },
};

export function useKanban() {
  return useSyncExternalStore(kanbanStore.subscribe, kanbanStore.get, kanbanStore.get);
}

export function statusTone(s: KanbanStatus) {
  switch (s) {
    case "Backlog": return "text-muted-foreground";
    case "Planejamento": return "text-[color:var(--color-accent)]";
    case "Em andamento": return "text-[color:var(--color-success)]";
    case "Aguardando Aprovação": return "text-[color:var(--color-warning)]";
    case "Concluído": return "text-primary";
    case "Cancelado": return "text-[color:var(--color-destructive)]";
  }
}

export function priorityDot(p: TaskPriority) {
  switch (p) {
    case "Crítica": return "bg-[color:var(--color-destructive)]";
    case "Alta": return "bg-[color:var(--color-warning)]";
    case "Média": return "bg-[color:var(--color-accent)]";
    default: return "bg-muted-foreground";
  }
}
