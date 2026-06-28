import { useSyncExternalStore } from "react";

export const EVENT_CATEGORIES = [
  "Campanha",
  "Evento",
  "Publicação",
  "Reunião",
  "Entrega",
  "Prazo",
  "Contrato",
  "Patrocínio",
  "Outdoor",
  "Rádio",
  "Produção de vídeo",
  "Aprovação",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_STATUSES = ["Planejado", "Em andamento", "Concluído", "Atrasado", "Cancelado"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;
export type EventPriority = (typeof EVENT_PRIORITIES)[number];

export type CalChecklistItem = { id: string; text: string; done: boolean };
export type CalComment = { id: string; author: string; text: string; createdAt: string };
export type CalTimelineEntry = { id: string; message: string; author?: string; createdAt: string };
export type CalFile = { name: string; size: number };

export type CalendarEvent = {
  id: string;
  title: string;
  category: EventCategory;
  status: EventStatus;
  priority: EventPriority;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  durationMin?: number;
  description: string;
  owners: string[];
  agency?: string;
  campaignId?: string;
  projectId?: string;
  kanbanTaskId?: string;
  files: CalFile[];
  checklist: CalChecklistItem[];
  comments: CalComment[];
  timeline: CalTimelineEntry[];
};

const KEY = "mhub.calendar.v1";

function uid(p = "e") {
  return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
const now = () => new Date().toISOString();

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = new Date();
const d = (offset: number) => {
  const x = new Date(today);
  x.setDate(today.getDate() + offset);
  return isoDate(x);
};

const seed: CalendarEvent[] = [
  {
    id: uid(), title: "Kickoff — Crédito Rural 2026", category: "Reunião",
    status: "Planejado", priority: "Alta", date: d(1), time: "09:30", durationMin: 60,
    description: "Reunião de abertura da campanha com squad e diretoria.",
    owners: ["Bruno", "Marina"], agency: "Interna", campaignId: "c-1",
    files: [], checklist: [{ id: uid("ck"), text: "Pauta enviada", done: true }],
    comments: [], timeline: [{ id: uid("t"), message: "Evento criado", author: "Sistema", createdAt: now() }],
  },
  {
    id: uid(), title: "Veiculação Outdoor — Lote 1", category: "Outdoor",
    status: "Em andamento", priority: "Alta", date: d(3),
    description: "Início da veiculação dos 12 outdoors do Lote 1.",
    owners: ["Pedro"], agency: "OOH Brasil", campaignId: "c-1",
    files: [], checklist: [], comments: [],
    timeline: [{ id: uid("t"), message: "Evento criado", createdAt: now() }],
  },
  {
    id: uid(), title: "Post Instagram — Stories Conta Jovem", category: "Publicação",
    status: "Planejado", priority: "Média", date: d(2), time: "11:00",
    description: "Sequência de 5 stories — Conta Digital Jovem.",
    owners: ["Carla"], campaignId: "c-2", projectId: "p-conta-jovem",
    files: [], checklist: [], comments: [],
    timeline: [{ id: uid("t"), message: "Evento criado", createdAt: now() }],
  },
  {
    id: uid(), title: "Spot rádio — Cidade FM", category: "Rádio",
    status: "Planejado", priority: "Média", date: d(5), time: "07:00",
    description: "30 inserções diárias na Cidade FM.",
    owners: ["Pedro"], agency: "Cidade FM", campaignId: "c-1",
    files: [], checklist: [], comments: [], timeline: [],
  },
  {
    id: uid(), title: "Aprovação — KV Filiação", category: "Aprovação",
    status: "Planejado", priority: "Crítica", date: d(0), time: "16:00", durationMin: 30,
    description: "Apresentação do KV final para diretoria.",
    owners: ["Bruno", "Diretoria"], campaignId: "c-3",
    files: [], checklist: [], comments: [],
    timeline: [{ id: uid("t"), message: "Solicitado", author: "Bruno", createdAt: now() }],
  },
  {
    id: uid(), title: "Entrega — Vídeo institucional 60s", category: "Produção de vídeo",
    status: "Planejado", priority: "Alta", date: d(7),
    description: "Entrega master do vídeo institucional.",
    owners: ["Marina"], agency: "Foco Filmes", campaignId: "c-2",
    files: [], checklist: [], comments: [], timeline: [],
  },
  {
    id: uid(), title: "Contrato — Patrocínio Festa Junina", category: "Contrato",
    status: "Planejado", priority: "Média", date: d(10),
    description: "Assinatura do contrato de patrocínio.",
    owners: ["Bruno"], agency: "Pref. Município", files: [], checklist: [],
    comments: [], timeline: [],
  },
  {
    id: uid(), title: "Patrocínio — Cavalgada Regional", category: "Patrocínio",
    status: "Planejado", priority: "Média", date: d(12),
    description: "Ativação no evento regional.",
    owners: ["Pedro"], files: [], checklist: [], comments: [], timeline: [],
  },
  {
    id: uid(), title: "Prazo — Briefing campanha Q4", category: "Prazo",
    status: "Planejado", priority: "Alta", date: d(-2),
    description: "Prazo final de envio do briefing.",
    owners: ["Bruno"], files: [], checklist: [], comments: [], timeline: [],
  },
  {
    id: uid(), title: "Campanha — Conta Jovem (janela)", category: "Campanha",
    status: "Em andamento", priority: "Crítica", date: d(4),
    description: "Pico de mídia da campanha Conta Jovem.",
    owners: ["Marina"], campaignId: "c-2", files: [], checklist: [], comments: [], timeline: [],
  },
];

function load(): CalendarEvent[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as CalendarEvent[];
  } catch {
    return seed;
  }
}

let state = load();
const listeners = new Set<() => void>();
function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
function emit() { persist(); listeners.forEach((l) => l()); }

function pushTimeline(e: CalendarEvent, msg: string, author = "Você"): CalendarEvent {
  return {
    ...e,
    timeline: [{ id: uid("t"), message: msg, author, createdAt: now() }, ...e.timeline],
  };
}

export const calendarStore = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  byId: (id: string) => state.find((e) => e.id === id),
  add(input: Omit<CalendarEvent, "id" | "files" | "checklist" | "comments" | "timeline"> & Partial<Pick<CalendarEvent, "files" | "checklist" | "comments" | "timeline">>) {
    const ev: CalendarEvent = {
      id: uid(),
      files: [], checklist: [], comments: [],
      timeline: [{ id: uid("t"), message: "Evento criado", author: "Você", createdAt: now() }],
      ...input,
    } as CalendarEvent;
    state = [ev, ...state];
    emit();
    return ev;
  },
  moveDate(id: string, date: string) {
    state = state.map((e) => {
      if (e.id !== id || e.date === date) return e;
      return pushTimeline({ ...e, date }, `Movido para ${date}.`);
    });
    emit();
  },
  update(id: string, patch: Partial<CalendarEvent>, author = "Você") {
    state = state.map((e) => {
      if (e.id !== id) return e;
      let next: CalendarEvent = { ...e, ...patch };
      if (patch.status && patch.status !== e.status) next = pushTimeline(next, `Status: ${e.status} → ${patch.status}`, author);
      if (patch.priority && patch.priority !== e.priority) next = pushTimeline(next, `Prioridade alterada para ${patch.priority}`, author);
      return next;
    });
    emit();
  },
  remove(id: string) { state = state.filter((e) => e.id !== id); emit(); },
  toggleChecklist(id: string, itemId: string) {
    state = state.map((e) => {
      if (e.id !== id) return e;
      const item = e.checklist.find((c) => c.id === itemId); if (!item) return e;
      return pushTimeline(
        { ...e, checklist: e.checklist.map((c) => c.id === itemId ? { ...c, done: !c.done } : c) },
        `${!item.done ? "Concluiu" : "Reabriu"} "${item.text}"`,
      );
    });
    emit();
  },
  addChecklist(id: string, text: string) {
    state = state.map((e) => e.id === id
      ? pushTimeline({ ...e, checklist: [...e.checklist, { id: uid("ck"), text, done: false }] }, `Item adicionado: ${text}`)
      : e);
    emit();
  },
  addComment(id: string, author: string, text: string) {
    state = state.map((e) => e.id === id
      ? pushTimeline({ ...e, comments: [{ id: uid("cm"), author, text, createdAt: now() }, ...e.comments] }, `Comentou: "${text.slice(0, 60)}"`, author)
      : e);
    emit();
  },
  addFile(id: string, file: CalFile) {
    state = state.map((e) => e.id === id
      ? pushTimeline({ ...e, files: [...e.files, file] }, `Anexou "${file.name}"`)
      : e);
    emit();
  },
};

export function useCalendar() {
  return useSyncExternalStore(calendarStore.subscribe, calendarStore.get, calendarStore.get);
}
export function useCalendarEvent(id: string | null) {
  return useCalendar().find((e) => e.id === id) ?? null;
}

/** Tailwind-safe color tokens per category. */
export const CATEGORY_STYLE: Record<EventCategory, { bg: string; text: string; ring: string; dot: string; label: string }> = {
  "Campanha":          { bg: "bg-indigo-500/15",   text: "text-indigo-300",   ring: "ring-indigo-500/30",   dot: "bg-indigo-400",   label: "Indigo" },
  "Evento":            { bg: "bg-pink-500/15",     text: "text-pink-300",     ring: "ring-pink-500/30",     dot: "bg-pink-400",     label: "Pink" },
  "Publicação":        { bg: "bg-sky-500/15",      text: "text-sky-300",      ring: "ring-sky-500/30",      dot: "bg-sky-400",      label: "Sky" },
  "Reunião":           { bg: "bg-violet-500/15",   text: "text-violet-300",   ring: "ring-violet-500/30",   dot: "bg-violet-400",   label: "Violet" },
  "Entrega":           { bg: "bg-emerald-500/15",  text: "text-emerald-300",  ring: "ring-emerald-500/30",  dot: "bg-emerald-400",  label: "Emerald" },
  "Prazo":             { bg: "bg-red-500/15",      text: "text-red-300",      ring: "ring-red-500/30",      dot: "bg-red-400",      label: "Red" },
  "Contrato":          { bg: "bg-amber-500/15",    text: "text-amber-300",    ring: "ring-amber-500/30",    dot: "bg-amber-400",    label: "Amber" },
  "Patrocínio":        { bg: "bg-orange-500/15",   text: "text-orange-300",   ring: "ring-orange-500/30",   dot: "bg-orange-400",   label: "Orange" },
  "Outdoor":           { bg: "bg-teal-500/15",     text: "text-teal-300",     ring: "ring-teal-500/30",     dot: "bg-teal-400",     label: "Teal" },
  "Rádio":             { bg: "bg-yellow-500/15",   text: "text-yellow-200",   ring: "ring-yellow-500/30",   dot: "bg-yellow-400",   label: "Yellow" },
  "Produção de vídeo": { bg: "bg-fuchsia-500/15",  text: "text-fuchsia-300",  ring: "ring-fuchsia-500/30",  dot: "bg-fuchsia-400",  label: "Fuchsia" },
  "Aprovação":         { bg: "bg-lime-500/15",     text: "text-lime-300",     ring: "ring-lime-500/30",     dot: "bg-lime-400",     label: "Lime" },
};

export function formatLongDate(iso: string) {
  const dt = new Date(iso + "T00:00:00");
  return dt.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

export function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

export { isoDate };
