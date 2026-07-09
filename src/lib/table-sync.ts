// Per-entity Supabase sync for Onda 1 modules (partners, contracts, campaigns,
// calendar_events). Replaces the app_state blob push with per-row upsert/delete
// so mutations don't race and DELETE is real.
//
// Each module supplies:
//   - table: Supabase table name
//   - key:   legacy module key (used to migrate from app_state and to key debounce timers)
//   - cols:  (item) => indexed columns to persist alongside the JSONB `data`

import { supabase } from "@/integrations/supabase/client";
import { loadModuleRecord, setCloudSyncUser } from "./cloud-sync";

type Item = { id: string };
export type TableSyncConfig<T extends Item> = {
  table: "partners" | "contracts" | "campaigns" | "calendar_events";
  key: string; // legacy module key in app_state
  cols: (item: T) => Record<string, unknown>;
};

type StoreBinding<T extends Item> = {
  getState: () => T[];
  replaceState: (items: T[]) => void;
};

type Ctx<T extends Item> = {
  cfg: TableSyncConfig<T>;
  bind: StoreBinding<T>;
  userId: string | null;
  snapshot: Map<string, string>;
  timer: ReturnType<typeof setTimeout> | null;
  inflight: boolean;
  pending: boolean;
};

function makeCtx<T extends Item>(cfg: TableSyncConfig<T>, bind: StoreBinding<T>): Ctx<T> {
  return { cfg, bind, userId: null, snapshot: new Map(), timer: null, inflight: false, pending: false };
}

async function pushNow<T extends Item>(ctx: Ctx<T>) {
  if (!ctx.userId) return;
  const state = ctx.bind.getState();
  const next = new Map<string, string>();
  const toUpsert: Array<Record<string, unknown>> = [];
  for (const item of state) {
    if (!item || typeof item !== "object" || !item.id) continue;
    const s = JSON.stringify(item);
    next.set(item.id, s);
    if (ctx.snapshot.get(item.id) !== s) {
      toUpsert.push({
        id: item.id,
        user_id: ctx.userId,
        ...ctx.cfg.cols(item),
        data: item as unknown as Record<string, unknown>,
      });
    }
  }
  const toDelete: string[] = [];
  for (const id of ctx.snapshot.keys()) if (!next.has(id)) toDelete.push(id);

  try {
    if (toUpsert.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(ctx.cfg.table) as any)
        .upsert(toUpsert, { onConflict: "id" });
      if (error) throw error;
    }
    if (toDelete.length) {
      const { error } = await supabase
        .from(ctx.cfg.table)
        .delete()
        .in("id", toDelete)
        .eq("user_id", ctx.userId);
      if (error) throw error;
    }
    ctx.snapshot = next;
  } catch (err) {
    console.error(`[table-sync:${ctx.cfg.table}] push`, err);
  }
}

function schedulePush<T extends Item>(ctx: Ctx<T>, delay = 500) {
  if (ctx.timer) clearTimeout(ctx.timer);
  ctx.timer = setTimeout(async () => {
    if (ctx.inflight) {
      ctx.pending = true;
      return;
    }
    ctx.inflight = true;
    try {
      await pushNow(ctx);
    } finally {
      ctx.inflight = false;
      if (ctx.pending) {
        ctx.pending = false;
        schedulePush(ctx, 0);
      }
    }
  }, delay);
}

async function hydrate<T extends Item>(ctx: Ctx<T>) {
  if (!ctx.userId) return;
  const { data, error } = await supabase
    .from(ctx.cfg.table)
    .select("id, data")
    .eq("user_id", ctx.userId);
  if (error) {
    console.error(`[table-sync:${ctx.cfg.table}] load`, error);
    return;
  }
  const cloud: T[] = (data ?? [])
    .map((row) => (row?.data ?? null) as T | null)
    .filter((v): v is T => !!v && typeof v === "object" && typeof (v as Item).id === "string");

  const local = ctx.bind.getState();

  // First-time migration: cloud is empty → import legacy app_state blob if any.
  if (cloud.length === 0) {
    const legacy = await loadModuleRecord<T[]>(ctx.cfg.key);
    const legacyArr = Array.isArray(legacy?.data)
      ? (legacy!.data as T[]).filter((v) => v && typeof v === "object" && typeof (v as Item).id === "string")
      : [];
    if (legacyArr.length) {
      // Merge with local (local wins for same id).
      const byId = new Map<string, T>();
      for (const it of legacyArr) byId.set(it.id, it);
      for (const it of local) byId.set(it.id, it);
      const merged = Array.from(byId.values());
      ctx.bind.replaceState(merged);
      ctx.snapshot = new Map(); // force full upsert
      schedulePush(ctx, 0);
    } else if (local.length) {
      ctx.snapshot = new Map();
      schedulePush(ctx, 0);
    }
    // Drop legacy blob (module now owned by relational table).
    if (legacy) {
      await supabase
        .from("app_state")
        .delete()
        .eq("module", ctx.cfg.key)
        .eq("user_id", ctx.userId);
    }
    return;
  }

  // Cloud is source of truth. Preserve local-only items (created offline while
  // hydration was pending) by merging them on top.
  const cloudIds = new Set(cloud.map((i) => i.id));
  const localOnly = local.filter((i) => !cloudIds.has(i.id));
  const merged = [...cloud, ...localOnly];
  ctx.snapshot = new Map(cloud.map((i) => [i.id, JSON.stringify(i)]));
  ctx.bind.replaceState(merged);
  if (localOnly.length) schedulePush(ctx, 0);
}

const registered = new Set<string>();

export function enableTableSync<T extends Item>(
  cfg: TableSyncConfig<T>,
  bind: StoreBinding<T>,
): () => void {
  const ctx = makeCtx(cfg, bind);
  const push = () => schedulePush(ctx);
  if (typeof window === "undefined") return push;
  if (registered.has(cfg.key)) return push;
  registered.add(cfg.key);

  const onUser = (userId: string | null) => {
    setCloudSyncUser(userId);
    ctx.userId = userId;
    ctx.snapshot = new Map();
    if (userId) void hydrate(ctx);
  };

  supabase.auth
    .getSession()
    .then(({ data }) => onUser(data.session?.user?.id ?? null))
    .catch((error) => console.error(`[table-sync:${cfg.table}] session`, error));
  supabase.auth.onAuthStateChange((_evt, session) => {
    setTimeout(() => onUser(session?.user?.id ?? null), 0);
  });

  return push;
}
