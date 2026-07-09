// Notifications store with localStorage persistence.

export type NotificationCategory =
  | "prazo"
  | "aprovacao"
  | "campanha"
  | "evento"
  | "contrato"
  | "brinde"
  | "parceiro"
  | "sistema";

export type NotificationPriority = "alta" | "media" | "baixa";

export type Notification = {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  createdAt: string; // ISO
  read: boolean;
  starred: boolean;
  archived: boolean;
  priority: NotificationPriority;
  link?: string;
  actor?: string;
};

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  prazo: "Prazo",
  aprovacao: "Aprovação",
  campanha: "Campanha",
  evento: "Evento",
  contrato: "Contrato",
  brinde: "Brinde",
  parceiro: "Parceiro",
  sistema: "Sistema",
};

export const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  prazo: "oklch(0.74 0.18 30)",
  aprovacao: "oklch(0.78 0.16 145)",
  campanha: "oklch(0.68 0.18 264)",
  evento: "oklch(0.70 0.18 320)",
  contrato: "oklch(0.72 0.16 200)",
  brinde: "oklch(0.82 0.16 80)",
  parceiro: "oklch(0.72 0.14 180)",
  sistema: "oklch(0.6 0.02 264)",
};

const STORAGE_KEY = "mh.notifications.v1";
const PREFS_KEY = "mh.notifications.prefs.v1";

export type NotificationPrefs = {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
  perCategory: Record<NotificationCategory, boolean>;
};

const DEFAULT_PREFS: NotificationPrefs = {
  push: false,
  email: false,
  whatsapp: false,
  perCategory: {
    prazo: true,
    aprovacao: true,
    campanha: true,
    evento: true,
    contrato: true,
    brinde: true,
    parceiro: true,
    sistema: true,
  },
};

const listeners = new Set<() => void>();
let state: Notification[] = load();
let prefs: NotificationPrefs = loadPrefs();
import { enableCloudSync as _ecs } from "./cloud-sync";
const cloudPushN = _ecs<Notification[]>("notifications", () => state, (s) => { state = s; listeners.forEach((l) => l()); });
const cloudPushP = _ecs<NotificationPrefs>("notifications-prefs", () => prefs, (s) => { prefs = s; listeners.forEach((l) => l()); });

function seed(): Notification[] {
  const now = Date.now();
  const m = (min: number) => new Date(now - min * 60_000).toISOString();
  return [
    { id: "n1", category: "contrato", title: "Contrato vence em 15 dias", message: "Contrato com Agência Norte expira em 15 dias. Iniciar renovação.", createdAt: m(8), read: false, starred: false, archived: false, priority: "alta", link: "/contratos", actor: "Sistema" },
    { id: "n2", category: "evento", title: "Evento amanhã", message: "Assembleia Regional Sul amanhã às 19h — checklist 80% concluído.", createdAt: m(34), read: false, starred: true, archived: false, priority: "alta", link: "/eventos" },
    { id: "n3", category: "campanha", title: "Campanha atrasada", message: "Junho Solidário está 3 dias atrás do cronograma.", createdAt: m(60), read: false, starred: false, archived: false, priority: "alta", link: "/campanhas" },
    { id: "n4", category: "aprovacao", title: "Arte aprovada", message: "Diretoria aprovou a arte do post para o Dia do Cooperativismo.", createdAt: m(120), read: true, starred: false, archived: false, priority: "media", link: "/conteudos" },
    { id: "n5", category: "brinde", title: "Brinde abaixo do estoque", message: "Caneca personalizada com 28 unidades — abaixo do mínimo (50).", createdAt: m(180), read: false, starred: false, archived: false, priority: "media", link: "/brindes" },
    { id: "n6", category: "prazo", title: "Tarefa vence hoje", message: "Briefing da campanha Educação Financeira vence hoje.", createdAt: m(240), read: false, starred: false, archived: false, priority: "alta", link: "/kanban" },
    { id: "n7", category: "parceiro", title: "Novo parceiro cadastrado", message: "Agência Sul foi adicionada como parceira estratégica.", createdAt: m(420), read: true, starred: false, archived: false, priority: "baixa", link: "/parceiros" },
    { id: "n8", category: "sistema", title: "Backup concluído", message: "Backup diário das 02h concluído com sucesso.", createdAt: m(720), read: true, starred: false, archived: true, priority: "baixa" },
  ];
}

function load(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  cloudPushN();
}
function persistPrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {}
  cloudPushP();
}
function emit() { listeners.forEach((l) => l()); }

export function subscribeNotifications(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function getNotifications() { return state; }
export function getPrefs() { return prefs; }

export function setPrefs(next: Partial<NotificationPrefs>) {
  prefs = { ...prefs, ...next };
  persistPrefs();
  emit();
}

export function setCategoryPref(cat: NotificationCategory, enabled: boolean) {
  prefs = { ...prefs, perCategory: { ...prefs.perCategory, [cat]: enabled } };
  persistPrefs();
  emit();
}

export function markRead(id: string, read = true) {
  state = state.map((n) => (n.id === id ? { ...n, read } : n));
  persist(); emit();
}

export function markAllRead() {
  state = state.map((n) => ({ ...n, read: true }));
  persist(); emit();
}

export function toggleStar(id: string) {
  state = state.map((n) => (n.id === id ? { ...n, starred: !n.starred } : n));
  persist(); emit();
}

export function toggleArchive(id: string) {
  state = state.map((n) => (n.id === id ? { ...n, archived: !n.archived } : n));
  persist(); emit();
}

export function removeNotification(id: string) {
  state = state.filter((n) => n.id !== id);
  persist(); emit();
}

export function addNotification(n: Omit<Notification, "id" | "createdAt" | "read" | "starred" | "archived"> & Partial<Pick<Notification, "read" | "starred" | "archived">>) {
  const created: Notification = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    read: false,
    starred: false,
    archived: false,
    ...n,
  };
  state = [created, ...state];
  persist(); emit();
  maybePush(created);
  return created;
}

// Browser push (foreground notifications). WhatsApp/Email are placeholders.
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  const res = await Notification.requestPermission();
  return res;
}

function maybePush(n: Notification) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (!prefs.push) return;
  if (!prefs.perCategory[n.category]) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(n.title, { body: n.message, tag: n.id });
  } catch {}
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min atrás`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.round(h / 24);
  return `${d} d atrás`;
}
