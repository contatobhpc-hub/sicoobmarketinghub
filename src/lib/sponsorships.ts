import { useSyncExternalStore } from "react";
import { isRememberedDeletion, rememberDeletion } from "./deletions";
import { enableEntitySync } from "./entity-sync";

export const SPONSORSHIP_TYPES = [
  "Master",
  "Ouro",
  "Prata",
  "Bronze",
  "Apoio",
  "Permuta",
] as const;
export type SponsorshipType = (typeof SPONSORSHIP_TYPES)[number];

export const SPONSORSHIP_STATUSES = [
  "Em negociação",
  "Confirmado",
  "Em execução",
  "Concluído",
  "Cancelado",
] as const;
export type SponsorshipStatus = (typeof SPONSORSHIP_STATUSES)[number];

export const SPONSORSHIP_CATEGORIES = [
  "Esportivo",
  "Cultural",
  "Social",
  "Educacional",
  "Agronegócio",
  "Religioso",
  "Empresarial",
] as const;
export type SponsorshipCategory = (typeof SPONSORSHIP_CATEGORIES)[number];

export type SponsorshipFile = { id: string; name: string; size: number; kind: "doc" | "photo" | "report" };
export type SponsorshipChecklistItem = { id: string; text: string; done: boolean };
export type SponsorshipCounterpart = { id: string; text: string; delivered: boolean };
export type SponsorshipTimelineEntry = {
  id: string;
  type: "created" | "status" | "delivery" | "counterpart" | "report" | "file" | "note" | "alert";
  message: string;
  author?: string;
  createdAt: string;
};

export type Sponsorship = {
  id: string;
  institution: string;
  event: string;
  eventId?: string;
  campaign?: string;
  campaignId?: string;
  city: string;
  category: SponsorshipCategory;
  type: SponsorshipType;
  value: number;
  contractId?: string;
  contractRef: string;
  owner: string;
  startDate: string;
  endDate: string;
  status: SponsorshipStatus;
  materialsDeadline?: string;
  counterpartsDeadline?: string;
  accountingDeadline?: string;
  counterparts: SponsorshipCounterpart[];
  materialsDelivered: string[];
  files: SponsorshipFile[];
  checklist: SponsorshipChecklistItem[];
  reportSummary: string;
  expectedReturn: number;
  deliveredReturn: number;
  timeline: SponsorshipTimelineEntry[];
  notes: string;
  createdAt: string;
};

const KEY = "mhub.sponsorships.v1";
const DELETED_KEY = "mhub.sponsorships.deleted.v1";
const uid = (p = "sp") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const defaultChecklist = (): SponsorshipChecklistItem[] => [
  { id: uid("c"), text: "Assinatura do contrato", done: false },
  { id: uid("c"), text: "Envio do material de divulgação", done: false },
  { id: uid("c"), text: "Acompanhamento das contrapartidas", done: false },
  { id: uid("c"), text: "Coleta de fotos e vídeos", done: false },
  { id: uid("c"), text: "Relatório final", done: false },
  { id: uid("c"), text: "Prestação de contas", done: false },
];

const seed: Sponsorship[] = [
  {
    id: uid(),
    institution: "Liga Esportiva Patense",
    event: "Campeonato Regional de Futebol",
    campaign: "Campanha Safra 2026",
    city: "Patos de Minas/MG",
    category: "Esportivo",
    type: "Ouro",
    value: 45000,
    contractRef: "CT-2026-007",
    owner: "Bruno",
    startDate: inDays(-10),
    endDate: inDays(60),
    status: "Em execução",
    materialsDeadline: inDays(5),
    counterpartsDeadline: inDays(20),
    accountingDeadline: inDays(75),
    counterparts: [
      { id: uid("cp"), text: "Logo nas camisas dos 12 times", delivered: true },
      { id: uid("cp"), text: "30 inserções no estádio", delivered: false },
      { id: uid("cp"), text: "Backdrop nas coletivas", delivered: false },
    ],
    materialsDelivered: ["Banners (40 un)", "Adesivos (200 un)"],
    files: [
      { id: uid("f"), name: "Contrato-Liga.pdf", size: 320000, kind: "doc" },
      { id: uid("f"), name: "Foto-abertura.jpg", size: 1800000, kind: "photo" },
    ],
    checklist: defaultChecklist().map((c, i) => (i < 2 ? { ...c, done: true } : c)),
    reportSummary: "",
    expectedReturn: 120000,
    deliveredReturn: 38000,
    timeline: [{ id: uid("tl"), type: "created", message: "Patrocínio criado.", author: "Bruno", createdAt: now() }],
    notes: "Cobertura na imprensa local confirmada.",
    createdAt: now(),
  },
  {
    id: uid(),
    institution: "Festival de Cultura Sertaneja",
    event: "Festival Sertanejo 2026",
    campaign: "Marca Institucional",
    city: "Patrocínio/MG",
    category: "Cultural",
    type: "Master",
    value: 120000,
    contractRef: "CT-2026-011",
    owner: "Camila",
    startDate: inDays(-30),
    endDate: inDays(2),
    status: "Em execução",
    materialsDeadline: inDays(-2),
    counterpartsDeadline: inDays(1),
    accountingDeadline: inDays(20),
    counterparts: [
      { id: uid("cp"), text: "Naming rights do palco principal", delivered: true },
      { id: uid("cp"), text: "10.000 pulseiras com a marca", delivered: true },
      { id: uid("cp"), text: "Stand institucional 6x6m", delivered: false },
    ],
    materialsDelivered: ["Pulseiras", "Backdrop palco"],
    files: [{ id: uid("f"), name: "Briefing-Festival.pdf", size: 540000, kind: "doc" }],
    checklist: defaultChecklist().map((c, i) => (i < 3 ? { ...c, done: true } : c)),
    reportSummary: "",
    expectedReturn: 480000,
    deliveredReturn: 290000,
    timeline: [{ id: uid("tl"), type: "created", message: "Patrocínio criado.", author: "Camila", createdAt: now() }],
    notes: "",
    createdAt: now(),
  },
  {
    id: uid(),
    institution: "Sindicato Rural",
    event: "ExpoAgro 2025",
    campaign: "Crédito Rural 2025",
    city: "Uberlândia/MG",
    category: "Agronegócio",
    type: "Prata",
    value: 65000,
    contractRef: "CT-2025-094",
    owner: "Diego",
    startDate: inDays(-120),
    endDate: inDays(-25),
    status: "Concluído",
    materialsDeadline: inDays(-130),
    counterpartsDeadline: inDays(-25),
    accountingDeadline: inDays(-5),
    counterparts: [
      { id: uid("cp"), text: "Stand 9x9m", delivered: true },
      { id: uid("cp"), text: "Palestra técnica patrocinada", delivered: true },
    ],
    materialsDelivered: ["Stand completo", "Banners", "Material gráfico"],
    files: [
      { id: uid("f"), name: "Relatório-ExpoAgro.pdf", size: 2400000, kind: "report" },
      { id: uid("f"), name: "Fotos-evento.zip", size: 12000000, kind: "photo" },
    ],
    checklist: defaultChecklist().map((c) => ({ ...c, done: true })),
    reportSummary: "412 leads coletados (137% da meta). ROI estimado de 4.6x.",
    expectedReturn: 220000,
    deliveredReturn: 298000,
    timeline: [{ id: uid("tl"), type: "created", message: "Patrocínio criado.", author: "Diego", createdAt: now() }],
    notes: "Excelente retorno. Renovar em 2026.",
    createdAt: now(),
  },
  {
    id: uid(),
    institution: "Instituto Educar+",
    event: "Olimpíada Estudantil",
    city: "Patos de Minas/MG",
    category: "Educacional",
    type: "Apoio",
    value: 18000,
    contractRef: "CT-2026-015",
    owner: "Larissa",
    startDate: inDays(15),
    endDate: inDays(45),
    status: "Confirmado",
    materialsDeadline: inDays(10),
    counterpartsDeadline: inDays(40),
    accountingDeadline: inDays(60),
    counterparts: [
      { id: uid("cp"), text: "Camisetas para 500 alunos", delivered: false },
      { id: uid("cp"), text: "Logo no certificado", delivered: false },
    ],
    materialsDelivered: [],
    files: [],
    checklist: defaultChecklist(),
    reportSummary: "",
    expectedReturn: 45000,
    deliveredReturn: 0,
    timeline: [{ id: uid("tl"), type: "created", message: "Patrocínio criado.", author: "Larissa", createdAt: now() }],
    notes: "",
    createdAt: now(),
  },
];

export function sponsorshipDeletionKey(s: Pick<Sponsorship, "institution" | "event" | "city">) {
  return `${s.event}|${s.institution}|${s.city}`;
}

export function isSponsorshipDeleted(s: Pick<Sponsorship, "id" | "institution" | "event" | "city">) {
  return isRememberedDeletion(DELETED_KEY, {
    id: s.id,
    name: `${s.event} ${s.institution}`,
    key: sponsorshipDeletionKey(s),
  });
}

function pruneDeleted(items: Sponsorship[]) {
  return items.filter((item) => !isSponsorshipDeleted(item));
}

const MODEL_SPONSORSHIP_KEYS = new Set(seed.map((item) => normalizeText(sponsorshipDeletionKey(item))));

function isModelSponsorship(s: Pick<Sponsorship, "institution" | "event" | "city">) {
  return MODEL_SPONSORSHIP_KEYS.has(normalizeText(sponsorshipDeletionKey(s)));
}

function sanitizeSponsorships(items: Sponsorship[]) {
  return pruneDeleted(items.filter((item) => !isModelSponsorship(item)));
}

function load(): Sponsorship[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? sanitizeSponsorships(parsed as Sponsorship[]) : [];
  } catch {
    return [];
  }
}
function save(s: Sponsorship[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

let state: Sponsorship[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableEntitySync<Sponsorship>(
  { module: "sponsorships", sanitize: sanitizeSponsorships },
  {
    getState: () => state,
    replaceState: (s) => {
      state = sanitizeSponsorships(s);
      save(state);
      listeners.forEach((l) => l());
    },
  },
);
function emit() {
  save(state);
  cloudPush();
  listeners.forEach((l) => l());
}
function pushTimeline(s: Sponsorship, t: Omit<SponsorshipTimelineEntry, "id" | "createdAt">): Sponsorship {
  return { ...s, timeline: [{ id: uid("tl"), createdAt: now(), ...t }, ...s.timeline] };
}

export const sponsorshipsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  byId: (id: string) => state.find((s) => s.id === id),
  add(input: Partial<Sponsorship> & Pick<Sponsorship, "institution" | "event" | "city" | "category" | "type" | "value" | "owner">): Sponsorship {
    const s: Sponsorship = {
      id: uid(),
      createdAt: now(),
      contractRef: "",
      status: "Em negociação",
      startDate: inDays(0),
      endDate: inDays(30),
      counterparts: [],
      materialsDelivered: [],
      files: [],
      checklist: defaultChecklist(),
      reportSummary: "",
      expectedReturn: 0,
      deliveredReturn: 0,
      notes: "",
      timeline: [{ id: uid("tl"), type: "created", message: "Patrocínio criado.", author: input.owner, createdAt: now() }],
      ...input,
    } as Sponsorship;
    state = [s, ...state];
    emit();
    return s;
  },
  update(id: string, patch: Partial<Sponsorship>, author = "Você") {
    state = state.map((s) => {
      if (s.id !== id) return s;
      let next: Sponsorship = { ...s, ...patch };
      if (patch.status && patch.status !== s.status) {
        next = pushTimeline(next, { type: "status", author, message: `Status: ${s.status} → ${patch.status}.` });
      }
      return next;
    });
    emit();
  },
  remove(id: string) {
    const item = state.find((s) => s.id === id);
    if (item) {
      rememberDeletion(DELETED_KEY, {
        id: item.id,
        name: `${item.event} ${item.institution}`,
        key: sponsorshipDeletionKey(item),
      });
    }
    state = state.filter((s) => s.id !== id);
    emit();
  },
  addNote(id: string, text: string, author = "Você") {
    state = state.map((s) => (s.id !== id ? s : pushTimeline(s, { type: "note", author, message: text })));
    emit();
  },
  toggleChecklist(id: string, itemId: string, author = "Você") {
    state = state.map((s) => {
      if (s.id !== id) return s;
      const item = s.checklist.find((c) => c.id === itemId);
      if (!item) return s;
      const next = { ...s, checklist: s.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) };
      return pushTimeline(next, { type: "note", author, message: `${!item.done ? "Concluiu" : "Reabriu"} "${item.text}".` });
    });
    emit();
  },
  addChecklistItem(id: string, text: string) {
    state = state.map((s) => (s.id !== id ? s : { ...s, checklist: [...s.checklist, { id: uid("c"), text, done: false }] }));
    emit();
  },
  removeChecklistItem(id: string, itemId: string) {
    state = state.map((s) => (s.id !== id ? s : { ...s, checklist: s.checklist.filter((c) => c.id !== itemId) }));
    emit();
  },
  toggleCounterpart(id: string, cpId: string, author = "Você") {
    state = state.map((s) => {
      if (s.id !== id) return s;
      const cp = s.counterparts.find((c) => c.id === cpId);
      if (!cp) return s;
      const next = { ...s, counterparts: s.counterparts.map((c) => (c.id === cpId ? { ...c, delivered: !c.delivered } : c)) };
      return pushTimeline(next, { type: "counterpart", author, message: `${!cp.delivered ? "Contrapartida entregue" : "Contrapartida reaberta"}: "${cp.text}".` });
    });
    emit();
  },
  addCounterpart(id: string, text: string) {
    state = state.map((s) => (s.id !== id ? s : { ...s, counterparts: [...s.counterparts, { id: uid("cp"), text, delivered: false }] }));
    emit();
  },
  removeCounterpart(id: string, cpId: string) {
    state = state.map((s) => (s.id !== id ? s : { ...s, counterparts: s.counterparts.filter((c) => c.id !== cpId) }));
    emit();
  },
  addMaterial(id: string, text: string, author = "Você") {
    state = state.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, materialsDelivered: [...s.materialsDelivered, text] };
      return pushTimeline(next, { type: "delivery", author, message: `Material entregue: ${text}.` });
    });
    emit();
  },
  removeMaterial(id: string, idx: number) {
    state = state.map((s) => (s.id !== id ? s : { ...s, materialsDelivered: s.materialsDelivered.filter((_, i) => i !== idx) }));
    emit();
  },
  addFile(id: string, file: Omit<SponsorshipFile, "id">, author = "Você") {
    state = state.map((s) => {
      if (s.id !== id) return s;
      const f = { id: uid("f"), ...file };
      const next = { ...s, files: [...s.files, f] };
      return pushTimeline(next, { type: "file", author, message: `Anexou ${file.kind} "${file.name}".` });
    });
    emit();
  },
  removeFile(id: string, fileId: string) {
    state = state.map((s) => (s.id !== id ? s : { ...s, files: s.files.filter((f) => f.id !== fileId) }));
    emit();
  },
  setReport(id: string, summary: string, deliveredReturn: number, author = "Você") {
    state = state.map((s) => {
      if (s.id !== id) return s;
      const next = { ...s, reportSummary: summary, deliveredReturn };
      return pushTimeline(next, { type: "report", author, message: `Relatório atualizado. Retorno: ${deliveredReturn}.` });
    });
    emit();
  },
};

export function useSponsorships() {
  return useSyncExternalStore(sponsorshipsStore.subscribe, sponsorshipsStore.get, sponsorshipsStore.get);
}
export function useSponsorship(id: string) {
  return useSponsorships().find((s) => s.id === id);
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

export type AlertKind = "materials" | "counterparts" | "accounting";
export type SponsorshipAlert = {
  sponsorshipId: string;
  kind: AlertKind;
  label: string;
  date: string;
  days: number;
  level: "expired" | "urgent" | "soon" | "ok";
};

export function computeAlerts(s: Sponsorship): SponsorshipAlert[] {
  const defs: { kind: AlertKind; date?: string; label: string; check: () => boolean }[] = [
    {
      kind: "materials",
      date: s.materialsDeadline,
      label: "Entrega de materiais",
      check: () => s.materialsDelivered.length === 0,
    },
    {
      kind: "counterparts",
      date: s.counterpartsDeadline,
      label: "Contrapartidas pendentes",
      check: () => s.counterparts.some((c) => !c.delivered) || s.counterparts.length === 0,
    },
    {
      kind: "accounting",
      date: s.accountingDeadline,
      label: "Prestação de contas",
      check: () => !s.reportSummary || s.deliveredReturn === 0,
    },
  ];
  const out: SponsorshipAlert[] = [];
  for (const d of defs) {
    if (!d.date) continue;
    if (!d.check()) continue;
    const days = daysUntil(d.date) ?? 0;
    const level: SponsorshipAlert["level"] = days < 0 ? "expired" : days <= 7 ? "urgent" : days <= 21 ? "soon" : "ok";
    out.push({ sponsorshipId: s.id, kind: d.kind, label: d.label, date: d.date, days, level });
  }
  return out;
}

export function typeTone(t: SponsorshipType) {
  switch (t) {
    case "Master":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] border-[color:var(--color-accent)]/30";
    case "Ouro":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30";
    case "Prata":
      return "bg-surface-elevated text-foreground border-border";
    case "Bronze":
      return "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/20";
    case "Apoio":
      return "bg-primary/15 text-primary border-primary/30";
    case "Permuta":
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30";
  }
}

export function statusTone(s: SponsorshipStatus) {
  switch (s) {
    case "Em negociação":
      return "bg-primary/15 text-primary";
    case "Confirmado":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]";
    case "Em execução":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]";
    case "Concluído":
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]";
    case "Cancelado":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
  }
}

export function alertTone(l: SponsorshipAlert["level"]) {
  switch (l) {
    case "expired":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)] border-[color:var(--color-destructive)]/30";
    case "urgent":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30";
    case "soon":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] border-[color:var(--color-accent)]/30";
    case "ok":
      return "bg-primary/10 text-primary border-primary/20";
  }
}
