import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

export const EVENT_STATUSES = [
  "Planejamento",
  "Em produção",
  "Confirmado",
  "Em andamento",
  "Concluído",
  "Cancelado",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_TYPES = [
  "Lançamento",
  "Assembleia",
  "Feira",
  "Patrocínio",
  "Ação Externa",
  "Treinamento",
  "Workshop",
  "Confraternização",
  "Inauguração",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;
export type EventPriority = (typeof EVENT_PRIORITIES)[number];

export type EventFile = { id: string; name: string; size: number; kind: "doc" | "photo" | "video" };
export type EventChecklistItem = { id: string; text: string; done: boolean; group: string };
export type EventScheduleItem = { id: string; time: string; title: string; owner?: string };
export type EventKanbanTask = { id: string; title: string; column: "Backlog" | "Fazendo" | "Revisão" | "Pronto"; owner?: string };
export type EventAttendee = { id: string; name: string; role?: string; confirmed: boolean };
export type EventGift = { id: string; name: string; quantity: number };
export type EventSupplier = { id: string; name: string; service: string; contact?: string };
export type EventTimelineEntry = {
  id: string;
  type: "created" | "status" | "field" | "note" | "checklist" | "file" | "schedule" | "kanban" | "attendee";
  message: string;
  author?: string;
  createdAt: string;
};

export type EventItem = {
  id: string;
  name: string;
  type: EventType;
  city: string;
  agency: string;
  venue: string;
  date: string; // ISO yyyy-mm-dd
  time: string; // HH:mm
  owner: string;
  team: string[];
  description: string;
  objective: string;
  campaign?: string;
  partners: string[];
  sponsorship: string;
  budget: number;
  gifts: EventGift[];
  suppliers: EventSupplier[];
  files: EventFile[];
  status: EventStatus;
  priority: EventPriority;
  progress: number;
  checklist: EventChecklistItem[];
  schedule: EventScheduleItem[];
  kanban: EventKanbanTask[];
  attendees: EventAttendee[];
  timeline: EventTimelineEntry[];
  notes: string;
  createdAt: string;
};

export const DEFAULT_CHECKLIST_GROUPS = [
  "Arte",
  "Banner",
  "Convite",
  "Coffee",
  "Brindes",
  "Lista",
  "Fotografia",
  "Vídeo",
  "Publicação",
  "Pós-evento",
] as const;

const KEY = "mhub.events.v1";
const uid = (p = "ev") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function makeDefaultChecklist(): EventChecklistItem[] {
  return DEFAULT_CHECKLIST_GROUPS.map((g) => ({
    id: uid("c"),
    group: g,
    text: g,
    done: false,
  }));
}

const seed: EventItem[] = [
  {
    id: uid(),
    name: "Lançamento Crédito Rural 2026",
    type: "Lançamento",
    city: "Patos de Minas/MG",
    agency: "Estúdio Norte",
    venue: "Auditório Sicoob Credibelo",
    date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    time: "19:30",
    owner: "Bruno",
    team: ["Camila", "Diego", "Larissa"],
    description: "Apresentação das novas linhas de crédito rural para cooperados e produtores parceiros.",
    objective: "Captar R$ 15 milhões em novas operações de crédito rural no trimestre.",
    campaign: "Campanha Safra 2026",
    partners: ["Estúdio Norte", "Rádio Sertaneja FM"],
    sponsorship: "Patrocínio institucional Sicoob Credibelo",
    budget: 48000,
    gifts: [
      { id: uid("g"), name: "Kit cooperado", quantity: 120 },
      { id: uid("g"), name: "Caneca personalizada", quantity: 150 },
    ],
    suppliers: [
      { id: uid("s"), name: "Buffet Sabor & Arte", service: "Coffee break", contact: "(34) 3821-1100" },
      { id: uid("s"), name: "AV Pro Eventos", service: "Som e iluminação", contact: "(34) 99999-7777" },
    ],
    files: [
      { id: uid("f"), name: "Briefing-Evento.pdf", size: 240000, kind: "doc" },
      { id: uid("f"), name: "Arte-convite.png", size: 1800000, kind: "photo" },
    ],
    status: "Em produção",
    priority: "Alta",
    progress: 45,
    checklist: makeDefaultChecklist().map((c, i) => (i < 3 ? { ...c, done: true } : c)),
    schedule: [
      { id: uid("sch"), time: "18:30", title: "Credenciamento e coffee", owner: "Camila" },
      { id: uid("sch"), time: "19:30", title: "Abertura institucional", owner: "Bruno" },
      { id: uid("sch"), time: "20:00", title: "Apresentação das linhas de crédito", owner: "Diretor" },
      { id: uid("sch"), time: "21:00", title: "Networking", owner: "Equipe" },
    ],
    kanban: [
      { id: uid("k"), title: "Aprovar arte do convite", column: "Revisão", owner: "Bruno" },
      { id: uid("k"), title: "Confirmar buffet", column: "Fazendo", owner: "Camila" },
      { id: uid("k"), title: "Montar lista de convidados VIP", column: "Backlog", owner: "Larissa" },
      { id: uid("k"), title: "Reservar auditório", column: "Pronto", owner: "Diego" },
    ],
    attendees: [
      { id: uid("a"), name: "João Silva", role: "Cooperado", confirmed: true },
      { id: uid("a"), name: "Maria Santos", role: "Produtora rural", confirmed: true },
      { id: uid("a"), name: "Carlos Mendes", role: "Parceiro institucional", confirmed: false },
    ],
    timeline: [{ id: uid("tl"), type: "created", message: "Evento criado a partir da Campanha Safra 2026.", author: "Sistema", createdAt: now() }],
    notes: "Diretoria solicitou foco na divulgação pré-evento via WhatsApp.",
    createdAt: now(),
  },
  {
    id: uid(),
    name: "Assembleia Geral Ordinária",
    type: "Assembleia",
    city: "Patrocínio/MG",
    agency: "Interna",
    venue: "Centro de Convenções",
    date: new Date(Date.now() + 42 * 86400000).toISOString().slice(0, 10),
    time: "08:00",
    owner: "Camila",
    team: ["Bruno", "Larissa"],
    description: "Assembleia anual com prestação de contas e eleição.",
    objective: "Garantir quórum de 80% dos cooperados aptos.",
    campaign: "Assembleia 2026",
    partners: ["Gráfica Triângulo"],
    sponsorship: "—",
    budget: 32000,
    gifts: [{ id: uid("g"), name: "Sacola institucional", quantity: 800 }],
    suppliers: [{ id: uid("s"), name: "Buffet Sabor & Arte", service: "Almoço executivo" }],
    files: [],
    status: "Planejamento",
    priority: "Crítica",
    progress: 18,
    checklist: makeDefaultChecklist(),
    schedule: [
      { id: uid("sch"), time: "08:00", title: "Credenciamento" },
      { id: uid("sch"), time: "09:00", title: "Abertura" },
    ],
    kanban: [
      { id: uid("k"), title: "Validar pauta com Diretoria", column: "Fazendo", owner: "Camila" },
      { id: uid("k"), title: "Imprimir convocações", column: "Backlog", owner: "Larissa" },
    ],
    attendees: [],
    timeline: [{ id: uid("tl"), type: "created", message: "Evento cadastrado.", author: "Camila", createdAt: now() }],
    notes: "",
    createdAt: now(),
  },
  {
    id: uid(),
    name: "Feira AgroSicoob",
    type: "Feira",
    city: "Uberlândia/MG",
    agency: "Estúdio Norte",
    venue: "Parque de Exposições",
    date: new Date(Date.now() - 18 * 86400000).toISOString().slice(0, 10),
    time: "10:00",
    owner: "Diego",
    team: ["Bruno", "Camila", "Larissa", "Renata"],
    description: "Estande institucional na maior feira agropecuária da região.",
    objective: "Gerar 300 leads qualificados para crédito rural.",
    partners: ["Estúdio Norte", "Gráfica Triângulo"],
    sponsorship: "Patrocínio bronze do evento principal",
    budget: 95000,
    gifts: [
      { id: uid("g"), name: "Boné Sicoob", quantity: 500 },
      { id: uid("g"), name: "Squeeze", quantity: 300 },
    ],
    suppliers: [{ id: uid("s"), name: "Estande Express", service: "Montagem do estande" }],
    files: [
      { id: uid("f"), name: "Relatório-Feira.pdf", size: 1240000, kind: "doc" },
      { id: uid("f"), name: "Foto-estande.jpg", size: 2400000, kind: "photo" },
    ],
    status: "Concluído",
    priority: "Média",
    progress: 100,
    checklist: makeDefaultChecklist().map((c) => ({ ...c, done: true })),
    schedule: [],
    kanban: [],
    attendees: [],
    timeline: [{ id: uid("tl"), type: "created", message: "Evento cadastrado.", author: "Sistema", createdAt: now() }],
    notes: "Resultado: 412 leads coletados (137% da meta).",
    createdAt: now(),
  },
];

function load(): EventItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as EventItem[];
  } catch {
    return [];
  }
}
function save(s: EventItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

let state: EventItem[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<EventItem[]>("events", () => state, (s) => { state = s; listeners.forEach((l) => l()); });
function emit() {
  save(state);
  cloudPush();
  listeners.forEach((l) => l());
}

function pushTimeline(e: EventItem, t: Omit<EventTimelineEntry, "id" | "createdAt">): EventItem {
  return { ...e, timeline: [{ id: uid("tl"), createdAt: now(), ...t }, ...e.timeline] };
}

export const eventsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  byId: (id: string) => state.find((e) => e.id === id),
  add(
    input: Omit<
      EventItem,
      | "id"
      | "createdAt"
      | "timeline"
      | "checklist"
      | "schedule"
      | "kanban"
      | "attendees"
      | "files"
      | "gifts"
      | "suppliers"
      | "team"
      | "partners"
      | "progress"
    > &
      Partial<
        Pick<
          EventItem,
          | "checklist"
          | "schedule"
          | "kanban"
          | "attendees"
          | "files"
          | "gifts"
          | "suppliers"
          | "team"
          | "partners"
          | "progress"
        >
      >,
  ): EventItem {
    const e: EventItem = {
      id: uid(),
      createdAt: now(),
      checklist: input.checklist ?? makeDefaultChecklist(),
      schedule: input.schedule ?? [],
      kanban: input.kanban ?? [],
      attendees: input.attendees ?? [],
      files: input.files ?? [],
      gifts: input.gifts ?? [],
      suppliers: input.suppliers ?? [],
      team: input.team ?? [],
      partners: input.partners ?? [],
      progress: input.progress ?? 0,
      timeline: [
        {
          id: uid("tl"),
          type: "created",
          message: "Evento criado.",
          author: input.owner || "Sistema",
          createdAt: now(),
        },
      ],
      ...input,
    } as EventItem;
    state = [e, ...state];
    emit();
    return e;
  },
  update(id: string, patch: Partial<EventItem>, author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      let next: EventItem = { ...e, ...patch };
      if (patch.status && patch.status !== e.status) {
        next = pushTimeline(next, { type: "status", author, message: `Status alterado de ${e.status} para ${patch.status}.` });
      }
      return next;
    });
    emit();
  },
  remove(id: string) {
    state = state.filter((e) => e.id !== id);
    emit();
  },
  addNote(id: string, text: string, author = "Você") {
    state = state.map((e) => (e.id !== id ? e : pushTimeline(e, { type: "note", author, message: text })));
    emit();
  },
  addFile(id: string, file: Omit<EventFile, "id">, author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const f = { id: uid("f"), ...file };
      const next = { ...e, files: [...e.files, f] };
      return pushTimeline(next, { type: "file", author, message: `Anexou ${file.kind} "${file.name}".` });
    });
    emit();
  },
  removeFile(id: string, fileId: string) {
    state = state.map((e) => (e.id !== id ? e : { ...e, files: e.files.filter((f) => f.id !== fileId) }));
    emit();
  },
  toggleChecklist(id: string, itemId: string, author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const item = e.checklist.find((c) => c.id === itemId);
      if (!item) return e;
      const checklist = e.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c));
      const progress = Math.round((checklist.filter((c) => c.done).length / Math.max(checklist.length, 1)) * 100);
      const next = { ...e, checklist, progress };
      return pushTimeline(next, { type: "checklist", author, message: `${!item.done ? "Concluiu" : "Reabriu"} "${item.text}".` });
    });
    emit();
  },
  addChecklistItem(id: string, text: string, group: string, author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, checklist: [...e.checklist, { id: uid("c"), text, group, done: false }] };
      return pushTimeline(next, { type: "checklist", author, message: `Adicionou ao checklist (${group}): "${text}".` });
    });
    emit();
  },
  removeChecklistItem(id: string, itemId: string) {
    state = state.map((e) => (e.id !== id ? e : { ...e, checklist: e.checklist.filter((c) => c.id !== itemId) }));
    emit();
  },
  addScheduleItem(id: string, item: Omit<EventScheduleItem, "id">, author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, schedule: [...e.schedule, { id: uid("sch"), ...item }].sort((a, b) => a.time.localeCompare(b.time)) };
      return pushTimeline(next, { type: "schedule", author, message: `Cronograma: ${item.time} — ${item.title}.` });
    });
    emit();
  },
  removeScheduleItem(id: string, itemId: string) {
    state = state.map((e) => (e.id !== id ? e : { ...e, schedule: e.schedule.filter((s) => s.id !== itemId) }));
    emit();
  },
  moveKanban(id: string, taskId: string, column: EventKanbanTask["column"], author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const task = e.kanban.find((k) => k.id === taskId);
      if (!task || task.column === column) return e;
      const next = { ...e, kanban: e.kanban.map((k) => (k.id === taskId ? { ...k, column } : k)) };
      return pushTimeline(next, { type: "kanban", author, message: `Moveu "${task.title}" para ${column}.` });
    });
    emit();
  },
  addKanbanTask(id: string, title: string, column: EventKanbanTask["column"], author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, kanban: [...e.kanban, { id: uid("k"), title, column }] };
      return pushTimeline(next, { type: "kanban", author, message: `Nova tarefa "${title}" em ${column}.` });
    });
    emit();
  },
  addAttendee(id: string, name: string, role?: string, author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, attendees: [...e.attendees, { id: uid("a"), name, role, confirmed: false }] };
      return pushTimeline(next, { type: "attendee", author, message: `Adicionou ${name} à lista de presença.` });
    });
    emit();
  },
  toggleAttendee(id: string, attendeeId: string) {
    state = state.map((e) =>
      e.id !== id ? e : { ...e, attendees: e.attendees.map((a) => (a.id === attendeeId ? { ...a, confirmed: !a.confirmed } : a)) },
    );
    emit();
  },
  removeAttendee(id: string, attendeeId: string) {
    state = state.map((e) => (e.id !== id ? e : { ...e, attendees: e.attendees.filter((a) => a.id !== attendeeId) }));
    emit();
  },
};

export function useEvents() {
  return useSyncExternalStore(eventsStore.subscribe, eventsStore.get, eventsStore.get);
}
export function useEvent(id: string) {
  return useEvents().find((e) => e.id === id);
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
export function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).getTime();
  return Math.ceil((d - Date.now()) / 86400000);
}

export function statusTone(s: EventStatus) {
  switch (s) {
    case "Planejamento":
      return "bg-primary/15 text-primary border-primary/30";
    case "Em produção":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] border-[color:var(--color-accent)]/30";
    case "Confirmado":
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30";
    case "Em andamento":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30";
    case "Concluído":
      return "bg-[color:var(--color-success)]/20 text-[color:var(--color-success)] border-[color:var(--color-success)]/40";
    case "Cancelado":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)] border-[color:var(--color-destructive)]/30";
  }
}

export function priorityTone(p: EventPriority) {
  switch (p) {
    case "Baixa":
      return "bg-surface-elevated text-muted-foreground";
    case "Média":
      return "bg-primary/15 text-primary";
    case "Alta":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]";
    case "Crítica":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
  }
}
