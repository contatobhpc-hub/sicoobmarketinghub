import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  CalendarRange,
  CircleDollarSign,
  Filter,
  Flame,
  Gift,
  Handshake,
  LineChart as LineChartIcon,
  MapPin,
  Megaphone,
  PartyPopper,
  ScrollText,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { useCampaigns } from "@/lib/campaigns";
import { useContracts, alertLevel } from "@/lib/contracts";
import { useEvents } from "@/lib/events";
import { useInventory, stockStatus } from "@/lib/inventory";
import { useOfflineMedia, coordsForCity } from "@/lib/offline-media";
import { usePartners } from "@/lib/partners";
import { useSponsorships } from "@/lib/sponsorships";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Dashboard Executivo — Marketing Hub" },
      {
        name: "description",
        content: "Visão executiva consolidada do departamento de Marketing: KPIs, ROI, investimento, campanhas, eventos e mídia.",
      },
    ],
  }),
  component: ExecutiveDashboard,
});

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v || 0);
const formatCompact = (v: number) =>
  new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v || 0);

const COLORS = ["#818cf8", "#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#fb7185", "#a78bfa", "#60a5fa"];

function ExecutiveDashboard() {
  const campaigns = useCampaigns();
  const events = useEvents();
  const sponsorships = useSponsorships();
  const offline = useOfflineMedia();
  const contracts = useContracts();
  const partners = usePartners();
  const inventory = useInventory();

  // ---- Filters
  const allYears = useMemo(() => {
    const set = new Set<number>();
    campaigns.forEach((c) => set.add(new Date(c.startDate).getFullYear()));
    events.forEach((e) => set.add(new Date(e.date).getFullYear()));
    contracts.forEach((c) => set.add(new Date(c.startDate).getFullYear()));
    if (!set.size) set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [campaigns, events, contracts]);

  const [year, setYear] = useState<string>(String(allYears[0]));
  const [month, setMonth] = useState<string>("all");
  const [campaignId, setCampaignId] = useState<string>("all");
  const [agency, setAgency] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [owner, setOwner] = useState<string>("all");

  const agencies = useMemo(
    () => Array.from(new Set(events.map((e) => e.agency).filter(Boolean))).sort(),
    [events],
  );
  const cities = useMemo(
    () =>
      Array.from(
        new Set([
          ...events.map((e) => e.city),
          ...offline.map((o) => o.city),
          ...sponsorships.map((s) => s.city),
          ...partners.map((p) => p.city),
        ]),
      )
        .filter(Boolean)
        .sort(),
    [events, offline, sponsorships, partners],
  );
  const owners = useMemo(
    () =>
      Array.from(
        new Set([
          ...campaigns.map((c) => c.owner),
          ...events.map((e) => e.owner),
          ...sponsorships.map((s) => s.owner),
          ...contracts.map((c) => c.owner),
          ...offline.map((o) => o.owner),
        ]),
      )
        .filter(Boolean)
        .sort(),
    [campaigns, events, sponsorships, contracts, offline],
  );

  const matchDate = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso);
    if (year !== "all" && d.getFullYear() !== Number(year)) return false;
    if (month !== "all" && d.getMonth() !== Number(month)) return false;
    return true;
  };
  const matchCampaign = (id?: string, name?: string) => {
    if (campaignId === "all") return true;
    const c = campaigns.find((x) => x.id === campaignId);
    return id === campaignId || (c && name === c.name);
  };

  const fCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        if (!matchDate(c.startDate)) return false;
        if (campaignId !== "all" && c.id !== campaignId) return false;
        if (owner !== "all" && c.owner !== owner) return false;
        return true;
      }),
    [campaigns, year, month, campaignId, owner],
  );

  const fEvents = useMemo(
    () =>
      events.filter((e) => {
        if (!matchDate(e.date)) return false;
        if (agency !== "all" && e.agency !== agency) return false;
        if (city !== "all" && e.city !== city) return false;
        if (owner !== "all" && e.owner !== owner) return false;
        if (!matchCampaign(undefined, e.campaign)) return false;
        return true;
      }),
    [events, year, month, agency, city, owner, campaignId, campaigns],
  );

  const fSponsorships = useMemo(
    () =>
      sponsorships.filter((s) => {
        if (!matchDate(s.startDate)) return false;
        if (city !== "all" && s.city !== city) return false;
        if (owner !== "all" && s.owner !== owner) return false;
        if (!matchCampaign(s.campaignId, s.campaign)) return false;
        return true;
      }),
    [sponsorships, year, month, city, owner, campaignId, campaigns],
  );

  const fOffline = useMemo(
    () =>
      offline.filter((o) => {
        if (!matchDate(o.installDate)) return false;
        if (city !== "all" && o.city !== city) return false;
        if (owner !== "all" && o.owner !== owner) return false;
        if (!matchCampaign(o.campaignId, o.campaign)) return false;
        return true;
      }),
    [offline, year, month, city, owner, campaignId, campaigns],
  );

  const fContracts = useMemo(
    () =>
      contracts.filter((c) => {
        if (!matchDate(c.startDate)) return false;
        if (owner !== "all" && c.owner !== owner) return false;
        return true;
      }),
    [contracts, year, month, owner],
  );

  // ---- KPIs
  const activeCampaigns = fCampaigns.filter((c) => c.status === "Em andamento").length;
  const closedCampaigns = fCampaigns.filter((c) => c.status === "Concluída").length;
  const totalInvestment =
    fCampaigns.reduce((s, c) => s + (c.budget || 0), 0) +
    fSponsorships.reduce((s, x) => s + (x.value || 0), 0) +
    fOffline.reduce((s, x) => s + (x.value || 0), 0);
  const expectedReturn = fSponsorships.reduce((s, x) => s + (x.expectedReturn || 0), 0);
  const roi = totalInvestment > 0 ? ((expectedReturn - totalInvestment) / totalInvestment) * 100 : 0;
  const leads = Math.round(
    fCampaigns.reduce((s, c) => s + (c.objective === "Conversão" ? c.budget * 0.012 : c.budget * 0.006), 0),
  );
  const totalSponsorships = fSponsorships.length;
  const totalOffline = fOffline.length;
  const totalGifts = inventory.reduce((s, i) => s + i.quantity, 0);
  const giftsLow = inventory.filter((i) => stockStatus(i) !== "ok").length;
  const totalContracts = fContracts.length;
  const contractsExpiring = fContracts.filter((c) => {
    const lvl = alertLevel(c).level;
    return lvl === "soon" || lvl === "warning" || lvl === "urgent" || lvl === "critical";
  }).length;

  // ---- Charts
  const investmentByMonth = useMemo(() => {
    const rows = MONTHS.map((m, i) => ({ name: m, Campanhas: 0, Patrocínios: 0, Mídia: 0 }));
    fCampaigns.forEach((c) => {
      const d = new Date(c.startDate);
      rows[d.getMonth()].Campanhas += c.budget || 0;
    });
    fSponsorships.forEach((s) => {
      const d = new Date(s.startDate);
      rows[d.getMonth()].Patrocínios += s.value || 0;
    });
    fOffline.forEach((o) => {
      const d = new Date(o.installDate);
      rows[d.getMonth()].Mídia += o.value || 0;
    });
    return rows;
  }, [fCampaigns, fSponsorships, fOffline]);

  const roiByCampaign = useMemo(() => {
    return fCampaigns
      .map((c) => {
        const linked = fSponsorships.filter((s) => s.campaignId === c.id || s.campaign === c.name);
        const inv = (c.budget || 0) + linked.reduce((s, x) => s + x.value, 0);
        const ret = linked.reduce((s, x) => s + (x.expectedReturn || 0), 0);
        return {
          name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
          ROI: inv > 0 ? Math.round(((ret - inv) / inv) * 100) : 0,
        };
      })
      .slice(0, 8);
  }, [fCampaigns, fSponsorships]);

  const investmentByCity = useMemo(() => {
    const map = new Map<string, number>();
    fOffline.forEach((o) => map.set(o.city, (map.get(o.city) || 0) + o.value));
    fSponsorships.forEach((s) => map.set(s.city, (map.get(s.city) || 0) + s.value));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [fOffline, fSponsorships]);

  const campaignsByType = useMemo(() => {
    const map = new Map<string, number>();
    fCampaigns.forEach((c) => map.set(c.type, (map.get(c.type) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [fCampaigns]);

  // ---- Timeline (latest events across modules)
  const timeline = useMemo(() => {
    type Item = { date: string; type: string; title: string; meta?: string; tone: string };
    const items: Item[] = [];
    fCampaigns.forEach((c) =>
      items.push({ date: c.startDate, type: "Campanha", title: c.name, meta: c.owner, tone: "bg-indigo-500/20 text-indigo-300" }),
    );
    fEvents.forEach((e) =>
      items.push({ date: e.date, type: "Evento", title: e.name, meta: e.city, tone: "bg-fuchsia-500/20 text-fuchsia-300" }),
    );
    fSponsorships.forEach((s) =>
      items.push({
        date: s.startDate,
        type: "Patrocínio",
        title: s.institution,
        meta: formatBRL(s.value),
        tone: "bg-emerald-500/20 text-emerald-300",
      }),
    );
    fOffline.forEach((o) =>
      items.push({
        date: o.installDate,
        type: "Mídia Offline",
        title: o.title,
        meta: o.city,
        tone: "bg-amber-500/20 text-amber-300",
      }),
    );
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  }, [fCampaigns, fEvents, fSponsorships, fOffline]);

  // ---- Map points
  const mapPoints = useMemo(() => {
    const map = new Map<string, { city: string; value: number; count: number; x: number; y: number }>();
    const add = (c: string, v: number) => {
      if (!c) return;
      const cur = map.get(c);
      const coords = coordsForCity(c);
      if (cur) {
        cur.value += v;
        cur.count += 1;
      } else {
        map.set(c, { city: c, value: v, count: 1, x: coords.x, y: coords.y });
      }
    };
    fOffline.forEach((o) => add(o.city, o.value));
    fSponsorships.forEach((s) => add(s.city, s.value));
    fEvents.forEach((e) => add(e.city, 0));
    return Array.from(map.values());
  }, [fOffline, fSponsorships, fEvents]);

  const maxMapValue = Math.max(1, ...mapPoints.map((p) => p.value));

  return (
    <AppShell>
      <PageHeader
        title="Dashboard Executivo"
        description="Visão consolidada do departamento de Marketing — KPIs, ROI, investimento e operação em tempo real."
      >
        <Badge variant="outline" className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Tempo real
        </Badge>
      </PageHeader>

      {/* Filters */}
      <Card className="mt-6 border-white/5 bg-white/[0.03] p-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Filter className="size-3.5" /> Filtros
          </div>
          <FilterSelect label="Ano" value={year} onChange={setYear} options={[{ v: "all", l: "Todos" }, ...allYears.map((y) => ({ v: String(y), l: String(y) }))]} />
          <FilterSelect
            label="Mês"
            value={month}
            onChange={setMonth}
            options={[{ v: "all", l: "Todos" }, ...MONTHS.map((m, i) => ({ v: String(i), l: m }))]}
          />
          <FilterSelect
            label="Campanha"
            value={campaignId}
            onChange={setCampaignId}
            options={[{ v: "all", l: "Todas" }, ...campaigns.map((c) => ({ v: c.id, l: c.name }))]}
          />
          <FilterSelect
            label="Agência"
            value={agency}
            onChange={setAgency}
            options={[{ v: "all", l: "Todas" }, ...agencies.map((a) => ({ v: a, l: a }))]}
          />
          <FilterSelect
            label="Cidade"
            value={city}
            onChange={setCity}
            options={[{ v: "all", l: "Todas" }, ...cities.map((c) => ({ v: c, l: c }))]}
          />
          <FilterSelect
            label="Responsável"
            value={owner}
            onChange={setOwner}
            options={[{ v: "all", l: "Todos" }, ...owners.map((o) => ({ v: o, l: o }))]}
          />
        </div>
      </Card>

      {/* KPI grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Campanhas Ativas" value={activeCampaigns} icon={Megaphone} tone="from-indigo-500/30 to-indigo-500/0" delta="+12%" />
        <Kpi label="Encerradas" value={closedCampaigns} icon={Target} tone="from-sky-500/30 to-sky-500/0" delta="+4%" />
        <Kpi label="Eventos" value={fEvents.length} icon={PartyPopper} tone="from-fuchsia-500/30 to-fuchsia-500/0" delta="+8%" />
        <Kpi label="ROI Estimado" value={`${roi.toFixed(1)}%`} icon={LineChartIcon} tone="from-emerald-500/30 to-emerald-500/0" delta={roi >= 0 ? "+" : ""} positive={roi >= 0} />
        <Kpi label="Investimento" value={formatCompact(totalInvestment)} prefix="R$ " icon={CircleDollarSign} tone="from-amber-500/30 to-amber-500/0" />
        <Kpi label="Leads (est.)" value={formatCompact(leads)} icon={Users} tone="from-rose-500/30 to-rose-500/0" delta="+15%" />
        <Kpi label="Patrocínios" value={totalSponsorships} icon={Handshake} tone="from-teal-500/30 to-teal-500/0" />
        <Kpi label="Mídia Offline" value={totalOffline} icon={MapPin} tone="from-violet-500/30 to-violet-500/0" />
        <Kpi label="Brindes" value={formatCompact(totalGifts)} icon={Gift} tone="from-pink-500/30 to-pink-500/0" sub={`${giftsLow} alertas`} />
        <Kpi label="Contratos" value={totalContracts} icon={ScrollText} tone="from-cyan-500/30 to-cyan-500/0" sub={`${contractsExpiring} vencendo`} />
        <Kpi label="Parceiros" value={partners.length} icon={Sparkles} tone="from-lime-500/30 to-lime-500/0" />
        <Kpi label="Retorno Esperado" value={formatCompact(expectedReturn)} prefix="R$ " icon={TrendingUp} tone="from-emerald-500/30 to-emerald-500/0" />
      </div>

      {/* Charts row 1 */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ChartCard title="Investimento por mês" subtitle="Campanhas · Patrocínios · Mídia" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={investmentByMonth}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => formatCompact(v as number)} />
              <Tooltip content={<DarkTooltip currency />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Campanhas" stroke="#818cf8" fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="Patrocínios" stroke="#34d399" fill="url(#g2)" strokeWidth={2} />
              <Area type="monotone" dataKey="Mídia" stroke="#fbbf24" fill="url(#g3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Campanhas por tipo" subtitle="Distribuição do portfólio">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={campaignsByType} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                {campaignsByType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard title="ROI por campanha" subtitle="Top 8 com maior retorno estimado" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={roiByCampaign}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<DarkTooltip suffix="%" />} />
              <Bar dataKey="ROI" radius={[8, 8, 0, 0]}>
                {roiByCampaign.map((d, i) => (
                  <Cell key={i} fill={d.ROI >= 0 ? "#34d399" : "#fb7185"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Investimento por cidade" subtitle="Mídia Offline + Patrocínios">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={investmentByCity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => formatCompact(v as number)} />
              <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} width={90} />
              <Tooltip content={<DarkTooltip currency />} />
              <Bar dataKey="value" fill="#22d3ee" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Map + Timeline */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 overflow-hidden border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Distribuição regional</h3>
              <p className="text-xs text-muted-foreground">Investimento e presença por cidade</p>
            </div>
            <Badge variant="outline" className="border-white/10 bg-white/5">
              {mapPoints.length} cidades
            </Badge>
          </div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-indigo-950/40 via-slate-950/60 to-slate-900/40">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(99,102,241,0.25), transparent 50%), radial-gradient(circle at 70% 60%, rgba(34,211,238,0.18), transparent 50%)" }} />
            <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                  <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.2" />
                </pattern>
              </defs>
              <rect width="100" height="60" fill="url(#grid)" />
              {mapPoints.map((p, i) => {
                const r = 1 + (p.value / maxMapValue) * 3.5;
                return (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={r + 2} fill="#818cf8" opacity={0.15} className="animate-pulse" />
                    <circle cx={p.x} cy={p.y} r={r} fill="#818cf8" />
                    <text x={p.x} y={p.y - r - 1} fontSize="2" fill="white" textAnchor="middle" opacity={0.85}>
                      {p.city}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {mapPoints.slice(0, 6).map((p) => (
              <div key={p.city} className="flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-xs">
                <MapPin className="size-3 text-indigo-300" />
                <span>{p.city}</span>
                <span className="text-muted-foreground">{formatBRL(p.value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Linha do tempo</h3>
              <p className="text-xs text-muted-foreground">Últimos acontecimentos operacionais</p>
            </div>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <div className="relative space-y-3 pl-5">
            <div className="absolute left-1.5 top-1 bottom-1 w-px bg-gradient-to-b from-indigo-500/40 via-white/10 to-transparent" />
            {timeline.map((t, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[18px] top-1.5 size-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-500/20" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("border-white/5 text-[10px]", t.tone)}>
                        {t.type}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-medium">{t.title}</p>
                    {t.meta ? <p className="text-xs text-muted-foreground">{t.meta}</p> : null}
                  </div>
                </div>
              </div>
            ))}
            {timeline.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento no período.</p> : null}
          </div>
        </Card>
      </div>

      {/* Quick navigation */}
      <div className="mt-6">
        <Tabs defaultValue="quick">
          <TabsList className="bg-white/5">
            <TabsTrigger value="quick">Acesso rápido</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { to: "/campanhas", label: "Campanhas", icon: Megaphone },
            { to: "/eventos", label: "Eventos", icon: PartyPopper },
            { to: "/patrocinios", label: "Patrocínios", icon: Handshake },
            { to: "/midia-offline", label: "Mídia Offline", icon: MapPin },
            { to: "/contratos", label: "Contratos", icon: ScrollText },
            { to: "/brindes", label: "Brindes", icon: Gift },
          ].map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3 transition-all hover:border-indigo-400/30 hover:bg-white/[0.06]"
            >
              <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-500/0">
                <q.icon className="size-4 text-indigo-300" />
              </div>
              <span className="text-sm font-medium">{q.label}</span>
              <Flame className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

// ---------- Sub-components

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[140px] border-white/10 bg-white/5 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.v} value={o.v} className="text-xs">
              {o.l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  delta,
  positive = true,
  prefix,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  delta?: string;
  positive?: boolean;
  prefix?: string;
  sub?: string;
}) {
  return (
    <Card className="relative overflow-hidden border-white/5 bg-white/[0.03] p-4 backdrop-blur-xl transition-all hover:border-white/10 hover:bg-white/[0.05]">
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", tone)} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          {prefix ? <span className="text-xs text-muted-foreground">{prefix}</span> : null}
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {delta ? (
            <span className={cn("flex items-center gap-0.5 text-[11px]", positive ? "text-emerald-400" : "text-rose-400")}>
              {positive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {delta}
            </span>
          ) : null}
          {sub ? <span className="text-[11px] text-muted-foreground">{sub}</span> : null}
        </div>
      </div>
    </Card>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl", className)}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <CalendarRange className="size-4 text-muted-foreground" />
      </div>
      <Separator className="mb-4 bg-white/5" />
      {children}
    </Card>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
  currency,
  suffix,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
  currency?: boolean;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      {label !== undefined ? <div className="mb-1 font-medium">{label}</div> : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">
            {currency ? formatBRL(p.value || 0) : `${p.value}${suffix || ""}`}
          </span>
        </div>
      ))}
    </div>
  );
}
