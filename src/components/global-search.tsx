import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Megaphone,
  FolderKanban,
  CalendarDays,
  Users,
  FileText,
  ScrollText,
  Package,
  Paperclip,
  User as UserIcon,
  Plus,
  Sparkles,
  CheckSquare,
  Image as ImageIcon,
  Handshake,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import { useCampaigns } from "@/lib/campaigns";
import { useProjects } from "@/lib/projects";
import { useEvents } from "@/lib/events";
import { usePartners } from "@/lib/partners";
import { useContracts } from "@/lib/contracts";
import { useContent } from "@/lib/content-library";
import { useInventory } from "@/lib/inventory";

type GlobalSearchProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TEAM = [
  { id: "u-bruno", name: "Bruno Almeida", role: "Gestor de Marketing" },
  { id: "u-carla", name: "Carla Souza", role: "Analista de Marketing" },
  { id: "u-marina", name: "Marina Reis", role: "Designer" },
  { id: "u-pedro", name: "Pedro Lima", role: "Mídia Offline" },
  { id: "u-camila", name: "Camila Torres", role: "Eventos" },
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const campaigns = useCampaigns();
  const projects = useProjects();
  const events = useEvents();
  const partners = usePartners();
  const contracts = useContracts();
  const content = useContent();
  const inventory = useInventory();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  const files = useMemo(() => {
    const acc: { id: string; name: string; from: string; to: string }[] = [];
    for (const p of projects) for (const f of p.files ?? []) acc.push({ id: `${p.id}-${f.name}`, name: f.name, from: `Projeto · ${p.name}`, to: `/projetos/${p.id}` });
    for (const c of contracts) for (const f of c.files ?? []) acc.push({ id: f.id, name: f.name, from: `Contrato · ${c.company}`, to: `/contratos` });
    for (const e of events) for (const f of e.files ?? []) acc.push({ id: f.id, name: f.name, from: `Evento · ${e.name}`, to: `/eventos` });
    return acc.slice(0, 20);
  }, [projects, contracts, events]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Pesquisar campanhas, projetos, eventos, parceiros, comandos…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[480px]">
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        <CommandGroup heading="Comandos rápidos">
          <CommandItem onSelect={() => go("/campanhas?new=1")}>
            <Plus className="mr-2 h-4 w-4 text-primary" />
            Criar Campanha
            <CommandShortcut>C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/eventos?new=1")}>
            <CalendarDays className="mr-2 h-4 w-4 text-primary" />
            Novo Evento
          </CommandItem>
          <CommandItem onSelect={() => go("/workflows?new=1")}>
            <CheckSquare className="mr-2 h-4 w-4 text-primary" />
            Nova Aprovação
          </CommandItem>
          <CommandItem onSelect={() => go("/conteudos?new=legenda")}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Nova Legenda
          </CommandItem>
          <CommandItem onSelect={() => go("/parceiros?new=1")}>
            <Handshake className="mr-2 h-4 w-4 text-primary" />
            Novo Parceiro
          </CommandItem>
          <CommandItem onSelect={() => go("/contratos?new=1")}>
            <ScrollText className="mr-2 h-4 w-4 text-primary" />
            Novo Contrato
          </CommandItem>
          <CommandItem onSelect={() => go("/projetos?new=1")}>
            <FolderKanban className="mr-2 h-4 w-4 text-primary" />
            Novo Projeto
          </CommandItem>
          <CommandItem onSelect={() => go("/brindes?new=1")}>
            <Package className="mr-2 h-4 w-4 text-primary" />
            Novo Brinde
          </CommandItem>
          <CommandItem onSelect={() => go("/central-ia")}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Abrir Central IA
          </CommandItem>
        </CommandGroup>

        {campaigns.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Campanhas">
              {campaigns.slice(0, 8).map((c) => (
                <CommandItem key={c.id} value={`campanha ${c.name} ${c.type}`} onSelect={() => go(`/campanhas/${c.id}`)}>
                  <Megaphone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projetos">
              {projects.slice(0, 8).map((p) => (
                <CommandItem key={p.id} value={`projeto ${p.name}`} onSelect={() => go(`/projetos/${p.id}`)}>
                  <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {events.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Eventos">
              {events.slice(0, 8).map((e) => (
                <CommandItem key={e.id} value={`evento ${e.name}`} onSelect={() => go("/eventos")}>
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{e.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{e.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {partners.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Parceiros">
              {partners.slice(0, 8).map((p) => (
                <CommandItem key={p.id} value={`parceiro ${p.company} ${p.category}`} onSelect={() => go("/parceiros")}>
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{p.company}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{p.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {content.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Conteúdos">
              {content.slice(0, 8).map((c) => (
                <CommandItem key={c.id} value={`conteudo ${c.title}`} onSelect={() => go("/conteudos")}>
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{c.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {contracts.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Contratos">
              {contracts.slice(0, 8).map((c) => (
                <CommandItem key={c.id} value={`contrato ${c.company} ${c.object}`} onSelect={() => go("/contratos")}>
                  <ScrollText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{c.company}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{c.status}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {inventory.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Brindes">
              {inventory.slice(0, 8).map((i) => (
                <CommandItem key={i.id} value={`brinde ${i.name} ${i.category}`} onSelect={() => go("/brindes")}>
                  <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{i.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{i.category}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {files.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Arquivos">
              {files.map((f) => (
                <CommandItem key={f.id} value={`arquivo ${f.name}`} onSelect={() => go(f.to)}>
                  <Paperclip className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{f.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{f.from}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Usuários">
          {TEAM.map((u) => (
            <CommandItem key={u.id} value={`usuario ${u.name}`} onSelect={() => go("/configuracoes")}>
              <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate">{u.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{u.role}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />
        <CommandGroup heading="Ir para">
          <CommandItem onSelect={() => go("/prioridades")}>
            <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            Central de Prioridades
          </CommandItem>
          <CommandItem onSelect={() => go("/analytics")}>
            <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            Dashboard Executivo
          </CommandItem>
          <CommandItem onSelect={() => go("/indicadores")}>
            <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            Indicadores
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
