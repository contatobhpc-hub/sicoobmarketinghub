import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Megaphone, Calendar, User, Wallet } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewCampaignDialog } from "@/components/campaigns/new-campaign-dialog";
import {
  CAMPAIGN_STATUSES,
  campaignProgress,
  formatCurrency,
  formatDate,
  priorityTone,
  statusTone,
  useCampaigns,
} from "@/lib/campaigns";

export const Route = createFileRoute("/campanhas")({
  head: () => ({
    meta: [
      { title: "Campanhas — Marketing Hub" },
      {
        name: "description",
        content: "Núcleo do Marketing OS — toda ação se vincula a uma campanha.",
      },
    ],
  }),
  component: CampanhasPage,
});

function CampanhasPage() {
  const campaigns = useCampaigns();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesQ =
        !query ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.owner.toLowerCase().includes(query.toLowerCase());
      const matchesS = statusFilter === "all" || c.status === statusFilter;
      return matchesQ && matchesS;
    });
  }, [campaigns, query, statusFilter]);

  return (
    <AppShell>
      <PageHeader
        title="Campanhas"
        description="Núcleo do Marketing OS — toda ação se vincula a uma campanha."
        actions={<NewCampaignDialog />}
      />

      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou responsável…"
            className="h-9 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {CAMPAIGN_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="font-display text-base font-semibold">Nenhuma campanha encontrada</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Ajuste os filtros ou crie uma nova campanha para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const progress = campaignProgress(c);
            return (
              <Link
                key={c.id}
                to="/campanhas/$id"
                params={{ id: c.id }}
                className="group flex flex-col rounded-xl border border-border bg-surface/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {c.type}
                    </span>
                    <h3 className="mt-0.5 truncate font-display text-base font-semibold tracking-tight">
                      {c.name}
                    </h3>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${statusTone(c.status)}`}>
                    {c.status}
                  </span>
                </div>

                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {c.description || "Sem descrição."}
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progresso</span>
                    <span className="tabular">{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress}%`, backgroundImage: "var(--gradient-primary)" }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <Meta icon={Calendar} label={`${formatDate(c.startDate)} → ${formatDate(c.endDate)}`} />
                  <Meta icon={User} label={c.owner || "Sem responsável"} />
                  <Meta icon={Wallet} label={formatCurrency(c.budget)} />
                  <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 font-semibold ${priorityTone(c.priority)}`}>
                    {c.priority}
                  </span>
                </div>

                {c.modules.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {c.modules.slice(0, 5).map((m) => (
                      <span key={m} className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {m.replace("_", " ")}
                      </span>
                    ))}
                    {c.modules.length > 5 && (
                      <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        +{c.modules.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Calendar; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 truncate">
      <Icon className="h-3 w-3" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </span>
  );
}
