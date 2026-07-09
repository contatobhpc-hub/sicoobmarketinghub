// Onda 3 — Per-row sync for remaining modules using a single generic
// `entities` table keyed by (user_id, module, id). Same pattern as
// table-sync.ts (Onda 1) but avoids creating a dedicated table per module.
//
// Modules migrated: offline-media, events, projects, kanban, sponsorships,
// inventory, content-library, strategic-planning, indicators, workflows.
//
// Legacy app_state blob is imported once on first hydration and then deleted.

import { supabase } from "@/integrations/supabase/client";
import { loadModuleRecord, setCloudSyncUser } from "./cloud-sync";

type Item = { id: string };

export type EntitySyncConfig<T extends Item> = {
  module: string; // legacy module key AND `entities.module` value
};

type StoreBinding<T extends Item> = {
  getState: () => T[];
  replaceState: (items: T[]) => void;
};

type Ctx<T extends Item> = {
  cfg: EntitySyncConfig<T>;
  bind: StoreBinding<T>;
  userId: string | null;
  snapshot: Map<string, string>;
  timer: ReturnType<typeof setTimeout> | null;
  inflight: boolean;
  pending: boolean;
};

function makeCtx<T extends Item>(cfg: EntitySyncConfig<T>, bind: StoreBinding<T>): Ctx<T> {
  return { cfg, bind, userId: null, snapshot: new Map(), timer: null, inflight: false, pending: false };
}

async function pushNow<T extends Item>(ctx: Ctx<T>) {
  if (!ctx.userId) return;
  const uid = ctx.userId;
  const module = ctx.cfg.module;
  const state = ctx.bind.getState();
  const next = new Map<string, string>();
  const toUpsert: Array<Record<string, unknown>> = [];
  for (const item of state) {
    if (!item || typeof item !== "object" || !item.id) continue;
    const s = JSON.stringify(item);
    next.set(item.id, s);
    if (ctx.snapshot.get(item.id) !== s) {
      toUpsert.push({
        user_id: uid,
        module,
        id: item.id,
        data: item as unknown as Record<string, unknown>,
      });
    }
  }
  const toDelete: string[] = [];
  for (const id of ctx.snapshot.keys()) if (!next.has(id)) toDelete.push(id);

  try {
    if (toUpsert.length) {
      const { error } = await supabase
        .from("entities")
        .upsert(toUpsert, { onConflict: "user_id,module,id" });
      if (error) throw error;
    }
    if (toDelete.length) {
      const { error } = await supabase
        .from("entities")
        .delete()
        .in("id", toDelete)
        .eq("user_id", uid)
        .eq("module", module);
      if (error) throw error;
    }
    ctx.snapshot = next;
  } catch (err) {
    console.error(`[entity-sync:${module}] push`, err);
  }
}

function schedulePush<T extends Item>(ctx: Ctx<T>, delay = 500) {
  if (ctx.timer) clearTimeout(ctx.timer);
  ctx.timer = setTimeout(async () => {
    if (ctx.inflight) { ctx.pending = true; return; }
    ctx.inflight = true;
    try { await pushNow(ctx); }
    finally {
      ctx.inflight = false;
      if (ctx.pending) { ctx.pending = false; schedulePush(ctx, 0); }
    }
  }, delay);
}

async function hydrate<T extends Item>(ctx: Ctx<T>) {
  if (!ctx.userId) return;
  const module = ctx.cfg.module;
  const { data, error } = await supabase
    .from("entities")
    .select("id, data")
    .eq("user_id", ctx.userId)
    .eq("module", module);
  if (error) {
    console.error(`[entity-sync:${module}] load`, error);
    return;
  }
  const cloud: T[] = (data ?? [])
    .map((row) => (row?.data ?? null) as T | null)
    .filter((v): v is T => !!v && typeof v === "object" && typeof (v as Item).id === "string");

  const local = ctx.bind.getState();

  if (cloud.length === 0) {
    // First-time migration from legacy app_state blob.
    const legacy = await loadModuleRecord<T[]>(module);
    const legacyArr = Array.isArray(legacy?.data)
      ? (legacy!.data as T[]).filter((v) => v && typeof v === "object" && typeof (v as Item).id === "string")
      : [];
    if (legacyArr.length) {
      const byId = new Map<string, T>();
      for (const it of legacyArr) byId.set(it.id, it);
      for (const it of local) byId.set(it.id, it); // local wins on collision
      ctx.bind.replaceState(Array.from(byId.values()));
      ctx.snapshot = new Map();
      schedulePush(ctx, 0);
    } else if (local.length) {
      ctx.snapshot = new Map();
      schedulePush(ctx, 0);
    }
    if (legacy) {
      await supabase.from("app_state").delete().eq("module", module).eq("user_id", ctx.userId);
    }
    return;
  }

  const cloudIds = new Set(cloud.map((i) => i.id));
  const localOnly = local.filter((i) => !cloudIds.has(i.id));
  const merged = [...cloud, ...localOnly];
  ctx.snapshot = new Map(cloud.map((i) => [i.id, JSON.stringify(i)]));
  ctx.bind.replaceState(merged);
  if (localOnly.length) schedulePush(ctx, 0);
}

const registered = new Set<string>();

export function enableEntitySync<T extends Item>(
  cfg: EntitySyncConfig<T>,
  bind: StoreBinding<T>,
): () => void {
  const ctx = makeCtx(cfg, bind);
  const push = () => schedulePush(ctx);
  if (typeof window === "undefined") return push;
  if (registered.has(cfg.module)) return push;
  registered.add(cfg.module);

  const onUser = (userId: string | null) => {
    setCloudSyncUser(userId);
    ctx.userId = userId;
    ctx.snapshot = new Map();
    if (userId) void hydrate(ctx);
  };

  supabase.auth
    .getSession()
    .then(({ data }) => onUser(data.session?.user?.id ?? null))
    .catch((error) => console.error(`[entity-sync:${cfg.module}] session`, error));
  supabase.auth.onAuthStateChange((_evt, session) => {
    setTimeout(() => onUser(session?.user?.id ?? null), 0);
  });

  return push;
}
