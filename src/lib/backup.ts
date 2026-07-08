// Global backup: exports/imports ALL app localStorage keys.
export const BACKUP_KEYS = [
  "mhub.settings.v1",
  "mhub.finance.v1",
  "mhub.contracts.v1",
  "mhub.contract-categories.v1",
  "mhub.partners.v1",
  "sicoob:partner-categories:v1",
  "mhub.campaigns.v1",
  "mhub.projects.v1",
  "mhub.events.v1",
  "mhub.calendar.v2",
  "mhub.content.v1",
  "mhub.inventory.v1",
  "mhub.kanban.v1",
  "mhub.sponsorships.v1",
  "mhub.strategic.v1",
  "mhub.workflows.v1",
  "mhub.offline-media.v1",
  "mhub.offline-media.categories.v1",
  "mh.notifications.v1",
  "mh.notifications.prefs.v1",
  "mh:ai-center:v1",
] as const;

export type FullBackup = {
  app: "marketing-hub";
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
};

export function exportFullBackup(): FullBackup {
  const data: Record<string, unknown> = {};
  for (const key of BACKUP_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) data[key] = JSON.parse(raw);
    } catch {
      /* skip corrupted key */
    }
  }
  return {
    app: "marketing-hub",
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function downloadFullBackup() {
  const payload = exportFullBackup();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `marketing-hub-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return payload;
}

export function importFullBackup(json: string): { restored: string[]; skipped: string[] } {
  const parsed = JSON.parse(json);
  const data: Record<string, unknown> =
    parsed?.data && typeof parsed.data === "object"
      ? parsed.data
      : parsed?.state
        ? { "mhub.settings.v1": parsed.state }
        : parsed;

  const restored: string[] = [];
  const skipped: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (!(BACKUP_KEYS as readonly string[]).includes(key)) {
      skipped.push(key);
      continue;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
      restored.push(key);
    } catch {
      skipped.push(key);
    }
  }
  return { restored, skipped };
}
