import { useMemo } from "react";
import { useCampaigns, type Campaign } from "./campaigns";
import { useContracts, alertLevel, type Contract } from "./contracts";
import { useEvents, type EventItem } from "./events";
import { useInventory, stockStatus, type InventoryItem } from "./inventory";
import { usePartners, renewalAlert, type Partner } from "./partners";
import { useProjects, type Project } from "./projects";
import { useSponsorships, computeAlerts, type Sponsorship } from "./sponsorships";
import { useOfflineMedia, daysUntil as mediaDaysUntil, type OfflineMedia } from "./offline-media";

export type PriorityKind =
  | "campaign"
  | "contract"
  | "event"
  | "inventory"
  | "partner"
  | "project"
  | "sponsorship"
  | "media"
  | "meeting";

export type PriorityItem = {
  id: string;
  kind: PriorityKind;
  icon: string; // emoji
  title: string;
  context: string;
  due?: string; // human label
  daysLeft?: number | null;
  urgency: number; // 0-100
  impact: number; // 0-100
  score: number;
  tone: "critical" | "warning" | "info" | "success";
  href: string;
};

export type Recommendation = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  action?: { label: string; href: string };
  tone: "insight" | "action" | "risk";
};

function daysBetween(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

function scoreOf(urgency: number, impact: number) {
  return Math.round(urgency * 0.65 + impact * 0.35);
}

function toneFromDays(d: number | null | undefined): PriorityItem["tone"] {
  if (d == null) return "info";
  if (d < 0) return "critical";
  if (d <= 3) return "critical";
  if (d <= 7) return "warning";
  if (d <= 15) return "info";
  return "success";
}

function impactFromPriority(p?: string) {
  switch (p) {
    case "Crítica": return 100;
    case "Alta": return 80;
    case "Média": return 55;
    case "Baixa": return 30;
    default: return 50;
  }
}

function fromCampaign(c: Campaign): PriorityItem | null {
  if (c.status === "Concluída" || c.status === "Cancelada") return null;
  const d = daysBetween(c.endDate);
  const needsApproval = c.status === "Rascunho" || c.status === "Planejamento";
  const urgency = needsApproval ? 90 : Math.max(0, Math.min(100, 100 - d * 3));
  const impact = impactFromPriority(c.priority);
  return {
    id: `campaign-${c.id}`,
    kind: "campaign",
    icon: c.priority === "Crítica" ? "🔥" : "📢",
    title: needsApproval ? `Aprovar Campanha ${c.name}` : `Campanha ${c.name}`,
    context: `${c.type} • ${c.status}`,
    due: d >= 0 ? `encerra em ${d}d` : `encerrada há ${-d}d`,
    daysLeft: d,
    urgency,
    impact,
    score: scoreOf(urgency, impact),
    tone: needsApproval ? "critical" : toneFromDays(d),
    href: `/campanhas/${c.id}`,
  };
}

function fromContract(c: Contract): PriorityItem | null {
  const a = alertLevel(c);
  if (a.level === "ok") return null;
  const d = a.days ?? -1;
  const urgency = d < 0 ? 100 : Math.max(20, 100 - d * 1.2);
  return {
    id: `contract-${c.id}`,
    kind: "contract",
    icon: "⚠",
    title: `Contrato ${c.title} ${d < 0 ? "vencido" : `vence em ${d} dia${d === 1 ? "" : "s"}`}`,
    context: `${c.category} • ${c.partner ?? "—"}`,
    due: d >= 0 ? `${d}d restantes` : `há ${-d}d`,
    daysLeft: d,
    urgency,
    impact: 85,
    score: scoreOf(urgency, 85),
    tone: d < 0 ? "critical" : d <= 7 ? "critical" : d <= 30 ? "warning" : "info",
    href: `/contratos`,
  };
}

function fromEvent(e: EventItem): PriorityItem | null {
  if (e.status === "Concluído" || e.status === "Cancelado") return null;
  const d = daysBetween(e.date);
  if (d < -1 || d > 30) return null;
  const checklistDone = e.checklist.filter((c) => c.done).length;
  const checklistTotal = e.checklist.length || 1;
  const completion = checklistDone / checklistTotal;
  const urgency = Math.max(0, 100 - d * 4) + (completion < 0.6 ? 10 : 0);
  return {
    id: `event-${e.id}`,
    kind: "event",
    icon: d <= 1 ? "📢" : "📅",
    title: `Evento ${e.name}${d === 1 ? " amanhã" : d === 0 ? " hoje" : ""}`,
    context: `${e.type} • ${e.city ?? "—"} • checklist ${Math.round(completion * 100)}%`,
    due: d === 0 ? "hoje" : d === 1 ? "amanhã" : `em ${d}d`,
    daysLeft: d,
    urgency: Math.min(100, urgency),
    impact: impactFromPriority(e.priority),
    score: scoreOf(Math.min(100, urgency), impactFromPriority(e.priority)),
    tone: toneFromDays(d),
    href: `/eventos`,
  };
}

function fromInventory(i: InventoryItem): PriorityItem | null {
  const s = stockStatus(i);
  if (s === "ok") return null;
  return {
    id: `inv-${i.id}`,
    kind: "inventory",
    icon: "🎁",
    title: `Estoque de ${i.name} ${s === "out" ? "esgotado" : "abaixo do mínimo"}`,
    context: `${i.category} • ${i.quantity}/${i.minStock} un.`,
    due: s === "out" ? "reposição imediata" : "reabastecer",
    urgency: s === "out" ? 100 : 75,
    impact: 60,
    score: scoreOf(s === "out" ? 100 : 75, 60),
    tone: s === "out" ? "critical" : "warning",
    href: `/brindes`,
  };
}

function fromPartner(p: Partner): PriorityItem | null {
  const a = renewalAlert(p);
  if (a.level === "ok") return null;
  const d = a.days ?? 0;
  return {
    id: `partner-${p.id}`,
    kind: "partner",
    icon: "📄",
    title: `Parceiro ${p.name} ${a.level === "expired" ? "vencido" : `renovar em ${d}d`}`,
    context: `${p.category} • ${p.status}`,
    due: a.label,
    daysLeft: d,
    urgency: a.level === "expired" ? 100 : a.level === "urgent" ? 85 : 55,
    impact: 65,
    score: scoreOf(a.level === "expired" ? 100 : a.level === "urgent" ? 85 : 55, 65),
    tone: a.level === "expired" ? "critical" : a.level === "urgent" ? "warning" : "info",
    href: `/parceiros`,
  };
}

function fromProject(p: Project): PriorityItem | null {
  if (p.status === "Concluído" || p.status === "Cancelado") return null;
  const d = daysBetween(p.dueDate);
  if (d > 14) return null;
  return {
    id: `project-${p.id}`,
    kind: "project",
    icon: d < 0 ? "🔥" : "📋",
    title: `Projeto ${p.name}${d < 0 ? " atrasado" : ""}`,
    context: `${p.status} • ${p.progress}%`,
    due: d < 0 ? `${-d}d atrasado` : `em ${d}d`,
    daysLeft: d,
    urgency: d < 0 ? 95 : Math.max(40, 100 - d * 5),
    impact: impactFromPriority(p.priority),
    score: scoreOf(d < 0 ? 95 : Math.max(40, 100 - d * 5), impactFromPriority(p.priority)),
    tone: toneFromDays(d),
    href: `/projetos/${p.id}`,
  };
}

function fromSponsorship(s: Sponsorship): PriorityItem | null {
  const alerts = computeAlerts(s);
  if (!alerts.length) return null;
  const top = alerts[0];
  return {
    id: `spons-${s.id}`,
    kind: "sponsorship",
    icon: "🤝",
    title: `Patrocínio ${s.name}: ${top.message}`,
    context: `${s.category} • ${s.city ?? "—"}`,
    due: top.message,
    urgency: 70,
    impact: 70,
    score: scoreOf(70, 70),
    tone: "warning",
    href: `/patrocinios`,
  };
}

function fromMedia(m: OfflineMedia): PriorityItem | null {
  const d = mediaDaysUntil(m.removalDate);
  if (d > 15) return null;
  return {
    id: `media-${m.id}`,
    kind: "media",
    icon: "📍",
    title: `Mídia ${m.title} ${d < 0 ? "vencida" : `retirar em ${d}d`}`,
    context: `${m.category} • ${m.city}`,
    due: d < 0 ? `há ${-d}d` : `em ${d}d`,
    daysLeft: d,
    urgency: d < 0 ? 95 : Math.max(40, 100 - d * 5),
    impact: 55,
    score: scoreOf(d < 0 ? 95 : Math.max(40, 100 - d * 5), 55),
    tone: toneFromDays(d),
    href: `/midia-offline`,
  };
}

export function useCommandCenter() {
  const campaigns = useCampaigns();
  const contracts = useContracts();
  const events = useEvents();
  const inventory = useInventory();
  const partners = usePartners();
  const projects = useProjects();
  const sponsorships = useSponsorships();
  const media = useOfflineMedia();

  return useMemo(() => {
    const items: PriorityItem[] = [];
    campaigns.forEach((c) => { const x = fromCampaign(c); if (x) items.push(x); });
    contracts.forEach((c) => { const x = fromContract(c); if (x) items.push(x); });
    events.forEach((e) => { const x = fromEvent(e); if (x) items.push(x); });
    inventory.forEach((i) => { const x = fromInventory(i); if (x) items.push(x); });
    partners.forEach((p) => { const x = fromPartner(p); if (x) items.push(x); });
    projects.forEach((p) => { const x = fromProject(p); if (x) items.push(x); });
    sponsorships.forEach((s) => { const x = fromSponsorship(s); if (x) items.push(x); });
    media.forEach((m) => { const x = fromMedia(m); if (x) items.push(x); });

    // Static meeting hint (placeholder integration with calendar)
    items.push({
      id: "meeting-1400",
      kind: "meeting",
      icon: "📅",
      title: "Reunião de Pauta às 14h",
      context: "Sala Inovação • 8 participantes",
      due: "hoje",
      daysLeft: 0,
      urgency: 80,
      impact: 50,
      score: scoreOf(80, 50),
      tone: "info",
      href: `/calendario`,
    });

    items.sort((a, b) => b.score - a.score);

    // AI recommendations derived from the same datasets
    const recs: Recommendation[] = [];

    const dadosDosPais = campaigns.find((c) => /pais/i.test(c.name));
    if (dadosDosPais) {
      recs.push({
        id: "rec-pais",
        icon: "🧠",
        title: `Antecipe a produção do material da campanha ${dadosDosPais.name}`,
        detail: "A IA detectou janela de produção apertada considerando aprovações e mídia.",
        action: { label: "Abrir campanha", href: `/campanhas/${dadosDosPais.id}` },
        tone: "action",
      });
    } else {
      recs.push({
        id: "rec-pais-fallback",
        icon: "🧠",
        title: "Antecipe a produção do material do Dia dos Pais",
        detail: "Recomendado iniciar criação 45 dias antes para garantir aprovação e mídia.",
        action: { label: "Criar campanha", href: "/campanhas" },
        tone: "action",
      });
    }

    const radioContract = contracts.find((c) => /r[áa]dio/i.test(c.title));
    if (radioContract) {
      const a = alertLevel(radioContract);
      recs.push({
        id: "rec-radio",
        icon: "📻",
        title: `Renove o contrato da ${radioContract.title}`,
        detail: a.label || "Contrato próximo do vencimento — inicie negociação.",
        action: { label: "Ver contrato", href: "/contratos" },
        tone: "risk",
      });
    }

    const semIndicadores = campaigns.filter(
      (c) => c.status === "Ativa" && (!c.kpis || c.kpis.length === 0),
    );
    if (semIndicadores.length) {
      recs.push({
        id: "rec-kpis",
        icon: "📊",
        title: `Há ${semIndicadores.length} campanhas sem indicadores definidos`,
        detail: "Defina KPIs para mensurar ROI e justificar investimentos à diretoria.",
        action: { label: "Abrir indicadores", href: "/indicadores" },
        tone: "insight",
      });
    }

    const eventosSemChecklist = events.filter(
      (e) =>
        e.status !== "Concluído" &&
        e.status !== "Cancelado" &&
        e.checklist.filter((c) => c.done).length / Math.max(1, e.checklist.length) < 0.6,
    );
    if (eventosSemChecklist.length >= 2) {
      recs.push({
        id: "rec-checklist",
        icon: "✅",
        title: `${eventosSemChecklist.length} eventos com checklist incompleto`,
        detail: "Complete a logística para reduzir risco operacional na semana do evento.",
        action: { label: "Ir para eventos", href: "/eventos" },
        tone: "action",
      });
    }

    const baixoEstoque = inventory.filter((i) => stockStatus(i) !== "ok");
    if (baixoEstoque.length) {
      recs.push({
        id: "rec-estoque",
        icon: "🎁",
        title: "Reabasteça o estoque de brindes em até 15 dias",
        detail: `${baixoEstoque.length} item(ns) abaixo do mínimo — risco de ruptura em eventos próximos.`,
        action: { label: "Abrir estoque", href: "/brindes" },
        tone: "risk",
      });
    }

    const renovacoes = partners.filter((p) => {
      const a = renewalAlert(p);
      return a.level === "soon" || a.level === "urgent";
    });
    if (renovacoes.length) {
      recs.push({
        id: "rec-parceiros",
        icon: "🤝",
        title: `${renovacoes.length} parceria(s) próximas de renovação`,
        detail: "Inicie tratativas agora para evitar ruptura de contrapartidas.",
        action: { label: "Ver parceiros", href: "/parceiros" },
        tone: "insight",
      });
    }

    // KPIs
    const kpis = {
      critical: items.filter((i) => i.tone === "critical").length,
      today: items.filter((i) => i.daysLeft === 0).length,
      week: items.filter((i) => (i.daysLeft ?? 99) <= 7 && (i.daysLeft ?? -1) >= 0).length,
      total: items.length,
    };

    return { items, recommendations: recs, kpis };
  }, [campaigns, contracts, events, inventory, partners, projects, sponsorships, media]);
}
