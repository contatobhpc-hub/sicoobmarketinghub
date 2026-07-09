import { useSyncExternalStore } from "react";
import { enableCloudSync } from "./cloud-sync";

export const INVENTORY_CATEGORIES = [
  "Vestuário",
  "Papelaria",
  "Tecnologia",
  "Bebidas",
  "Alimentos",
  "Acessórios",
  "Decoração",
  "Material gráfico",
  "Kits institucionais",
  "Outros",
] as const;
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];

export const MOVEMENT_TYPES = ["Entrada", "Saída", "Transferência", "Reserva", "Inventário"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type InventoryPhoto = { id: string; name: string; size: number };

export type InventoryMovement = {
  id: string;
  type: MovementType;
  quantity: number; // positive number; type defines direction
  reason: string;
  author: string;
  destination?: string; // for transfer / saída
  campaign?: string;
  campaignId?: string;
  event?: string;
  eventId?: string;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  internalCode: string;
  qrCode: string;
  name: string;
  category: InventoryCategory;
  supplier: string;
  quantity: number;
  minQuantity: number;
  unitValue: number;
  location: string;
  reserved: number;
  photos: InventoryPhoto[];
  notes: string;
  movements: InventoryMovement[];
  createdAt: string;
};

const KEY = "mhub.inventory.v1";
const uid = (p = "inv") => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

function code(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

const seed: InventoryItem[] = [
  {
    id: uid(),
    internalCode: "BR-CAM-001",
    qrCode: code("QR"),
    name: "Camiseta Polo Institucional",
    category: "Vestuário",
    supplier: "Confecções Cerrado",
    quantity: 320,
    minQuantity: 100,
    unitValue: 38,
    location: "Almoxarifado — Estante A2",
    reserved: 60,
    photos: [],
    notes: "Tamanhos P/M/G/GG. Logo bordado.",
    movements: [
      { id: uid("mv"), type: "Entrada", quantity: 500, reason: "Compra inicial", author: "Bruno", createdAt: now() },
      { id: uid("mv"), type: "Saída", quantity: 180, reason: "ExpoAgro 2025", event: "ExpoAgro 2025", author: "Diego", createdAt: now() },
    ],
    createdAt: now(),
  },
  {
    id: uid(),
    internalCode: "BR-CAN-014",
    qrCode: code("QR"),
    name: "Caneta Metálica",
    category: "Papelaria",
    supplier: "Brindes Plus",
    quantity: 85,
    minQuantity: 200,
    unitValue: 6.5,
    location: "Almoxarifado — Caixa B1",
    reserved: 0,
    photos: [],
    notes: "Estoque baixo. Repor com urgência.",
    movements: [
      { id: uid("mv"), type: "Entrada", quantity: 1000, reason: "Lote anual", author: "Camila", createdAt: now() },
      { id: uid("mv"), type: "Saída", quantity: 915, reason: "Eventos diversos", author: "Camila", createdAt: now() },
    ],
    createdAt: now(),
  },
  {
    id: uid(),
    internalCode: "BR-GAR-022",
    qrCode: code("QR"),
    name: "Garrafa Térmica 500ml",
    category: "Acessórios",
    supplier: "TechBrindes",
    quantity: 210,
    minQuantity: 80,
    unitValue: 42,
    location: "Almoxarifado — Estante C1",
    reserved: 30,
    photos: [],
    notes: "",
    movements: [
      { id: uid("mv"), type: "Entrada", quantity: 250, reason: "Reposição Q2", author: "Bruno", createdAt: now() },
      { id: uid("mv"), type: "Reserva", quantity: 30, reason: "Festival Sertanejo", event: "Festival Sertanejo 2026", author: "Larissa", createdAt: now() },
    ],
    createdAt: now(),
  },
  {
    id: uid(),
    internalCode: "BR-KIT-007",
    qrCode: code("QR"),
    name: "Kit Boas-vindas Cooperado",
    category: "Kits institucionais",
    supplier: "Montagem interna",
    quantity: 42,
    minQuantity: 50,
    unitValue: 78,
    location: "Sala de marketing — Armário 3",
    reserved: 12,
    photos: [],
    notes: "Caneca + caneta + bloco + sacola.",
    movements: [
      { id: uid("mv"), type: "Inventário", quantity: 42, reason: "Inventário mensal", author: "Camila", createdAt: now() },
    ],
    createdAt: now(),
  },
];

function load(): InventoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as InventoryItem[];
  } catch {
    return [];
  }
}
function save(s: InventoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

let state: InventoryItem[] = load();
const listeners = new Set<() => void>();
const cloudPush = enableCloudSync<InventoryItem[]>("inventory", () => state, (s) => { state = s; listeners.forEach((l) => l()); });
function emit() {
  save(state);
  cloudPush();
  listeners.forEach((l) => l());
}

export const inventoryStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  byId: (id: string) => state.find((i) => i.id === id),
  add(input: Partial<InventoryItem> & Pick<InventoryItem, "name" | "category" | "supplier" | "quantity" | "minQuantity" | "unitValue" | "location">): InventoryItem {
    const item: InventoryItem = {
      id: uid(),
      internalCode: input.internalCode ?? code("BR"),
      qrCode: input.qrCode ?? code("QR"),
      reserved: 0,
      photos: [],
      notes: "",
      movements: [],
      createdAt: now(),
      ...input,
    };
    const opening: InventoryMovement = {
      id: uid("mv"),
      type: "Entrada",
      quantity: item.quantity,
      reason: "Cadastro inicial",
      author: "Sistema",
      createdAt: now(),
    };
    item.movements = [opening];
    state = [item, ...state];
    emit();
    return item;
  },
  update(id: string, patch: Partial<InventoryItem>) {
    state = state.map((i) => (i.id === id ? { ...i, ...patch } : i));
    emit();
  },
  remove(id: string) {
    state = state.filter((i) => i.id !== id);
    emit();
  },
  registerMovement(id: string, mv: Omit<InventoryMovement, "id" | "createdAt">) {
    state = state.map((i) => {
      if (i.id !== id) return i;
      const entry: InventoryMovement = { id: uid("mv"), createdAt: now(), ...mv };
      let qty = i.quantity;
      let reserved = i.reserved;
      switch (mv.type) {
        case "Entrada":
          qty += mv.quantity;
          break;
        case "Saída":
        case "Transferência":
          qty -= mv.quantity;
          break;
        case "Reserva":
          reserved += mv.quantity;
          break;
        case "Inventário":
          qty = mv.quantity;
          break;
      }
      return { ...i, quantity: Math.max(0, qty), reserved: Math.max(0, reserved), movements: [entry, ...i.movements] };
    });
    emit();
  },
};

export function useInventory() {
  return useSyncExternalStore(inventoryStore.subscribe, inventoryStore.get, inventoryStore.get);
}

export type StockStatus = "ok" | "low" | "out";
export function stockStatus(i: InventoryItem): StockStatus {
  if (i.quantity <= 0) return "out";
  if (i.quantity <= i.minQuantity) return "low";
  return "ok";
}

export const CATEGORY_TONE: Record<InventoryCategory, string> = {
  Vestuário: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  Papelaria: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Tecnologia: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Bebidas: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  Alimentos: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  Acessórios: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
  Decoração: "bg-pink-500/15 text-pink-300 border-pink-500/30",
  "Material gráfico": "bg-lime-500/15 text-lime-300 border-lime-500/30",
  "Kits institucionais": "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Outros: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export const MOVEMENT_TONE: Record<MovementType, string> = {
  Entrada: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Saída: "bg-red-500/15 text-red-300 border-red-500/30",
  Transferência: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Reserva: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Inventário: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

// Monthly consumption: total Saída + Transferência per month over last N months
export function monthlyConsumption(items: InventoryItem[], months = 6) {
  const buckets: { label: string; key: string; qty: number; value: number }[] = [];
  const today = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    buckets.push({
      label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      qty: 0,
      value: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  items.forEach((i) => {
    i.movements.forEach((m) => {
      if (m.type !== "Saída" && m.type !== "Transferência") return;
      const d = new Date(m.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const b = byKey.get(k);
      if (!b) return;
      b.qty += m.quantity;
      b.value += m.quantity * i.unitValue;
    });
  });
  return buckets;
}
