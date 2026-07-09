import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

export const PLAN_STATUSES = ["Rascunho", "Em execução", "Concluído", "Arquivado"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const OBJECTIVE_PRESETS = [
  "Aumentar Base de Cooperados",
  "Fortalecer Marca",
  "Aumentar Carteira de Seguros",
  "Impulsionar Consórcios",
  "Fortalecer Crédito Rural",
  "Aumentar Capital Social",
  "Melhorar Comunicação Interna",
  "Aumentar Engajamento Digital",
] as const;

export const COMMERCIAL_CALENDAR: { month: number; label: string; theme: string }[] = [
  { month: 1, label: "Janeiro", theme: "Planejamento" },
  { month: 2, label: "Fevereiro", theme: "Volta às aulas" },
  { month: 3, label: "Março", theme: "Dia da Mulher" },
  { month: 4, label: "Abril", theme: "Assembleias" },
  { month: 5, label: "Maio", theme: "Dia das Mães" },
  { month: 6, label: "Junho", theme: "Plano Safra" },
  { month: 7, label: "Julho", theme: "Capital Premiado" },
  { month: 8, label: "Agosto", theme: "Dia dos Pais" },
  { month: 9, label: "Setembro", theme: "Cooperativismo" },
  { month: 10, label: "Outubro", theme: "Dia das Crianças" },
  { month: 11, label: "Novembro", theme: "Black Friday" },
  { month: 12, label: "Dezembro", theme: "Natal" },
];

export type Goal = {
  id: string;
  objectiveId: string;
  description: string;
  indicator: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  owner: string;
  status: "Pendente" | "Em andamento" | "Concluída" | "Atrasada";
};

export type Objective = {
  id: string;
  title: string;
  description?: string;
  campaignIds: string[];
};

export type KPI = {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
};

export type CalendarItem = {
  id: string;
  month: number;
  theme: string;
  campaignName?: string;
  generated: boolean;
};

export type TimelineEntry = { id: string; at: string; actor: string; description: string };

export type PlanModuleKey =
  | "calendario"
  | "campanhas"
  | "projetos"
  | "indicadores"
  | "orcamento"
  | "eventos"
  | "datas"
  | "cronograma"
  | "dashboard"
  | "timeline";

export const PLAN_MODULES: { key: PlanModuleKey; label: string }[] = [
  { key: "calendario", label: "Calendário" },
  { key: "campanhas", label: "Campanhas" },
  { key: "projetos", label: "Projetos" },
  { key: "indicadores", label: "Indicadores" },
  { key: "orcamento", label: "Orçamento" },
  { key: "eventos", label: "Eventos" },
  { key: "datas", label: "Datas comemorativas" },
  { key: "cronograma", label: "Cronograma" },
  { key: "dashboard", label: "Dashboard" },
  { key: "timeline", label: "Timeline" },
];

export type StrategicPlan = {
  id: string;
  year: number;
  name: string;
  description: string;
  owner: string;
  team: string[];
  status: PlanStatus;
  startDate: string;
  endDate: string;
  annualBudget: number;
  realizedBudget: number;
  objectives: Objective[];
  goals: Goal[];
  kpis: KPI[];
  calendar: CalendarItem[];
  modules: PlanModuleKey[];
  files: { name: string; size: number }[];
  comments: { id: string; at: string; author: string; text: string }[];
  timeline: TimelineEntry[];
  createdAt: string;
};

const KEY = "mhub.strategic.v1";
const uid = (p = "sp") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

function defaultCalendar(generated: boolean): CalendarItem[] {
  return COMMERCIAL_CALENDAR.map((c) => ({
    id: uid("cal"),
    month: c.month,
    theme: c.theme,
    campaignName: generated ? `Campanha ${c.theme}` : undefined,
    generated,
  }));
}

function seed(): StrategicPlan[] {
  const year = new Date().getFullYear();
  const objA: Objective = { id: uid("obj"), title: "Aumentar Base de Cooperados", campaignIds: [] };
  const objB: Objective = { id: uid("obj"), title: "Fortalecer Crédito Rural", campaignIds: [] };
  const objC: Objective = { id: uid("obj"), title: "Aumentar Engajamento Digital", campaignIds: [] };

  const plan: StrategicPlan = {
    id: uid("plan"),
    year,
    name: `Planejamento Estratégico ${year}`,
    description: "Plano anual integrado de Comunicação e Marketing do Sicoob Credibelo.",
    owner: "Bruno Ferreira",
    team: ["Marina Souza", "Carlos Lima", "Ana Beatriz"],
    status: "Em execução",
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
    annualBudget: 1850000,
    realizedBudget: 642000,
    objectives: [objA, objB, objC],
    goals: [
      { id: uid("g"), objectiveId: objA.id, description: "Captar 2.000 novos cooperados", indicator: "Novos cooperados", target: 2000, current: 740, unit: "un.", deadline: `${year}-12-31`, owner: "Marina Souza", status: "Em andamento" },
      { id: uid("g"), objectiveId: objB.id, description: "Crescer 25% na carteira rural", indicator: "Carteira rural", target: 25, current: 11, unit: "%", deadline: `${year}-12-31`, owner: "Carlos Lima", status: "Em andamento" },
      { id: uid("g"), objectiveId: objC.id, description: "Atingir 80k seguidores nas redes", indicator: "Seguidores totais", target: 80000, current: 53200, unit: "", deadline: `${year}-12-31`, owner: "Ana Beatriz", status: "Em andamento" },
    ],
    kpis: [
      { id: uid("k"), name: "ROI Médio das Campanhas", target: 3, current: 2.1, unit: "x" },
      { id: uid("k"), name: "Engajamento Digital", target: 6, current: 4.4, unit: "%" },
      { id: uid("k"), name: "NPS Cooperados", target: 75, current: 68, unit: "" },
    ],
    calendar: defaultCalendar(true),
    modules: ["calendario", "campanhas", "indicadores", "orcamento", "eventos", "dashboard", "timeline"],
    files: [],
    comments: [],
    timeline: [
      { id: uid("tl"), at: nowIso(), actor: "Sistema", description: "Planejamento estratégico criado" },
      { id: uid("tl"), at: nowIso(), actor: "Sistema", description: "Calendário comercial e campanhas geradas automaticamente" },
    ],
    createdAt: nowIso(),
  };
  return [plan];
}

let state: StrategicPlan[] = (() => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StrategicPlan[];
  } catch {}
  return [];
})();

const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<StrategicPlan[]>("strategic-planning", () => state, (s) => { state = s; listeners.forEach((l) => l()); });
function emit() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  cloudPush();
  listeners.forEach((l) => l());
}

export const strategicStore = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  add(input: {
    year: number; name: string; description: string; owner: string; team: string[];
    startDate: string; endDate: string; annualBudget: number; objectives: string[];
    modules: PlanModuleKey[];
  }): StrategicPlan {
    const objectives: Objective[] = input.objectives.map((t) => ({ id: uid("obj"), title: t, campaignIds: [] }));
    const generateCalendar = input.modules.includes("calendario") || input.modules.includes("campanhas");
    const plan: StrategicPlan = {
      id: uid("plan"),
      year: input.year,
      name: input.name,
      description: input.description,
      owner: input.owner,
      team: input.team,
      status: "Rascunho",
      startDate: input.startDate,
      endDate: input.endDate,
      annualBudget: input.annualBudget,
      realizedBudget: 0,
      objectives,
      goals: [],
      kpis: [],
      calendar: defaultCalendar(generateCalendar),
      modules: input.modules,
      files: [],
      comments: [],
      timeline: [
        { id: uid("tl"), at: nowIso(), actor: input.owner, description: "Planejamento criado" },
        ...input.modules.map((m) => ({
          id: uid("tl"), at: nowIso(), actor: "Sistema",
          description: `Módulo ${PLAN_MODULES.find((x) => x.key === m)?.label ?? m} gerado automaticamente`,
        })),
      ],
      createdAt: nowIso(),
    };
    state = [plan, ...state];
    emit();
    return plan;
  },
  update(id: string, patch: Partial<StrategicPlan>) {
    state = state.map((p) => (p.id === id ? { ...p, ...patch } : p));
    emit();
  },
  remove(id: string) {
    state = state.filter((p) => p.id !== id);
    emit();
  },
  addGoal(planId: string, goal: Omit<Goal, "id">) {
    state = state.map((p) => (p.id === planId ? { ...p, goals: [...p.goals, { ...goal, id: uid("g") }] } : p));
    emit();
  },
  addObjective(planId: string, title: string) {
    state = state.map((p) => (p.id === planId ? { ...p, objectives: [...p.objectives, { id: uid("obj"), title, campaignIds: [] }] } : p));
    emit();
  },
};

export function useStrategicPlans() {
  return useSyncExternalStore(strategicStore.subscribe, strategicStore.get, strategicStore.get);
}

export function planProgress(p: StrategicPlan): number {
  if (p.goals.length === 0) return 0;
  const sum = p.goals.reduce((acc, g) => acc + Math.min(100, g.target > 0 ? (g.current / g.target) * 100 : 0), 0);
  return Math.round(sum / p.goals.length);
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
