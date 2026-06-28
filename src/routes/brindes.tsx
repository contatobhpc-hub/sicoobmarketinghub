import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  ClipboardList,
  CircleDollarSign,
  FileImage,
  Gift,
  Lock,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import {
  CATEGORY_TONE,
  INVENTORY_CATEGORIES,
  MOVEMENT_TONE,
  MOVEMENT_TYPES,
  inventoryStore,
  monthlyConsumption,
  stockStatus,
  useInventory,
  type InventoryCategory,
  type InventoryItem,
  type MovementType,
} from "@/lib/inventory";

export const Route = createFileRoute("/brindes")({
  head: () => ({
    meta: [
      { title: "Estoque & Brindes — Marketing Hub" },
      { name: "description", content: "Gestão completa de estoque de brindes, kits e materiais com alertas e histórico." },
    ],
  }),
  component: BrindesPage,
});

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function BrindesPage() {
  const items = useInventory();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | InventoryCategory>("all");
  const [stock, setStock] = useState<"all" | "low" | "out" | "ok">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (stock !== "all" && stockStatus(i) !== stock) return false;
      if (!q) return true;
      return [i.name, i.internalCode, i.qrCode, i.supplier, i.location, i.category].join(" ").toLowerCase().includes(q);
    });
  }, [items, query, cat, stock]);

  const stats = useMemo(() => {
    const totalValue = items.reduce((s, i) => s + i.quantity * i.unitValue, 0);
    const low = items.filter((i) => stockStatus(i) === "low").length;
    const out = items.filter((i) => stockStatus(i) === "out").length;
    const reserved = items.reduce((s, i) => s + i.reserved, 0);
    return { totalValue, low, out, reserved, count: items.length };
  }, [items]);

  const consumption = useMemo(() => monthlyConsumption(items, 6), [items]);

  const byCategory = useMemo(() => {
    const map = new Map<InventoryCategory, number>();
    items.forEach((i) => map.set(i.category, (map.get(i.category) ?? 0) + i.quantity * i.unitValue));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [items]);

  const selected = openId ? items.find((i) => i.id === openId) ?? null : null;
  const alerts = items.filter((i) => stockStatus(i) !== "ok");

  return (
    <AppShell>
      <PageHeader
        title="Estoque & Brindes"
        description="Cadastro de produtos, movimentações, reservas e histórico completo com alertas automáticos."
        actions={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button><Plus className="size-4" /> Novo produto</Button>
            </DialogTrigger>
            <NewItemDialog onClose={() => setCreating(false)} />
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Package} label="Produtos cadastrados" value={String(stats.count)} />
        <Kpi icon={CircleDollarSign} label="Valor em estoque" value={fmtBRL(stats.totalValue)} />
        <Kpi icon={Lock} label="Reservados" value={String(stats.reserved)} />
        <Kpi
          icon={AlertTriangle}
          label="Alertas (baixo / zerado)"
          value={`${stats.low} / ${stats.out}`}
          tone={stats.low + stats.out > 0 ? "danger" : "default"}
        />
      </div>

      {alerts.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-300">
            <AlertTriangle className="size-4" /> Estoque baixo / zerado
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((i) => (
              <button
                key={i.id}
                onClick={() => setOpenId(i.id)}
                className={`rounded-md border px-3 py-1.5 text-left text-xs transition ${
                  stockStatus(i) === "out"
                    ? "border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
                }`}
              >
                <span className="font-medium">{i.name}</span>
                <span className="ml-2 opacity-80">
                  {i.quantity}/{i.minQuantity}
                </span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-display text-sm font-semibold">Consumo mensal (últimos 6 meses)</div>
            <span className="text-xs text-muted-foreground">Quantidade · valor</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={consumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(value: number, key) => (key === "qty" ? [`${value} un`, "Quantidade"] : [fmtBRL(value), "Valor"])}
                />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 font-display text-sm font-semibold">Valor por categoria</div>
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {byCategory.map((_, idx) => (
                    <Cell key={idx} fill={`hsl(${(idx * 47) % 360} 75% 60%)`} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => fmtBRL(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto, código, fornecedor…" className="pl-9" />
          </div>
          <Select value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {INVENTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stock} onValueChange={(v) => setStock(v as typeof stock)}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Estoque" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ok">Normal</SelectItem>
              <SelectItem value="low">Baixo</SelectItem>
              <SelectItem value="out">Zerado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Gift className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Nenhum produto encontrado.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((i) => <ItemCard key={i.id} i={i} onClick={() => setOpenId(i.id)} />)}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          {selected && <ItemDetail item={selected} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`size-4 ${tone === "danger" ? "text-red-400" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 font-display text-2xl font-semibold ${tone === "danger" ? "text-red-300" : ""}`}>{value}</div>
    </Card>
  );
}

function ItemCard({ i, onClick }: { i: InventoryItem; onClick: () => void }) {
  const status = stockStatus(i);
  const available = Math.max(0, i.quantity - i.reserved);
  const pct = Math.min(100, (i.quantity / Math.max(1, i.minQuantity * 2)) * 100);
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={CATEGORY_TONE[i.category]}>{i.category}</Badge>
            {status === "low" && <Badge variant="outline" className="border-amber-500/30 bg-amber-500/15 text-amber-300">Baixo</Badge>}
            {status === "out" && <Badge variant="outline" className="border-red-500/30 bg-red-500/15 text-red-300">Zerado</Badge>}
          </div>
          <h3 className="mt-2 truncate font-medium">{i.name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{i.supplier} · {i.location}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div className="flex items-center justify-end gap-1"><QrCode className="size-3" /> {i.internalCode}</div>
          <div className="mt-1">{fmtBRL(i.unitValue)} / un</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <Stat label="Em estoque" value={String(i.quantity)} />
        <Stat label="Disponível" value={String(available)} />
        <Stat label="Reservado" value={String(i.reserved)} />
      </div>
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/30">
          <div
            className={`h-full rounded-full transition-all ${
              status === "out" ? "bg-red-500" : status === "low" ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>min {i.minQuantity}</span>
          <span>{fmtBRL(i.quantity * i.unitValue)}</span>
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-card/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-display text-sm font-semibold">{value}</div>
    </div>
  );
}

function ItemDetail({ item }: { item: InventoryItem }) {
  const [notes, setNotes] = useState(item.notes);
  const [mvOpen, setMvOpen] = useState(false);
  const status = stockStatus(item);
  const available = Math.max(0, item.quantity - item.reserved);

  return (
    <>
      <SheetHeader className="space-y-2 pr-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={CATEGORY_TONE[item.category]}>{item.category}</Badge>
          {status === "low" && <Badge variant="outline" className="border-amber-500/30 bg-amber-500/15 text-amber-300">Estoque baixo</Badge>}
          {status === "out" && <Badge variant="outline" className="border-red-500/30 bg-red-500/15 text-red-300">Zerado</Badge>}
        </div>
        <SheetTitle className="font-display text-xl">{item.name}</SheetTitle>
        <SheetDescription className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1"><QrCode className="size-3" /> {item.internalCode}</span>
          <span>·</span>
          <span>{item.qrCode}</span>
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Em estoque" value={String(item.quantity)} />
        <Stat label="Disponível" value={String(available)} />
        <Stat label="Reservado" value={String(item.reserved)} />
        <Stat label="Mínimo" value={String(item.minQuantity)} />
        <Stat label="Valor unitário" value={fmtBRL(item.unitValue)} />
        <Stat label="Valor total" value={fmtBRL(item.quantity * item.unitValue)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Info label="Fornecedor" value={item.supplier} />
        <Info label="Localização" value={item.location} />
      </div>

      <Dialog open={mvOpen} onOpenChange={setMvOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4 w-full"><RefreshCw className="size-4" /> Registrar movimentação</Button>
        </DialogTrigger>
        <MovementDialog itemId={item.id} onClose={() => setMvOpen(false)} />
      </Dialog>

      <Tabs defaultValue="historico" className="mt-5">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
          <TabsTrigger value="notas">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="historico">
          <ScrollArea className="h-80 pr-2">
            <ol className="space-y-2">
              {item.movements.map((m) => (
                <li key={m.id} className="rounded-md border border-border/40 bg-card/40 p-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={MOVEMENT_TONE[m.type]}>{m.type}</Badge>
                    <span className="font-display font-semibold">{m.type === "Saída" || m.type === "Transferência" ? "-" : m.type === "Entrada" ? "+" : ""}{m.quantity}</span>
                  </div>
                  <p className="mt-1">{m.reason}</p>
                  <div className="mt-1 flex justify-between text-muted-foreground">
                    <span>{m.author}{m.event ? ` · ${m.event}` : ""}{m.campaign ? ` · ${m.campaign}` : ""}{m.destination ? ` → ${m.destination}` : ""}</span>
                    <span>{new Date(m.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="qr">
          <Card className="flex flex-col items-center gap-3 p-6 text-center">
            <div className="flex size-40 items-center justify-center rounded-md border border-border/60 bg-white/95 p-4">
              <QrPattern seed={item.qrCode} />
            </div>
            <div className="font-mono text-xs">{item.qrCode}</div>
            <div className="text-xs text-muted-foreground">Código interno: {item.internalCode}</div>
          </Card>
        </TabsContent>

        <TabsContent value="fotos" className="space-y-2">
          {item.photos.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">Nenhuma foto enviada.</Card>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {item.photos.map((p) => (
                <Card key={p.id} className="flex h-24 flex-col items-center justify-center gap-1 p-2 text-xs">
                  <FileImage className="size-5 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                </Card>
              ))}
            </div>
          )}
          <Button size="sm" variant="outline" className="w-full" onClick={() => {
            const photo = { id: `ph-${Date.now()}`, name: `foto-${item.photos.length + 1}.jpg`, size: 1500000 };
            inventoryStore.update(item.id, { photos: [...item.photos, photo] });
          }}><Upload className="size-3.5" /> Adicionar foto</Button>
        </TabsContent>

        <TabsContent value="notas">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes !== item.notes && inventoryStore.update(item.id, { notes })}
            rows={6}
            placeholder="Observações sobre o produto, restrições, fornecedor, validade…"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/40 bg-card/40 p-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm">{value}</div>
    </div>
  );
}

function QrPattern({ seed }: { seed: string }) {
  // Deterministic pseudo-QR visualization
  const size = 12;
  const cells: boolean[] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < size * size; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push(((h >> 16) & 1) === 1);
  }
  return (
    <div className="grid h-full w-full gap-px" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {cells.map((on, i) => (
        <div key={i} className={on ? "bg-black" : "bg-transparent"} />
      ))}
    </div>
  );
}

function MovementDialog({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const [type, setType] = useState<MovementType>("Saída");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [author, setAuthor] = useState("Bruno");
  const [destination, setDestination] = useState("");
  const [campaign, setCampaign] = useState("");
  const [event, setEvent] = useState("");

  function submit() {
    if (!reason || quantity <= 0) {
      toast.error("Informe quantidade e motivo.");
      return;
    }
    inventoryStore.registerMovement(itemId, {
      type,
      quantity,
      reason,
      author,
      destination: destination || undefined,
      campaign: campaign || undefined,
      event: event || undefined,
    });
    toast.success("Movimentação registrada");
    onClose();
  }

  const Icon =
    type === "Entrada" ? ArrowDownToLine :
    type === "Saída" ? ArrowUpFromLine :
    type === "Transferência" ? Boxes :
    type === "Reserva" ? Lock : ClipboardList;

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><Icon className="size-5" /> Registrar movimentação</DialogTitle>
        <DialogDescription>Tipo de operação e dados de rastreio.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as MovementType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MOVEMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{type === "Inventário" ? "Quantidade contada" : "Quantidade"}</Label>
          <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 0)} />
        </div>
        <div className="col-span-2">
          <Label>Motivo</Label>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: Distribuição no evento" />
        </div>
        <div>
          <Label>Responsável</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
        {(type === "Saída" || type === "Transferência") && (
          <div>
            <Label>{type === "Transferência" ? "Destino" : "Para quem / onde"}</Label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Almoxarifado B / Equipe" />
          </div>
        )}
        <div>
          <Label>Campanha (opcional)</Label>
          <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} />
        </div>
        <div>
          <Label>Evento (opcional)</Label>
          <Input value={event} onChange={(e) => setEvent(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Registrar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function NewItemDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    category: "Vestuário" as InventoryCategory,
    supplier: "",
    quantity: 0,
    minQuantity: 10,
    unitValue: 0,
    location: "Almoxarifado",
    internalCode: "",
  });

  function submit() {
    if (!form.name || !form.supplier) {
      toast.error("Informe nome e fornecedor.");
      return;
    }
    inventoryStore.add(form);
    toast.success("Produto cadastrado");
    onClose();
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Novo produto</DialogTitle>
        <DialogDescription>Cadastre um item no estoque. Código interno e QR Code são gerados automaticamente.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Produto</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as InventoryCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {INVENTORY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Fornecedor</Label>
          <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        </div>
        <div>
          <Label>Quantidade inicial</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Quantidade mínima</Label>
          <Input type="number" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Valor unitário (R$)</Label>
          <Input type="number" step="0.01" value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: Number(e.target.value) || 0 })} />
        </div>
        <div>
          <Label>Localização</Label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Código interno (opcional)</Label>
          <Input value={form.internalCode} onChange={(e) => setForm({ ...form, internalCode: e.target.value })} placeholder="Em branco para gerar automaticamente" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit}>Cadastrar produto</Button>
      </DialogFooter>
    </DialogContent>
  );
}
