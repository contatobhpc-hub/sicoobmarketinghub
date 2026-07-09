// Cloud sync layer for the finance module.
// Loads state from Supabase on login, writes back on every mutation (debounced).
// Preserves the synchronous financeStore API used across the app.

import { supabase } from "@/integrations/supabase/client";
import type { FinanceState, FinanceSupplier, CostCenter, Expense, Invoice, Payment, PurchaseRequest, BudgetLine, BudgetCategory, ExpenseCategory, PaymentMethod, PRStatus, Urgency, InvoiceStatus, PaymentStatus, PRTimelineEntry } from "./finance";
import { clearLocalMutation, loadModuleState, markLocalMutation } from "./cloud-sync";

let syncing = false;
let pending = false;
let latestGetter: (() => FinanceState) | null = null;
let currentUser: string | null = null;

export function setCurrentUser(userId: string | null) {
  currentUser = userId;
}

// ---------- Load from cloud ----------
export async function loadFinanceFromCloud(): Promise<FinanceState | null> {
  const snapshot = await loadModuleState<FinanceState>("finance");
  if (snapshot) return snapshot;

  const [budget, cc, sup, exp, pr, inv, pay] = await Promise.all([
    supabase.from("finance_budget").select("*"),
    supabase.from("finance_cost_centers").select("*"),
    supabase.from("finance_suppliers").select("*"),
    supabase.from("finance_expenses").select("*"),
    supabase.from("finance_purchase_requests").select("*"),
    supabase.from("finance_invoices").select("*"),
    supabase.from("finance_payments").select("*"),
  ]);

  if (budget.error || cc.error || sup.error || exp.error || pr.error || inv.error || pay.error) {
    console.error("[finance-cloud] load error", { budget: budget.error, cc: cc.error, sup: sup.error, exp: exp.error, pr: pr.error, inv: inv.error, pay: pay.error });
    return null;
  }

  const year = (budget.data?.[0]?.year as number | undefined) ?? new Date().getFullYear();

  return {
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
}

// ---------- Push to cloud (full replace, debounced) ----------
function isUuid(v: string | undefined | null): v is string {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

async function pushNow(state: FinanceState) {
  if (!currentUser) return false;

  const { error: snapshotError } = await supabase
    .from("app_state")
    .upsert(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { module: "finance", data: state as any, updated_by: currentUser },
      { onConflict: "module" },
    );
  if (snapshotError) {
    console.error("[finance-cloud] snapshot", snapshotError);
    return false;
  }

  // Full replace strategy for simplicity. Volume is low.
  const deletes = await Promise.all([
    supabase.from("finance_payments").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("finance_invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("finance_purchase_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("finance_expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("finance_suppliers").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("finance_cost_centers").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    supabase.from("finance_budget").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
  ]);
  const deleteErrors = deletes.filter((d) => d.error).map((d) => d.error);
  if (deleteErrors.length) {
    console.error("[finance-cloud] delete", deleteErrors);
    return false;
  }

  // Budget
  if (state.budget.length) {
    const { error } = await supabase.from("finance_budget").insert(
      state.budget.map((b) => ({ year: state.year, category: b.category, planned: b.planned, approved: b.approved })),
    );
    if (error) { console.error("[finance-cloud] budget", error); return false; }
  }

  // Cost centers — need to preserve ids used by other tables. Only push UUID ids;
  // legacy string ids from seed get remapped to fresh UUIDs.
  const ccIdMap = new Map<string, string>();
  const ccRows = state.costCenters.map((c) => {
    const id = isUuid(c.id) ? c.id : crypto.randomUUID();
    ccIdMap.set(c.id, id);
    return { id, code: c.code, name: c.name, responsible: c.responsible, active: c.active };
  });
  if (ccRows.length) {
    const { error } = await supabase.from("finance_cost_centers").insert(ccRows);
    if (error) { console.error("[finance-cloud] cc", error); return false; }
  }

  const supIdMap = new Map<string, string>();
  const supRows = state.suppliers.map((s) => {
    const id = isUuid(s.id) ? s.id : crypto.randomUUID();
    supIdMap.set(s.id, id);
    return {
      id,
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
    };
  });
  if (supRows.length) {
    const { error } = await supabase.from("finance_suppliers").insert(supRows);
    if (error) { console.error("[finance-cloud] sup", error); return false; }
  }

  const invIdMap = new Map<string, string>();
  const invRows = state.invoices.map((i) => {
    const id = isUuid(i.id) ? i.id : crypto.randomUUID();
    invIdMap.set(i.id, id);
    return {
      id,
      number: i.number,
      supplier_id: i.supplierId ? supIdMap.get(i.supplierId) ?? null : null,
      date: i.date,
      value: i.value,
      category: i.category,
      cost_center_id: i.costCenterId ? ccIdMap.get(i.costCenterId) ?? null : null,
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
    };
  });
  if (invRows.length) {
    const { error } = await supabase.from("finance_invoices").insert(invRows);
    if (error) { console.error("[finance-cloud] inv", error); return false; }
  }

  const expRows = state.expenses.map((e) => ({
    id: isUuid(e.id) ? e.id : crypto.randomUUID(),
    description: e.description,
    category: e.category,
    supplier_id: e.supplierId ? supIdMap.get(e.supplierId) ?? null : null,
    campaign_id: e.campaignId ?? null,
    cost_center_id: e.costCenterId ? ccIdMap.get(e.costCenterId) ?? null : null,
    quantity: e.quantity,
    unit_value: e.unitValue,
    date: e.date,
    invoice_id: e.invoiceId ? invIdMap.get(e.invoiceId) ?? null : null,
    attachment_name: e.attachmentName ?? null,
    payment_method: e.paymentMethod,
    owner: e.owner,
    notes: e.notes ?? null,
  }));
  if (expRows.length) {
    const { error } = await supabase.from("finance_expenses").insert(expRows);
    if (error) { console.error("[finance-cloud] exp", error); return false; }
  }

  const prRows = state.purchaseRequests.map((p) => ({
    id: isUuid(p.id) ? p.id : crypto.randomUUID(),
    code: p.code,
    requester: p.requester,
    description: p.description,
    justification: p.justification,
    campaign_id: p.campaignId ?? null,
    project_id: p.projectId ?? null,
    cost_center_id: p.costCenterId ? ccIdMap.get(p.costCenterId) ?? null : null,
    supplier_id: p.supplierId ? supIdMap.get(p.supplierId) ?? null : null,
    estimated_value: p.estimatedValue,
    urgency: p.urgency,
    status: p.status,
    timeline: p.timeline,
  }));
  if (prRows.length) {
    const { error } = await supabase.from("finance_purchase_requests").insert(prRows);
    if (error) { console.error("[finance-cloud] pr", error); return false; }
  }

  const payRows = state.payments.map((p) => ({
    id: isUuid(p.id) ? p.id : crypto.randomUUID(),
    invoice_id: p.invoiceId ? invIdMap.get(p.invoiceId) ?? null : null,
    supplier_id: p.supplierId ? supIdMap.get(p.supplierId) ?? null : null,
    description: p.description,
    value: p.value,
    due_date: p.dueDate,
    paid_at: p.paidAt ?? null,
    method: p.method,
    status: p.status,
  }));
  if (payRows.length) {
    const { error } = await supabase.from("finance_payments").insert(payRows);
    if (error) { console.error("[finance-cloud] pay", error); return false; }
  }
  return true;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
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
  }, 800);
}
