// Aggregated indicators for the Analytics module.
// Pulls from existing in-memory stores; falls back to deterministic mocks.

export type ModuleKey =
  | "campanhas"
  | "projetos"
  | "eventos"
  | "conteudos"
  | "parceiros"
  | "contratos"
  | "brindes"
  | "financeiro"
  | "midia-offline"
  | "kanban";

export const MODULES: { key: ModuleKey; label: string }[] = [
  { key: "campanhas", label: "Campanhas" },
  { key: "projetos", label: "Projetos" },
  { key: "eventos", label: "Eventos" },
  { key: "conteudos", label: "Conteúdos" },
  { key: "parceiros", label: "Parceiros" },
  { key: "contratos", label: "Contratos" },
  { key: "brindes", label: "Brindes" },
  { key: "financeiro", label: "Financeiro" },
  { key: "midia-offline", label: "Mídia Offline" },
  { key: "kanban", label: "Kanban" },
];

export type Kpi = { label: string; value: string; delta?: string; trend?: "up" | "down" | "flat" };

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// Deterministic seed so charts are stable
function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1664525 + 1013904223) % 2 ** 32;
    return x / 2 ** 32;
  };
}

export function getKpis(module: ModuleKey): Kpi[] {
  const r = seeded(module.length * 137);
  const base: Record<ModuleKey, Kpi[]> = {
    campanhas: [
      { label: "Ativas", value: "18", delta: "+12%", trend: "up" },
      { label: "Encerradas", value: "47", delta: "+5%", trend: "up" },
      { label: "Investimento", value: fmtBRL(842000), delta: "+8%", trend: "up" },
      { label: "Retorno (ROI)", value: "3.4x", delta: "+0.4x", trend: "up" },
    ],
    projetos: [
      { label: "Em andamento", value: "32", delta: "+4", trend: "up" },
      { label: "Concluídos", value: "128", delta: "+18", trend: "up" },
      { label: "Tempo médio", value: "12.4 dias", delta: "-1.2d", trend: "up" },
      { label: "Atrasados", value: "5", delta: "-2", trend: "up" },
    ],
    eventos: [
      { label: "Realizados", value: "26", delta: "+6", trend: "up" },
      { label: "Agendados", value: "9" },
      { label: "Investimento", value: fmtBRL(312000), delta: "+11%", trend: "up" },
      { label: "Público total", value: "14.2k", delta: "+22%", trend: "up" },
    ],
    conteudos: [
      { label: "Publicados", value: "342", delta: "+58", trend: "up" },
      { label: "Engajamento", value: "7.8%", delta: "+0.6pp", trend: "up" },
      { label: "Templates", value: "84" },
      { label: "Em aprovação", value: "12" },
    ],
    parceiros: [
      { label: "Ativos", value: "47" },
      { label: "Novos no mês", value: "6", delta: "+3", trend: "up" },
      { label: "Renovações", value: "11" },
      { label: "ROI médio", value: "2.9x", delta: "+0.2x", trend: "up" },
    ],
    contratos: [
      { label: "Vigentes", value: "63" },
      { label: "Vencendo 30d", value: "8", delta: "+2", trend: "down" },
      { label: "Valor total", value: fmtBRL(1240000) },
      { label: "Pendentes", value: "4" },
    ],
    brindes: [
      { label: "SKUs", value: "126" },
      { label: "Estoque baixo", value: "9", trend: "down" },
      { label: "Consumo mês", value: "2.4k un.", delta: "+18%", trend: "up" },
      { label: "Valor estoque", value: fmtBRL(186000) },
    ],
    financeiro: [
      { label: "Orçamento", value: fmtBRL(2400000) },
      { label: "Executado", value: fmtBRL(1620000), delta: "67%", trend: "up" },
      { label: "Saldo", value: fmtBRL(780000) },
      { label: "Comprometido", value: fmtBRL(420000) },
    ],
    "midia-offline": [
      { label: "Instaladas", value: "38" },
      { label: "Cidades", value: "6" },
      { label: "Retirada 7d", value: "6", trend: "down" },
      { label: "Investimento", value: fmtBRL(218000) },
    ],
    kanban: [
      { label: "Tarefas totais", value: "486" },
      { label: "Em andamento", value: "112" },
      { label: "Concluídas", value: "298", delta: "+34", trend: "up" },
      { label: "Tempo médio", value: "4.2 dias", delta: "-0.6d", trend: "up" },
    ],
  };
  void r;
  return base[module];
}

export function getLineSeries(module: ModuleKey) {
  const r = seeded(module.charCodeAt(0) * 31);
  return MONTHS.map((m) => ({
    name: m,
    investimento: Math.round(60000 + r() * 120000),
    retorno: Math.round(120000 + r() * 280000),
  }));
}

export function getBarSeries(module: ModuleKey) {
  const r = seeded(module.length * 53 + 7);
  const cats = ["Institucional", "Produto", "Sazonal", "Cooperado", "Educação", "Social"];
  return cats.map((c) => ({ name: c, valor: Math.round(20 + r() * 80) }));
}

export function getPieSeries(module: ModuleKey) {
  const r = seeded(module.length * 89);
  const cats = ["Digital", "Offline", "Eventos", "Patrocínio", "Conteúdo"];
  return cats.map((c) => ({ name: c, value: Math.round(10 + r() * 40) }));
}

export function getRadarSeries() {
  return [
    { eixo: "Alcance", A: 120, B: 110 },
    { eixo: "Engajamento", A: 98, B: 130 },
    { eixo: "Conversão", A: 86, B: 95 },
    { eixo: "ROI", A: 99, B: 100 },
    { eixo: "Awareness", A: 85, B: 90 },
    { eixo: "Retenção", A: 65, B: 85 },
  ];
}

export function getHeatmap() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const hours = ["08h", "10h", "12h", "14h", "16h", "18h", "20h"];
  const r = seeded(42);
  return days.map((d) => ({
    day: d,
    cells: hours.map((h) => ({ hour: h, v: Math.round(r() * 100) })),
  }));
}

export function getTimeline() {
  return [
    { date: "10/06", titulo: "Lançamento Campanha Junho Solidário", tipo: "Campanha" },
    { date: "14/06", titulo: "Aprovação contrato Agência Norte", tipo: "Contrato" },
    { date: "18/06", titulo: "Evento Assembleia Regional", tipo: "Evento" },
    { date: "22/06", titulo: "Instalação outdoor – Av. Central", tipo: "Mídia Offline" },
    { date: "25/06", titulo: "Entrega de brindes Cooperado VIP", tipo: "Brindes" },
    { date: "28/06", titulo: "Fechamento financeiro mensal", tipo: "Financeiro" },
  ];
}

export const CHART_PALETTE = [
  "oklch(0.68 0.18 264)",
  "oklch(0.72 0.16 200)",
  "oklch(0.78 0.16 145)",
  "oklch(0.82 0.16 80)",
  "oklch(0.74 0.18 30)",
  "oklch(0.70 0.18 320)",
];
