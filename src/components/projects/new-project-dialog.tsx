import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  projectsStore,
  type ProjectPriority,
  type ProjectStatus,
} from "@/lib/projects";
import { useCampaigns } from "@/lib/campaigns";
import { settingsStore, useHasPermission } from "@/lib/settings";
import { PermissionButton } from "@/components/permission-gate";

export function NewProjectDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const campaigns = useCampaigns();
  const canCreate = useHasPermission("projetos:create");


  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [area, setArea] = useState("");
  const [owner, setOwner] = useState("");
  const [team, setTeam] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Backlog");
  const [priority, setPriority] = useState<ProjectPriority>("Média");
  const [description, setDescription] = useState("");
  const [campaignId, setCampaignId] = useState<string>("none");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) {
      toast.error("Você não tem permissão para criar projetos.");
      return;
    }
    if (!name.trim()) {
      toast.error("Informe o nome do projeto.");
      return;
    }
    const created = projectsStore.add({
      name: name.trim(),
      client: client.trim(),
      area: area.trim(),
      owner: owner.trim(),
      team: team.split(",").map((s) => s.trim()).filter(Boolean),
      dueDate,
      status,
      priority,
      progress: 0,
      description: description.trim(),
      files: [],
      campaignId: campaignId === "none" ? undefined : campaignId,
    });
    settingsStore.addLog("Criou projeto", created.name);
    toast.success("Projeto criado");
    setOpen(false);
    navigate({ to: "/projetos/$id", params: { id: created.id } });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <PermissionButton
            perm="projetos:create"
            className="h-9 gap-2 text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Plus className="h-4 w-4" /> Novo projeto
          </PermissionButton>
        )}
      </DialogTrigger>


      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Novo projeto</DialogTitle>
          <DialogDescription>
            Criar manualmente ou vincular a uma campanha existente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Nome do projeto">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Cliente interno">
              <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Ex.: Diretoria de Negócios" />
            </Field>
            <Field label="Área solicitante">
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex.: Crédito, RH" />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Responsável">
              <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
            </Field>
            <Field label="Prazo">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>

          <Field label="Equipe" hint="Separe por vírgula">
            <Input value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Marina, Pedro, Carla" />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Status">
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prioridade">
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Campanha vinculada">
            <Select value={campaignId} onValueChange={setCampaignId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (manual)</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Descrição">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              className="text-primary-foreground shadow-[var(--shadow-glow)]"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Criar projeto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
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
