import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

export const WORKFLOW_TRIGGERS = [
  { id: "campaign.created", label: "Campanha criada", module: "Campanhas" },
  { id: "campaign.status_changed", label: "Status de campanha alterado", module: "Campanhas" },
  { id: "event.approved", label: "Evento aprovado", module: "Eventos" },
  { id: "event.created", label: "Evento criado", module: "Eventos" },
  { id: "contract.expiring", label: "Contrato próximo do vencimento", module: "Contratos" },
  { id: "inventory.low_stock", label: "Brinde abaixo do estoque", module: "Brindes" },
  { id: "date.approaching", label: "Data chegando", module: "Calendário" },
  { id: "post.scheduled", label: "Publicação agendada", module: "Conteúdos" },
  { id: "partner.created", label: "Parceiro cadastrado", module: "Parceiros" },
  { id: "sponsorship.created", label: "Patrocínio cadastrado", module: "Patrocínios" },
  { id: "task.completed", label: "Tarefa concluída", module: "Kanban" },
  { id: "approval.pending", label: "Aprovação pendente", module: "Aprovações" },
] as const;
export type WorkflowTriggerId = (typeof WORKFLOW_TRIGGERS)[number]["id"];

export const WORKFLOW_ACTIONS = [
  { id: "notify", label: "Enviar notificação", icon: "bell" },
  { id: "create_task", label: "Criar tarefa", icon: "check-square" },
  { id: "update_status", label: "Atualizar status", icon: "refresh-cw" },
  { id: "create_project", label: "Criar projeto", icon: "folder-kanban" },
  { id: "send_email", label: "Enviar e-mail", icon: "mail" },
  { id: "move_kanban", label: "Mover no Kanban", icon: "trello" },
  { id: "add_owner", label: "Adicionar responsável", icon: "user-plus" },
  { id: "create_checklist", label: "Criar checklist", icon: "list-checks" },
  { id: "create_calendar_event", label: "Criar evento no calendário", icon: "calendar" },
  { id: "create_folder", label: "Criar pasta de arquivos", icon: "folder" },
  { id: "create_approval", label: "Criar aprovação", icon: "shield-check" },
  { id: "create_indicator", label: "Criar indicador", icon: "bar-chart-3" },
  { id: "create_timeline", label: "Registrar timeline", icon: "history" },
  { id: "webhook", label: "Chamar webhook", icon: "globe" },
] as const;
export type WorkflowActionId = (typeof WORKFLOW_ACTIONS)[number]["id"];

export type WorkflowCondition = { field: string; op: "eq" | "neq" | "gt" | "lt" | "contains"; value: string };

export type WorkflowStep = {
  id: string;
  action: WorkflowActionId;
  config: Record<string, string>;
};

export type WorkflowRun = {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: "success" | "error" | "running";
  triggerPayload: Record<string, unknown>;
  log: { stepId?: string; level: "info" | "error" | "warn"; message: string; at: string }[];
  durationMs?: number;
};

export type Workflow = {
  id: string;
  name: string;
  description: string;
  module: string;
  trigger: WorkflowTriggerId;
  conditions: WorkflowCondition[];
  steps: WorkflowStep[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
  runs: WorkflowRun[];
  stats: { success: number; error: number; lastRunAt?: string };
};

const KEY = "mhub.workflows.v1";
const uid = (p = "wf") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function defaultCampaignWorkflow(): Workflow {
  const steps: WorkflowStep[] = [
    { id: uid("st"), action: "create_project", config: { name: "Projeto da campanha" } },
    { id: uid("st"), action: "move_kanban", config: { board: "Operacional", column: "Backlog" } },
    { id: uid("st"), action: "create_calendar_event", config: { title: "Lançamento da campanha" } },
    { id: uid("st"), action: "create_checklist", config: { template: "Padrão Campanha" } },
    { id: uid("st"), action: "create_folder", config: { name: "Arquivos da campanha" } },
    { id: uid("st"), action: "notify", config: { audience: "Responsáveis" } },
    { id: uid("st"), action: "create_timeline", config: { message: "Campanha iniciada via workflow" } },
    { id: uid("st"), action: "create_approval", config: { type: "Plano de campanha" } },
    { id: uid("st"), action: "create_indicator", config: { metric: "ROI da campanha" } },
  ];
  return {
    id: uid(),
    name: "Quando criar uma Campanha",
    description: "Provisiona todo o ecossistema operacional de uma nova campanha em um único disparo.",
    module: "Campanhas",
    trigger: "campaign.created",
    conditions: [],
    steps,
    active: true,
    createdAt: now(),
    updatedAt: now(),
    runs: [
      {
        id: uid("rn"),
        startedAt: new Date(Date.now() - 3600_000).toISOString(),
        finishedAt: new Date(Date.now() - 3600_000 + 1240).toISOString(),
        status: "success",
        triggerPayload: { campaign: "Campanha Safra 2026", owner: "Bruno" },
        durationMs: 1240,
        log: steps.map((s, i) => ({
          stepId: s.id,
          level: "info" as const,
          message: `Passo ${i + 1}: ${s.action} executado.`,
          at: new Date(Date.now() - 3600_000 + i * 140).toISOString(),
        })),
      },
    ],
    stats: { success: 14, error: 0, lastRunAt: new Date(Date.now() - 3600_000).toISOString() },
  };
}

const seed: Workflow[] = [
  defaultCampaignWorkflow(),
  {
    id: uid(),
    name: "Alerta de contrato vencendo",
    description: "Quando um contrato estiver a 15 dias do vencimento, notifica o responsável e cria tarefa de renovação.",
    module: "Contratos",
    trigger: "contract.expiring",
    conditions: [{ field: "daysToExpire", op: "lt", value: "15" }],
    steps: [
      { id: uid("st"), action: "notify", config: { audience: "Responsável" } },
      { id: uid("st"), action: "create_task", config: { title: "Renegociar contrato", priority: "Alta" } },
      { id: uid("st"), action: "create_approval", config: { type: "Renovação" } },
    ],
    active: true,
    createdAt: now(),
    updatedAt: now(),
    runs: [
      {
        id: uid("rn"),
        startedAt: new Date(Date.now() - 86400_000).toISOString(),
        finishedAt: new Date(Date.now() - 86400_000 + 800).toISOString(),
        status: "success",
        triggerPayload: { contract: "CT-2026-007", daysToExpire: 12 },
        durationMs: 800,
        log: [
          { level: "info", message: "Notificação enviada para Bruno.", at: now() },
          { level: "info", message: "Tarefa criada: Renegociar contrato.", at: now() },
          { level: "info", message: "Aprovação criada.", at: now() },
        ],
      },
    ],
    stats: { success: 8, error: 1, lastRunAt: new Date(Date.now() - 86400_000).toISOString() },
  },
  {
    id: uid(),
    name: "Reposição automática de brindes",
    description: "Brindes abaixo do mínimo geram tarefa de compra para o time de marketing.",
    module: "Brindes",
    trigger: "inventory.low_stock",
    conditions: [],
    steps: [
      { id: uid("st"), action: "create_task", config: { title: "Repor estoque", priority: "Alta" } },
      { id: uid("st"), action: "notify", config: { audience: "Gestor de Marketing" } },
      { id: uid("st"), action: "send_email", config: { to: "suprimentos@credibelo.com.br" } },
    ],
    active: true,
    createdAt: now(),
    updatedAt: now(),
    runs: [],
    stats: { success: 3, error: 0 },
  },
  {
    id: uid(),
    name: "Onboarding de Parceiro",
    description: "Ao cadastrar um novo parceiro, cria pasta, checklist e aprovação inicial.",
    module: "Parceiros",
    trigger: "partner.created",
    conditions: [],
    steps: [
      { id: uid("st"), action: "create_folder", config: { name: "Documentos do parceiro" } },
      { id: uid("st"), action: "create_checklist", config: { template: "Onboarding parceiro" } },
      { id: uid("st"), action: "create_approval", config: { type: "Cadastro de parceiro" } },
      { id: uid("st"), action: "notify", config: { audience: "Gestor de Marketing" } },
    ],
    active: false,
    createdAt: now(),
    updatedAt: now(),
    runs: [
      {
        id: uid("rn"),
        startedAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
        finishedAt: new Date(Date.now() - 7 * 86400_000 + 2300).toISOString(),
        status: "error",
        triggerPayload: { partner: "Liga Esportiva Patense" },
        durationMs: 2300,
        log: [
          { level: "info", message: "Pasta criada.", at: now() },
          { level: "error", message: "Template de checklist 'Onboarding parceiro' não encontrado.", at: now() },
        ],
      },
    ],
    stats: { success: 4, error: 2, lastRunAt: new Date(Date.now() - 7 * 86400_000).toISOString() },
  },
];

function load(): Workflow[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as Workflow[];
  } catch {
    return seed;
  }
}
function save(s: Workflow[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

let state: Workflow[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<Workflow[]>("workflows", () => state, (s) => { state = s; listeners.forEach((l) => l()); });
function emit() {
  save(state);
  cloudPush();
  listeners.forEach((l) => l());
}

export const workflowsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  byId: (id: string) => state.find((w) => w.id === id),
  add(input: Partial<Workflow> & Pick<Workflow, "name" | "trigger" | "module">): Workflow {
    const wf: Workflow = {
      id: uid(),
      description: "",
      conditions: [],
      steps: [],
      active: true,
      createdAt: now(),
      updatedAt: now(),
      runs: [],
      stats: { success: 0, error: 0 },
      ...input,
    };
    state = [wf, ...state];
    emit();
    return wf;
  },
  update(id: string, patch: Partial<Workflow>) {
    state = state.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: now() } : w));
    emit();
  },
  duplicate(id: string) {
    const w = state.find((x) => x.id === id);
    if (!w) return;
    const copy: Workflow = {
      ...w,
      id: uid(),
      name: `${w.name} (cópia)`,
      active: false,
      runs: [],
      stats: { success: 0, error: 0 },
      createdAt: now(),
      updatedAt: now(),
    };
    state = [copy, ...state];
    emit();
  },
  remove(id: string) {
    state = state.filter((w) => w.id !== id);
    emit();
  },
  toggle(id: string) {
    state = state.map((w) => (w.id === id ? { ...w, active: !w.active, updatedAt: now() } : w));
    emit();
  },
  run(id: string, payload: Record<string, unknown> = {}) {
    const w = state.find((x) => x.id === id);
    if (!w) return;
    const startedAt = now();
    const log: WorkflowRun["log"] = [
      { level: "info", message: `Gatilho disparado: ${w.trigger}`, at: startedAt },
    ];
    let status: WorkflowRun["status"] = "success";
    w.steps.forEach((s, i) => {
      const fail = Math.random() < 0.04;
      log.push({
        stepId: s.id,
        level: fail ? "error" : "info",
        message: fail ? `Falha ao executar "${s.action}".` : `Passo ${i + 1}: ${s.action} executado.`,
        at: now(),
      });
      if (fail) status = "error";
    });
    const finishedAt = now();
    const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime() + 250;
    const run: WorkflowRun = { id: uid("rn"), startedAt, finishedAt, status, triggerPayload: payload, log, durationMs };
    state = state.map((x) =>
      x.id !== id
        ? x
        : {
            ...x,
            runs: [run, ...x.runs].slice(0, 50),
            stats: {
              success: x.stats.success + (status === "success" ? 1 : 0),
              error: x.stats.error + (status === "error" ? 1 : 0),
              lastRunAt: finishedAt,
            },
          },
    );
    emit();
  },
};

export function useWorkflows() {
  return useSyncExternalStore(workflowsStore.subscribe, workflowsStore.get, workflowsStore.get);
}

export function triggerLabel(id: WorkflowTriggerId): string {
  return WORKFLOW_TRIGGERS.find((t) => t.id === id)?.label ?? id;
}
export function actionLabel(id: WorkflowActionId): string {
  return WORKFLOW_ACTIONS.find((a) => a.id === id)?.label ?? id;
}
