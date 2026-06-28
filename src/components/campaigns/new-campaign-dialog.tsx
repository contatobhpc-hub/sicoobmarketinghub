import { useState, type ReactNode } from "react";
import { Plus, Sparkles, Upload, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CAMPAIGN_MODULES,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_PRIORITIES,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  campaignsStore,
  type CampaignFile,
  type CampaignModuleKey,
  type CampaignObjective,
  type CampaignPriority,
  type CampaignStatus,
  type CampaignType,
} from "@/lib/campaigns";

const defaultModules: CampaignModuleKey[] = CAMPAIGN_MODULES.map((m) => m.key);

export function NewCampaignDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("Institucional");
  const [objective, setObjective] = useState<CampaignObjective>("Awareness");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("Planejamento");
  const [priority, setPriority] = useState<CampaignPriority>("Média");
  const [owner, setOwner] = useState("");
  const [products, setProducts] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<CampaignFile[]>([]);
  const [modules, setModules] = useState<CampaignModuleKey[]>(defaultModules);

  function reset() {
    setName("");
    setType("Institucional");
    setObjective("Awareness");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setStatus("Planejamento");
    setPriority("Média");
    setOwner("");
    setProducts("");
    setBudget("");
    setNotes("");
    setFiles([]);
    setModules(defaultModules);
  }

  function toggleModule(k: CampaignModuleKey) {
    setModules((curr) =>
      curr.includes(k) ? curr.filter((m) => m !== k) : [...curr, k],
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da campanha.");
      return;
    }
    const created = campaignsStore.add({
      name: name.trim(),
      type,
      objective,
      description: description.trim(),
      startDate,
      endDate,
      status,
      priority,
      owner: owner.trim(),
      products: products
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      budget: Number(budget) || 0,
      notes: notes.trim(),
      files,
      modules,
    });
    toast.success("Campanha criada", {
      description: `${modules.length} módulo${modules.length === 1 ? "" : "s"} vinculado${modules.length === 1 ? "" : "s"}.`,
    });
    reset();
    setOpen(false);
    navigate({ to: "/campanhas/$id", params: { id: created.id } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            className="h-9 gap-2 text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" /> Nova campanha
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nova campanha</DialogTitle>
          <DialogDescription>
            Defina os dados principais e escolha quais módulos devem ser gerados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          <section className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da campanha</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Crédito Rural 2026"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tipo">
                <Select value={type} onValueChange={(v) => setType(v as CampaignType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Objetivo">
                <Select value={objective} onValueChange={(v) => setObjective(v as CampaignObjective)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_OBJECTIVES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="desc">Descrição</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto, público-alvo e principais entregas."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Data início">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
              <Field label="Data fim">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Status">
                <Select value={status} onValueChange={(v) => setStatus(v as CampaignStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_STATUSES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Prioridade">
                <Select value={priority} onValueChange={(v) => setPriority(v as CampaignPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_PRIORITIES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Responsável">
                <Input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Nome" />
              </Field>
              <Field label="Orçamento (R$)">
                <Input
                  type="number"
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="0"
                />
              </Field>
            </div>

            <Field label="Produtos relacionados" hint="Separe por vírgula">
              <Input
                value={products}
                onChange={(e) => setProducts(e.target.value)}
                placeholder="Crédito Rural, Custeio Agrícola"
              />
            </Field>

            <div className="grid gap-2">
              <Label>Arquivos</Label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-elevated/40 px-4 py-6 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground">
                <Upload className="h-4 w-4" />
                Arraste arquivos ou clique para selecionar
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? []).map((f) => ({
                      name: f.name,
                      size: f.size,
                    }));
                    setFiles((curr) => [...curr, ...list]);
                  }}
                />
              </label>
              {files.length > 0 && (
                <ul className="space-y-1">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between rounded-md border border-border bg-surface-elevated/40 px-3 py-1.5 text-xs"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles((curr) => curr.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-elevated/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold">Gerar módulos automaticamente</h3>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              Selecione quais entidades devem ser criadas e vinculadas a esta campanha.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CAMPAIGN_MODULES.map((m) => {
                const checked = modules.includes(m.key);
                return (
                  <label
                    key={m.key}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      checked
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border bg-surface/60 text-muted-foreground hover:border-border-strong hover:text-foreground"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleModule(m.key)}
                    />
                    {m.label}
                  </label>
                );
              })}
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Criar campanha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
