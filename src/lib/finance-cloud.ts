// Onda 2 — Financeiro relacional per-row.
// Substitui o full-replace + snapshot em app_state por upsert/delete por linha,
// escopado por user_id. Migra dados legados de app_state uma única vez.

import { supabase } from "@/integrations/supabase/client";
import type {
  FinanceState,
  FinanceSupplier,
  CostCenter,
  Expense,
  Invoice,
  Payment,
  PurchaseRequest,
  BudgetLine,
  BudgetCategory,
  ExpenseCategory,
  PaymentMethod,
  PRStatus,
  Urgency,
  InvoiceStatus,
  PaymentStatus,
  PRTimelineEntry,
} from "./finance";
import { clearLocalMutation, loadModuleRecord, markLocalMutation } from "./cloud-sync";

let currentUser: string | null = null;
export function setCurrentUser(userId: string | null) {
  currentUser = userId;
  if (!userId) {
    for (const key of Object.keys(snapshots) as (keyof Snapshots)[]) snapshots[key] = new Map();
  }
}

// ---------- snapshots for diffing ----------
type Snapshots = {
  budget: Map<string, string>;
  costCenters: Map<string, string>;
  suppliers: Map<string, string>;
  expenses: Map<string, string>;
  invoices: Map<string, string>;
  payments: Map<string, string>;
  purchaseRequests: Map<string, string>;
};
const snapshots: Snapshots = {
  budget: new Map(),
  costCenters: new Map(),
  suppliers: new Map(),
  expenses: new Map(),
  invoices: new Map(),
  payments: new Map(),
  purchaseRequests: new Map(),
};
const budgetKey = (b: BudgetLine) => `${b.category}`;

// ---------- Load from cloud ----------
export async function loadFinanceFromCloud(): Promise<FinanceState | null> {
  if (!currentUser) return null;
  const uid = currentUser;
  const [budget, cc, sup, exp, pr, inv, pay] = await Promise.all([
    supabase.from("finance_budget").select("*").eq("user_id", uid),
    supabase.from("finance_cost_centers").select("*").eq("user_id", uid),
    supabase.from("finance_suppliers").select("*").eq("user_id", uid),
    supabase.from("finance_expenses").select("*").eq("user_id", uid),
    supabase.from("finance_purchase_requests").select("*").eq("user_id", uid),
    supabase.from("finance_invoices").select("*").eq("user_id", uid),
    supabase.from("finance_payments").select("*").eq("user_id", uid),
  ]);

  if (budget.error || cc.error || sup.error || exp.error || pr.error || inv.error || pay.error) {
    console.error("[finance-cloud] load", { budget: budget.error, cc: cc.error, sup: sup.error, exp: exp.error, pr: pr.error, inv: inv.error, pay: pay.error });
    return null;
  }

  const year = (budget.data?.[0]?.year as number | undefined) ?? new Date().getFullYear();
  const state: FinanceState = {
    year,
    budget: (budget.data ?? []).map((b) => ({
      category: b.category as BudgetCategory,
      planned: Number(b.planned) || 0,
      approved: Number(b.approved) || 0,
    })),
    costCenters: (cc.data ?? []).map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      responsible: c.responsible ?? "",
      active: !!c.active,
    })),
    suppliers: (sup.data ?? []).map((s) => ({
      id: s.id,
      company: s.company,
      category: s.category ?? "",
      city: s.city ?? "",
      contact: s.contact ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      contractRef: s.contract_ref ?? undefined,
      products: s.products ?? [],
      rating: Number(s.rating) || 0,
      partnerId: s.partner_id ?? undefined,
      monthlyInvestment: s.monthly_investment != null ? Number(s.monthly_investment) : undefined,
      annualInvestment: s.annual_investment != null ? Number(s.annual_investment) : undefined,
    })),
    expenses: (exp.data ?? []).map((e) => ({
      id: e.id,
      description: e.description,
      category: (e.category ?? "Outros") as ExpenseCategory,
      supplierId: e.supplier_id ?? undefined,
      campaignId: e.campaign_id ?? undefined,
      costCenterId: e.cost_center_id ?? undefined,
      quantity: Number(e.quantity) || 0,
      unitValue: Number(e.unit_value) || 0,
      date: e.date,
      invoiceId: e.invoice_id ?? undefined,
      attachmentName: e.attachment_name ?? undefined,
      paymentMethod: (e.payment_method ?? "Boleto") as PaymentMethod,
      owner: e.owner ?? "",
      notes: e.notes ?? undefined,
      createdAt: e.created_at,
    })),
    purchaseRequests: (pr.data ?? []).map((p) => ({
      id: p.id,
      code: p.code,
      requester: p.requester ?? "",
      description: p.description,
      justification: p.justification ?? "",
      campaignId: p.campaign_id ?? undefined,
      projectId: p.project_id ?? undefined,
      costCenterId: p.cost_center_id ?? undefined,
      supplierId: p.supplier_id ?? undefined,
      estimatedValue: Number(p.estimated_value) || 0,
      urgency: (p.urgency ?? "Média") as Urgency,
      status: (p.status ?? "Solicitado") as PRStatus,
      createdAt: p.created_at,
      timeline: (p.timeline as PRTimelineEntry[]) ?? [],
    })),
    invoices: (inv.data ?? []).map((i) => ({
      id: i.id,
      number: i.number,
      supplierId: i.supplier_id ?? undefined,
      date: i.date,
      value: Number(i.value) || 0,
      category: (i.category ?? "Outros") as ExpenseCategory,
      costCenterId: i.cost_center_id ?? undefined,
      campaignId: i.campaign_id ?? undefined,
      projectId: i.project_id ?? undefined,
      eventId: i.event_id ?? undefined,
      pdfName: i.pdf_name ?? undefined,
      xmlName: i.xml_name ?? undefined,
      receiptName: i.receipt_name ?? undefined,
      status: (i.status ?? "Pendente") as InvoiceStatus,
      dueDate: i.due_date ?? undefined,
      receivedAt: i.received_at ?? undefined,
      receivedBy: i.received_by ?? undefined,
      sentToPaymentAt: i.sent_to_payment_at ?? undefined,
      sentBy: i.sent_by ?? undefined,
      notes: i.notes ?? undefined,
    })),
    payments: (pay.data ?? []).map((p) => ({
      id: p.id,
      invoiceId: p.invoice_id ?? undefined,
      supplierId: p.supplier_id ?? undefined,
      description: p.description,
      value: Number(p.value) || 0,
      dueDate: p.due_date,
      paidAt: p.paid_at ?? undefined,
      method: (p.method ?? "Boleto") as PaymentMethod,
      status: (p.status ?? "Agendado") as PaymentStatus,
    })),
  };

  // Legacy import (once): if relational is empty AND app_state has finance blob,
  // fill state from app_state and push per-row on next tick, then delete blob.
  const hasAny =
    state.budget.length + state.costCenters.length + state.suppliers.length +
    state.expenses.length + state.invoices.length + state.payments.length +
    state.purchaseRequests.length > 0;
  if (!hasAny) {
    const legacy = await loadModuleRecord<FinanceState>("finance");
    if (legacy?.data && typeof legacy.data === "object") {
      const l = legacy.data as FinanceState;
      if (Array.isArray(l.suppliers)) {
        state.year = l.year || state.year;
        state.budget = Array.isArray(l.budget) ? l.budget : [];
        state.costCenters = Array.isArray(l.costCenters) ? l.costCenters : [];
        state.suppliers = Array.isArray(l.suppliers) ? l.suppliers : [];
        state.expenses = Array.isArray(l.expenses) ? l.expenses : [];
        state.purchaseRequests = Array.isArray(l.purchaseRequests) ? l.purchaseRequests : [];
        state.invoices = Array.isArray(l.invoices) ? l.invoices : [];
        state.payments = Array.isArray(l.payments) ? l.payments : [];
      }
      // limpa snapshots para forçar upsert completo no próximo push
      for (const key of Object.keys(snapshots) as (keyof Snapshots)[]) snapshots[key] = new Map();
      // marca sujo para que schedulePush dispare
      markLocalMutation("finance");
      // apaga blob legado
      await supabase.from("app_state").delete().eq("module", "finance").eq("user_id", uid);
    }
    return state;
  }

  // Preenche snapshots com o que veio do banco
  snapshots.budget = new Map(state.budget.map((b) => [budgetKey(b), JSON.stringify(b)]));
  snapshots.costCenters = new Map(state.costCenters.map((c) => [c.id, JSON.stringify(c)]));
  snapshots.suppliers = new Map(state.suppliers.map((s) => [s.id, JSON.stringify(s)]));
  snapshots.expenses = new Map(state.expenses.map((e) => [e.id, JSON.stringify(e)]));
  snapshots.invoices = new Map(state.invoices.map((i) => [i.id, JSON.stringify(i)]));
  snapshots.payments = new Map(state.payments.map((p) => [p.id, JSON.stringify(p)]));
  snapshots.purchaseRequests = new Map(state.purchaseRequests.map((p) => [p.id, JSON.stringify(p)]));

  return state;
}

// ---------- Push per-row ----------
async function diffAndFlush<T>(
  table:
    | "finance_budget"
    | "finance_cost_centers"
    | "finance_suppliers"
    | "finance_expenses"
    | "finance_invoices"
    | "finance_payments"
    | "finance_purchase_requests",
  items: T[],
  keyOf: (item: T) => string,
  toRow: (item: T) => Record<string, unknown>,
  snapshotKey: keyof Snapshots,
  conflict = "id",
) {
  if (!currentUser) return;
  const uid = currentUser;
  const snap = snapshots[snapshotKey];
  const next = new Map<string, string>();
  const toUpsert: Array<Record<string, unknown>> = [];
  for (const item of items) {
    const k = keyOf(item);
    if (!k) continue;
    const s = JSON.stringify(item);
    next.set(k, s);
    if (snap.get(k) !== s) {
      toUpsert.push({ ...toRow(item), user_id: uid });
    }
  }
  const toDeleteKeys: string[] = [];
  for (const k of snap.keys()) if (!next.has(k)) toDeleteKeys.push(k);

  if (toUpsert.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from(table) as any).upsert(toUpsert, { onConflict: conflict });
    if (error) { console.error(`[finance-cloud:${table}] upsert`, error); return; }
  }
  if (toDeleteKeys.length) {
    if (table === "finance_budget") {
      // budget é chaveado por (user_id, category)
      const { error } = await supabase
        .from(table)
        .delete()
        .in("category", toDeleteKeys)
        .eq("user_id", uid);
      if (error) { console.error(`[finance-cloud:${table}] delete`, error); return; }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table) as any)
        .delete()
        .in("id", toDeleteKeys)
        .eq("user_id", uid);
      if (error) { console.error(`[finance-cloud:${table}] delete`, error); return; }
    }
  }
  snapshots[snapshotKey] = next;
}

async function pushNow(state: FinanceState) {
  if (!currentUser) return false;
  try {
    await diffAndFlush(
      "finance_budget",
      state.budget,
      budgetKey,
      (b) => ({ id: `${state.year}-${b.category}`, year: state.year, category: b.category, planned: b.planned, approved: b.approved }),
      "budget",
      "user_id,category",
    );
    await diffAndFlush<CostCenter>(
      "finance_cost_centers",
      state.costCenters,
      (c) => c.id,
      (c) => ({ id: c.id, code: c.code, name: c.name, responsible: c.responsible, active: c.active }),
      "costCenters",
    );
    await diffAndFlush<FinanceSupplier>(
      "finance_suppliers",
      state.suppliers,
      (s) => s.id,
      (s) => ({
        id: s.id,
        company: s.company,
        category: s.category,
        city: s.city,
        contact: s.contact,
        phone: s.phone,
        email: s.email,
        contract_ref: s.contractRef ?? null,
        products: s.products ?? [],
        rating: s.rating ?? 0,
        partner_id: s.partnerId ?? null,
        monthly_investment: s.monthlyInvestment ?? null,
        annual_investment: s.annualInvestment ?? null,
      }),
      "suppliers",
    );
    await diffAndFlush<Invoice>(
      "finance_invoices",
      state.invoices,
      (i) => i.id,
      (i) => ({
        id: i.id,
        number: i.number,
        supplier_id: i.supplierId ?? null,
        date: i.date,
        value: i.value,
        category: i.category,
        cost_center_id: i.costCenterId ?? null,
        campaign_id: i.campaignId ?? null,
        project_id: i.projectId ?? null,
        event_id: i.eventId ?? null,
        pdf_name: i.pdfName ?? null,
        xml_name: i.xmlName ?? null,
        receipt_name: i.receiptName ?? null,
        status: i.status,
        due_date: i.dueDate ?? null,
        received_at: i.receivedAt ?? null,
        received_by: i.receivedBy ?? null,
        sent_to_payment_at: i.sentToPaymentAt ?? null,
        sent_by: i.sentBy ?? null,
        notes: i.notes ?? null,
      }),
      "invoices",
    );
    await diffAndFlush<Expense>(
      "finance_expenses",
      state.expenses,
      (e) => e.id,
      (e) => ({
        id: e.id,
        description: e.description,
        category: e.category,
        supplier_id: e.supplierId ?? null,
        campaign_id: e.campaignId ?? null,
        cost_center_id: e.costCenterId ?? null,
        quantity: e.quantity,
        unit_value: e.unitValue,
        date: e.date,
        invoice_id: e.invoiceId ?? null,
        attachment_name: e.attachmentName ?? null,
        payment_method: e.paymentMethod,
        owner: e.owner,
        notes: e.notes ?? null,
      }),
      "expenses",
    );
    await diffAndFlush<PurchaseRequest>(
      "finance_purchase_requests",
      state.purchaseRequests,
      (p) => p.id,
      (p) => ({
        id: p.id,
        code: p.code,
        requester: p.requester,
        description: p.description,
        justification: p.justification,
        campaign_id: p.campaignId ?? null,
        project_id: p.projectId ?? null,
        cost_center_id: p.costCenterId ?? null,
        supplier_id: p.supplierId ?? null,
        estimated_value: p.estimatedValue,
        urgency: p.urgency,
        status: p.status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        timeline: p.timeline as any,
      }),
      "purchaseRequests",
    );
    await diffAndFlush<Payment>(
      "finance_payments",
      state.payments,
      (p) => p.id,
      (p) => ({
        id: p.id,
        invoice_id: p.invoiceId ?? null,
        supplier_id: p.supplierId ?? null,
        description: p.description,
        value: p.value,
        due_date: p.dueDate,
        paid_at: p.paidAt ?? null,
        method: p.method,
        status: p.status,
      }),
      "payments",
    );
    return true;
  } catch (err) {
    console.error("[finance-cloud] push", err);
    return false;
  }
}

// Para a unicidade de budget (user_id, category), garantimos um índice único.
// Isso é criado via migração separada quando necessário; upsert usa esse conflito.

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let latestGetter: (() => FinanceState) | null = null;
let syncing = false;
let pending = false;
export function schedulePush(getState: () => FinanceState) {
  latestGetter = getState;
  markLocalMutation("finance");
  if (!currentUser) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (syncing) { pending = true; return; }
    syncing = true;
    try {
      const ok = await pushNow((latestGetter ?? getState)());
      if (ok) clearLocalMutation("finance");
    } finally {
      syncing = false;
      if (pending) { pending = false; schedulePush(latestGetter ?? getState); }
    }
  }, 600);
}
