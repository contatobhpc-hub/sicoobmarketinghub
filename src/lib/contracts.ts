import { useEffect, useSyncExternalStore } from "react";
import { partnersStore, type Partner, type PartnerStatus } from "./partners";
import { enableTableSync } from "./table-sync";
import { isRememberedDeletion, rememberDeletion } from "./deletions";


export const CONTRACT_STATUSES = [
  "Rascunho",
  "Em análise",
  "Assinado",
  "Vigente",
  "Renovação",
  "Encerrado",
  "Cancelado",
] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const CONTRACT_CATEGORIES = [
  "Agência",
  "Mídia",
  "Patrocínio",
  "Fornecedor",
  "Gráfica",
  "Tecnologia",
  "Eventos",
  "Consultoria",
  "Outros",
] as const;
export type ContractCategory = string;

/* ---------- Contract categories store (dynamic, per-module) ---------- */
const CC_KEY = "mhub.contract-categories.v1";
let ccState: string[] = [...CONTRACT_CATEGORIES];
const ccListeners = new Set<() => void>();
if (typeof window !== "undefined") {
  try {
    const raw = window.localStorage.getItem(CC_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "string") && parsed.length) {
        ccState = parsed;
      }
    }
  } catch { /* ignore */ }
}
function ccEmit() {
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(CC_KEY, JSON.stringify(ccState)); } catch { /* ignore */ }
  }
  for (const l of ccListeners) l();
}
export const contractCategoriesStore = {
  get: () => ccState,
  subscribe(l: () => void) { ccListeners.add(l); return () => ccListeners.delete(l); },
  add(name: string) {
    const v = name.trim();
    if (!v) return false;
    if (ccState.some((c) => c.toLowerCase() === v.toLowerCase())) return false;
    ccState = [...ccState, v];
    ccEmit();
    return true;
  },
  remove(name: string) {
    if (!ccState.includes(name)) return;
    ccState = ccState.filter((c) => c !== name);
    ccEmit();
  },
};
export function useContractCategories() {
  return useSyncExternalStore(contractCategoriesStore.subscribe, () => ccState, () => ccState);
}

export const ALERT_DAYS = [90, 60, 30, 15, 7, 1] as const;
export type AlertDay = (typeof ALERT_DAYS)[number];

export type ContractFile = { id: string; name: string; size: number; kind: "pdf" | "attachment"; storagePath?: string };
export type ContractChecklistItem = { id: string; text: string; done: boolean };
export type ContractTimelineEntry = {
  id: string;
  type: "created" | "status" | "field" | "file" | "checklist" | "note" | "alert" | "signature" | "renewal";
  message: string;
  author?: string;
  createdAt: string;
  signature?: string; // hash assinatura do histórico
};

export type Contract = {
  id: string;
  company: string;
  category: ContractCategory;
  object: string;
  value: number;
  costCenter: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  renewalDate?: string;
  autoRenewal: boolean;
  owner: string;
  status: ContractStatus;
  pdfFileId?: string;
  files: ContractFile[];
  checklist: ContractChecklistItem[];
  notes: string;
  alertsTriggered: AlertDay[];
  timeline: ContractTimelineEntry[];
  createdAt: string;
  partnerId?: string;
};

const KEY = "mhub.contracts.v1";
const DELETED_KEY = "mhub.contracts.deleted.v1";
const uid = (p = "ct") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function sign(message: string, author?: string, ts?: string): string {
  // Simple deterministic hash for "assinatura do histórico" (visual)
  const base = `${message}|${author ?? ""}|${ts ?? ""}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = ((h << 5) - h + base.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(16).padStart(8, "0").slice(0, 10);
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);

const seed: Contract[] = [];


function contractDeletionKey(contract: Pick<Contract, "partnerId" | "company">) {
  return contract.partnerId ? `partner:${contract.partnerId}` : `company:${contract.company}`;
}

function isContractDeleted(contract: Pick<Contract, "id" | "partnerId" | "company">) {
  return isRememberedDeletion(DELETED_KEY, {
    id: contract.id,
    name: contract.company,
    key: contractDeletionKey(contract),
  });
}

function isContractSyncDismissed(partner: Pick<Partner, "id" | "company">) {
  return isRememberedDeletion(DELETED_KEY, {
    name: partner.company,
    key: `partner:${partner.id}`,
  });
}

function pruneDeletedContracts(list: Contract[]) {
  return list.filter((contract) => !isContractDeleted(contract));
}

function load(): Contract[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return pruneDeletedContracts(JSON.parse(raw) as Contract[]);
  } catch {
    return [];
  }
}
function save(s: Contract[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

let state: Contract[] = load();
const listeners = new Set<() => void>();
function emit() { save(state); scheduleModulePush("contracts", () => state); listeners.forEach((l) => l()); }

let cloudHydrated = false;
export async function hydrateContractsFromCloud(userId: string | null) {
  setCloudSyncUser(userId);
  if (!userId) { cloudHydrated = false; return; }
  const cloud = await loadModuleRecord<Contract[]>("contracts");
  const local = typeof window !== "undefined" ? load() : [];
  const cloudArr = Array.isArray(cloud?.data) ? pruneDeletedContracts(cloud.data) : [];
  const localDirtyAt = readLocalMutationAt("contracts");
  const localSavedAt = readLocalSavedAt("contracts");
  const cloudUpdatedAt = cloud?.updated_at ? Date.parse(cloud.updated_at) : 0;
  // Keep local when it is newer/richer so the cloud cannot restore deleted rows
  // or overwrite edits made while the previous push was still pending.
  if (localDirtyAt > 0 || (localSavedAt > 0 && localSavedAt > cloudUpdatedAt)) {
    state = local;
    listeners.forEach((l) => l());
    scheduleModulePush("contracts", () => state);
  } else if (cloudArr.length > 0) {
    state = cloudArr;
    save(state);
    listeners.forEach((l) => l());
  } else if (!cloudHydrated) {
    if (state.length) scheduleModulePush("contracts", () => state);
  }
  cloudHydrated = true;
}

if (typeof window !== "undefined") {
  supabase.auth
    .getSession()
    .then(({ data }) => {
      if (data.session?.user) void hydrateContractsFromCloud(data.session.user.id);
    })
    .catch((error) => console.error("[contracts] auth session", error));
  supabase.auth.onAuthStateChange((_evt, session) => {
    setTimeout(() => {
      void hydrateContractsFromCloud(session?.user?.id ?? null);
    }, 0);
  });
}

function pushTimeline(c: Contract, e: Omit<ContractTimelineEntry, "id" | "createdAt" | "signature">): Contract {
  const ts = now();
  const id = uid("tl");
  const signature = sign(e.message, e.author, ts);
  return { ...c, timeline: [{ id, createdAt: ts, signature, ...e }, ...c.timeline] };
}

export const contractsStore = {
  get: () => state,
  subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); },
  byId: (id: string) => state.find((c) => c.id === id),
  add(input: Omit<Contract, "id" | "createdAt" | "timeline" | "alertsTriggered" | "files" | "checklist"> & Partial<Pick<Contract, "files" | "checklist">>): Contract {
    const c: Contract = {
      id: uid(),
      createdAt: now(),
      alertsTriggered: [],
      files: input.files ?? [],
      checklist: input.checklist ?? [],
      timeline: [],
      ...input,
    } as Contract;
    const ts = now();
    c.timeline = [{
      id: uid("tl"),
      createdAt: ts,
      type: "created",
      message: "Contrato cadastrado.",
      author: input.owner || "Sistema",
      signature: sign("Contrato cadastrado.", input.owner, ts),
    }];
    state = [c, ...state];
    emit();
    return c;
  },
  update(id: string, patch: Partial<Contract>, author = "Você") {
    state = state.map((c) => {
      if (c.id !== id) return c;
      let next: Contract = { ...c, ...patch };
      if (patch.status && patch.status !== c.status) {
        next = pushTimeline(next, { type: "status", author, message: `Status alterado de ${c.status} para ${patch.status}.` });
      }
      if (patch.endDate && patch.endDate !== c.endDate) {
        next = pushTimeline(next, { type: "field", author, message: `Vigência atualizada para ${patch.endDate}.` });
      }
      if (typeof patch.autoRenewal === "boolean" && patch.autoRenewal !== c.autoRenewal) {
        next = pushTimeline(next, { type: "renewal", author, message: `Renovação automática ${patch.autoRenewal ? "ativada" : "desativada"}.` });
      }
      return next;
    });
    emit();
  },
  remove(id: string) {
    const removed = state.find((c) => c.id === id);
    if (removed) {
      rememberDeletion(DELETED_KEY, {
        id: removed.id,
        name: removed.company,
        key: contractDeletionKey(removed),
      });
    }
    state = state.filter((c) => c.id !== id);
    emit();
  },
  addFile(id: string, file: Omit<ContractFile, "id">, author = "Você") {
    state = state.map((c) => {
      if (c.id !== id) return c;
      const f = { id: uid("f"), ...file };
      let next = { ...c, files: [...c.files, f] };
      if (file.kind === "pdf" && !c.pdfFileId) next = { ...next, pdfFileId: f.id };
      return pushTimeline(next, { type: "file", author, message: `Anexou ${file.kind === "pdf" ? "PDF do contrato" : "anexo"}: "${file.name}".` });
    });
    emit();
  },
  removeFile(id: string, fileId: string) {
    state = state.map((c) => c.id !== id ? c : ({ ...c, files: c.files.filter((f) => f.id !== fileId), pdfFileId: c.pdfFileId === fileId ? undefined : c.pdfFileId }));
    emit();
  },
  toggleChecklist(id: string, itemId: string, author = "Você") {
    state = state.map((c) => {
      if (c.id !== id) return c;
      const it = c.checklist.find((x) => x.id === itemId);
      if (!it) return c;
      const next = { ...c, checklist: c.checklist.map((x) => x.id === itemId ? { ...x, done: !x.done } : x) };
      return pushTimeline(next, { type: "checklist", author, message: `${!it.done ? "Concluiu" : "Reabriu"}: "${it.text}".` });
    });
    emit();
  },
  addChecklistItem(id: string, text: string, author = "Você") {
    state = state.map((c) => {
      if (c.id !== id) return c;
      const next = { ...c, checklist: [...c.checklist, { id: uid("c"), text, done: false }] };
      return pushTimeline(next, { type: "checklist", author, message: `Adicionou ao checklist: "${text}".` });
    });
    emit();
  },
  addNote(id: string, text: string, author = "Você") {
    state = state.map((c) => c.id !== id ? c : pushTimeline(c, { type: "note", author, message: text }));
    emit();
  },
  acknowledgeAlert(id: string, day: AlertDay, author = "Sistema") {
    state = state.map((c) => {
      if (c.id !== id || c.alertsTriggered.includes(day)) return c;
      const next = { ...c, alertsTriggered: [...c.alertsTriggered, day] };
      return pushTimeline(next, { type: "alert", author, message: `Alerta de ${day} dia(s) para vencimento registrado.` });
    });
    emit();
  },
  syncFromPartners(partners: Partner[]) {
    let changed = false;
    const next = [...state];
    for (const p of partners) {
      if (isContractSyncDismissed(p)) continue;
      const existingIdx = next.findIndex(
        (c) => (p.contractId && c.id === p.contractId) || c.partnerId === p.id || c.company === p.company,
      );
      const startDate = (p.createdAt || now()).slice(0, 10);
      const endDate = p.contractEnd || inDays(365);
      const category = mapPartnerCategory(p.category);
      const status = mapPartnerStatus(p.status);
      const value = Math.round((p.investmentMonth || 0) * 12);
      if (existingIdx === -1) {
        const ts = now();
        const contract: Contract = {
          id: uid(),
          company: p.company,
          category,
          object: p.counterparts || `Parceria com ${p.company}.`,
          value,
          costCenter: "MKT",
          startDate,
          endDate,
          autoRenewal: false,
          owner: p.owner,
          status,
          files: [],
          checklist: [],
          notes: p.notes || "",
          alertsTriggered: [],
          timeline: [{
            id: uid("tl"),
            createdAt: ts,
            type: "created",
            message: `Contrato gerado a partir do parceiro ${p.company}.`,
            author: "Sistema",
            signature: sign("Contrato gerado", "Sistema", ts),
          }],
          createdAt: ts,
          partnerId: p.id,
        };
        next.unshift(contract);
        changed = true;
      } else {
        const c = next[existingIdx];
        if (!c.partnerId || c.company !== p.company || c.endDate !== endDate || c.value !== value || c.category !== category) {
          next[existingIdx] = { ...c, partnerId: p.id, company: p.company, endDate, value, category };
          changed = true;
        }
      }
    }
    if (changed) { state = next; emit(); }
  },
};

function mapPartnerCategory(c: string): ContractCategory {
  // Preserve original partner category so contratos e parceiros exibam a mesma taxonomia.
  return (c && c.trim()) || "Outros";
}
function mapPartnerStatus(s: PartnerStatus): ContractStatus {
  switch (s) {
    case "Ativo": return "Vigente";
    case "Renovação": return "Renovação";
    case "Negociação": return "Em análise";
    case "Prospect": return "Rascunho";
    case "Inativo": return "Encerrado";
  }
}

if (typeof window !== "undefined") {
  partnersStore.hydrate();
  contractsStore.syncFromPartners(partnersStore.get());
  partnersStore.subscribe(() => {
    contractsStore.syncFromPartners(partnersStore.get());
  });
}

export function useContracts() {
  useEffect(() => {
    partnersStore.hydrate();
    contractsStore.syncFromPartners(partnersStore.get());
    const unsub = partnersStore.subscribe(() => {
      contractsStore.syncFromPartners(partnersStore.get());
    });
    return () => { unsub(); };
  }, []);
  return useSyncExternalStore(contractsStore.subscribe, contractsStore.get, contractsStore.get);
}
export function useContract(id: string) {
  return useContracts().find((c) => c.id === id);
}

export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).getTime();
  return Math.ceil((d - Date.now()) / 86400000);
}

export type ContractAlertLevel = "ok" | "soon" | "warning" | "urgent" | "critical" | "expired";
export function alertLevel(c: Contract): { level: ContractAlertLevel; days: number | null; label: string; matchedDay?: AlertDay } {
  const days = daysUntil(c.endDate);
  if (days === null) return { level: "ok", days, label: "Sem vencimento" };
  if (days < 0) return { level: "expired", days, label: `Vencido há ${Math.abs(days)} dia(s)` };
  const matched = ALERT_DAYS.find((d) => days <= d);
  if (!matched) return { level: "ok", days, label: `Vence em ${days} dias` };
  const level: ContractAlertLevel =
    matched <= 1 ? "critical" :
    matched <= 7 ? "urgent" :
    matched <= 30 ? "warning" :
    "soon";
  return { level, days, label: `Vence em ${days} dia(s)`, matchedDay: matched };
}

export function alertTone(level: ContractAlertLevel) {
  switch (level) {
    case "expired":
    case "critical":
      return "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)] border-[color:var(--color-destructive)]/40";
    case "urgent":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/40";
    case "warning":
      return "bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] border-[color:var(--color-warning)]/30";
    case "soon":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] border-[color:var(--color-accent)]/40";
    default:
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)] border-[color:var(--color-success)]/30";
  }
}

export function statusTone(s: ContractStatus) {
  switch (s) {
    case "Vigente":
    case "Assinado":
      return "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]";
    case "Renovação":
      return "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]";
    case "Em análise":
    case "Rascunho":
      return "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]";
    case "Encerrado":
    case "Cancelado":
      return "bg-surface-elevated text-muted-foreground";
  }
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
export function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
export function formatRelative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff / 86400)} d`;
  return formatDate(iso);
}

export function upcomingExpirations(limit = 5): Contract[] {
  return [...state]
    .filter((c) => c.status !== "Encerrado" && c.status !== "Cancelado")
    .filter((c) => {
      const d = daysUntil(c.endDate);
      return d !== null && d <= 90;
    })
    .sort((a, b) => (daysUntil(a.endDate) ?? 0) - (daysUntil(b.endDate) ?? 0))
    .slice(0, limit);
}
