import { useEffect, useSyncExternalStore } from "react";
import { partnersStore, type Partner } from "./partners";

export const BUDGET_CATEGORIES = [
  "Campanhas Comerciais",
  "Campanhas Institucionais",
  "Eventos",
  "Patrocínios",
  "Brindes",
  "Mídia Offline",
  "Tráfego Pago",
  "Endomarketing",
  "Treinamentos",
  "Comunicação Institucional",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const EXPENSE_CATEGORIES = [
  "Outdoor",
  "Rádio",
  "Vídeo",
  "Fotografia",
  "Brindes",
  "Coffee Break",
  "Locação",
  "Impresso",
  "Facebook Ads",
  "Google Ads",
  "Produção",
  "Eventos",
  "Outros",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_METHODS = ["Boleto", "PIX", "Cartão Corporativo", "Transferência", "Dinheiro"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PR_STATUSES = [
  "Rascunho",
  "Solicitado",
  "Em aprovação",
  "Aprovado",
  "Comprado",
  "Recebido",
  "Concluído",
  "Recusado",
] as const;
export type PRStatus = (typeof PR_STATUSES)[number];

export const URGENCIES = ["Baixa", "Média", "Alta", "Urgente"] as const;
export type Urgency = (typeof URGENCIES)[number];

export const INVOICE_STATUSES = ["Pendente", "Aprovada", "Paga", "Cancelada"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_STATUSES = ["Agendado", "Pago", "Atrasado", "Cancelado"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type BudgetLine = {
  category: BudgetCategory;
  planned: number;
  approved: number;
};

export type CostCenter = {
  id: string;
  code: string;
  name: string;
  responsible: string;
  active: boolean;
};

export type FinanceSupplier = {
  id: string;
  company: string;
  category: string;
  city: string;
  contact: string;
  phone: string;
  email: string;
  contractRef?: string;
  products: string[];
  rating: number; // 0-5
  partnerId?: string;
  monthlyInvestment?: number;
  annualInvestment?: number;
};

export type Expense = {
  id: string;
  description: string;
  category: ExpenseCategory;
  supplierId?: string;
  campaignId?: string;
  costCenterId?: string;
  quantity: number;
  unitValue: number;
  date: string;
  invoiceId?: string;
  attachmentName?: string;
  paymentMethod: PaymentMethod;
  owner: string;
  notes?: string;
  createdAt: string;
};

export type PRTimelineEntry = { id: string; at: string; actor: string; type: string; description: string };

export type PurchaseRequest = {
  id: string;
  code: string;
  requester: string;
  description: string;
  justification: string;
  campaignId?: string;
  projectId?: string;
  costCenterId?: string;
  supplierId?: string;
  estimatedValue: number;
  urgency: Urgency;
  status: PRStatus;
  createdAt: string;
  timeline: PRTimelineEntry[];
};

export type Invoice = {
  id: string;
  number: string;
  supplierId?: string;
  date: string;
  value: number;
  category: ExpenseCategory;
  costCenterId?: string;
  campaignId?: string;
  projectId?: string;
  eventId?: string;
  pdfName?: string;
  xmlName?: string;
  receiptName?: string;
  status: InvoiceStatus;
  dueDate?: string;
  receivedAt?: string;
  receivedBy?: string;
  sentToPaymentAt?: string;
  sentBy?: string;
  notes?: string;
};


export type Payment = {
  id: string;
  invoiceId?: string;
  supplierId?: string;
  description: string;
  value: number;
  dueDate: string;
  paidAt?: string;
  method: PaymentMethod;
  status: PaymentStatus;
};

export type FinanceState = {
  year: number;
  budget: BudgetLine[];
  costCenters: CostCenter[];
  suppliers: FinanceSupplier[];
  expenses: Expense[];
  purchaseRequests: PurchaseRequest[];
  invoices: Invoice[];
  payments: Payment[];
};

const KEY = "mhub.finance.v1";
const uid = (p = "f") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();
const today = () => new Date().toISOString().slice(0, 10);

function seed(): FinanceState {
  const year = new Date().getFullYear();
  const budget: BudgetLine[] = BUDGET_CATEGORIES.map((category, i) => {
    const base = [380000, 220000, 180000, 160000, 90000, 140000, 220000, 60000, 50000, 110000][i] ?? 80000;
    return { category, planned: base, approved: Math.round(base * 0.92) };
  });

  const cc: CostCenter[] = [
    { id: uid("cc"), code: "CC-INST", name: "Institucional", responsible: "Bruno Ferreira", active: true },
    { id: uid("cc"), code: "CC-PROD", name: "Produtos", responsible: "Marina Souza", active: true },
    { id: uid("cc"), code: "CC-EVT", name: "Eventos", responsible: "Carlos Lima", active: true },
    { id: uid("cc"), code: "CC-PAT", name: "Patrocínios", responsible: "Ana Beatriz", active: true },
    { id: uid("cc"), code: "CC-BRI", name: "Brindes", responsible: "Marina Souza", active: true },
    { id: uid("cc"), code: "CC-OUT", name: "Outdoor", responsible: "Carlos Lima", active: true },
    { id: uid("cc"), code: "CC-TV", name: "TV", responsible: "Bruno Ferreira", active: true },
    { id: uid("cc"), code: "CC-RAD", name: "Rádio", responsible: "Bruno Ferreira", active: true },
    { id: uid("cc"), code: "CC-DIG", name: "Digital", responsible: "Marina Souza", active: true },
    { id: uid("cc"), code: "CC-TRE", name: "Treinamentos", responsible: "Ana Beatriz", active: true },
    { id: uid("cc"), code: "CC-END", name: "Endomarketing", responsible: "Ana Beatriz", active: true },
  ];

  const suppliers: FinanceSupplier[] = [
    { id: uid("sup"), company: "Outdoor Brasil Mídia", category: "Mídia Offline", city: "Salvador", contact: "Renata Alves", phone: "(71) 99999-0001", email: "comercial@outdoorbrasil.com", contractRef: "CT-2025-014", products: ["Outdoor", "Backbus"], rating: 4.6 },
    { id: uid("sup"), company: "Rádio Cidade FM", category: "Rádio", city: "Senhor do Bonfim", contact: "José Pereira", phone: "(74) 99888-1234", email: "comercial@radiocidade.fm", contractRef: "CT-2025-021", products: ["Spot 30s", "Patrocínio"], rating: 4.2 },
    { id: uid("sup"), company: "Gráfica Premium", category: "Gráfica", city: "Feira de Santana", contact: "Lucas Cardoso", phone: "(75) 99777-2222", email: "atendimento@premium.com.br", products: ["Folder", "Banner", "Adesivo"], rating: 4.7 },
    { id: uid("sup"), company: "Mídia Digital BA", category: "Tráfego Pago", city: "Salvador", contact: "Camila Rocha", phone: "(71) 99777-3333", email: "ads@midiadigital.com", products: ["Meta Ads", "Google Ads"], rating: 4.4 },
    { id: uid("sup"), company: "Brindes Norte Bahia", category: "Brindes", city: "Juazeiro", contact: "Felipe Costa", phone: "(74) 99666-4444", email: "vendas@brindesnb.com", products: ["Garrafa", "Caneca", "Camiseta"], rating: 4.0 },
  ];

  const expenses: Expense[] = [
    { id: uid("exp"), description: "Outdoor Av. Centenário (15 dias)", category: "Outdoor", supplierId: suppliers[0].id, costCenterId: cc[5].id, quantity: 4, unitValue: 1850, date: today(), paymentMethod: "Boleto", owner: "Bruno Ferreira", createdAt: now() },
    { id: uid("exp"), description: "Spot 30s Plano Safra", category: "Rádio", supplierId: suppliers[1].id, costCenterId: cc[7].id, quantity: 60, unitValue: 95, date: today(), paymentMethod: "Boleto", owner: "Carlos Lima", createdAt: now() },
    { id: uid("exp"), description: "Impulsionamento Meta Ads — Junho", category: "Facebook Ads", supplierId: suppliers[3].id, costCenterId: cc[8].id, quantity: 1, unitValue: 8500, date: today(), paymentMethod: "Cartão Corporativo", owner: "Marina Souza", createdAt: now() },
    { id: uid("exp"), description: "Brindes Dia do Cooperativismo", category: "Brindes", supplierId: suppliers[4].id, costCenterId: cc[4].id, quantity: 300, unitValue: 42, date: today(), paymentMethod: "PIX", owner: "Marina Souza", createdAt: now() },
  ];

  const prs: PurchaseRequest[] = [
    {
      id: uid("pr"), code: "SC-0231", requester: "Marina Souza",
      description: "Confecção de 500 camisetas Cooperjovem",
      justification: "Distribuição no evento Cooperjovem em julho",
      costCenterId: cc[4].id, supplierId: suppliers[4].id, estimatedValue: 18500,
      urgency: "Alta", status: "Em aprovação", createdAt: now(),
      timeline: [
        { id: uid("tl"), at: now(), actor: "Marina Souza", type: "Criação", description: "Solicitação criada" },
        { id: uid("tl"), at: now(), actor: "Sistema", type: "Encaminhamento", description: "Enviada para aprovação do gestor" },
      ],
    },
    {
      id: uid("pr"), code: "SC-0232", requester: "Carlos Lima",
      description: "Locação de palco para evento Mulheres Cooperativistas",
      justification: "Evento institucional confirmado para 14/07",
      costCenterId: cc[2].id, estimatedValue: 12800,
      urgency: "Urgente", status: "Aprovado", createdAt: now(),
      timeline: [
        { id: uid("tl"), at: now(), actor: "Carlos Lima", type: "Criação", description: "Solicitação criada" },
        { id: uid("tl"), at: now(), actor: "Bruno Ferreira", type: "Aprovação", description: "Aprovada pelo gestor" },
      ],
    },
  ];

  const invoices: Invoice[] = [
    { id: uid("nf"), number: "NF-001245", supplierId: suppliers[0].id, date: today(), value: 7400, category: "Outdoor", costCenterId: cc[5].id, status: "Aprovada" },
    { id: uid("nf"), number: "NF-022109", supplierId: suppliers[2].id, date: today(), value: 3200, category: "Impresso", costCenterId: cc[0].id, status: "Pendente" },
  ];

  const payments: Payment[] = [
    { id: uid("pay"), invoiceId: invoices[0].id, supplierId: suppliers[0].id, description: "Outdoor Av. Centenário", value: 7400, dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), method: "Boleto", status: "Agendado" },
    { id: uid("pay"), invoiceId: invoices[1].id, supplierId: suppliers[2].id, description: "Folders institucionais", value: 3200, dueDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10), method: "PIX", status: "Atrasado" },
  ];

  return { year, budget, costCenters: cc, suppliers, expenses, purchaseRequests: prs, invoices, payments };
}

let state: FinanceState = (() => {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as FinanceState;
  } catch {}
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
  return s;
})();

const listeners = new Set<() => void>();
function emit() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) { listeners.add(l); return () => listeners.delete(l); }

export const financeStore = {
  get: () => state,
  setBudget: (category: BudgetCategory, patch: Partial<Pick<BudgetLine, "planned" | "approved">>) => {
    state = { ...state, budget: state.budget.map((b) => (b.category === category ? { ...b, ...patch } : b)) };
    emit();
  },
  setYear: (year: number) => { state = { ...state, year }; emit(); },
  addExpense: (input: Omit<Expense, "id" | "createdAt">) => {
    const exp: Expense = { ...input, id: uid("exp"), createdAt: now() };
    state = { ...state, expenses: [exp, ...state.expenses] };
    emit();
    return exp;
  },
  removeExpense: (id: string) => {
    state = { ...state, expenses: state.expenses.filter((e) => e.id !== id) };
    emit();
  },
  addPurchaseRequest: (input: Omit<PurchaseRequest, "id" | "code" | "createdAt" | "timeline" | "status"> & { status?: PRStatus }) => {
    const code = `SC-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const pr: PurchaseRequest = {
      ...input,
      id: uid("pr"),
      code,
      createdAt: now(),
      status: input.status ?? "Solicitado",
      timeline: [{ id: uid("tl"), at: now(), actor: input.requester, type: "Criação", description: "Solicitação criada" }],
    };
    state = { ...state, purchaseRequests: [pr, ...state.purchaseRequests] };
    emit();
    return pr;
  },
  advancePR: (id: string, next: PRStatus, actor: string) => {
    state = {
      ...state,
      purchaseRequests: state.purchaseRequests.map((p) =>
        p.id === id
          ? {
              ...p,
              status: next,
              timeline: [...p.timeline, { id: uid("tl"), at: now(), actor, type: "Status", description: `Status alterado para ${next}` }],
            }
          : p,
      ),
    };
    emit();
  },
  addSupplier: (input: Omit<FinanceSupplier, "id">) => {
    state = { ...state, suppliers: [{ ...input, id: uid("sup") }, ...state.suppliers] };
    emit();
  },
  updateSupplier: (id: string, patch: Partial<Omit<FinanceSupplier, "id">>) => {
    state = { ...state, suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
    emit();
  },
  removeSupplier: (id: string) => {
    state = {
      ...state,
      suppliers: state.suppliers.filter((s) => s.id !== id),
      expenses: state.expenses.map((e) => (e.supplierId === id ? { ...e, supplierId: undefined } : e)),
      invoices: state.invoices.map((i) => (i.supplierId === id ? { ...i, supplierId: undefined } : i)),
      payments: state.payments.map((p) => (p.supplierId === id ? { ...p, supplierId: undefined } : p)),
      purchaseRequests: state.purchaseRequests.map((pr) =>
        pr.supplierId === id ? { ...pr, supplierId: undefined } : pr,
      ),
    };
    emit();
  },
  addCostCenter: (input: Omit<CostCenter, "id">) => {
    state = { ...state, costCenters: [{ ...input, id: uid("cc") }, ...state.costCenters] };
    emit();
  },
  addInvoice: (input: Omit<Invoice, "id">) => {
    state = { ...state, invoices: [{ ...input, id: uid("nf") }, ...state.invoices] };
    emit();
  },
  removeInvoice: (id: string) => {
    state = { ...state, invoices: state.invoices.filter((i) => i.id !== id) };
    emit();
  },
  toggleInvoiceReceived: (id: string, actor: string) => {
    state = {
      ...state,
      invoices: state.invoices.map((i) =>
        i.id === id
          ? i.receivedAt
            ? { ...i, receivedAt: undefined, receivedBy: undefined }
            : { ...i, receivedAt: now(), receivedBy: actor }
          : i,
      ),
    };
    emit();
  },
  toggleInvoiceSent: (id: string, actor: string) => {
    state = {
      ...state,
      invoices: state.invoices.map((i) =>
        i.id === id
          ? i.sentToPaymentAt
            ? { ...i, sentToPaymentAt: undefined, sentBy: undefined }
            : { ...i, sentToPaymentAt: now(), sentBy: actor, status: i.status === "Pendente" ? "Aprovada" : i.status }
          : i,
      ),
    };
    emit();
  },
  markPaid: (paymentId: string) => {
    state = {
      ...state,
      payments: state.payments.map((p) => (p.id === paymentId ? { ...p, status: "Pago", paidAt: today() } : p)),
    };
    emit();
  },
  syncFromPartners: (partners: Partner[]) => {
    let changed = false;
    const next = [...state.suppliers];
    for (const p of partners) {
      const idx = next.findIndex(
        (s) => (s.partnerId && s.partnerId === p.id) || s.company.toLowerCase() === p.company.toLowerCase(),
      );
      if (idx === -1) {
        next.unshift({
          id: uid("sup"),
          company: p.company,
          category: p.category || "Outros",
          city: p.city || "",
          contact: p.contact || "",
          phone: p.phone || "",
          email: p.email || "",
          contractRef: p.contractId,
          products: [],
          rating: 5,
          partnerId: p.id,
          monthlyInvestment: p.investmentMonth || 0,
          annualInvestment: Math.round((p.investmentMonth || 0) * 12),
        });
        changed = true;
      } else {
        const s = next[idx];
        const patch: FinanceSupplier = {
          ...s,
          partnerId: p.id,
          company: p.company,
          category: p.category || s.category,
          city: p.city || s.city,
          contact: p.contact || s.contact,
          phone: p.phone || s.phone,
          email: p.email || s.email,
          contractRef: p.contractId ?? s.contractRef,
          monthlyInvestment: p.investmentMonth || 0,
          annualInvestment: Math.round((p.investmentMonth || 0) * 12),
        };
        if (JSON.stringify(patch) !== JSON.stringify(s)) {
          next[idx] = patch;
          changed = true;
        }
      }
    }
    if (changed) {
      state = { ...state, suppliers: next };
      emit();
    }
  },
  syncMonthlyInvoicesFromSuppliers: (month: string) => {
    // month = "YYYY-MM"
    let changed = false;
    const next = [...state.invoices];
    for (const s of state.suppliers) {
      const value = s.monthlyInvestment ?? 0;
      if (value <= 0) continue;
      const number = `AUTO-${s.id}-${month}`;
      const existingIdx = next.findIndex((i) => i.number === number);
      if (existingIdx === -1) {
        next.unshift({
          id: uid("nf"),
          number,
          supplierId: s.id,
          date: `${month}-01`,
          value,
          category: "Outros",
          status: "Pendente",
          notes: `Gerada automaticamente a partir do investimento mensal de ${s.company}.`,
        });
        changed = true;
      } else if (next[existingIdx].value !== value) {
        next[existingIdx] = { ...next[existingIdx], value };
        changed = true;
      }
    }
    if (changed) {
      state = { ...state, invoices: next };
      emit();
    }
  },
};

if (typeof window !== "undefined") {
  partnersStore.hydrate();
  financeStore.syncFromPartners(partnersStore.get());
  partnersStore.subscribe(() => {
    financeStore.syncFromPartners(partnersStore.get());
  });
}

export function useFinance() {
  useEffect(() => {
    partnersStore.hydrate();
    financeStore.syncFromPartners(partnersStore.get());
    const unsub = partnersStore.subscribe(() => {
      financeStore.syncFromPartners(partnersStore.get());
    });
    return () => { unsub(); };
  }, []);
  return useSyncExternalStore(subscribe, financeStore.get, financeStore.get);
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function expenseTotal(e: Expense) {
  return e.quantity * e.unitValue;
}

export function categoryUsage(state: FinanceState, category: BudgetCategory): number {
  // Heuristic mapping from ExpenseCategory + costCenter to BudgetCategory
  const map: Record<ExpenseCategory, BudgetCategory> = {
    Outdoor: "Mídia Offline",
    Rádio: "Mídia Offline",
    Vídeo: "Comunicação Institucional",
    Fotografia: "Comunicação Institucional",
    Brindes: "Brindes",
    "Coffee Break": "Eventos",
    Locação: "Eventos",
    Impresso: "Comunicação Institucional",
    "Facebook Ads": "Tráfego Pago",
    "Google Ads": "Tráfego Pago",
    Produção: "Campanhas Comerciais",
    Eventos: "Eventos",
    Outros: "Campanhas Institucionais",
  };
  return state.expenses
    .filter((e) => map[e.category] === category)
    .reduce((acc, e) => acc + expenseTotal(e), 0);
}

export type FinanceAlert = {
  id: string;
  level: "info" | "warning" | "danger";
  title: string;
  detail: string;
};

export function computeAlerts(state: FinanceState): FinanceAlert[] {
  const alerts: FinanceAlert[] = [];
  state.budget.forEach((b) => {
    const used = categoryUsage(state, b.category);
    const pct = b.approved > 0 ? used / b.approved : 0;
    if (pct >= 1) {
      alerts.push({
        id: `over-${b.category}`,
        level: "danger",
        title: `Orçamento de ${b.category} ultrapassado`,
        detail: `${formatBRL(used)} utilizados de ${formatBRL(b.approved)} aprovados.`,
      });
    } else if (pct >= 0.8) {
      alerts.push({
        id: `near-${b.category}`,
        level: "warning",
        title: `${b.category} atingiu ${Math.round(pct * 100)}% do orçamento`,
        detail: `Considere reavaliar novos compromissos.`,
      });
    }
  });
  state.payments
    .filter((p) => p.status === "Atrasado" || (p.status === "Agendado" && daysUntil(p.dueDate) <= 3))
    .forEach((p) =>
      alerts.push({
        id: `pay-${p.id}`,
        level: p.status === "Atrasado" ? "danger" : "warning",
        title: `Pagamento ${p.status === "Atrasado" ? "vencido" : "vencendo"}: ${p.description}`,
        detail: `${formatBRL(p.value)} • ${p.dueDate}`,
      }),
    );
  state.invoices
    .filter((i) => i.status === "Pendente")
    .slice(0, 3)
    .forEach((i) =>
      alerts.push({
        id: `nf-${i.id}`,
        level: "info",
        title: `Nota Fiscal ${i.number} pendente`,
        detail: `${formatBRL(i.value)} aguardando aprovação.`,
      }),
    );
  state.suppliers
    .filter((s) => !s.contractRef)
    .slice(0, 2)
    .forEach((s) =>
      alerts.push({
        id: `sup-${s.id}`,
        level: "info",
        title: `Fornecedor ${s.company} sem contrato vinculado`,
        detail: "Anexe um contrato para garantir compliance.",
      }),
    );
  return alerts;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}
