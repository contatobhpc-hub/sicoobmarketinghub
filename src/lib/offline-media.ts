import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";
import { enableEntitySync } from "./entity-sync";
import { isRememberedDeletion, rememberDeletion } from "./deletions";

export const OFFLINE_MEDIA_DEFAULT_CATEGORIES = [
  "Outdoor",
  "Painel LED",
  "TV",
  "Faixa",
  "Banner",
  "Cartaz",
  "Folder",
  "Busdoor",
  "Backdrop",
  "Relógio Digital",
] as const;
export type OfflineMediaCategory = string;

// Backwards-compat alias.
export const OFFLINE_MEDIA_CATEGORIES = OFFLINE_MEDIA_DEFAULT_CATEGORIES;

const CATEGORIES_KEY = "mhub.offline-media.categories.v1";

function normalizeText(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function normalizeCategoryList(values: unknown) {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => {
      const key = normalizeText(value);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function loadCategories(): string[] {
  if (typeof window === "undefined") return [...OFFLINE_MEDIA_DEFAULT_CATEGORIES];
  try {
    const raw = window.localStorage.getItem(CATEGORIES_KEY);
    if (!raw) return [...OFFLINE_MEDIA_DEFAULT_CATEGORIES];
    const arr = normalizeCategoryList(JSON.parse(raw));
    return arr.length ? arr : [...OFFLINE_MEDIA_DEFAULT_CATEGORIES];
  } catch {
    return [...OFFLINE_MEDIA_DEFAULT_CATEGORIES];
  }
}
let categoriesState: string[] = loadCategories();
const categoriesListeners = new Set<() => void>();
function saveCategories() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categoriesState));
  } catch {
    /* ignore */
  }
}
const categoryCloudPush = enableCloudSync<string[]>("offline-media-categories", () => categoriesState, (incoming) => {
  const next = normalizeCategoryList(incoming);
  if (!next.length && categoriesState.length) {
    categoryCloudPush();
    return;
  }
  categoriesState = next.length ? next : [...OFFLINE_MEDIA_DEFAULT_CATEGORIES];
  saveCategories();
  categoriesListeners.forEach((l) => l());
});
function emitCategories() {
  saveCategories();
  categoryCloudPush();
  categoriesListeners.forEach((l) => l());
}
export const offlineMediaCategoriesStore = {
  get: () => categoriesState,
  subscribe(l: () => void) {
    categoriesListeners.add(l);
    return () => categoriesListeners.delete(l);
  },
  add(v: string) {
    const value = v.trim();
    if (!value) return false;
    if (categoriesState.some((c) => c.toLowerCase() === value.toLowerCase())) return false;
    categoriesState = [...categoriesState, value];
    emitCategories();
    return true;
  },
  remove(v: string) {
    categoriesState = categoriesState.filter((c) => c !== v);
    emitCategories();
  },
};
export function useOfflineMediaCategories() {
  return useSyncExternalStore(
    offlineMediaCategoriesStore.subscribe,
    offlineMediaCategoriesStore.get,
    offlineMediaCategoriesStore.get,
  );
}

export const OFFLINE_MEDIA_STATUSES = [
  "Planejado",
  "Arte em produção",
  "Aguardando instalação",
  "Instalado",
  "Retirado",
  "Cancelado",
] as const;
export type OfflineMediaStatus = (typeof OFFLINE_MEDIA_STATUSES)[number];

export type OfflineMediaPhoto = { id: string; name: string; size: number };
export type OfflineMediaTimelineEntry = {
  id: string;
  type: "created" | "status" | "file" | "note" | "alert";
  message: string;
  author?: string;
  createdAt: string;
};

export type OfflineMedia = {
  id: string;
  title: string;
  category: OfflineMediaCategory;
  categories?: OfflineMediaCategory[];
  city: string;
  location: string;
  supplier: string;
  campaign?: string;
  campaignId?: string;
  project?: string;
  projectId?: string;
  installDate: string;
  removalDate: string;
  status: OfflineMediaStatus;
  owner: string;
  value: number;
  costCenter: string;
  artworkFile?: { id: string; name: string; size: number } | null;
  photos: OfflineMediaPhoto[];
  notes: string;
  timeline: OfflineMediaTimelineEntry[];
  createdAt: string;
  // Pseudo-coordinates for the map view (fictional, scaled 0-100)
  coords?: { x: number; y: number };
};

const KEY = "mhub.offline-media.v1";
const BACKUP_KEY = "mhub.offline-media.backups.v1";
const DELETED_KEY = "mhub.offline-media.deleted.v1";
const INITIALIZED_KEY = "mhub.offline-media.initialized.v1";
const uid = (p = "om") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const CITY_COORDS: Record<string, { x: number; y: number }> = {
  "Patos de Minas/MG": { x: 42, y: 38 },
  "Patrocínio/MG": { x: 55, y: 32 },
  "Uberlândia/MG": { x: 28, y: 58 },
  "Araxá/MG": { x: 48, y: 52 },
  "Lagoa Formosa/MG": { x: 38, y: 44 },
  "Carmo do Paranaíba/MG": { x: 50, y: 42 },
};

export function coordsForCity(city: string): { x: number; y: number } {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // hash-based fallback
  let h = 0;
  for (let i = 0; i < city.length; i++) h = (h * 31 + city.charCodeAt(i)) >>> 0;
  return { x: 15 + (h % 70), y: 15 + ((h >> 8) % 70) };
}

const seed: OfflineMedia[] = [
  {
    id: uid(),
    title: "Outdoor BR-365 — entrada de Patos",
    category: "Outdoor",
    city: "Patos de Minas/MG",
    location: "BR-365 km 412 (sentido capital)",
    supplier: "Mídia Brasil Outdoor",
    campaign: "Campanha Safra 2026",
    installDate: inDays(-5),
    removalDate: inDays(9),
    status: "Instalado",
    owner: "Bruno",
    value: 3800,
    costCenter: "CC-MKT-001",
    artworkFile: { id: uid("f"), name: "Outdoor-Safra-3x9.pdf", size: 2400000 },
    photos: [{ id: uid("ph"), name: "instalado-frente.jpg", size: 1800000 }],
    notes: "Iluminação noturna inclusa.",
    timeline: [{ id: uid("tl"), type: "created", message: "Mídia cadastrada.", author: "Bruno", createdAt: now() }],
    createdAt: now(),
    coords: CITY_COORDS["Patos de Minas/MG"],
  },
  {
    id: uid(),
    title: "Painel LED Praça do Coreto",
    category: "Painel LED",
    city: "Patrocínio/MG",
    location: "Praça Olímpio Garcia Brandão",
    supplier: "LED Cerrado",
    campaign: "Marca Institucional",
    installDate: inDays(-12),
    removalDate: inDays(2),
    status: "Instalado",
    owner: "Camila",
    value: 5200,
    costCenter: "CC-MKT-002",
    artworkFile: { id: uid("f"), name: "Institucional-LED-15s.mp4", size: 18000000 },
    photos: [],
    notes: "Veiculação 24h, loop de 15s.",
    timeline: [{ id: uid("tl"), type: "created", message: "Mídia cadastrada.", author: "Camila", createdAt: now() }],
    createdAt: now(),
    coords: CITY_COORDS["Patrocínio/MG"],
  },
  {
    id: uid(),
    title: "Busdoor linha 204",
    category: "Busdoor",
    city: "Uberlândia/MG",
    location: "Linha 204 — Terminal Central",
    supplier: "Transmídia Uberlândia",
    campaign: "Crédito Rural 2025",
    installDate: inDays(3),
    removalDate: inDays(33),
    status: "Aguardando instalação",
    owner: "Diego",
    value: 2100,
    costCenter: "CC-MKT-001",
    artworkFile: null,
    photos: [],
    notes: "",
    timeline: [{ id: uid("tl"), type: "created", message: "Mídia cadastrada.", author: "Diego", createdAt: now() }],
    createdAt: now(),
    coords: CITY_COORDS["Uberlândia/MG"],
  },
  {
    id: uid(),
    title: "Faixas — Festival Sertanejo",
    category: "Faixa",
    city: "Patrocínio/MG",
    location: "Avenida Faria Pereira (10 pontos)",
    supplier: "Gráfica Sertão",
    campaign: "Festival Sertanejo 2026",
    installDate: inDays(-2),
    removalDate: inDays(4),
    status: "Instalado",
    owner: "Larissa",
    value: 1450,
    costCenter: "CC-MKT-003",
    artworkFile: { id: uid("f"), name: "Faixa-Festival.pdf", size: 540000 },
    photos: [],
    notes: "Retirada urgente após o evento.",
    timeline: [{ id: uid("tl"), type: "created", message: "Mídia cadastrada.", author: "Larissa", createdAt: now() }],
    createdAt: now(),
    coords: CITY_COORDS["Patrocínio/MG"],
  },
  {
    id: uid(),
    title: "Backdrop coletiva — ExpoAgro",
    category: "Backdrop",
    city: "Uberlândia/MG",
    location: "Centro de Convenções",
    supplier: "Print Express",
    installDate: inDays(20),
    removalDate: inDays(25),
    status: "Arte em produção",
    owner: "Bruno",
    value: 980,
    costCenter: "CC-MKT-002",
    artworkFile: null,
    photos: [],
    notes: "",
    timeline: [{ id: uid("tl"), type: "created", message: "Mídia cadastrada.", author: "Bruno", createdAt: now() }],
    createdAt: now(),
    coords: CITY_COORDS["Uberlândia/MG"],
  },
];

type OfflineMediaBackup = { savedAt: string; reason: string; items: OfflineMedia[] };

const SEED_TITLES = new Set(seed.map((m) => normalizeText(m.title)));

function mediaDeletionKey(m: Pick<OfflineMedia, "title" | "city" | "location">) {
  return `${m.title}|${m.city}|${m.location}`;
}

function hasUserMedia(items: OfflineMedia[]) {
  return items.some((item) => !SEED_TITLES.has(normalizeText(item.title)));
}

function pruneDeleted(items: OfflineMedia[]) {
  return items.filter(
    (item) =>
      !isRememberedDeletion(DELETED_KEY, {
        id: item.id,
        name: item.title,
        key: mediaDeletionKey(item),
      }),
  );
}

function sanitizeMediaArray(value: unknown): OfflineMedia[] | null {
  if (!Array.isArray(value)) return null;
  return pruneDeleted(
    value.filter(
      (item): item is OfflineMedia =>
        !!item &&
        typeof item === "object" &&
        typeof (item as OfflineMedia).id === "string" &&
        typeof (item as OfflineMedia).title === "string",
    ),
  );
}

function readBackups(): OfflineMediaBackup[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(BACKUP_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is OfflineMediaBackup =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as OfflineMediaBackup).savedAt === "string" &&
        Array.isArray((entry as OfflineMediaBackup).items),
    );
  } catch {
    return [];
  }
}

function mediaSignature(items: OfflineMedia[]) {
  return items
    .map((item) => `${item.id}:${item.title}:${item.createdAt ?? ""}`)
    .sort()
    .join("|");
}

function writeBackup(items: OfflineMedia[], reason: string) {
  if (typeof window === "undefined") return;
  const clean = pruneDeleted(items);
  if (!clean.length || !hasUserMedia(clean)) return;
  try {
    const backups = readBackups();
    if (backups[0] && mediaSignature(backups[0].items) === mediaSignature(clean)) return;
    const next: OfflineMediaBackup[] = [{ savedAt: now(), reason, items: clean }, ...backups].slice(0, 12);
    window.localStorage.setItem(BACKUP_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function latestUsableBackup() {
  for (const backup of readBackups()) {
    const clean = sanitizeMediaArray(backup.items);
    if (clean?.length && hasUserMedia(clean)) return clean;
  }
  return null;
}

function load(): OfflineMedia[] {
  if (typeof window === "undefined") return [];
  const initialized = window.localStorage.getItem(INITIALIZED_KEY) === "true";
  const backup = latestUsableBackup();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return backup ?? [];
    const parsed = sanitizeMediaArray(JSON.parse(raw));
    if (!parsed) return backup ?? [];
    if (parsed.length === 0 && initialized) return [];
    if (backup && backup.length > parsed.length && hasUserMedia(backup) && !hasUserMedia(parsed)) return backup;
    return parsed.length ? parsed : backup ?? [];
  } catch {
    return backup ?? [];
  }
}
function save(s: OfflineMedia[], reason = "local-save") {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INITIALIZED_KEY, "true");
    window.localStorage.setItem(KEY, JSON.stringify(s));
    writeBackup(s, reason);
  } catch {
    /* ignore */
  }
}

let state: OfflineMedia[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableEntitySync<OfflineMedia>(
  { module: "offline-media" },
  {
    getState: () => state,
    replaceState: (incoming) => {
      const next = sanitizeMediaArray(incoming);
      if (!next) return;
      if (state.length) writeBackup(state, "before-cloud-sync");
      if (hasUserMedia(state) && (!hasUserMedia(next) || next.length < state.length)) {
        cloudPush();
        return;
      }
      if (!next.length && state.length) {
        cloudPush();
        return;
      }
      state = next;
      save(state, "cloud-sync");
      listeners.forEach((l) => l());
    },
  },
);
function emit() {
  save(state);
  cloudPush();
  listeners.forEach((l) => l());
}
function pushTimeline(m: OfflineMedia, t: Omit<OfflineMediaTimelineEntry, "id" | "createdAt">): OfflineMedia {
  return { ...m, timeline: [{ id: uid("tl"), createdAt: now(), ...t }, ...m.timeline] };
}

export const offlineMediaStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  byId: (id: string) => state.find((m) => m.id === id),
  add(
    input: Partial<OfflineMedia> &
      Pick<OfflineMedia, "title" | "category" | "city" | "location" | "supplier" | "installDate" | "removalDate" | "owner" | "value">,
  ): OfflineMedia {
    const m: OfflineMedia = {
      id: uid(),
      status: "Planejado",
      costCenter: "CC-MKT-001",
      artworkFile: null,
      photos: [],
      notes: "",
      timeline: [],
      createdAt: now(),
      coords: coordsForCity(input.city),
      ...input,
    };
    const withEntry = pushTimeline(m, { type: "created", message: "Mídia cadastrada.", author: m.owner });
    state = [withEntry, ...state];
    emit();
    return withEntry;
  },
  update(id: string, patch: Partial<OfflineMedia>, msg?: string) {
    state = state.map((m) => {
      if (m.id !== id) return m;
      let next: OfflineMedia = { ...m, ...patch };
      if (patch.city) next.coords = coordsForCity(patch.city);
      if (msg) next = pushTimeline(next, { type: "note", message: msg, author: next.owner });
      return next;
    });
    emit();
  },
  setStatus(id: string, status: OfflineMediaStatus) {
    state = state.map((m) =>
      m.id === id
        ? pushTimeline({ ...m, status }, { type: "status", message: `Status alterado para "${status}".`, author: m.owner })
        : m,
    );
    emit();
  },
  remove(id: string) {
    const removed = state.find((m) => m.id === id);
    if (removed) rememberDeletion(DELETED_KEY, { id: removed.id, name: removed.title, key: mediaDeletionKey(removed) });
    state = state.filter((m) => m.id !== id);
    emit();
  },
};

export function useOfflineMedia() {
  return useSyncExternalStore(offlineMediaStore.subscribe, offlineMediaStore.get, offlineMediaStore.get);
}

export function daysUntil(dateISO: string): number {
  const d = new Date(dateISO + (dateISO.length === 10 ? "T00:00:00" : ""));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
}

export type RemovalAlertLevel = "expired" | "urgent" | "soon" | "ok";
export function removalAlert(m: OfflineMedia): RemovalAlertLevel {
  if (m.status === "Retirado" || m.status === "Cancelado") return "ok";
  const d = daysUntil(m.removalDate);
  if (d < 0) return "expired";
  if (d <= 2) return "urgent";
  if (d <= 7) return "soon";
  return "ok";
}

export const STATUS_TONE: Record<OfflineMediaStatus, string> = {
  Planejado: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  "Arte em produção": "bg-amber-500/15 text-amber-300 border-amber-500/30",
  "Aguardando instalação": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Instalado: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Retirado: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30",
  Cancelado: "bg-red-500/15 text-red-300 border-red-500/30",
};

export const CATEGORY_TONE: Record<OfflineMediaCategory, string> = {
  Outdoor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  "Painel LED": "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  TV: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Faixa: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Banner: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Cartaz: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  Folder: "bg-lime-500/15 text-lime-300 border-lime-500/30",
  Busdoor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Backdrop: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  "Relógio Digital": "bg-sky-500/15 text-sky-300 border-sky-500/30",
};
