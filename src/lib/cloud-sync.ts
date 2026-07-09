// Generic per-module cloud state sync using the app_state table.
// Each module stores its entire array (or object) as a JSONB blob keyed by module name.

import { supabase } from "@/integrations/supabase/client";

let currentUserId: string | null = null;
export function setCloudSyncUser(id: string | null) {
  currentUserId = id;
}
export function getCloudSyncUser() {
  return currentUserId;
}

type ModuleRecord<T> = { data: T | null; updated_at?: string | null };

const dirtyKey = (module: string) => `mhub.cloud-sync.${module}.dirtyAt.v1`;
const savedKey = (module: string) => `mhub.cloud-sync.${module}.savedAt.v1`;

function stateWeight(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (!value || typeof value !== "object") return value == null ? 0 : 1;
  return Object.values(value as Record<string, unknown>).reduce<number>((total, item) => total + stateWeight(item), 0);
}

export function hasMeaningfulState(value: unknown) {
  return stateWeight(value) > 0;
}

function readTimestamp(key: string) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(key);
  const value = raw ? Number(raw) : 0;
  return Number.isFinite(value) ? value : 0;
}

export function readLocalMutationAt(module: string) {
  return readTimestamp(dirtyKey(module));
}

export function readLocalSavedAt(module: string) {
  return readTimestamp(savedKey(module));
}

export function markLocalMutation(module: string) {
  if (typeof window === "undefined") return;
  try {
    const ts = String(Date.now());
    window.localStorage.setItem(dirtyKey(module), ts);
  } catch {
    // ignore quota/storage errors
  }
}

function arrayIds(value: unknown) {
  if (!Array.isArray(value)) return null;
  const ids = value
    .map((item) => (item && typeof item === "object" ? (item as { id?: unknown }).id : undefined))
    .filter((id): id is string => typeof id === "string" && id.length > 0);
  return ids.length === value.length ? new Set(ids) : null;
}

function shouldKeepLocalState<T>(local: T, cloud: T, cloudUpdatedAt: number, localSavedAt: number) {
  if (localSavedAt > 0 && (!cloudUpdatedAt || localSavedAt > cloudUpdatedAt)) return true;

  const localIds = arrayIds(local);
  const cloudIds = arrayIds(cloud);
  if (!localIds || !cloudIds || localIds.size === 0 || cloudIds.size <= localIds.size || localSavedAt <= 0) return false;

  // If cloud is only a superset of the local list, the extra rows are usually
  // stale records that were deleted locally but later rehydrated by an old copy.
  return [...localIds].every((id) => cloudIds.has(id));
}

export function clearLocalMutation(module: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(savedKey(module), String(Date.now()));
    window.localStorage.removeItem(dirtyKey(module));
  } catch {
    // ignore quota/storage errors
  }
}

export async function loadModuleRecord<T>(module: string): Promise<ModuleRecord<T> | null> {
  const { data, error } = await supabase
    .from("app_state")
    .select("data, updated_at")
    .eq("module", module)
    .maybeSingle();
  if (error) {
    console.error(`[cloud-sync:${module}] load`, error);
    return null;
  }
  if (!data) return null;
  return { data: (data.data ?? null) as T | null, updated_at: data.updated_at as string | null };
}

export async function loadModuleState<T>(module: string): Promise<T | null> {
  const record = await loadModuleRecord<T>(module);
  return record?.data ?? null;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const inflight = new Set<string>();
const pending = new Set<string>();

async function pushNow<T>(module: string, getter: () => T) {
  if (!currentUserId) return false;
  const payload = getter();
  const { error } = await supabase
    .from("app_state")
    .upsert(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { module, data: payload as any, updated_by: currentUserId },
      { onConflict: "module" },
    );
  if (error) {
    console.error(`[cloud-sync:${module}] push`, error);
    return false;
  }
  return true;
}

export function scheduleModulePush<T>(module: string, getter: () => T, delay = 700) {
  markLocalMutation(module);
  if (!currentUserId) return;
  const prev = timers.get(module);
  if (prev) clearTimeout(prev);
  timers.set(
    module,
    setTimeout(async () => {
      if (inflight.has(module)) {
        pending.add(module);
        return;
      }
      inflight.add(module);
      try {
        const ok = await pushNow(module, getter);
        if (ok) clearLocalMutation(module);
      } finally {
        inflight.delete(module);
        if (pending.delete(module)) scheduleModulePush(module, getter, 0);
      }
    }, delay),
  );
}

// Convenience: hooks a module store to auth + cloud. Returns a `push` fn to call from emit().
const attached = new Set<string>();
export function enableCloudSync<T>(
  module: string,
  getState: () => T,
  replaceState: (s: T) => void,
) {
  const push = () => scheduleModulePush(module, getState);
  if (typeof window === "undefined") return push;
  if (attached.has(module)) return push;
  attached.add(module);
  const hydrate = async (userId: string | null) => {
    setCloudSyncUser(userId);
    if (!userId) return;
    const record = await loadModuleRecord<T>(module);
    if (!record || record.data == null) {
      const localDirtyAt = readLocalMutationAt(module);
      const localState = getState();
      if (localDirtyAt > 0 || hasMeaningfulState(localState)) {
        scheduleModulePush(module, getState);
      }
      return;
    }
    const localDirtyAt = readLocalMutationAt(module);
    const localSavedAt = readLocalSavedAt(module);
    const cloudUpdatedAt = record.updated_at ? Date.parse(record.updated_at) : 0;
    if (localDirtyAt > 0 && (!cloudUpdatedAt || localDirtyAt >= cloudUpdatedAt)) {
      scheduleModulePush(module, getState, 0);
      return;
    }
    if (shouldKeepLocalState(getState(), record.data, cloudUpdatedAt, localSavedAt)) {
      scheduleModulePush(module, getState, 0);
      return;
    }
    replaceState(record.data);
    clearLocalMutation(module);
  };
  supabase.auth
    .getSession()
    .then(({ data }) => hydrate(data.session?.user?.id ?? null))
    .catch((error) => console.error(`[cloud-sync:${module}] auth session`, error));
  supabase.auth.onAuthStateChange((_e, s) => {
    setTimeout(() => {
      void hydrate(s?.user?.id ?? null);
    }, 0);
  });
  return push;
}
