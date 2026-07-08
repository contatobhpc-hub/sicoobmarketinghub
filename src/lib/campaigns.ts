import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

export const CAMPAIGN_TYPES = [
  "Institucional",
  "Produto",
  "Sazonal",
  "Lançamento",
  "Endomarketing",
  "Patrocínio",
  "Performance",
] as const;

export const CAMPAIGN_OBJECTIVES = [
  "Awareness",
  "Geração de leads",
  "Conversão",
  "Engajamento",
  "Relacionamento",
  "Educação",
] as const;

export const CAMPAIGN_STATUSES = [
  "Rascunho",
  "Planejamento",
  "Em andamento",
  "Pausada",
  "Concluída",
  "Cancelada",
] as const;

export const CAMPAIGN_PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];
export type CampaignObjective = (typeof CAMPAIGN_OBJECTIVES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type CampaignPriority = (typeof CAMPAIGN_PRIORITIES)[number];

export type CampaignModuleKey =
  | "projeto"
  | "kanban"
  | "calendario"
  | "checklist"
  | "conteudos"
  | "midia_offline"
  | "eventos"
  | "brindes"
  | "parceiros"
  | "contratos"
  | "indicadores";

export const CAMPAIGN_MODULES: { key: CampaignModuleKey; label: string }[] = [
  { key: "projeto", label: "Projeto" },
  { key: "kanban", label: "Kanban" },
  { key: "calendario", label: "Calendário" },
  { key: "checklist", label: "Checklist" },
  { key: "conteudos", label: "Conteúdos" },
  { key: "midia_offline", label: "Mídia Offline" },
  { key: "eventos", label: "Eventos" },
  { key: "brindes", label: "Brindes" },
  { key: "parceiros", label: "Parceiros" },
  { key: "contratos", label: "Contratos" },
  { key: "indicadores", label: "Indicadores" },
];

export type CampaignFile = { name: string; size: number };

export type Campaign = {
  id: string;
  name: string;
  type: CampaignType;
  objective: CampaignObjective;
  description: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  priority: CampaignPriority;
  owner: string;
  products: string[];
  budget: number;
  notes: string;
  files: CampaignFile[];
  modules: CampaignModuleKey[];
  createdAt: string;
};

const KEY = "mhub.campaigns.v1";

const seed: Campaign[] = [
  {
    id: "c-1",
    name: "Crédito Rural 2026",
    type: "Produto",
    objective: "Conversão",
    description: "Campanha multicanal para captação de produtores na safra 2026.",
    startDate: "2026-06-01",
    endDate: "2026-09-30",
    status: "Em andamento",
    priority: "Alta",
    owner: "Bruno Almeida",
    products: ["Crédito Rural", "Custeio Agrícola"],
    budget: 180000,
    notes: "Foco em municípios de maior potencial agro.",
    files: [],
    modules: ["projeto", "kanban", "calendario", "conteudos", "midia_offline", "indicadores"],
    createdAt: "2026-05-12T10:00:00.000Z",
  },
  {
    id: "c-2",
    name: "Conta Digital Jovem",
    type: "Lançamento",
    objective: "Awareness",
    description: "Lançamento da conta digital para o público de 14 a 24 anos.",
    startDate: "2026-07-10",
    endDate: "2026-10-10",
    status: "Planejamento",
    priority: "Crítica",
    owner: "Marina Sousa",
    products: ["Conta Jovem"],
    budget: 95000,
    notes: "",
    files: [],
    modules: ["projeto", "kanban", "conteudos", "eventos", "indicadores"],
    createdAt: "2026-06-02T14:30:00.000Z",
  },
  {
    id: "c-3",
    name: "Campanha de Filiação",
    type: "Institucional",
    objective: "Relacionamento",
    description: "Ação institucional para ampliar quadro social.",
    startDate: "2026-06-15",
    endDate: "2026-12-15",
    status: "Em andamento",
    priority: "Média",
    owner: "Pedro Lima",
    products: [],
    budget: 60000,
    notes: "",
    files: [],
    modules: ["projeto", "calendario", "conteudos", "brindes", "indicadores"],
    createdAt: "2026-06-10T09:15:00.000Z",
  },
];

function load(): Campaign[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as Campaign[];
  } catch {
    return seed;
  }
}

let state: Campaign[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<Campaign[]>("campaigns", () => state, (s) => { state = s; listeners.forEach((l) => l()); });

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

function emit() {
  persist();
  cloudPush();
  listeners.forEach((l) => l());
}

export const campaignsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  add(input: Omit<Campaign, "id" | "createdAt">): Campaign {
    const c: Campaign = {
      ...input,
      id: `c-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    state = [c, ...state];
    emit();
    return c;
  },
  update(id: string, patch: Partial<Campaign>) {
    state = state.map((c) => (c.id === id ? { ...c, ...patch } : c));
    emit();
  },
  remove(id: string) {
    state = state.filter((c) => c.id !== id);
    emit();
  },
  byId(id: string) {
    return state.find((c) => c.id === id);
  },
};

export function useCampaigns() {
  return useSyncExternalStore(
    campaignsStore.subscribe,
    campaignsStore.get,
    campaignsStore.get,
  );
}

export function useCampaign(id: string) {
  const all = useCampaigns();
  return all.find((c) => c.id === id);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function statusTone(s: CampaignStatus) {
  switch (s) {
    case "Em andamento":
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]";
    case "Planejamento":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]";
    case "Pausada":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]";
    case "Concluída":
      return "bg-primary/15 text-primary";
    case "Cancelada":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
    default:
      return "bg-surface-elevated text-muted-foreground";
  }
}

export function priorityTone(p: CampaignPriority) {
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

export function campaignProgress(c: Campaign) {
  const start = new Date(c.startDate).getTime();
  const end = new Date(c.endDate).getTime();
  const now = Date.now();
  if (!start || !end || end <= start) return 0;
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}
