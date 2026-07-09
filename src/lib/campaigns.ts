import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";
import { calendarStore, type CalendarEvent } from "./calendar";

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

// Calendário de Ações Comerciais CNV 2026 (fonte da verdade).
// Semanas: 1ª = dias 1-7, 2ª = 8-14, 3ª = 15-21, 4ª = 22-fim do mês.
type SeedCampaign = Omit<Campaign, "createdAt"> & { createdAt?: string };

const CNV_CALENDAR_2026: SeedCampaign[] = [
  // ===== 1º SEMESTRE =====
  { id: "cnv-consignado-jan", name: "Consignado — Janeiro/Fevereiro", type: "Produto", objective: "Conversão", description: "Campanha Consignado (3ª sem jan → 1ª sem fev).", startDate: "2026-01-15", endDate: "2026-02-07", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Consignado"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos", "midia_offline"] },
  { id: "cnv-seguros-gerais-copa", name: "Seguros Gerais — Copa da Proteção", type: "Produto", objective: "Awareness", description: "Copa da Proteção (2ª-4ª sem fev).", startDate: "2026-02-08", endDate: "2026-02-28", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Seguros Gerais"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seg-vida-mulher", name: "Seg. Vida — Dia da Mulher", type: "Sazonal", objective: "Conversão", description: "Dia da Mulher (1ª-2ª sem mar).", startDate: "2026-03-01", endDate: "2026-03-14", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro de Vida"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-consorcio-mar", name: "Consórcio — Março", type: "Produto", objective: "Conversão", description: "Consórcio (3ª-4ª sem mar).", startDate: "2026-03-15", endDate: "2026-03-31", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Consórcio"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-cartoes-experience-pj", name: "Cartões — Experience Mastercard PJ", type: "Produto", objective: "Conversão", description: "Experience Mastercard PJ (3ª sem mar → 1ª sem abr).", startDate: "2026-03-15", endDate: "2026-04-07", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Cartões PJ"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-credito-pj-apoio-1s", name: "Crédito PJ — Mov. Apoio Empresário (1º sem)", type: "Produto", objective: "Conversão", description: "Apoio ao Empresário (4ª sem mar → 1ª sem abr).", startDate: "2026-03-22", endDate: "2026-04-07", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Crédito PJ"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seguro-rural-maquinas", name: "Seguro Rural — Máquinas/Equipamentos/Benfeitorias e Animais", type: "Produto", objective: "Conversão", description: "Contínua (fev-jun).", startDate: "2026-02-01", endDate: "2026-06-30", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro Rural"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos", "midia_offline"] },
  { id: "cnv-seg-gerais-abr", name: "Seg. Gerais — Abril", type: "Produto", objective: "Conversão", description: "Seguros Gerais (2ª sem abr).", startDate: "2026-04-08", endDate: "2026-04-14", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Seguros Gerais"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-previdencia-1s", name: "Previdência (1º sem)", type: "Produto", objective: "Conversão", description: "Previdência (2ª sem abr → 1ª sem mai).", startDate: "2026-04-08", endDate: "2026-05-07", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Previdência"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-sipag-credenciamento", name: "Sipag — Credenciamento", type: "Produto", objective: "Conversão", description: "Sipag Credenciamento (3ª sem abr → 4ª sem mai).", startDate: "2026-04-15", endDate: "2026-05-31", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Sipag"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos", "midia_offline"] },
  { id: "cnv-seg-vida-maes", name: "Seg. Vida — Dia das Mães", type: "Sazonal", objective: "Conversão", description: "Dia das Mães (1ª-2ª sem mai).", startDate: "2026-05-01", endDate: "2026-05-14", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro de Vida"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-poupanca-premiada-1s", name: "Poupança Premiada (1º sem)", type: "Produto", objective: "Awareness", description: "Poupança Premiada (mai-jun).", startDate: "2026-05-01", endDate: "2026-06-30", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Poupança"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-consorcio-jun", name: "Consórcio — Junho", type: "Produto", objective: "Conversão", description: "Consórcio (2ª-3ª sem jun).", startDate: "2026-06-08", endDate: "2026-06-21", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Consórcio"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-cartoes-visa-jun", name: "Cartões — Grande Prêmio VISA (jun)", type: "Produto", objective: "Conversão", description: "Grande Prêmio VISA (3ª-4ª sem jun).", startDate: "2026-06-15", endDate: "2026-06-30", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Cartões"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seg-gerais-jun", name: "Seg. Gerais — Junho", type: "Produto", objective: "Conversão", description: "Seguros Gerais (4ª sem jun).", startDate: "2026-06-22", endDate: "2026-06-30", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Seguros Gerais"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-cobranca-jun", name: "Cobrança Bancária — Junho", type: "Produto", objective: "Conversão", description: "Cobrança Bancária (4ª sem jun).", startDate: "2026-06-22", endDate: "2026-06-30", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Cobrança Bancária"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },

  // ===== 2º SEMESTRE =====
  { id: "cnv-seg-vida-empresa", name: "Seg. Vida Empresa Protegida", type: "Produto", objective: "Conversão", description: "Empresa Protegida (1ª-2ª sem jul).", startDate: "2026-07-01", endDate: "2026-07-14", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro de Vida"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-cartoes-visa-jul", name: "Cartões — Grande Prêmio VISA (jul)", type: "Produto", objective: "Conversão", description: "Grande Prêmio VISA (1ª-3ª sem jul).", startDate: "2026-07-01", endDate: "2026-07-21", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Cartões"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-investimentos-todos", name: "Investimentos — Investir é para Todos", type: "Produto", objective: "Awareness", description: "Investimentos (2ª sem jul → 4ª sem ago).", startDate: "2026-07-08", endDate: "2026-08-31", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Investimentos"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seg-vida-pais", name: "Seg. Vida — Dia dos Pais", type: "Sazonal", objective: "Conversão", description: "Dia dos Pais (1ª sem ago).", startDate: "2026-08-01", endDate: "2026-08-07", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro de Vida"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seguro-rural-ago", name: "Seguro Rural — Todos os Produtos (ago)", type: "Produto", objective: "Conversão", description: "Seguro Rural (1ª-4ª sem ago).", startDate: "2026-08-01", endDate: "2026-08-31", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro Rural"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos", "midia_offline"] },
  { id: "cnv-consignado-ago", name: "Consignado — Agosto", type: "Produto", objective: "Conversão", description: "Consignado (2ª sem ago).", startDate: "2026-08-08", endDate: "2026-08-14", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Consignado"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seg-gerais-acelera", name: "Seg. Gerais — Acelera Seguros", type: "Produto", objective: "Conversão", description: "Acelera Seguros (1ª-2ª sem set).", startDate: "2026-09-01", endDate: "2026-09-14", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguros Gerais"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-credito-pf-veiculos", name: "Crédito PF — Financ. Veículos", type: "Produto", objective: "Conversão", description: "Financiamento de Veículos (1ª sem set → 1ª sem out).", startDate: "2026-09-01", endDate: "2026-10-07", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Crédito PF", "Financiamento de Veículos"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos", "midia_offline"] },
  { id: "cnv-consignado-out", name: "Consignado — Outubro", type: "Produto", objective: "Conversão", description: "Consignado (2ª-3ª sem out).", startDate: "2026-10-08", endDate: "2026-10-21", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Consignado"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-credito-pj-apoio-2s", name: "Crédito PJ — Mov. Apoio Empresário (2º sem)", type: "Produto", objective: "Conversão", description: "Apoio ao Empresário (2ª sem out → 2ª sem nov).", startDate: "2026-10-08", endDate: "2026-11-14", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Crédito PJ"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seg-vida-rosa-azul", name: "Seg. Vida — Outubro Rosa e Novembro Azul", type: "Sazonal", objective: "Awareness", description: "Out. Rosa e Nov. Azul (4ª sem out → 1ª sem nov).", startDate: "2026-10-22", endDate: "2026-11-07", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro de Vida"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-consorcio-nov", name: "Consórcio — Novembro", type: "Produto", objective: "Conversão", description: "Consórcio (2ª-3ª sem nov).", startDate: "2026-11-08", endDate: "2026-11-21", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Consórcio"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-seguro-rural-nov", name: "Seguro Rural — Todos os Produtos (nov)", type: "Produto", objective: "Conversão", description: "Seguro Rural (2ª-4ª sem nov).", startDate: "2026-11-08", endDate: "2026-11-30", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguro Rural"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos", "midia_offline"] },
  { id: "cnv-seg-gerais-ferias", name: "Seg. Gerais — Férias Protegidas", type: "Sazonal", objective: "Conversão", description: "Férias Protegidas (4ª sem nov → 1ª sem dez).", startDate: "2026-11-22", endDate: "2026-12-07", status: "Planejamento", priority: "Alta", owner: "Equipe CNV", products: ["Seguros Gerais"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-previdencia-2s", name: "Previdência (2º sem)", type: "Produto", objective: "Conversão", description: "Previdência (4ª sem nov → 4ª sem dez).", startDate: "2026-11-22", endDate: "2026-12-31", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Previdência"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-cobranca-dez", name: "Cobrança Bancária — Dezembro", type: "Produto", objective: "Conversão", description: "Cobrança Bancária (4ª sem dez).", startDate: "2026-12-22", endDate: "2026-12-31", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Cobrança Bancária"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
  { id: "cnv-poupanca-premiada-2s", name: "Poupança Premiada (2º sem)", type: "Produto", objective: "Awareness", description: "Poupança Premiada (jul-dez).", startDate: "2026-07-01", endDate: "2026-12-31", status: "Planejamento", priority: "Média", owner: "Equipe CNV", products: ["Poupança"], budget: 0, notes: "CNV 2026", files: [], modules: ["projeto", "calendario", "conteudos"] },
];

function materializeCnv(): Campaign[] {
  const base = new Date("2026-01-01T09:00:00.000Z").getTime();
  return CNV_CALENDAR_2026.map((c, i) => ({
    ...c,
    createdAt: c.createdAt ?? new Date(base + i * 60000).toISOString(),
  }));
}

function mergeCnv(existing: Campaign[]): Campaign[] {
  const cnv = materializeCnv();
  const byId = new Set(existing.map((c) => c.id));
  const missing = cnv.filter((c) => !byId.has(c.id));
  return missing.length ? [...existing, ...missing] : existing;
}

function load(): Campaign[] {
  if (typeof window === "undefined") return mergeCnv(seed);
  try {
    const raw = window.localStorage.getItem(KEY);
    const current = raw ? (JSON.parse(raw) as Campaign[]) : seed;
    return mergeCnv(current);
  } catch {
    return mergeCnv(seed);
  }
}

let state: Campaign[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<Campaign[]>("campaigns", () => state, (s) => {
  state = mergeCnv(s);
  listeners.forEach((l) => l());
});

// Garante que as campanhas do calendário CNV 2026 fiquem persistidas no
// localStorage e sincronizadas com a nuvem já no primeiro load.
if (typeof window !== "undefined") {
  window.localStorage.setItem(KEY, JSON.stringify(state));
  setTimeout(() => cloudPush(), 0);
}

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
