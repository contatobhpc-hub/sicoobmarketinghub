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

export async function loadModuleState<T>(module: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("app_state")
    .select("data")
    .eq("module", module)
    .maybeSingle();
  if (error) {
    console.error(`[cloud-sync:${module}] load`, error);
    return null;
  }
  return (data?.data ?? null) as T | null;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const inflight = new Set<string>();
const pending = new Set<string>();

async function pushNow<T>(module: string, getter: () => T) {
  if (!currentUserId) return;
  const payload = getter();
  const { error } = await supabase
    .from("app_state")
    .upsert(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { module, data: payload as any, updated_by: currentUserId },
      { onConflict: "module" },
    );
  if (error) console.error(`[cloud-sync:${module}] push`, error);
}

export function scheduleModulePush<T>(module: string, getter: () => T, delay = 700) {
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
        await pushNow(module, getter);
      } finally {
        inflight.delete(module);
        if (pending.delete(module)) scheduleModulePush(module, getter, 0);
      }
    }, delay),
  );
}
