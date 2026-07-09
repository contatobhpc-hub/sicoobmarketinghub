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
}

export function isRememberedDeletion(storageKey: string, candidate: DeletionCandidate) {
  const record = readRecord(storageKey);
  const id = candidate.id?.trim();
  const name = normalize(candidate.name);
  const key = normalize(candidate.key);
  return (!!id && record.ids.includes(id)) || (!!name && record.names.includes(name)) || (!!key && record.keys.includes(key));
}

export function normalizeDeletionText(value?: string | null) {
  return normalize(value);
}