import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

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

const KEY = "mhub.calendar.v2";

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

const CURRENT_YEAR = new Date().getFullYear();

type BirthdaySeed = {
  title: string;
  category: EventCategory;
  month: number;
  day: number;
  originYear?: number;
  description: string;
};

const CITY_BIRTHDAYS: BirthdaySeed[] = [
  { title: "Aniversário da cidade — Campo Belo", category: "Evento", month: 9, day: 28, originYear: 1879, description: "Fundação de Campo Belo (28/09/1879)." },
  { title: "Aniversário da cidade — Candeias", category: "Evento", month: 12, day: 17, originYear: 1938, description: "Fundação de Candeias (17/12/1938)." },
  { title: "Aniversário da cidade — Cristais", category: "Evento", month: 6, day: 4, originYear: 1948, description: "Fundação de Cristais (04/06/1948)." },
  { title: "Aniversário da cidade — Aguanil", category: "Evento", month: 3, day: 1, originYear: 1962, description: "Fundação de Aguanil (01/03/1962)." },
  { title: "Aniversário da cidade — Cana Verde", category: "Evento", month: 9, day: 1, originYear: 1962, description: "Fundação de Cana Verde (01/09/1962)." },
  { title: "Aniversário da cidade — Santana do Jacaré", category: "Evento", month: 12, day: 12, description: "Aniversário de Santana do Jacaré (12/12)." },
];

const COPOM_2026: { month: number; day: number }[] = [
  { month: 1, day: 27 }, { month: 1, day: 28 },
  { month: 3, day: 17 }, { month: 3, day: 18 },
  { month: 4, day: 28 }, { month: 4, day: 29 },
  { month: 6, day: 16 }, { month: 6, day: 17 },
  { month: 8, day: 4 },  { month: 8, day: 5 },
  { month: 9, day: 15 }, { month: 9, day: 16 },
  { month: 11, day: 3 }, { month: 11, day: 4 },
  { month: 12, day: 8 }, { month: 12, day: 9 },
];

function buildCopom(m: number, d: number): CalendarEvent {
  const date = `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return {
    id: uid(),
    title: "Reunião do COPOM 2026",
    category: "Reunião",
    status: "Planejado",
    priority: "Alta",
    date,
    description: "Reunião do Comitê de Política Monetária (COPOM) — definição da taxa Selic.",
    owners: ["Financeiro"],
    files: [],
    checklist: [],
    comments: [],
    timeline: [{ id: uid("t"), message: "Evento criado", author: "Sistema", createdAt: now() }],
  };
}

const AGENCY_BIRTHDAYS: BirthdaySeed[] = [
  { title: "Aniversário da agência — Campo Belo", category: "Campanha", month: 10, day: 15, originYear: 1993, description: "Inauguração da agência Campo Belo (15/10/1993)." },
  { title: "Aniversário da agência — Candeias", category: "Campanha", month: 3, day: 2, originYear: 1998, description: "Inauguração da agência Candeias (02/03/1998)." },
  { title: "Aniversário da agência — Cristais", category: "Campanha", month: 9, day: 25, originYear: 1999, description: "Inauguração da agência Cristais (25/09/1999)." },
  { title: "Aniversário da agência — Aguanil", category: "Campanha", month: 5, day: 3, originYear: 2001, description: "Inauguração da agência Aguanil (03/05/2001)." },
  { title: "Aniversário da agência — Cana Verde", category: "Campanha", month: 11, day: 5, originYear: 2006, description: "Inauguração da agência Cana Verde (05/11/2006)." },
  { title: "Aniversário da agência — Alto das Mercês", category: "Campanha", month: 9, day: 2, originYear: 2013, description: "Inauguração da agência Alto das Mercês (02/09/2013)." },
  { title: "Aniversário da agência — Praça", category: "Campanha", month: 6, day: 2, originYear: 2022, description: "Inauguração da agência Praça (02/06/2022)." },
  { title: "Aniversário da agência — Santana do Jacaré", category: "Campanha", month: 10, day: 16, originYear: 2023, description: "Inauguração da agência Santana do Jacaré (16/10/2023)." },
];

function buildBirthday(b: BirthdaySeed): CalendarEvent {
  const date = `${CURRENT_YEAR}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;
  const years = b.originYear ? ` (${CURRENT_YEAR - b.originYear} anos)` : "";
  return {
    id: uid(),
    title: `${b.title}${years}`,
    category: b.category,
    status: "Planejado",
    priority: "Média",
    date,
    description: b.description,
    owners: ["Marketing"],
    files: [],
    checklist: [],
    comments: [],
    timeline: [{ id: uid("t"), message: "Evento criado", author: "Sistema", createdAt: now() }],
  };
}

const seed: CalendarEvent[] = [
  ...CITY_BIRTHDAYS.map(buildBirthday),
  ...AGENCY_BIRTHDAYS.map(buildBirthday),
  ...COPOM_2026.map((c) => buildCopom(c.month, c.day)),
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
const cloudPush = enableCloudSync<CalendarEvent[]>("calendar", () => state, (s) => { state = s; listeners.forEach((l) => l()); });
function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}
function emit() { persist(); cloudPush(); listeners.forEach((l) => l()); }

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
  upsert(ev: CalendarEvent) {
    const existing = state.find((e) => e.id === ev.id);
    if (existing) {
      state = state.map((e) => (e.id === ev.id ? { ...existing, ...ev, timeline: existing.timeline, comments: existing.comments, checklist: existing.checklist, files: existing.files } : e));
    } else {
      state = [ev, ...state];
    }
    emit();
  },
  removeMany(ids: string[]) {
    const set = new Set(ids);
    const before = state.length;
    state = state.filter((e) => !set.has(e.id));
    if (state.length !== before) emit();
  },
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
