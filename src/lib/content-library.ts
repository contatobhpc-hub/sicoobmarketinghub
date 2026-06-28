import { useSyncExternalStore } from "react";

export const CONTENT_CATEGORIES = [
  "Legendas",
  "Matérias",
  "Roteiros",
  "Spot Rádio",
  "E-mails",
  "Comunicados",
  "Vídeos",
  "Stories",
  "Reels",
  "Campanhas",
  "Templates",
  "Arquivos Institucionais",
] as const;
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export const CONTENT_STATUSES = [
  "Rascunho",
  "Em revisão",
  "Aguardando aprovação",
  "Aprovado",
  "Publicado",
  "Arquivado",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export type ContentVersion = {
  id: string;
  label: string; // v1, v2…
  body: string;
  author: string;
  createdAt: string;
  note?: string;
};

export type ContentHistoryEntry = {
  id: string;
  message: string;
  author?: string;
  createdAt: string;
};

export type ContentItem = {
  id: string;
  title: string;
  category: ContentCategory;
  description: string;
  body: string;
  tags: string[];
  campaignId?: string;
  projectId?: string;
  author: string;
  approver?: string;
  status: ContentStatus;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  versions: ContentVersion[];
  history: ContentHistoryEntry[];
  attachmentName?: string;
};

const KEY = "mhub.content.v1";
const uid = (p = "ci") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function ago(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const seed: ContentItem[] = [
  {
    id: uid(), title: "Legenda — Lançamento Crédito Rural", category: "Legendas",
    description: "Legenda principal para o anúncio do Crédito Rural 2026.",
    body: "A safra do agro brasileiro merece um parceiro à altura. Conheça as novas condições do Crédito Rural Sicoob Credibelo 2026 — taxas competitivas, prazos flexíveis e atendimento próximo. #CooperarPraColher",
    tags: ["instagram", "agro", "produto"],
    campaignId: "c-1", author: "Bruno Almeida", approver: "Marina Sousa",
    status: "Aprovado", favorite: true, createdAt: ago(14), updatedAt: ago(2),
    versions: [
      { id: uid("v"), label: "v1", body: "Texto inicial — aprovado pela diretoria.", author: "Bruno", createdAt: ago(14) },
      { id: uid("v"), label: "v2", body: "Ajuste fino de tom — adicionado CTA.", author: "Bruno", createdAt: ago(2), note: "Ajuste de copy" },
    ],
    history: [
      { id: uid("h"), message: "Conteúdo criado", author: "Bruno", createdAt: ago(14) },
      { id: uid("h"), message: "Aprovado por Marina Sousa", author: "Marina", createdAt: ago(2) },
    ],
  },
  {
    id: uid(), title: "Roteiro — Vídeo institucional Filiação", category: "Roteiros",
    description: "Roteiro do vídeo institucional 60s para a campanha de filiação.",
    body: "CENA 1 — Aberta. Drone sobrevoa a cidade ao amanhecer. NARRADOR: Aqui, cooperar é fazer junto…",
    tags: ["video", "institucional", "60s"],
    campaignId: "c-3", projectId: "p-rural-26",
    author: "Marina Sousa", approver: "Bruno Almeida",
    status: "Em revisão", favorite: false, createdAt: ago(7), updatedAt: ago(1),
    versions: [
      { id: uid("v"), label: "v1", body: "Primeira versão do roteiro.", author: "Marina", createdAt: ago(7) },
    ],
    history: [
      { id: uid("h"), message: "Conteúdo criado", author: "Marina", createdAt: ago(7) },
      { id: uid("h"), message: "Enviado para revisão", author: "Marina", createdAt: ago(1) },
    ],
  },
  {
    id: uid(), title: "Spot Rádio 30s — Conta Jovem", category: "Spot Rádio",
    description: "Spot para veiculação em rádios locais.",
    body: "[LOC] Tem coisa que só quem é jovem entende. Por isso, o Sicoob Credibelo criou a Conta Jovem — sem mensalidade, com Pix ilimitado e tudo no app.",
    tags: ["radio", "30s", "jovem"],
    campaignId: "c-2", author: "Pedro Lima",
    status: "Aguardando aprovação", favorite: true, createdAt: ago(5), updatedAt: ago(1),
    versions: [{ id: uid("v"), label: "v1", body: "Versão inicial.", author: "Pedro", createdAt: ago(5) }],
    history: [{ id: uid("h"), message: "Conteúdo criado", author: "Pedro", createdAt: ago(5) }],
  },
  {
    id: uid(), title: "E-mail Marketing — Boas-vindas Cooperado", category: "E-mails",
    description: "Onboarding por e-mail para novos cooperados.",
    body: "Olá, {{nome}}!\n\nSeja bem-vindo(a) ao Sicoob Credibelo. Você agora faz parte de uma cooperativa que cresce junto com você…",
    tags: ["e-mail", "onboarding", "transacional"],
    author: "Carla Reis", status: "Rascunho", favorite: false,
    createdAt: ago(3), updatedAt: ago(3),
    versions: [{ id: uid("v"), label: "v1", body: "Esboço inicial.", author: "Carla", createdAt: ago(3) }],
    history: [{ id: uid("h"), message: "Conteúdo criado", author: "Carla", createdAt: ago(3) }],
  },
  {
    id: uid(), title: "Comunicado — Horário de Carnaval", category: "Comunicados",
    description: "Comunicado interno e externo sobre funcionamento.",
    body: "Informamos que durante o feriado de Carnaval as agências funcionarão em horário especial…",
    tags: ["aviso", "feriado"], author: "Bruno Almeida",
    status: "Publicado", favorite: false, createdAt: ago(40), updatedAt: ago(38),
    versions: [{ id: uid("v"), label: "v1", body: "Texto final.", author: "Bruno", createdAt: ago(40) }],
    history: [{ id: uid("h"), message: "Publicado", author: "Bruno", createdAt: ago(38) }],
  },
  {
    id: uid(), title: "Template — Card aniversariantes", category: "Templates",
    description: "Template editável para posts mensais de aniversariantes.",
    body: "Layout 1080x1080 — base PSD com camadas nomeadas.", tags: ["template", "aniversário"],
    author: "Carla Reis", status: "Aprovado", favorite: true,
    createdAt: ago(60), updatedAt: ago(30),
    versions: [{ id: uid("v"), label: "v1", body: "Versão liberada.", author: "Carla", createdAt: ago(60) }],
    history: [{ id: uid("h"), message: "Aprovado", author: "Marina", createdAt: ago(30) }],
    attachmentName: "template-aniversariantes.psd",
  },
  {
    id: uid(), title: "Reels — Dicas de educação financeira #1", category: "Reels",
    description: "Roteiro + descrição do Reels semanal.",
    body: "Hook: 'Você sabia que 70% das pessoas…' — gravar com Marina + tela do app.",
    tags: ["reels", "educacao", "semanal"],
    campaignId: "c-3", author: "Marina Sousa",
    status: "Em revisão", favorite: false, createdAt: ago(2), updatedAt: ago(1),
    versions: [{ id: uid("v"), label: "v1", body: "Versão inicial.", author: "Marina", createdAt: ago(2) }],
    history: [{ id: uid("h"), message: "Criado", author: "Marina", createdAt: ago(2) }],
  },
  {
    id: uid(), title: "Manual de Marca Sicoob Credibelo", category: "Arquivos Institucionais",
    description: "Manual oficial de identidade visual (PDF).",
    body: "Documento institucional contendo paleta, tipografia, aplicações e regras de uso.",
    tags: ["manual", "marca", "institucional"],
    author: "Bruno Almeida", status: "Publicado", favorite: true,
    createdAt: ago(120), updatedAt: ago(60),
    versions: [
      { id: uid("v"), label: "v1", body: "Manual 2024.", author: "Bruno", createdAt: ago(180) },
      { id: uid("v"), label: "v2", body: "Atualização 2026.", author: "Bruno", createdAt: ago(60), note: "Nova paleta" },
    ],
    history: [{ id: uid("h"), message: "Versão 2 publicada", author: "Bruno", createdAt: ago(60) }],
    attachmentName: "manual-marca-v2.pdf",
  },
];

function load(): ContentItem[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as ContentItem[];
  } catch { return seed; }
}

let state = load();
const listeners = new Set<() => void>();
function persist() { if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(state)); }
function emit() { persist(); listeners.forEach((l) => l()); }
function pushHistory(c: ContentItem, message: string, author = "Você"): ContentItem {
  return { ...c, history: [{ id: uid("h"), message, author, createdAt: now() }, ...c.history], updatedAt: now() };
}

export const contentStore = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  byId: (id: string) => state.find((c) => c.id === id),
  add(input: Omit<ContentItem, "id" | "createdAt" | "updatedAt" | "versions" | "history" | "favorite"> & { body: string }) {
    const item: ContentItem = {
      ...input,
      id: uid(),
      favorite: false,
      createdAt: now(),
      updatedAt: now(),
      versions: [{ id: uid("v"), label: "v1", body: input.body, author: input.author, createdAt: now() }],
      history: [{ id: uid("h"), message: "Conteúdo criado", author: input.author, createdAt: now() }],
    };
    state = [item, ...state];
    emit();
    return item;
  },
  update(id: string, patch: Partial<ContentItem>, author = "Você") {
    state = state.map((c) => {
      if (c.id !== id) return c;
      let next: ContentItem = { ...c, ...patch, updatedAt: now() };
      if (patch.status && patch.status !== c.status) next = pushHistory(next, `Status: ${c.status} → ${patch.status}`, author);
      if (patch.approver && patch.approver !== c.approver) next = pushHistory(next, `Aprovador definido: ${patch.approver}`, author);
      return next;
    });
    emit();
  },
  toggleFavorite(id: string) {
    state = state.map((c) => c.id === id ? pushHistory({ ...c, favorite: !c.favorite }, c.favorite ? "Removido dos favoritos" : "Marcado como favorito") : c);
    emit();
  },
  addVersion(id: string, body: string, author = "Você", note?: string) {
    state = state.map((c) => {
      if (c.id !== id) return c;
      const label = `v${c.versions.length + 1}`;
      const next = { ...c, body, versions: [...c.versions, { id: uid("v"), label, body, author, createdAt: now(), note }] };
      return pushHistory(next, `Nova versão ${label}${note ? ` — ${note}` : ""}`, author);
    });
    emit();
  },
  remove(id: string) { state = state.filter((c) => c.id !== id); emit(); },
};

export function useContent() {
  return useSyncExternalStore(contentStore.subscribe, contentStore.get, contentStore.get);
}

export const CATEGORY_COLOR: Record<ContentCategory, string> = {
  "Legendas":               "bg-sky-500/15 text-sky-300",
  "Matérias":               "bg-blue-500/15 text-blue-300",
  "Roteiros":               "bg-fuchsia-500/15 text-fuchsia-300",
  "Spot Rádio":             "bg-yellow-500/15 text-yellow-200",
  "E-mails":                "bg-emerald-500/15 text-emerald-300",
  "Comunicados":            "bg-amber-500/15 text-amber-300",
  "Vídeos":                 "bg-pink-500/15 text-pink-300",
  "Stories":                "bg-rose-500/15 text-rose-300",
  "Reels":                  "bg-violet-500/15 text-violet-300",
  "Campanhas":              "bg-indigo-500/15 text-indigo-300",
  "Templates":              "bg-teal-500/15 text-teal-300",
  "Arquivos Institucionais":"bg-lime-500/15 text-lime-300",
};

export function statusTone(s: ContentStatus) {
  switch (s) {
    case "Rascunho":            return "bg-surface-elevated text-muted-foreground";
    case "Em revisão":          return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]";
    case "Aguardando aprovação":return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]";
    case "Aprovado":            return "bg-primary/15 text-primary";
    case "Publicado":           return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]";
    case "Arquivado":           return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
  }
}

export function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
