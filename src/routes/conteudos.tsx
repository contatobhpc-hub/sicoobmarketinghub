import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Star,
  LayoutGrid,
  List,
  Plus,
  Filter,
  X,
  Sparkles,
  Tag,
  User,
  Calendar,
  History,
  FileText,
  ChevronRight,
  Send,
  Copy,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

import {
  CATEGORY_COLOR,
  CONTENT_CATEGORIES,
  CONTENT_STATUSES,
  contentStore,
  formatRelative,
  statusTone,
  useContent,
  type ContentCategory,
  type ContentItem,
  type ContentStatus,
} from "@/lib/content-library";
import { useCampaigns } from "@/lib/campaigns";
import { useProjects } from "@/lib/projects";

export const Route = createFileRoute("/conteudos")({
  head: () => ({
    meta: [
      { title: "Banco de Conteúdo — Marketing Hub" },
      { name: "description", content: "Biblioteca inteligente de conteúdos do departamento." },
    ],
  }),
  component: ContentLibraryPage,
});

function ContentLibraryPage() {
  const items = useContent();
  const campaigns = useCampaigns();
  const projects = useProjects();

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"cards" | "lista">("cards");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [fCategory, setFCategory] = useState<"all" | ContentCategory>("all");
  const [fStatus, setFStatus] = useState<"all" | ContentStatus>("all");
  const [fAuthor, setFAuthor] = useState("all");
  const [fCampaign, setFCampaign] = useState("all");
  const [fProject, setFProject] = useState("all");
  const [fTag, setFTag] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const authors = useMemo(() => Array.from(new Set(items.map((i) => i.author))).sort(), [items]);
  const tags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))).sort(), [items]);

  const filtered = useMemo(() => items.filter((i) => {
    if (onlyFavorites && !i.favorite) return false;
    if (fCategory !== "all" && i.category !== fCategory) return false;
    if (fStatus !== "all" && i.status !== fStatus) return false;
    if (fAuthor !== "all" && i.author !== fAuthor) return false;
    if (fCampaign !== "all" && i.campaignId !== fCampaign) return false;
    if (fProject !== "all" && i.projectId !== fProject) return false;
    if (fTag !== "all" && !i.tags.includes(fTag)) return false;
    if (query) {
      const q = query.toLowerCase();
      const hit =
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.body.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  }), [items, onlyFavorites, fCategory, fStatus, fAuthor, fCampaign, fProject, fTag, query]);

  const activeFilters =
    (fCategory !== "all" ? 1 : 0) + (fStatus !== "all" ? 1 : 0) +
    (fAuthor !== "all" ? 1 : 0) + (fCampaign !== "all" ? 1 : 0) +
    (fProject !== "all" ? 1 : 0) + (fTag !== "all" ? 1 : 0);

  function clearFilters() {
    setFCategory("all"); setFStatus("all"); setFAuthor("all");
    setFCampaign("all"); setFProject("all"); setFTag("all");
  }

  return (
    <AppShell>
      <PageHeader
        title="Banco de Conteúdo"
        description="Biblioteca pesquisável de tudo que o departamento produz."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => toast.info("Em breve", { description: "Integração com Central de IA será habilitada na próxima fase." })}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Gerar com IA
            </Button>
            <NewContentDialog />
          </div>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar título, descrição, conteúdo ou tag…"
            className="h-9 pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={onlyFavorites ? "default" : "outline"}
            size="sm"
            className="h-9 gap-1.5"
            onClick={() => setOnlyFavorites((v) => !v)}
          >
            <Star className={`h-3.5 w-3.5 ${onlyFavorites ? "fill-current" : ""}`} /> Favoritos
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5">
                <Filter className="h-3.5 w-3.5" /> Filtros
                {activeFilters > 0 && (
                  <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{activeFilters}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 space-y-3 p-3">
              <FilterRow label="Categoria" value={fCategory} onChange={(v) => setFCategory(v as never)} options={[...CONTENT_CATEGORIES]} />
              <FilterRow label="Status" value={fStatus} onChange={(v) => setFStatus(v as never)} options={[...CONTENT_STATUSES]} />
              <FilterRow label="Autor" value={fAuthor} onChange={setFAuthor} options={authors} />
              <FilterRow label="Tag" value={fTag} onChange={setFTag} options={tags} />
              <FilterRow label="Campanha" value={fCampaign} onChange={setFCampaign} options={campaigns.map((c) => ({ value: c.id, label: c.name }))} />
              <FilterRow label="Projeto" value={fProject} onChange={setFProject} options={projects.map((p) => ({ value: p.id, label: p.name }))} />
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs" onClick={clearFilters}>
                  <X className="h-3 w-3" /> Limpar filtros
                </Button>
              )}
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-surface/60 p-0.5">
            <button
              onClick={() => setView("cards")}
              className={`rounded-md p-1.5 transition-colors ${view === "cards" ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="Cards"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("lista")}
              className={`rounded-md p-1.5 transition-colors ${view === "lista" ? "bg-surface-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              aria-label="Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Chip active={fCategory === "all"} onClick={() => setFCategory("all")}>Todas</Chip>
        {CONTENT_CATEGORIES.map((c) => (
          <Chip key={c} active={fCategory === c} onClick={() => setFCategory((curr) => curr === c ? "all" : c)} tone={CATEGORY_COLOR[c]}>{c}</Chip>
        ))}
      </div>

      <div className="mb-3 text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "item" : "itens"}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="font-display text-base font-semibold">Nenhum conteúdo encontrado</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Ajuste a busca ou crie um novo conteúdo.</p>
        </div>
      ) : view === "cards" ? (
        <div className="grid grid-cols-1 gap-4 animate-fade-in sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((i) => (
            <ContentCard key={i.id} item={i} onOpen={() => setSelectedId(i.id)} />
          ))}
        </div>
      ) : (
        <ContentList items={filtered} onOpen={setSelectedId} />
      )}

      <PreviewDrawer id={selectedId} onClose={() => setSelectedId(null)} />
    </AppShell>
  );
}

function Chip({
  children, active, onClick, tone,
}: { children: React.ReactNode; active?: boolean; onClick?: () => void; tone?: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] transition-all ${
        active
          ? tone
            ? `${tone} border-transparent ring-1 ring-current/30`
            : "border-primary/40 bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function FilterRow({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="grid gap-1.5">
      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {opts.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ContentCard({ item, onOpen }: { item: ContentItem; onOpen: () => void }) {
  return (
    <article
      onClick={onOpen}
      className="group flex cursor-pointer flex-col rounded-xl border border-border bg-surface/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[item.category]}`}>{item.category}</span>
        <button
          onClick={(e) => { e.stopPropagation(); contentStore.toggleFavorite(item.id); }}
          className="text-muted-foreground transition-colors hover:text-yellow-400"
          aria-label="Favorito"
        >
          <Star className={`h-3.5 w-3.5 ${item.favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
        </button>
      </div>
      <h3 className="font-display text-sm font-semibold leading-snug">{item.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">{item.description || item.body}</p>

      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {item.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">#{t}</span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{item.author}</span>
        <span className="inline-flex items-center gap-1"><History className="h-3 w-3" />v{item.versions.length}</span>
        <span className={`rounded-md px-1.5 py-0.5 font-medium ${statusTone(item.status)}`}>{item.status}</span>
      </div>
    </article>
  );
}

function ContentList({ items, onOpen }: { items: ContentItem[]; onOpen: (id: string) => void }) {
  return (
    <ul className="animate-fade-in divide-y divide-border/60 rounded-xl border border-border bg-surface/40">
      {items.map((i) => (
        <li
          key={i.id}
          onClick={() => onOpen(i.id)}
          className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-elevated/40"
        >
          <button
            onClick={(e) => { e.stopPropagation(); contentStore.toggleFavorite(i.id); }}
            className="text-muted-foreground hover:text-yellow-400"
          >
            <Star className={`h-3.5 w-3.5 ${i.favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[i.category]}`}>{i.category}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{i.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">{i.description}</p>
          </div>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">{i.author}</span>
          <span className="hidden text-[10px] text-muted-foreground md:inline tabular">v{i.versions.length}</span>
          <span className={`hidden rounded-md px-1.5 py-0.5 text-[10px] font-medium md:inline ${statusTone(i.status)}`}>{i.status}</span>
          <span className="hidden text-[10px] text-muted-foreground lg:inline">{formatRelative(i.updatedAt)}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </li>
      ))}
    </ul>
  );
}

/* ---------- Preview drawer ---------- */

function PreviewDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const item = useContent().find((c) => c.id === id) ?? null;
  return (
    <Sheet open={!!item} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-[560px]">
        {item && <PreviewBody item={item} />}
      </SheetContent>
    </Sheet>
  );
}

function PreviewBody({ item }: { item: ContentItem }) {
  const campaigns = useCampaigns();
  const projects = useProjects();
  const campaign = item.campaignId ? campaigns.find((c) => c.id === item.campaignId) : undefined;
  const project = item.projectId ? projects.find((p) => p.id === item.projectId) : undefined;

  const [draft, setDraft] = useState(item.body);
  const [note, setNote] = useState("");

  function saveVersion() {
    if (!draft.trim() || draft === item.body) return;
    contentStore.addVersion(item.id, draft, "Bruno", note || undefined);
    setNote("");
    toast.success("Nova versão salva");
  }

  function copy() {
    navigator.clipboard.writeText(item.body).then(() => toast.success("Conteúdo copiado"));
  }

  return (
    <>
      <SheetHeader className={`border-b border-border ${CATEGORY_COLOR[item.category]} px-6 py-5`}>
        <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wide">
          <span>{item.category}</span>
          <button onClick={() => contentStore.toggleFavorite(item.id)} className="transition-colors hover:text-yellow-400">
            <Star className={`h-4 w-4 ${item.favorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
          </button>
        </div>
        <SheetTitle className="text-left font-display text-xl">{item.title}</SheetTitle>
        <p className="text-left text-[11px] text-muted-foreground">{item.description}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Select value={item.status} onValueChange={(v) => contentStore.update(item.id, { status: v as ContentStatus })}>
            <SelectTrigger className="h-7 w-auto gap-1 text-[11px]"><SelectValue /></SelectTrigger>
            <SelectContent>{CONTENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={copy}>
            <Copy className="h-3 w-3" /> Copiar
          </Button>
        </div>
      </SheetHeader>

      <div className="space-y-5 p-6">
        <section className="grid grid-cols-2 gap-2 text-xs">
          <Meta icon={User} label="Autor" value={item.author} />
          <Meta icon={CheckCircle2} label="Aprovador" value={item.approver ?? "—"} />
          <Meta icon={Calendar} label="Atualizado" value={formatRelative(item.updatedAt)} />
          <Meta icon={History} label="Versões" value={`${item.versions.length}`} />
        </section>

        {(campaign || project) && (
          <section className="space-y-1.5">
            {campaign && <RelLine label="Campanha" name={campaign.name} />}
            {project && <RelLine label="Projeto" name={project.name} />}
          </section>
        )}

        {item.tags.length > 0 && (
          <section className="flex flex-wrap gap-1">
            {item.tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Tag className="h-2.5 w-2.5" />{t}
              </span>
            ))}
          </section>
        )}

        {item.attachmentName && (
          <a className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated/40 px-3 py-2 text-xs">
            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" /> {item.attachmentName}
          </a>
        )}

        <Tabs defaultValue="preview">
          <TabsList className="grid grid-cols-3 bg-surface-elevated/60">
            <TabsTrigger value="preview" className="text-[11px]">Preview</TabsTrigger>
            <TabsTrigger value="versoes" className="text-[11px]">Versões</TabsTrigger>
            <TabsTrigger value="historico" className="text-[11px]">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="pt-4">
            <div className="rounded-lg border border-border bg-background/60 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {item.body}
            </div>
            <div className="mt-4 space-y-2">
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Editar e salvar nova versão</Label>
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} />
              <div className="flex gap-2">
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota da versão (opcional)" className="h-8 text-xs" />
                <Button size="sm" className="h-8 gap-1" onClick={saveVersion} disabled={draft === item.body || !draft.trim()}>
                  <Send className="h-3 w-3" /> Salvar versão
                </Button>
              </div>
              <Button
                variant="ghost" size="sm" className="h-8 w-full gap-1.5 text-xs"
                onClick={() => toast.info("Em breve", { description: "Sugestões e reescrita com IA estarão disponíveis aqui." })}
              >
                <Sparkles className="h-3 w-3 text-primary" /> Melhorar com IA
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="versoes" className="space-y-3 pt-4">
            {item.versions.slice().reverse().map((v) => (
              <div key={v.id} className="rounded-lg border border-border bg-surface-elevated/40 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{v.label}</span>
                  <span className="text-[10px] text-muted-foreground">{formatRelative(v.createdAt)} · {v.author}</span>
                </div>
                {v.note && <p className="mt-1.5 text-[11px] italic text-muted-foreground">"{v.note}"</p>}
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-foreground/90">{v.body}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="historico" className="pt-4">
            <ol className="relative space-y-3 border-l border-border pl-5">
              {item.history.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute -left-[23px] top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-primary/30" />
                  <div className="flex items-baseline justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="uppercase tracking-wide">{h.author ?? "Sistema"}</span>
                    <span>{formatRelative(h.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 text-sm">{h.message}</p>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-surface-elevated/40 p-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />{label}
      </div>
      <div className="mt-0.5 truncate text-xs font-medium">{value}</div>
    </div>
  );
}
function RelLine({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-elevated/40 px-2.5 py-1.5 text-xs">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="truncate">{name}</span>
    </div>
  );
}

/* ---------- New content ---------- */

function NewContentDialog() {
  const [open, setOpen] = useState(false);
  const campaigns = useCampaigns();
  const projects = useProjects();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ContentCategory>("Legendas");
  const [status, setStatus] = useState<ContentStatus>("Rascunho");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("Bruno Almeida");
  const [approver, setApprover] = useState("");
  const [campaignId, setCampaignId] = useState("none");
  const [projectId, setProjectId] = useState("none");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    contentStore.add({
      title: title.trim(),
      category, status, description: description.trim(), body,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      author, approver: approver || undefined,
      campaignId: campaignId === "none" ? undefined : campaignId,
      projectId: projectId === "none" ? undefined : projectId,
    });
    setOpen(false);
    toast.success("Conteúdo adicionado à biblioteca");
    setTitle(""); setDescription(""); setBody(""); setTags(""); setApprover("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 gap-2 text-primary-foreground shadow-[var(--shadow-glow)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4" /> Novo conteúdo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader><DialogTitle className="font-display text-xl">Novo conteúdo</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ContentCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Conteúdo</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Texto da legenda, roteiro, comunicado…" />
          </div>
          <div className="grid gap-2">
            <Label>Tags <span className="text-[10px] text-muted-foreground">(separe por vírgula)</span></Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="instagram, agro, produto" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Autor</Label>
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Aprovador</Label>
              <Input value={approver} onChange={(e) => setApprover(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Campanha</Label>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Projeto</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" className="text-primary-foreground shadow-[var(--shadow-glow)]" style={{ backgroundImage: "var(--gradient-primary)" }}>Adicionar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
