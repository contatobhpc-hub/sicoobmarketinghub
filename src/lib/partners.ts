import { useEffect, useSyncExternalStore } from "react";

export const PARTNER_STATUSES = [
  "Prospect",
  "Negociação",
  "Ativo",
  "Renovação",
  "Inativo",
] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const PARTNER_CATEGORIES = [
  "Agência",
  "Fornecedor",
  "Patrocinador",
  "Mídia",
  "Rádio",
  "Gráfica",
  "Brindes",
  "Eventos",
  "Tecnologia",
  "Consultoria",
] as const;
export type PartnerCategory = string;

/* ---------- Partner categories store (dynamic, per-module) ---------- */
const PC_KEY = "sicoob:partner-categories:v1";
let pcState: string[] = [...PARTNER_CATEGORIES];
const pcListeners = new Set<() => void>();
if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(PC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string") && parsed.length) {
        pcState = parsed;
      }
    }
  } catch {
    /* ignore */
  }
}
function pcEmit() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PC_KEY, JSON.stringify(pcState));
    } catch {
      /* ignore */
    }
  }
  for (const l of pcListeners) l();
}
export const partnerCategoriesStore = {
  get: () => pcState,
  subscribe(l: () => void) {
    pcListeners.add(l);
    return () => pcListeners.delete(l);
  },
  add(name: string) {
    const v = name.trim();
    if (!v) return false;
    if (pcState.some((c) => c.toLowerCase() === v.toLowerCase())) return false;
    pcState = [...pcState, v];
    pcEmit();
    return true;
  },
  remove(name: string) {
    if (!pcState.includes(name)) return;
    pcState = pcState.filter((c) => c !== name);
    pcEmit();
  },
};
export function usePartnerCategories() {
  return useSyncExternalStore(
    partnerCategoriesStore.subscribe,
    () => pcState,
    () => pcState,
  );
}

export type PartnerFile = { id: string; name: string; size: number; kind: "doc" | "photo" };

export type PartnerChecklistItem = { id: string; text: string; done: boolean };

export type PartnerTimelineEntry = {
  id: string;
  type: "created" | "status" | "field" | "note" | "checklist" | "file" | "reminder" | "contract";
  message: string;
  author?: string;
  createdAt: string;
};

export type Partner = {
  id: string;
  company: string;
  category: PartnerCategory;
  city: string;
  contact: string;
  phone: string;
  whatsapp: string;
  email: string;
  owner: string;
  contractId?: string;
  contractEnd?: string; // ISO date - usado p/ lembrete de renovação
  counterparts: string;
  logoUrl?: string;
  files: PartnerFile[];
  events: string[];
  campaigns: string[];
  investmentMonth: number;
  expectedReturn: number;
  deliveredReturn: number;
  status: PartnerStatus;
  checklist: PartnerChecklistItem[];
  timeline: PartnerTimelineEntry[];
  notes: string;
  createdAt: string;
};

const KEY = "mhub.partners.v1";

const uid = (p = "pt") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

const seed: Partner[] = [
  {
    id: uid(),
    company: "Estúdio Norte",
    category: "Agência",
    city: "Patos de Minas/MG",
    contact: "Larissa Aguiar",
    phone: "(34) 3821-0000",
    whatsapp: "(34) 99999-1010",
    email: "contato@estudionorte.com",
    owner: "Bruno",
    contractEnd: new Date(Date.now() + 18 * 86400000).toISOString().slice(0, 10),
    counterparts: "Produção de campanhas trimestrais + 12 vídeos institucionais.",
    files: [
      { id: uid("f"), name: "Contrato-2026.pdf", size: 384000, kind: "doc" },
      { id: uid("f"), name: "Apresentação.pdf", size: 1240000, kind: "doc" },
    ],
    events: ["Lançamento Crédito Rural"],
    campaigns: ["Campanha Safra 2026"],
    investmentMonth: 15000,
    expectedReturn: 350000,
    deliveredReturn: 142000,
    status: "Ativo",
    checklist: [
      { id: uid("c"), text: "Validar contrapartidas do trimestre", done: true },
      { id: uid("c"), text: "Renovar contrato anual", done: false },
    ],
    timeline: [
      { id: uid("t"), type: "created", message: "Parceiro cadastrado.", author: "Sistema", createdAt: now() },
    ],
    notes: "Atendimento excelente. Resposta em até 2h úteis.",
    createdAt: now(),
  },
  {
    id: uid(),
    company: "Rádio Sertaneja FM",
    category: "Mídia",
    city: "Patrocínio/MG",
    contact: "Roberto Mendes",
    phone: "(34) 3839-2200",
    whatsapp: "(34) 98888-2020",
    email: "comercial@sertanejafm.com.br",
    owner: "Camila",
    contractEnd: new Date(Date.now() + 65 * 86400000).toISOString().slice(0, 10),
    counterparts: "20 inserções diárias + 2 programas patrocinados/semana.",
    files: [{ id: uid("f"), name: "Mídia-Kit.pdf", size: 540000, kind: "doc" }],
    events: [],
    campaigns: ["Campanha Safra 2026", "Educação Financeira"],
    investmentMonth: 8000,
    expectedReturn: 220000,
    deliveredReturn: 198000,
    status: "Renovação",
    checklist: [{ id: uid("c"), text: "Reunião de renovação", done: false }],
    timeline: [
      { id: uid("t"), type: "created", message: "Parceiro cadastrado.", author: "Sistema", createdAt: now() },
    ],
    notes: "",
    createdAt: now(),
  },
  {
    id: uid(),
    company: "Gráfica Triângulo",
    category: "Gráfica",
    city: "Uberlândia/MG",
    contact: "Patrícia Lemos",
    phone: "(34) 3210-7700",
    whatsapp: "(34) 97777-3030",
    email: "atendimento@graficatriangulo.com",
    owner: "Bruno",
    contractEnd: new Date(Date.now() + 240 * 86400000).toISOString().slice(0, 10),
    counterparts: "Impressão de folhetos, banners e materiais institucionais.",
    files: [],
    events: [],
    campaigns: ["Assembleia 2026"],
    investmentMonth: 3500,
    expectedReturn: 60000,
    deliveredReturn: 22000,
    status: "Ativo",
    checklist: [],
    timeline: [
      { id: uid("t"), type: "created", message: "Parceiro cadastrado.", author: "Sistema", createdAt: now() },
    ],
    notes: "",
    createdAt: now(),
  },
];

function isPartnerStatus(value: unknown): value is PartnerStatus {
  return typeof value === "string" && PARTNER_STATUSES.includes(value as PartnerStatus);
}

function isPartnerCategory(value: unknown): value is PartnerCategory {
  return typeof value === "string" && PARTNER_CATEGORIES.includes(value as PartnerCategory);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizePartner(value: unknown, index: number): Partner | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const fallback = seed[index % seed.length];
  const company = safeString(raw.company, fallback.company).trim();
  if (!company) return null;

  const legacyAnnualInvestment = safeNumber(raw.investmentAnnual);
  const investmentMonth =
    raw.investmentMonth !== undefined
      ? safeNumber(raw.investmentMonth)
      : legacyAnnualInvestment > 0
        ? Math.round(legacyAnnualInvestment / 12)
        : fallback.investmentMonth;

  return {
    id: safeString(raw.id, uid()),
    company,
    category: isPartnerCategory(raw.category) ? raw.category : fallback.category,
    city: safeString(raw.city, fallback.city),
    contact: safeString(raw.contact, fallback.contact),
    phone: safeString(raw.phone),
    whatsapp: safeString(raw.whatsapp),
    email: safeString(raw.email, fallback.email),
    owner: safeString(raw.owner, "Sistema"),
    contractId: safeString(raw.contractId) || undefined,
    contractEnd: safeString(raw.contractEnd) || undefined,
    counterparts: safeString(raw.counterparts),
    logoUrl: safeString(raw.logoUrl) || undefined,
    files: safeArray<PartnerFile>(raw.files).filter((file) => file && typeof file === "object"),
    events: safeArray<string>(raw.events).filter((event) => typeof event === "string"),
    campaigns: safeArray<string>(raw.campaigns).filter((campaign) => typeof campaign === "string"),
    investmentMonth,
    expectedReturn: safeNumber(raw.expectedReturn),
    deliveredReturn: safeNumber(raw.deliveredReturn),
    status: isPartnerStatus(raw.status) ? raw.status : "Prospect",
    checklist: safeArray<PartnerChecklistItem>(raw.checklist).filter((item) => item && typeof item === "object"),
    timeline: safeArray<PartnerTimelineEntry>(raw.timeline).filter((entry) => entry && typeof entry === "object"),
    notes: safeString(raw.notes),
    createdAt: safeString(raw.createdAt, now()),
  };
}

function normalizePartners(value: unknown): Partner[] {
  if (!Array.isArray(value)) return seed;
  const normalized = value
    .map((partner, index) => normalizePartner(partner, index))
    .filter((partner): partner is Partner => partner !== null);
  return normalized.length > 0 ? normalized : seed;
}

function load(): Partner[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return normalizePartners(JSON.parse(raw));
  } catch {
    return seed;
  }
}
function save(s: Partner[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore quota
  }
}

let state: Partner[] = seed;
let hydrated = false;
const listeners = new Set<() => void>();
function emit() {
  save(state);
  listeners.forEach((l) => l());
}

function hydrateFromStorage() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  state = load();
  listeners.forEach((l) => l());
}

function pushTimeline(p: Partner, e: Omit<PartnerTimelineEntry, "id" | "createdAt">): Partner {
  return { ...p, timeline: [{ id: uid("tl"), createdAt: now(), ...e }, ...p.timeline] };
}

export const partnersStore = {
  get: () => state,
  getServerSnapshot: () => seed,
  hydrate: hydrateFromStorage,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  byId: (id: string) => state.find((p) => p.id === id),
  add(input: Omit<Partner, "id" | "createdAt" | "timeline" | "checklist" | "files" | "events" | "campaigns"> & Partial<Pick<Partner, "checklist" | "files" | "events" | "campaigns">>): Partner {
    const p: Partner = {
      id: uid(),
      createdAt: now(),
      checklist: input.checklist ?? [],
      files: input.files ?? [],
      events: input.events ?? [],
      campaigns: input.campaigns ?? [],
      timeline: [
        { id: uid("tl"), type: "created", message: "Parceiro cadastrado.", author: input.owner || "Sistema", createdAt: now() },
      ],
      ...input,
    } as Partner;
    state = [p, ...state];
    emit();
    return p;
  },
  update(id: string, patch: Partial<Partner>, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      let next: Partner = { ...p, ...patch };
      if (patch.status && patch.status !== p.status) {
        next = pushTimeline(next, { type: "status", author, message: `Status alterado de ${p.status} para ${patch.status}.` });
      }
      if (patch.contractEnd && patch.contractEnd !== p.contractEnd) {
        next = pushTimeline(next, { type: "contract", author, message: `Vencimento do contrato atualizado para ${patch.contractEnd}.` });
      }
      return next;
    });
    emit();
  },
  remove(id: string) {
    state = state.filter((p) => p.id !== id);
    emit();
  },
  addNote(id: string, text: string, author = "Você") {
    state = state.map((p) => (p.id !== id ? p : pushTimeline(p, { type: "note", author, message: text })));
    emit();
  },
  addFile(id: string, file: Omit<PartnerFile, "id">, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const f = { id: uid("f"), ...file };
      const next = { ...p, files: [...p.files, f] };
      return pushTimeline(next, { type: "file", author, message: `Anexou ${file.kind === "photo" ? "foto" : "documento"} "${file.name}".` });
    });
    emit();
  },
  removeFile(id: string, fileId: string) {
    state = state.map((p) => (p.id !== id ? p : { ...p, files: p.files.filter((f) => f.id !== fileId) }));
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
      return pushTimeline(next, { type: "checklist", author, message: `${!item.done ? "Concluiu" : "Reabriu"} "${item.text}".` });
    });
    emit();
  },
  addChecklistItem(id: string, text: string, author = "Você") {
    state = state.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, checklist: [...p.checklist, { id: uid("c"), text, done: false }] };
      return pushTimeline(next, { type: "checklist", author, message: `Adicionou ao checklist: "${text}".` });
    });
    emit();
  },
};

export function usePartners() {
  useEffect(() => {
    partnersStore.hydrate();
  }, []);
  return useSyncExternalStore(partnersStore.subscribe, partnersStore.get, partnersStore.getServerSnapshot);
}
export function usePartner(id: string) {
  return usePartners().find((p) => p.id === id);
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
export function formatDate(iso?: string) {
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

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).getTime();
  return Math.ceil((d - Date.now()) / 86400000);
}

export function renewalAlert(p: Partner): { level: "ok" | "soon" | "urgent" | "expired"; days: number | null; label: string } {
  const days = daysUntil(p.contractEnd);
  if (days === null) return { level: "ok", days, label: "Sem contrato vinculado" };
  if (days < 0) return { level: "expired", days, label: `Vencido há ${Math.abs(days)} dias` };
  if (days <= 30) return { level: "urgent", days, label: `Renovar em ${days} dias` };
  if (days <= 90) return { level: "soon", days, label: `Renovação em ${days} dias` };
  return { level: "ok", days, label: `Vence em ${days} dias` };
}

export function statusTone(s: PartnerStatus) {
  switch (s) {
    case "Ativo":
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]";
    case "Renovação":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]";
    case "Negociação":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]";
    case "Prospect":
      return "bg-primary/15 text-primary";
    case "Inativo":
      return "bg-surface-elevated text-muted-foreground";
  }
}

export function categoryTone(c: PartnerCategory) {
  const map: Record<PartnerCategory, string> = {
    "Agência": "bg-primary/15 text-primary",
    Fornecedor: "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]",
    Patrocinador: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
    "Mídia": "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
    "Rádio": "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]",
    "Gráfica": "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]",
    Brindes: "bg-primary/15 text-primary",
    Eventos: "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]",
    Tecnologia: "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
    Consultoria: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
  };
  return map[c];
}

export function partnerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
