import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

const KEY = "mh:ai-center:v1";

export type AiRole = "user" | "assistant";

export type AiMessage = {
  id: string;
  role: AiRole;
  content: string;
  createdAt: string;
};

export type AiConversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AiMessage[];
  campaignId?: string;
  projectId?: string;
};

export type AiPrompt = {
  id: string;
  title: string;
  category: string;
  prompt: string;
  favorite?: boolean;
};

export type AiTemplate = {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  category: string;
};

type State = {
  conversations: AiConversation[];
  prompts: AiPrompt[];
  activeId: string | null;
};

export const AI_TEMPLATES: AiTemplate[] = [
  { id: "legenda", label: "Nova legenda", icon: "📱", category: "Conteúdo", prompt: "Crie uma legenda envolvente para Instagram sobre [tema], com tom cooperativista, máximo 4 linhas, com 3 hashtags relevantes." },
  { id: "roteiro", label: "Novo roteiro", icon: "🎬", category: "Conteúdo", prompt: "Crie um roteiro de vídeo de 60 segundos sobre [tema], formato Reels, linguagem próxima e cooperativista." },
  { id: "release", label: "Novo release", icon: "📰", category: "Imprensa", prompt: "Escreva um release de imprensa sobre [tema], com lead, corpo, citação do presidente e dados institucionais do Sicoob Credibelo." },
  { id: "comunicado", label: "Novo comunicado", icon: "📢", category: "Interno", prompt: "Redija um comunicado interno sobre [tema] para os colaboradores do Sicoob Credibelo, tom institucional e claro." },
  { id: "email", label: "Novo e-mail", icon: "✉️", category: "Conteúdo", prompt: "Escreva um e-mail marketing sobre [tema] para cooperados, com assunto, pré-header, corpo e CTA." },
  { id: "campanha", label: "Nova campanha", icon: "🚀", category: "Estratégia", prompt: "Estruture uma campanha de marketing sobre [tema]: objetivo, público, mensagem-chave, canais, peças, KPIs e cronograma." },
  { id: "cronograma", label: "Novo cronograma", icon: "📅", category: "Planejamento", prompt: "Monte um cronograma detalhado de execução para [projeto], com etapas, responsáveis sugeridos e prazos." },
  { id: "checklist", label: "Novo checklist", icon: "✅", category: "Planejamento", prompt: "Crie um checklist completo para [tipo de entrega], cobrindo pré-produção, execução e pós." },
  { id: "comercial", label: "Nova ação comercial", icon: "💼", category: "Estratégia", prompt: "Desenhe uma ação comercial cooperativista sobre [produto], com argumentos, abordagem, materiais e meta." },
  { id: "briefing", label: "Novo briefing", icon: "📝", category: "Planejamento", prompt: "Monte um briefing criativo para [demanda]: contexto, objetivo, público, mensagem, tom, entregáveis e prazos." },
  { id: "spot", label: "Novo spot", icon: "🎙️", category: "Conteúdo", prompt: "Crie um spot de rádio de 30 segundos sobre [tema], com locução clara, jingle institucional Sicoob e assinatura final." },
  { id: "planejamento", label: "Novo planejamento", icon: "🗺️", category: "Estratégia", prompt: "Desenvolva um planejamento de marketing trimestral para [foco], com diagnóstico, objetivos, ações e indicadores." },
  { id: "calendario", label: "Novo calendário", icon: "🗓️", category: "Planejamento", prompt: "Monte um calendário editorial mensal sobre [tema], com datas, formatos, canais e responsáveis." },
  { id: "evento", label: "Novo evento", icon: "🎉", category: "Eventos", prompt: "Estruture um evento sobre [tema]: objetivo, formato, público, programação, fornecedores, brindes e divulgação." },
  { id: "relatorio", label: "Novo relatório", icon: "📊", category: "Análise", prompt: "Gere a estrutura de um relatório de resultados de [campanha], com KPIs, gráficos sugeridos, insights e recomendações." },
];

const DEFAULT_PROMPTS: AiPrompt[] = [
  { id: "p-1", title: "Linguagem Cooperativista", category: "Estilo", prompt: "Reescreva o texto a seguir com tom cooperativista, próximo e institucional do Sicoob: [texto]", favorite: true },
  { id: "p-2", title: "Ideias para Dia do Cooperativismo", category: "Datas", prompt: "Gere 10 ideias de conteúdo para o Dia do Cooperativismo focadas no Sicoob Credibelo." },
  { id: "p-3", title: "Resumo Executivo", category: "Análise", prompt: "Resuma o seguinte conteúdo em 5 bullets executivos: [texto]" },
  { id: "p-4", title: "Crédito Rural — Argumentos", category: "Produto", prompt: "Liste 8 argumentos comerciais sobre Crédito Rural Sicoob para cooperados produtores." },
  { id: "p-5", title: "Storytelling de Cooperado", category: "Conteúdo", prompt: "Crie uma narrativa emocional baseada na história de um cooperado do Sicoob Credibelo: [contexto]." },
  { id: "p-6", title: "Comparativo Banco x Cooperativa", category: "Educação", prompt: "Explique de forma didática 5 diferenças entre banco tradicional e cooperativa de crédito." },
];

function load(): State {
  if (typeof window === "undefined") return { conversations: [], prompts: [], activeId: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { conversations: [], prompts: [], activeId: null };
    const s = JSON.parse(raw) as State;
    if (!s.prompts) s.prompts = [];
    return s;
  } catch {
    return { conversations: [], prompts: [], activeId: null };
  }
}

let state: State = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<State>("ai-center", () => state, (s) => { state = s; listeners.forEach((l) => l()); });

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  cloudPush();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }
function getSnapshot() { return state; }

export function useAiCenter() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function createConversation(title = "Nova conversa"): string {
  const id = uid();
  const now = new Date().toISOString();
  state = {
    ...state,
    activeId: id,
    conversations: [
      { id, title, createdAt: now, updatedAt: now, messages: [] },
      ...state.conversations,
    ],
  };
  save();
  return id;
}

export function setActive(id: string) {
  state = { ...state, activeId: id };
  save();
}

export function deleteConversation(id: string) {
  const conversations = state.conversations.filter((c) => c.id !== id);
  state = {
    ...state,
    conversations,
    activeId: state.activeId === id ? conversations[0]?.id ?? null : state.activeId,
  };
  save();
}

export function renameConversation(id: string, title: string) {
  state = {
    ...state,
    conversations: state.conversations.map((c) => c.id === id ? { ...c, title } : c),
  };
  save();
}

export function linkConversation(id: string, link: { campaignId?: string; projectId?: string }) {
  state = {
    ...state,
    conversations: state.conversations.map((c) => c.id === id ? { ...c, ...link } : c),
  };
  save();
}

export function sendMessage(conversationId: string, content: string) {
  const now = new Date().toISOString();
  const userMsg: AiMessage = { id: uid(), role: "user", content, createdAt: now };
  const reply: AiMessage = {
    id: uid(),
    role: "assistant",
    content: mockReply(content),
    createdAt: new Date(Date.now() + 1).toISOString(),
  };
  state = {
    ...state,
    conversations: state.conversations.map((c) => {
      if (c.id !== conversationId) return c;
      const isFirst = c.messages.length === 0;
      return {
        ...c,
        title: isFirst ? content.slice(0, 48) : c.title,
        updatedAt: now,
        messages: [...c.messages, userMsg, reply],
      };
    }),
  };
  save();
}

export function toggleFavoritePrompt(id: string) {
  state = {
    ...state,
    prompts: state.prompts.map((p) => p.id === id ? { ...p, favorite: !p.favorite } : p),
  };
  save();
}

export function addPrompt(p: Omit<AiPrompt, "id">) {
  state = { ...state, prompts: [{ ...p, id: uid() }, ...state.prompts] };
  save();
}

function mockReply(input: string): string {
  return `🤖 **Central IA — Marketing Cooperativista**\n\nRecebi sua solicitação:\n> ${input.slice(0, 200)}\n\n_Esta é uma resposta de demonstração. A integração com OpenAI será ativada em breve, conectando esta conversa ao contexto de campanhas, projetos e banco de conteúdo do Sicoob Credibelo._\n\n**Próximos passos sugeridos:**\n- Vincular esta conversa a uma campanha ou projeto\n- Salvar este prompt nos favoritos\n- Gerar variações da resposta`;
}
