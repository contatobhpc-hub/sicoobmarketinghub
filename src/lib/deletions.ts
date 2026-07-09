import { enableCloudSync } from "./cloud-sync";

export type DeletionCandidate = {
  id?: string | null;
  name?: string | null;
  key?: string | null;
};

type DeletionRecord = {
  ids: string[];
  names: string[];
  keys: string[];
};

const cloudPushers = new Map<string, () => void>();

function normalize(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function readRecord(storageKey: string): DeletionRecord {
  if (typeof window === "undefined") return { ids: [], names: [], keys: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids.filter((v: unknown) => typeof v === "string") : [],
      names: Array.isArray(parsed.names) ? parsed.names.filter((v: unknown) => typeof v === "string") : [],
      keys: Array.isArray(parsed.keys) ? parsed.keys.filter((v: unknown) => typeof v === "string") : [],
    };
  } catch {
    return { ids: [], names: [], keys: [] };
  }
}

function writeRecord(storageKey: string, record: DeletionRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {
    // ignore quota/storage errors
  }
}

function mergeRecords(a: DeletionRecord, b: DeletionRecord): DeletionRecord {
  return {
    ids: unique([...a.ids, ...b.ids]),
    names: unique([...a.names, ...b.names]),
    keys: unique([...a.keys, ...b.keys]),
  };
}

function deletionModuleName(storageKey: string) {
  return `deletions-${storageKey.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "")}`;
}

function getCloudPush(storageKey: string) {
  if (cloudPushers.has(storageKey)) return cloudPushers.get(storageKey)!;
  const push = enableCloudSync<DeletionRecord>(
    deletionModuleName(storageKey),
    () => readRecord(storageKey),
    (incoming) => {
      const merged = mergeRecords(readRecord(storageKey), incoming ?? { ids: [], names: [], keys: [] });
      writeRecord(storageKey, merged);
    },
  );
  cloudPushers.set(storageKey, push);
  return push;
}

export function rememberDeletion(storageKey: string, candidate: DeletionCandidate) {
  const record = readRecord(storageKey);
  const id = candidate.id?.trim();
  const name = normalize(candidate.name);
  const key = normalize(candidate.key);
  writeRecord(storageKey, {
    ids: unique([...record.ids, id || ""]),
    names: unique([...record.names, name]),
    keys: unique([...record.keys, key]),
  });
  getCloudPush(storageKey)();
}

export function isRememberedDeletion(storageKey: string, candidate: DeletionCandidate) {
  getCloudPush(storageKey);
  const record = readRecord(storageKey);
  const id = candidate.id?.trim();
  const name = normalize(candidate.name);
  const key = normalize(candidate.key);
  return (!!id && record.ids.includes(id)) || (!!name && record.names.includes(name)) || (!!key && record.keys.includes(key));
}

export function normalizeDeletionText(value?: string | null) {
  return normalize(value);
}