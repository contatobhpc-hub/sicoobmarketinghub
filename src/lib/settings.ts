import { useEffect, useSyncExternalStore } from "react";

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  status: "Ativo" | "Convidado" | "Inativo";
};

export type RoleKey =
  | "Administrador"
  | "Gestor de Marketing"
  | "Analista de Marketing"
  | "Colaborador"
  | "Diretoria"
  | "Convidado";

export type RoleDef = { key: RoleKey; description: string; permissions: string[] };

export type SettingsState = {
  // Multiempresa / Multiworkspace
  organizations: { id: string; name: string; cnpj: string; active: boolean }[];
  activeOrgId: string;
  workspaces: { id: string; orgId: string; name: string; description: string }[];
  activeWorkspaceId: string;

  // Empresa
  company: {
    legalName: string;
    tradeName: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    site: string;
    logoUrl?: string;
    timezone: string;
  };

  // Multiusuário
  members: WorkspaceMember[];

  // Papéis / Permissões
  roles: RoleDef[];

  // Listas mestre
  campaignTypes: string[];
  categories: string[];
  agencies: string[];
  cities: string[];
  products: string[];
  tags: { id: string; label: string; color: string }[];
  statuses: { id: string; label: string; color: string }[];
  templates: { id: string; name: string; type: string }[];

  // Integrações
  integrations: {
    id: string;
    name: string;
    category: "Calendário" | "E-mail" | "Drive" | "Social" | "Analytics" | "IA";
    connected: boolean;
    phase: 1 | 2;
  }[];

  // Automações
  automations: { id: string; name: string; enabled: boolean; trigger: string }[];

  // Notificações
  notifications: { channel: "Email" | "Push" | "WhatsApp" | "Teams"; enabled: boolean }[];

  // Backup
  backup: { autoDaily: boolean; retentionDays: number; lastBackupAt: string };

  // Logs / Auditoria
  logs: { id: string; at: string; actor: string; action: string; target: string }[];

  // Sessão
  currentUserId?: string;

  // Preferências
  theme: "Sistema" | "Claro" | "Escuro";
  language: "pt-BR" | "en-US" | "es-ES";

  // Segurança
  security: {
    twoFactor: boolean;
    sessionTimeoutMinutes: number;
    enforceSSO: boolean;
    passwordMinLength: number;
  };

  // LGPD
  lgpd: {
    dpoName: string;
    dpoEmail: string;
    consentBanner: boolean;
    retentionMonths: number;
    privacyPolicyUrl: string;
  };
};

const KEY = "mhub.settings.v1";
const uid = (p = "s") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const seed = (): SettingsState => ({
  organizations: [
    { id: "org-credibelo", name: "Sicoob Credibelo", cnpj: "00.000.000/0001-00", active: true },
  ],
  activeOrgId: "org-credibelo",
  workspaces: [
    { id: "ws-mkt", orgId: "org-credibelo", name: "Marketing & Comunicação", description: "Workspace principal" },
  ],
  activeWorkspaceId: "ws-mkt",
  company: {
    legalName: "Sicoob Credibelo",
    tradeName: "Sicoob Credibelo",
    cnpj: "00.000.000/0001-00",
    address: "Belo Horizonte, MG",
    phone: "(31) 3000-0000",
    email: "marketing@credibelo.coop.br",
    site: "https://credibelo.coop.br",
    timezone: "America/Sao_Paulo",
  },
  members: [
    { id: uid("u"), name: "Bruno Almeida", email: "bruno@credibelo.coop.br", role: "Gestor de Marketing", status: "Ativo" },
    { id: uid("u"), name: "Carla Souza", email: "carla@credibelo.coop.br", role: "Analista de Marketing", status: "Ativo" },
    { id: uid("u"), name: "Marina Reis", email: "marina@credibelo.coop.br", role: "Colaborador", status: "Ativo" },
    { id: uid("u"), name: "Diretoria", email: "diretoria@credibelo.coop.br", role: "Diretoria", status: "Ativo" },
  ],
  roles: [
    { key: "Administrador", description: "Controle total da plataforma.", permissions: ["*"] },
    { key: "Gestor de Marketing", description: "Gerencia campanhas, aprova demandas, acompanha indicadores.", permissions: ["campanhas:*", "projetos:*", "aprovacoes:*", "indicadores:read"] },
    { key: "Analista de Marketing", description: "Cria campanhas, tarefas, conteúdos e eventos.", permissions: ["campanhas:create", "projetos:create", "conteudos:*", "eventos:*"] },
    { key: "Colaborador", description: "Executa apenas tarefas atribuídas.", permissions: ["tarefas:assigned"] },
    { key: "Diretoria", description: "Acesso somente leitura a dashboards e aprovações.", permissions: ["indicadores:read", "aprovacoes:approve"] },
    { key: "Convidado", description: "Acesso restrito a projetos/eventos compartilhados.", permissions: ["shared:read"] },
  ],
  campaignTypes: ["Institucional", "Produto", "Sazonal", "Lançamento", "Endomarketing", "Patrocínio", "Performance"],
  categories: ["Crédito", "Conta", "Investimentos", "Seguros", "Cooperativismo", "Educação"],
  agencies: ["Agência Norte", "Studio Belo", "Casa Criativa"],
  cities: ["Belo Horizonte", "Uberlândia", "Uberaba", "Patos de Minas", "Araxá"],
  products: ["Crédito Rural", "Conta Digital Jovem", "Investimentos", "Consórcio", "Cartão"],
  tags: [
    { id: uid("tg"), label: "Urgente", color: "#ef4444" },
    { id: uid("tg"), label: "Estratégico", color: "#6366f1" },
    { id: uid("tg"), label: "Endomarketing", color: "#10b981" },
  ],
  statuses: [
    { id: uid("st"), label: "Backlog", color: "#94a3b8" },
    { id: uid("st"), label: "Em andamento", color: "#6366f1" },
    { id: uid("st"), label: "Aguardando aprovação", color: "#f59e0b" },
    { id: uid("st"), label: "Concluído", color: "#10b981" },
  ],
  templates: [
    { id: uid("tp"), name: "Briefing de Campanha", type: "Campanha" },
    { id: uid("tp"), name: "Checklist de Evento", type: "Evento" },
    { id: uid("tp"), name: "Roteiro de Vídeo", type: "Conteúdo" },
  ],
  integrations: [
    { id: "google-calendar", name: "Google Calendar", category: "Calendário", connected: false, phase: 1 },
    { id: "email", name: "E-mail (SMTP)", category: "E-mail", connected: false, phase: 1 },
    { id: "google-drive", name: "Google Drive", category: "Drive", connected: false, phase: 1 },
    { id: "onedrive", name: "OneDrive", category: "Drive", connected: false, phase: 1 },
    { id: "meta-business", name: "Meta Business Suite", category: "Social", connected: false, phase: 1 },
    { id: "google-analytics", name: "Google Analytics", category: "Analytics", connected: false, phase: 1 },
    { id: "meta-ads", name: "Meta Ads", category: "Social", connected: false, phase: 2 },
    { id: "google-ads", name: "Google Ads", category: "Analytics", connected: false, phase: 2 },
    { id: "rd-station", name: "RD Station", category: "E-mail", connected: false, phase: 2 },
    { id: "whatsapp-business", name: "WhatsApp Business API", category: "Social", connected: false, phase: 2 },
    { id: "canva", name: "Canva", category: "Drive", connected: false, phase: 2 },
    { id: "openai", name: "OpenAI / ChatGPT", category: "IA", connected: false, phase: 2 },
    { id: "teams", name: "Microsoft Teams", category: "E-mail", connected: false, phase: 2 },
    { id: "powerbi", name: "Power BI", category: "Analytics", connected: false, phase: 2 },
  ],
  automations: [
    { id: uid("a"), name: "Alertar contrato vencendo em 30 dias", enabled: true, trigger: "contrato.vence" },
    { id: uid("a"), name: "Criar checklist ao aprovar evento", enabled: true, trigger: "evento.aprovado" },
    { id: uid("a"), name: "Notificar estoque baixo de brinde", enabled: true, trigger: "brinde.baixo" },
  ],
  notifications: [
    { channel: "Email", enabled: true },
    { channel: "Push", enabled: true },
    { channel: "WhatsApp", enabled: false },
    { channel: "Teams", enabled: false },
  ],
  backup: { autoDaily: true, retentionDays: 30, lastBackupAt: new Date().toISOString() },
  logs: [
    { id: uid("l"), at: new Date().toISOString(), actor: "Bruno", action: "Atualizou", target: "Campanha Crédito Rural" },
    { id: uid("l"), at: new Date(Date.now() - 3.6e6).toISOString(), actor: "Carla", action: "Criou", target: "Projeto Conta Jovem" },
    { id: uid("l"), at: new Date(Date.now() - 7.2e6).toISOString(), actor: "Sistema", action: "Backup", target: "Banco de dados" },
  ],
  theme: "Sistema",
  language: "pt-BR",
  security: { twoFactor: false, sessionTimeoutMinutes: 60, enforceSSO: false, passwordMinLength: 10 },
  lgpd: {
    dpoName: "Encarregado de Dados",
    dpoEmail: "dpo@credibelo.coop.br",
    consentBanner: true,
    retentionMonths: 24,
    privacyPolicyUrl: "https://credibelo.coop.br/privacidade",
  },
});

let state: SettingsState = (() => {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...(JSON.parse(raw) as SettingsState) };
  } catch {
    /* ignore */
  }
  return seed();
})();

const listeners = new Set<() => void>();
const emit = () => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
  for (const l of listeners) l();
};

export const settingsStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  update(patch: Partial<SettingsState>) {
    state = { ...state, ...patch };
    emit();
  },
  patchSection<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    state = { ...state, [key]: value };
    emit();
  },
};

export function useSettings() {
  return useSyncExternalStore(
    settingsStore.subscribe,
    () => state,
    () => state,
  );
}
