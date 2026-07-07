import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  FileText,
  GripVertical,
  Layers,
  Settings2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ModuleManagementButton } from "@/components/module-management";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  CHART_PALETTE,
  MODULES,
  type ModuleKey,
  getBarSeries,
  getHeatmap,
  getKpis,
  getLineSeries,
  getPieSeries,
  getRadarSeries,
  getTimeline,
} from "@/lib/indicators";
import { exportCSV, exportExcel, exportPDF } from "@/lib/export-utils";

export const Route = createFileRoute("/indicadores")({
  component: IndicadoresPage,
});

type WidgetKey = "kpis" | "line" | "bar" | "pie" | "radar" | "heatmap" | "timeline";

const WIDGETS: { key: WidgetKey; label: string }[] = [
  { key: "kpis", label: "KPIs" },
  { key: "line", label: "Linha — Investimento x Retorno" },
  { key: "bar", label: "Barra — Categorias" },
  { key: "pie", label: "Pizza — Distribuição" },
  { key: "radar", label: "Radar — Performance" },
  { key: "heatmap", label: "Heatmap — Atividade" },
  { key: "timeline", label: "Timeline — Eventos" },
];

const STORAGE = "mh.indicadores.widgets.v1";

function loadWidgets(): Record<WidgetKey, boolean> {
  if (typeof window === "undefined") return Object.fromEntries(WIDGETS.map((w) => [w.key, true])) as Record<WidgetKey, boolean>;
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return Object.fromEntries(WIDGETS.map((w) => [w.key, true])) as Record<WidgetKey, boolean>;
}

function IndicadoresPage() {
  const [module, setModule] = useState<ModuleKey>("campanhas");
  const [period, setPeriod] = useState("2026");
  const [widgets, setWidgets] = useState<Record<WidgetKey, boolean>>(loadWidgets);

  const kpis = useMemo(() => getKpis(module), [module]);
  const line = useMemo(() => getLineSeries(module), [module]);
  const bar = useMemo(() => getBarSeries(module), [module]);
  const pie = useMemo(() => getPieSeries(module), [module]);
  const radar = useMemo(() => getRadarSeries(), []);
  const heatmap = useMemo(() => getHeatmap(), []);
  const timeline = useMemo(() => getTimeline(), []);

  const toggleWidget = (key: WidgetKey) => {
    const next = { ...widgets, [key]: !widgets[key] };
    setWidgets(next);
    try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch {}
  };

  const moduleLabel = MODULES.find((m) => m.key === module)?.label ?? module;

  const exportData = () => ({
    KPIs: kpis.map((k) => ({ Indicador: k.label, Valor: k.value, Variação: k.delta ?? "—" })),
    "Investimento x Retorno": line.map((l) => ({ Mês: l.name, Investimento: l.investimento, Retorno: l.retorno })),
    Categorias: bar.map((b) => ({ Categoria: b.name, Valor: b.valor })),
    Distribuição: pie.map((p) => ({ Item: p.name, Valor: p.value })),
    Timeline: timeline.map((t) => ({ Data: t.date, Título: t.titulo, Tipo: t.tipo })),
  });

  const handleCSV = () => {
    const d = exportData();
    exportCSV(`indicadores-${module}-${period}`, d["Investimento x Retorno"]);
  };
  const handleXLSX = () => exportExcel(`indicadores-${module}-${period}`, exportData());
  const handlePDF = () => {
    const d = exportData();
    exportPDF(
      `indicadores-${module}-${period}`,
      `Analytics — ${moduleLabel} (${period})`,
      Object.entries(d).map(([heading, rows]) => ({ heading, rows })),
    );
  };

  return (
    <AppShell>
      <PageHeader
        title="Analytics"
        description="Indicadores por módulo, gráficos interativos e dashboards personalizáveis."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={module} onValueChange={(v) => setModule(v as ModuleKey)}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODULES.map((m) => (
                  <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-9 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["2024", "2025", "2026"].map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9"><Settings2 className="mr-2 h-4 w-4" />Personalizar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Widgets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {WIDGETS.map((w) => (
                  <DropdownMenuCheckboxItem
                    key={w.key}
                    checked={widgets[w.key]}
                    onCheckedChange={() => toggleWidget(w.key)}
                  >
                    {w.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-9"><Download className="mr-2 h-4 w-4" />Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handlePDF}><FileText className="mr-2 h-4 w-4" />PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={handleXLSX}><FileSpreadsheet className="mr-2 h-4 w-4" />Excel (.xlsx)</DropdownMenuItem>
                <DropdownMenuItem onClick={handleCSV}><Download className="mr-2 h-4 w-4" />CSV</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {widgets.kpis && (
        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</div>
              <div className="mt-1.5 font-display text-2xl font-semibold">{k.value}</div>
              {k.delta && (
                <div className={`mt-1 flex items-center gap-1 text-xs ${k.trend === "down" ? "text-rose-500" : "text-emerald-500"}`}>
                  {k.trend === "down" ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  {k.delta}
                </div>
              )}
            </Card>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {widgets.line && (
          <ChartCard title="Investimento x Retorno" subtitle="Série mensal" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={line}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 264 / 0.3)" />
                <XAxis dataKey="name" stroke="oklch(0.6 0.02 264)" fontSize={11} />
                <YAxis stroke="oklch(0.6 0.02 264)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 264)", border: "1px solid oklch(0.3 0.02 264)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="investimento" stroke={CHART_PALETTE[0]} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="retorno" stroke={CHART_PALETTE[2]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgets.pie && (
          <ChartCard title="Distribuição" subtitle="Composição por canal">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {pie.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 264)", border: "1px solid oklch(0.3 0.02 264)", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgets.bar && (
          <ChartCard title="Categorias" subtitle="Volume por categoria" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bar}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.02 264 / 0.3)" />
                <XAxis dataKey="name" stroke="oklch(0.6 0.02 264)" fontSize={11} />
                <YAxis stroke="oklch(0.6 0.02 264)" fontSize={11} />
                <Tooltip contentStyle={{ background: "oklch(0.18 0.02 264)", border: "1px solid oklch(0.3 0.02 264)", borderRadius: 8 }} />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {bar.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgets.radar && (
          <ChartCard title="Performance" subtitle="Atual vs meta">
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radar}>
                <PolarGrid stroke="oklch(0.3 0.02 264 / 0.4)" />
                <PolarAngleAxis dataKey="eixo" stroke="oklch(0.6 0.02 264)" fontSize={11} />
                <PolarRadiusAxis stroke="oklch(0.4 0.02 264)" fontSize={10} />
                <Radar name="Atual" dataKey="A" stroke={CHART_PALETTE[0]} fill={CHART_PALETTE[0]} fillOpacity={0.35} />
                <Radar name="Meta" dataKey="B" stroke={CHART_PALETTE[2]} fill={CHART_PALETTE[2]} fillOpacity={0.2} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {widgets.heatmap && (
          <ChartCard title="Heatmap de atividade" subtitle="Engajamento por dia × hora" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 text-left text-muted-foreground"></th>
                    {heatmap[0].cells.map((c) => (
                      <th key={c.hour} className="px-2 py-1 text-center font-normal text-muted-foreground">{c.hour}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.map((row) => (
                    <tr key={row.day}>
                      <td className="px-2 py-1 text-muted-foreground">{row.day}</td>
                      {row.cells.map((c, i) => {
                        const a = Math.max(0.08, c.v / 100);
                        return (
                          <td key={i} className="p-1">
                            <div
                              className="h-7 w-full rounded-md transition-all hover:scale-105"
                              style={{ background: `oklch(0.68 0.18 264 / ${a})` }}
                              title={`${row.day} ${c.hour}: ${c.v}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}

        {widgets.timeline && (
          <ChartCard title="Timeline" subtitle="Eventos recentes">
            <ol className="relative space-y-3 border-l border-border/60 pl-4">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                  <div className="text-xs text-muted-foreground">{t.date}</div>
                  <div className="text-sm font-medium">{t.titulo}</div>
                  <Badge variant="secondary" className="mt-1 text-[10px]">{t.tipo}</Badge>
                </li>
              ))}
            </ol>
          </ChartCard>
        )}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Layers className="h-3.5 w-3.5" />
        Os dados são unificados a partir dos módulos. Personalize os widgets e exporte em PDF, Excel ou CSV.
      </p>
    </AppShell>
  );
}

function ChartCard({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-display text-sm font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
      </div>
      {children}
    </Card>
  );
}
