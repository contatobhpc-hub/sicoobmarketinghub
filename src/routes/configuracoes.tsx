import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Users,
  ShieldCheck,
  KeyRound,
  Tags,
  Layers,
  Briefcase,
  MapPin,
  Package,
  Hash,
  CircleDot,
  FileCode2,
  Plug,
  Zap,
  Bell,
  HardDriveDownload,
  ScrollText,
  History,
  Palette,
  Languages,
  Lock,
  Scale,
  Search,
  Plus,
  Trash2,
  Check,
  CircleDashed,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { settingsStore, useSettings, useCurrentUser, type SettingsState, type RoleKey } from "@/lib/settings";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Marketing Hub" },
      { name: "description", content: "Empresa, usuários, papéis, integrações, segurança e LGPD." },
    ],
  }),
  component: ConfiguracoesPage,
});

type SectionKey =
  | "empresa"
  | "usuarios"
  | "permissoes"
  | "papeis"
  | "categorias"
  | "tipos"
  | "agencias"
  | "cidades"
  | "produtos"
  | "etiquetas"
  | "status"
  | "templates"
  | "integracoes"
  | "automacoes"
  | "notificacoes"
  | "backup"
  | "logs"
  | "auditoria"
  | "tema"
  | "idioma"
  | "seguranca"
  | "lgpd";

type Group = {
  label: string;
  items: { key: SectionKey; label: string; icon: typeof Building2; description?: string }[];
};

const GROUPS: Group[] = [
  {
    label: "Workspace",
    items: [
      { key: "empresa", label: "Empresa", icon: Building2 },
      { key: "usuarios", label: "Usuários", icon: Users },
      { key: "permissoes", label: "Permissões", icon: KeyRound },
      { key: "papeis", label: "Papéis", icon: ShieldCheck },
    ],
  },
  {
    label: "Listas",
    items: [
      { key: "categorias", label: "Categorias", icon: Layers },
      { key: "tipos", label: "Tipos de Campanha", icon: Tags },
      { key: "agencias", label: "Agências", icon: Briefcase },
      { key: "cidades", label: "Cidades", icon: MapPin },
      { key: "produtos", label: "Produtos", icon: Package },
      { key: "etiquetas", label: "Etiquetas", icon: Hash },
      { key: "status", label: "Status", icon: CircleDot },
      { key: "templates", label: "Templates", icon: FileCode2 },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { key: "integracoes", label: "Integrações", icon: Plug },
      { key: "automacoes", label: "Automações", icon: Zap },
      { key: "notificacoes", label: "Notificações", icon: Bell },
      { key: "backup", label: "Backup", icon: HardDriveDownload },
      { key: "logs", label: "Logs", icon: ScrollText },
      { key: "auditoria", label: "Auditoria", icon: History },
    ],
  },
  {
    label: "Preferências",
    items: [
      { key: "tema", label: "Tema", icon: Palette },
      { key: "idioma", label: "Idioma", icon: Languages },
      { key: "seguranca", label: "Segurança", icon: Lock },
      { key: "lgpd", label: "LGPD", icon: Scale },
    ],
  },
];

function ConfiguracoesPage() {
  const settings = useSettings();
  const [section, setSection] = useState<SectionKey>("empresa");
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return GROUPS;
    const q = query.toLowerCase();
    return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) })).filter(
      (g) => g.items.length > 0,
    );
  }, [query]);

  const active = useMemo(() => {
    for (const g of GROUPS) for (const i of g.items) if (i.key === section) return i;
    return GROUPS[0].items[0];
  }, [section]);

  return (
    <AppShell>
      <PageHeader
        title="Configurações"
        description="Gerencie empresa, equipe, permissões, integrações e preferências da plataforma."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar Notion-like */}
        <aside className="space-y-4">
          <OrgSwitcher settings={settings} />
          <div className="rounded-xl border border-border bg-surface/40 p-2">
            <div className="relative px-1 pb-2">
              <Search className="pointer-events-none absolute left-3 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar configuração…"
                className="h-8 pl-7 text-xs"
              />
            </div>
            <nav className="space-y-3 px-1 pb-1">
              {filteredGroups.map((g) => (
                <div key={g.label}>
                  <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {g.label}
                  </div>
                  <ul className="space-y-0.5">
                    {g.items.map((i) => {
                      const Icon = i.icon;
                      const activeItem = section === i.key;
                      return (
                        <li key={i.key}>
                          <button
                            onClick={() => setSection(i.key)}
                            className={cn(
                              "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                              activeItem
                                ? "bg-primary/10 text-foreground"
                                : "text-muted-foreground hover:bg-surface hover:text-foreground",
                            )}
                          >
                            <Icon className={cn("h-3.5 w-3.5", activeItem ? "text-primary" : "")} />
                            <span className="truncate">{i.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <section className="min-w-0">
          <div className="rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-xl">
            <header className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <active.icon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{active.label}</h2>
                <p className="text-xs text-muted-foreground">Configure {active.label.toLowerCase()} do workspace.</p>
              </div>
            </header>
            <Separator className="mb-6" />
            <SectionContent section={section} settings={settings} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/* -------------------- Sections -------------------- */

function SectionContent({ section, settings }: { section: SectionKey; settings: SettingsState }) {
  switch (section) {
    case "empresa":
      return <EmpresaSection settings={settings} />;
    case "usuarios":
      return <UsuariosSection settings={settings} />;
    case "permissoes":
      return <PermissoesSection settings={settings} />;
    case "papeis":
      return <PapeisSection settings={settings} />;
    case "categorias":
      return <ListSection title="Categorias" items={settings.categories} onChange={(v) => settingsStore.patchSection("categories", v)} />;
    case "tipos":
      return <ListSection title="Tipos de Campanha" items={settings.campaignTypes} onChange={(v) => settingsStore.patchSection("campaignTypes", v)} />;
    case "agencias":
      return <ListSection title="Agências" items={settings.agencies} onChange={(v) => settingsStore.patchSection("agencies", v)} />;
    case "cidades":
      return <ListSection title="Cidades" items={settings.cities} onChange={(v) => settingsStore.patchSection("cities", v)} />;
    case "produtos":
      return <ListSection title="Produtos" items={settings.products} onChange={(v) => settingsStore.patchSection("products", v)} />;
    case "etiquetas":
      return <TagsSection settings={settings} />;
    case "status":
      return <StatusSection settings={settings} />;
    case "templates":
      return <TemplatesSection settings={settings} />;
    case "integracoes":
      return <IntegracoesSection settings={settings} />;
    case "automacoes":
      return <AutomacoesSection settings={settings} />;
    case "notificacoes":
      return <NotificacoesSection settings={settings} />;
    case "backup":
      return <BackupSection settings={settings} />;
    case "logs":
    case "auditoria":
      return <LogsSection settings={settings} />;
    case "tema":
      return <TemaSection settings={settings} />;
    case "idioma":
      return <IdiomaSection settings={settings} />;
    case "seguranca":
      return <SegurancaSection settings={settings} />;
    case "lgpd":
      return <LgpdSection settings={settings} />;
    default:
      return null;
  }
}

/* -------------------- Reusable -------------------- */

function OrgSwitcher({ settings }: { settings: SettingsState }) {
  const current = useCurrentUser();
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Multiempresa</div>
      <Select value={settings.activeOrgId} onValueChange={(v) => { settingsStore.update({ activeOrgId: v }); toast.success("Organização alterada"); }}>
        <SelectTrigger className="mt-2 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {settings.organizations.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</div>
      <Select value={settings.activeWorkspaceId} onValueChange={(v) => { settingsStore.update({ activeWorkspaceId: v }); toast.success("Workspace alterado"); }}>
        <SelectTrigger className="mt-2 h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {settings.workspaces
            .filter((w) => w.orgId === settings.activeOrgId)
            .map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      <div className="mt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Usuário ativo</div>
      <Select
        value={current?.id ?? settings.members[0]?.id}
        onValueChange={(v) => { settingsStore.setCurrentUser(v); toast.success("Sessão alterada"); }}
      >
        <SelectTrigger className="mt-2 h-9"><SelectValue /></SelectTrigger>
        <SelectContent>
          {settings.members.map((m) => (
            <SelectItem key={m.id} value={m.id}>{m.name} — {m.role}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Define quem está logado para permissões, auditoria e atribuições em toda a plataforma.
      </p>
    </div>
  );
}

function EmpresaSection({ settings }: { settings: SettingsState }) {
  const c = settings.company;
  const update = (patch: Partial<typeof c>) => settingsStore.patchSection("company", { ...c, ...patch });
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Razão social"><Input value={c.legalName} onChange={(e) => update({ legalName: e.target.value })} /></Field>
      <Field label="Nome fantasia"><Input value={c.tradeName} onChange={(e) => update({ tradeName: e.target.value })} /></Field>
      <Field label="CNPJ"><Input value={c.cnpj} onChange={(e) => update({ cnpj: e.target.value })} /></Field>
      <Field label="Telefone"><Input value={c.phone} onChange={(e) => update({ phone: e.target.value })} /></Field>
      <Field label="E-mail"><Input value={c.email} onChange={(e) => update({ email: e.target.value })} /></Field>
      <Field label="Site"><Input value={c.site} onChange={(e) => update({ site: e.target.value })} /></Field>
      <Field label="Endereço" full><Input value={c.address} onChange={(e) => update({ address: e.target.value })} /></Field>
      <Field label="Fuso horário"><Input value={c.timezone} onChange={(e) => update({ timezone: e.target.value })} /></Field>
    </div>
  );
}

function UsuariosSection({ settings }: { settings: SettingsState }) {
  const update = (members: SettingsState["members"]) => settingsStore.patchSection("members", members);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ name: string; email: string; role: RoleKey }>({ name: "", email: "", role: "Colaborador" });

  const invite = () => {
    if (!draft.name.trim() || !draft.email.trim()) return toast.error("Preencha nome e e-mail");
    const member = { id: `u-${Date.now().toString(36)}`, name: draft.name.trim(), email: draft.email.trim(), role: draft.role, status: "Convidado" as const };
    update([...settings.members, member]);
    settingsStore.addLog("Convidou", `${member.name} (${member.role})`);
    toast.success(`Convite enviado para ${member.email}`);
    setDraft({ name: "", email: "", role: "Colaborador" });
    setOpen(false);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{settings.members.length} usuários no workspace.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Convidar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Convidar usuário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Field label="Nome"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nome completo" /></Field>
              <Field label="E-mail"><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="usuario@credibelo.coop.br" /></Field>
              <Field label="Papel">
                <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as RoleKey })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{settings.roles.map((r) => <SelectItem key={r.key} value={r.key}>{r.key}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={invite}>Enviar convite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs text-muted-foreground">
            <tr><th className="px-3 py-2 text-left font-medium">Usuário</th><th className="px-3 py-2 text-left font-medium">Papel</th><th className="px-3 py-2 text-left font-medium">Status</th><th /></tr>
          </thead>
          <tbody>
            {settings.members.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{m.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                    <div>
                      <div className="font-medium text-foreground">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Select value={m.role} onValueChange={(v) => { update(settings.members.map((x) => x.id === m.id ? { ...x, role: v as RoleKey } : x)); toast.success(`Papel de ${m.name} atualizado`); }}>
                    <SelectTrigger className="h-8 w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{settings.roles.map((r) => <SelectItem key={r.key} value={r.key}>{r.key}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select value={m.status} onValueChange={(v) => update(settings.members.map((x) => x.id === m.id ? { ...x, status: v as typeof m.status } : x))}>
                    <SelectTrigger className="h-8 w-[140px]"><Badge variant={m.status === "Ativo" ? "default" : "secondary"}>{m.status}</Badge></SelectTrigger>
                    <SelectContent>{(["Ativo", "Convidado", "Inativo"] as const).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2 text-right">
                  <Button size="icon" variant="ghost" onClick={() => { update(settings.members.filter((x) => x.id !== m.id)); toast.success(`${m.name} removido`); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PapeisSection({ settings }: { settings: SettingsState }) {
  return (
    <div className="space-y-3">
      {settings.roles.map((r) => (
        <div key={r.key} className="rounded-lg border border-border bg-surface/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><span className="font-medium">{r.key}</span></div>
            <Badge variant="secondary">{r.permissions.length} permissões</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {r.permissions.map((p) => <span key={p} className="rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{p}</span>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function PermissoesSection({ settings }: { settings: SettingsState }) {
  const modules = ["campanhas", "projetos", "eventos", "conteudos", "contratos", "parceiros", "brindes", "indicadores"];
  const actions: Array<"read" | "create" | "update" | "delete"> = ["read", "create", "update", "delete"];
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-surface/60">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Módulo</th>
            {settings.roles.map((r) => <th key={r.key} className="px-3 py-2 text-center font-medium">{r.key}</th>)}
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => (
            <tr key={m} className="border-t border-border">
              <td className="px-3 py-2 font-medium capitalize">{m}</td>
              {settings.roles.map((r) => {
                const has = r.permissions.includes("*") || r.permissions.some((p) => p.startsWith(`${m}:`));
                return (
                  <td key={r.key} className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                      {actions.map((a) => {
                        const allowed = r.permissions.includes("*") || r.permissions.includes(`${m}:*`) || r.permissions.includes(`${m}:${a}`);
                        return <span key={a} className={cn("rounded px-1", allowed ? "bg-primary/15 text-primary" : "bg-surface")}>{a[0].toUpperCase()}</span>;
                      })}
                      {!has && <CircleDashed className="ml-1 h-3 w-3" />}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListSection({ title, items, onChange }: { title: string; items: string[]; onChange: (v: string[]) => void }) {
  const [value, setValue] = useState("");
  const add = () => {
    const v = value.trim();
    if (!v) return toast.error("Digite um valor antes de adicionar");
    if (items.some((i) => i.toLowerCase() === v.toLowerCase())) return toast.error(`${v} já existe em ${title}`);
    onChange([...items, v]);
    settingsStore.addLog("Adicionou", `${title}: ${v}`);
    toast.success(`${v} adicionado em ${title}`);
    setValue("");
  };
  const remove = (idx: number) => {
    const it = items[idx];
    if (!window.confirm(`Remover "${it}" de ${title}?`)) return;
    onChange(items.filter((_, i) => i !== idx));
    settingsStore.addLog("Removeu", `${title}: ${it}`);
    toast.success(`${it} removido`);
  };
  return (
    <div>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={`Novo item em ${title.toLowerCase()}…`} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Adicionar</Button>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-border bg-surface/40 px-3 py-6 text-center text-xs text-muted-foreground">
          Nenhum item em {title.toLowerCase()} ainda. Adicione o primeiro acima.
        </p>
      ) : (
        <ul className="mt-4 space-y-1">
          {items.map((it, idx) => (
            <li key={`${it}-${idx}`} className="flex items-center justify-between rounded-md border border-border bg-surface/60 px-3 py-2 text-sm">
              <span>{it}</span>
              <Button size="icon" variant="ghost" onClick={() => remove(idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TagsSection({ settings }: { settings: SettingsState }) {
  const update = (v: SettingsState["tags"]) => settingsStore.patchSection("tags", v);
  const add = () => {
    const label = window.prompt("Nome da etiqueta:", "Nova etiqueta")?.trim();
    if (!label) return;
    if (settings.tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) return toast.error("Etiqueta já existe");
    update([...settings.tags, { id: `tg-${Date.now().toString(36)}`, label, color: "#6366f1" }]);
    settingsStore.addLog("Adicionou", `Etiqueta: ${label}`);
    toast.success(`Etiqueta "${label}" criada`);
  };
  const remove = (id: string) => {
    const t = settings.tags.find((x) => x.id === id);
    if (!t || !window.confirm(`Remover etiqueta "${t.label}"?`)) return;
    update(settings.tags.filter((x) => x.id !== id));
    settingsStore.addLog("Removeu", `Etiqueta: ${t.label}`);
    toast.success("Etiqueta removida");
  };
  return (
    <div className="space-y-3">
      <Button size="sm" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Nova etiqueta</Button>
      <ul className="space-y-1">
        {settings.tags.map((t) => (
          <li key={t.id} className="flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm">
            <input type="color" value={t.color} onChange={(e) => update(settings.tags.map((x) => x.id === t.id ? { ...x, color: e.target.value } : x))} className="h-6 w-6 cursor-pointer rounded border border-border bg-transparent" />
            <Input value={t.label} onChange={(e) => update(settings.tags.map((x) => x.id === t.id ? { ...x, label: e.target.value } : x))} className="h-8" />
            <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusSection({ settings }: { settings: SettingsState }) {
  const update = (v: SettingsState["statuses"]) => settingsStore.patchSection("statuses", v);
  const add = () => {
    const label = window.prompt("Nome do status:", "Novo status")?.trim();
    if (!label) return;
    if (settings.statuses.some((s) => s.label.toLowerCase() === label.toLowerCase())) return toast.error("Status já existe");
    update([...settings.statuses, { id: `st-${Date.now().toString(36)}`, label, color: "#94a3b8" }]);
    settingsStore.addLog("Adicionou", `Status: ${label}`);
    toast.success(`Status "${label}" criado`);
  };
  const remove = (id: string) => {
    const s = settings.statuses.find((x) => x.id === id);
    if (!s || !window.confirm(`Remover status "${s.label}"?`)) return;
    update(settings.statuses.filter((x) => x.id !== id));
    settingsStore.addLog("Removeu", `Status: ${s.label}`);
    toast.success("Status removido");
  };
  return (
    <div className="space-y-3">
      <Button size="sm" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Novo status</Button>
      <ul className="space-y-1">
        {settings.statuses.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm">
            <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
            <Input value={s.label} onChange={(e) => update(settings.statuses.map((x) => x.id === s.id ? { ...x, label: e.target.value } : x))} className="h-8" />
            <input type="color" value={s.color} onChange={(e) => update(settings.statuses.map((x) => x.id === s.id ? { ...x, color: e.target.value } : x))} className="h-6 w-6 cursor-pointer rounded border border-border bg-transparent" />
            <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplatesSection({ settings }: { settings: SettingsState }) {
  const update = (v: SettingsState["templates"]) => settingsStore.patchSection("templates", v);
  const add = () => {
    const name = window.prompt("Nome do template:", "Novo template")?.trim();
    if (!name) return;
    update([...settings.templates, { id: `tp-${Date.now().toString(36)}`, name, type: "Campanha" }]);
    settingsStore.addLog("Adicionou", `Template: ${name}`);
    toast.success(`Template "${name}" criado`);
  };
  const remove = (id: string) => {
    const t = settings.templates.find((x) => x.id === id);
    if (!t || !window.confirm(`Remover template "${t.name}"?`)) return;
    update(settings.templates.filter((x) => x.id !== id));
    settingsStore.addLog("Removeu", `Template: ${t.name}`);
    toast.success("Template removido");
  };
  return (
    <div className="space-y-3">
      <Button size="sm" onClick={add}><Plus className="mr-1 h-3.5 w-3.5" /> Novo template</Button>
      <ul className="space-y-1">
        {settings.templates.map((t) => (
          <li key={t.id} className="flex items-center gap-2 rounded-md border border-border bg-surface/60 px-3 py-2 text-sm">
            <Input value={t.name} onChange={(e) => update(settings.templates.map((x) => x.id === t.id ? { ...x, name: e.target.value } : x))} className="h-8" />
            <Select value={t.type} onValueChange={(v) => update(settings.templates.map((x) => x.id === t.id ? { ...x, type: v } : x))}>
              <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>{["Campanha", "Projeto", "Evento", "Conteúdo", "Contrato"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </li>
        ))}
      </ul>
    </div>
  );
}


function IntegracoesSection({ settings }: { settings: SettingsState }) {
  const update = (v: SettingsState["integrations"]) => settingsStore.patchSection("integrations", v);
  const toggle = (id: string, v: boolean) => {
    const name = settings.integrations.find((i) => i.id === id)?.name ?? id;
    update(settings.integrations.map((x) => x.id === id ? { ...x, connected: v } : x));
    settingsStore.addLog(v ? "Conectou" : "Desconectou", name);
    toast.success(`${name} ${v ? "conectada" : "desconectada"}`);
  };
  const byPhase = (phase: 1 | 2) => settings.integrations.filter((i) => i.phase === phase);
  return (
    <div className="space-y-6">
      {[1, 2].map((phase) => (
        <div key={phase}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-medium">Fase {phase}</h3>
            <Badge variant="secondary">{phase === 1 ? "Prioridade" : "Próximas versões"}</Badge>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {byPhase(phase as 1 | 2).map((i) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-3">
                <div>
                  <div className="text-sm font-medium">{i.name}</div>
                  <div className="text-xs text-muted-foreground">{i.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  {i.connected && <Badge className="gap-1"><Check className="h-3 w-3" /> Conectado</Badge>}
                  <Switch checked={i.connected} onCheckedChange={(v) => toggle(i.id, v)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AutomacoesSection({ settings }: { settings: SettingsState }) {
  const update = (v: SettingsState["automations"]) => settingsStore.patchSection("automations", v);
  return (
    <ul className="space-y-2">
      {settings.automations.map((a) => (
        <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-3">
          <div>
            <div className="text-sm font-medium">{a.name}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{a.trigger}</div>
          </div>
          <Switch
            checked={a.enabled}
            onCheckedChange={(v) => {
              update(settings.automations.map((x) => x.id === a.id ? { ...x, enabled: v } : x));
              toast.success(`Automação ${v ? "ativada" : "desativada"}`);
            }}
          />
        </li>
      ))}
    </ul>
  );
}

function NotificacoesSection({ settings }: { settings: SettingsState }) {
  const update = (v: SettingsState["notifications"]) => settingsStore.patchSection("notifications", v);
  const toggle = async (channel: SettingsState["notifications"][number]["channel"], v: boolean) => {
    if (channel === "Push" && v && typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Permissão de notificação negada pelo navegador");
        return;
      }
      new Notification("Marketing Hub", { body: "Notificações push ativadas com sucesso." });
    }
    update(settings.notifications.map((x) => x.channel === channel ? { ...x, enabled: v } : x));
    toast.success(`${channel}: ${v ? "ativado" : "desativado"}`);
  };
  return (
    <ul className="space-y-2">
      {settings.notifications.map((n) => (
        <li key={n.channel} className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{n.channel}</span>
            {(n.channel === "WhatsApp" || n.channel === "Teams") && <Badge variant="secondary" className="text-[10px]">Fase 2</Badge>}
          </div>
          <Switch checked={n.enabled} onCheckedChange={(v) => toggle(n.channel, v)} />
        </li>
      ))}
    </ul>
  );
}

function BackupSection({ settings }: { settings: SettingsState }) {
  const b = settings.backup;
  const update = (patch: Partial<typeof b>) => settingsStore.patchSection("backup", { ...b, ...patch });
  const fileRef = useRef<HTMLInputElement>(null);

  const runBackup = () => {
    const json = settingsStore.exportBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marketing-hub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    update({ lastBackupAt: new Date().toISOString() });
    settingsStore.addLog("Executou", "Backup do workspace");
    toast.success("Backup gerado e baixado");
  };

  const onRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      settingsStore.importBackup(text);
      settingsStore.addLog("Restaurou", `Backup: ${file.name}`);
      toast.success("Backup restaurado com sucesso");
    } catch {
      toast.error("Arquivo de backup inválido");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <ToggleRow label="Backup diário automático" checked={b.autoDaily} onChange={(v) => update({ autoDaily: v })} />
      <Field label="Retenção (dias)"><Input type="number" value={b.retentionDays} onChange={(e) => update({ retentionDays: Number(e.target.value) })} /></Field>
      <div className="text-xs text-muted-foreground">Último backup: {new Date(b.lastBackupAt).toLocaleString("pt-BR")}</div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={runBackup}><HardDriveDownload className="mr-1 h-3.5 w-3.5" /> Executar backup agora</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>Restaurar de arquivo…</Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onRestoreFile} />
        <Button
          variant="ghost"
          onClick={() => {
            if (!window.confirm("Restaurar dados padrão? Todas as personalizações serão perdidas.")) return;
            settingsStore.resetToSeed();
            toast.success("Configurações restauradas ao padrão");
          }}
        >
          Restaurar padrão
        </Button>
      </div>
    </div>
  );
}

function LogsSection({ settings }: { settings: SettingsState }) {
  const exportLogs = () => {
    const csv = ["timestamp,actor,action,target", ...settings.logs.map((l) => `${l.at},${l.actor},${l.action},${l.target}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exportados");
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{settings.logs.length} eventos registrados.</p>
        <Button size="sm" variant="outline" onClick={exportLogs}>Exportar CSV</Button>
      </div>
      <ul className="space-y-1">
        {settings.logs.map((l) => (
          <li key={l.id} className="rounded-md border border-border bg-surface/60 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <div><span className="font-medium">{l.actor}</span> <span className="text-muted-foreground">{l.action.toLowerCase()}</span> <span className="font-medium">{l.target}</span></div>
              <span className="text-[11px] text-muted-foreground">{new Date(l.at).toLocaleString("pt-BR")}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemaSection({ settings }: { settings: SettingsState }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {(["Sistema", "Claro", "Escuro"] as const).map((t) => (
        <button
          key={t}
          onClick={() => { settingsStore.update({ theme: t }); toast.success(`Tema: ${t}`); }}
          className={cn(
            "rounded-xl border p-4 text-left transition-all",
            settings.theme === t ? "border-primary bg-primary/10" : "border-border bg-surface/60 hover:border-border-strong",
          )}
        >
          <Palette className="h-5 w-5 text-primary" />
          <div className="mt-2 font-medium">{t}</div>
          <div className="text-xs text-muted-foreground">Aparência {t.toLowerCase()}.</div>
        </button>
      ))}
    </div>
  );
}

function IdiomaSection({ settings }: { settings: SettingsState }) {
  return (
    <Field label="Idioma da plataforma">
      <Select value={settings.language} onValueChange={(v) => settingsStore.update({ language: v as SettingsState["language"] })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
          <SelectItem value="en-US">English (US)</SelectItem>
          <SelectItem value="es-ES">Español</SelectItem>
        </SelectContent>
      </Select>
    </Field>
  );
}

function SegurancaSection({ settings }: { settings: SettingsState }) {
  const s = settings.security;
  const update = (patch: Partial<typeof s>) => settingsStore.patchSection("security", { ...s, ...patch });
  return (
    <div className="space-y-4">
      <ToggleRow label="Autenticação em dois fatores (2FA)" checked={s.twoFactor} onChange={(v) => update({ twoFactor: v })} />
      <ToggleRow label="Forçar SSO corporativo" checked={s.enforceSSO} onChange={(v) => update({ enforceSSO: v })} />
      <Field label="Timeout de sessão (minutos)"><Input type="number" value={s.sessionTimeoutMinutes} onChange={(e) => update({ sessionTimeoutMinutes: Number(e.target.value) })} /></Field>
      <Field label="Tamanho mínimo de senha"><Input type="number" value={s.passwordMinLength} onChange={(e) => update({ passwordMinLength: Number(e.target.value) })} /></Field>
    </div>
  );
}

function LgpdSection({ settings }: { settings: SettingsState }) {
  const l = settings.lgpd;
  const update = (patch: Partial<typeof l>) => settingsStore.patchSection("lgpd", { ...l, ...patch });
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Encarregado (DPO)"><Input value={l.dpoName} onChange={(e) => update({ dpoName: e.target.value })} /></Field>
      <Field label="E-mail do DPO"><Input value={l.dpoEmail} onChange={(e) => update({ dpoEmail: e.target.value })} /></Field>
      <Field label="Retenção de dados (meses)"><Input type="number" value={l.retentionMonths} onChange={(e) => update({ retentionMonths: Number(e.target.value) })} /></Field>
      <Field label="Política de privacidade (URL)"><Input value={l.privacyPolicyUrl} onChange={(e) => update({ privacyPolicyUrl: e.target.value })} /></Field>
      <div className="md:col-span-2"><ToggleRow label="Banner de consentimento de cookies" checked={l.consentBanner} onChange={(v) => update({ consentBanner: v })} /></div>
      <div className="md:col-span-2"><Textarea readOnly className="text-xs" value={"Plataforma em conformidade com a Lei 13.709/2018 (LGPD). Os titulares de dados podem solicitar acesso, correção, anonimização ou exclusão através do canal do DPO."} /></div>
    </div>
  );
}

/* -------------------- atoms -------------------- */

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "md:col-span-2")}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface/60 p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
