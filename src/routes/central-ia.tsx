import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  MessageSquare,
  Sparkles,
  Star,
  Search,
  Send,
  Link2,
  Trash2,
  BookMarked,
  Wand2,
  History,
  Bot,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCampaigns } from "@/lib/campaigns";
import { useProjects } from "@/lib/projects";
import {
  AI_TEMPLATES,
  createConversation,
  deleteConversation,
  linkConversation,
  sendMessage,
  setActive,
  toggleFavoritePrompt,
  useAiCenter,
  type AiConversation,
} from "@/lib/ai-center";

export const Route = createFileRoute("/central-ia")({
  head: () => ({
    meta: [
      { title: "Central IA — Marketing Hub" },
      {
        name: "description",
        content: "Inteligência Artificial especializada em Marketing Cooperativista.",
      },
    ],
  }),
  component: CentralIaPage,
});

type Tab = "conversas" | "templates" | "historico" | "favoritos";

function CentralIaPage() {
  const state = useAiCenter();
  const campaigns = useCampaigns();
  const projects = useProjects();
  const [tab, setTab] = useState<Tab>("conversas");
  const [q, setQ] = useState("");
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const active = state.conversations.find((c) => c.id === state.activeId) ?? null;

  useEffect(() => {
    if (!state.activeId && state.conversations.length === 0) return;
    if (!state.activeId && state.conversations[0]) setActive(state.conversations[0].id);
  }, [state.activeId, state.conversations]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length]);

  const filteredConvs = useMemo(() => {
    const list = state.conversations;
    if (!q) return list;
    return list.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));
  }, [state.conversations, q]);

  const recent = useMemo(
    () => [...state.conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.conversations],
  );

  const favorites = state.prompts.filter((p) => p.favorite);

  function handleSend(text?: string) {
    const content = (text ?? input).trim();
    if (!content) return;
    let id = state.activeId;
    if (!id) id = createConversation();
    sendMessage(id, content);
    setInput("");
  }

  return (
    <AppShell>
      <div className="-mx-6 -my-8 flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Left rail */}
        <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-surface/40 md:flex">
          <div className="border-b border-border p-3">
            <Button
              onClick={() => createConversation()}
              className="w-full justify-start gap-2"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Plus className="h-4 w-4" /> Nova conversa
            </Button>
          </div>

          <div className="flex border-b border-border text-xs">
            {([
              { id: "conversas", icon: MessageSquare, label: "Conversas" },
              { id: "templates", icon: Wand2, label: "Templates" },
              { id: "historico", icon: History, label: "Histórico" },
              { id: "favoritos", icon: Star, label: "Favoritos" },
            ] as { id: Tab; icon: typeof Star; label: string }[]).map((t) => {
              const Icon = t.icon;
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 border-b-2 px-2 py-2.5 transition-colors ${
                    on
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="mx-auto mb-0.5 h-3.5 w-3.5" />
                  <span className="block text-[10px]">{t.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…"
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {tab === "conversas" && (
              <ConvList items={filteredConvs} activeId={state.activeId} />
            )}
            {tab === "historico" && <ConvList items={recent} activeId={state.activeId} />}
            {tab === "templates" && (
              <div className="space-y-1">
                {AI_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSend(t.prompt)}
                    className="flex w-full items-start gap-2 rounded-md border border-transparent p-2 text-left text-xs transition-colors hover:border-border hover:bg-surface"
                  >
                    <span className="text-base leading-none">{t.icon}</span>
                    <span>
                      <span className="block font-medium text-foreground">{t.label}</span>
                      <span className="line-clamp-2 text-[10px] text-muted-foreground">
                        {t.prompt}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {tab === "favoritos" && (
              <div className="space-y-1">
                {favorites.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">
                    Marque prompts como favoritos para acesso rápido.
                  </p>
                ) : (
                  favorites.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setInput(p.prompt)}
                      className="flex w-full items-start gap-2 rounded-md border border-transparent p-2 text-left text-xs transition-colors hover:border-border hover:bg-surface"
                    >
                      <Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                      <span>
                        <span className="block font-medium text-foreground">{p.title}</span>
                        <span className="line-clamp-2 text-[10px] text-muted-foreground">
                          {p.prompt}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Center */}
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 items-center gap-2 border-b border-border bg-background/60 px-4 backdrop-blur-xl">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md text-white"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-sm font-semibold leading-tight">
                {active?.title ?? "Central IA"}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Marketing Cooperativista · Sicoob Credibelo
              </p>
            </div>

            {active && (
              <div className="ml-auto flex items-center gap-2">
                <LinkPopover
                  conv={active}
                  campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
                  projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteConversation(active.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </header>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto">
            {!active || active.messages.length === 0 ? (
              <EmptyState onPick={(p) => handleSend(p)} />
            ) : (
              <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                  >
                    {m.role === "assistant" && (
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white"
                        style={{ backgroundImage: "var(--gradient-primary)" }}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-surface/60 text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-background/70 px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-border bg-surface/60 p-2 transition-colors focus-within:border-primary/60">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Pergunte algo sobre Marketing Cooperativista, peça uma legenda, roteiro, briefing…"
                  className="min-h-[52px] resize-none border-0 bg-transparent p-2 text-sm shadow-none focus-visible:ring-0"
                />
                <div className="flex items-center justify-between gap-2 px-1">
                  <p className="text-[10px] text-muted-foreground">
                    Enter para enviar · Shift+Enter para nova linha · Integração OpenAI em breve
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="h-8 gap-1.5"
                    style={{ backgroundImage: "var(--gradient-primary)" }}
                  >
                    <Send className="h-3.5 w-3.5" /> Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ConvList({ items, activeId }: { items: AiConversation[]; activeId: string | null }) {
  if (items.length === 0) {
    return (
      <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">
        Nenhuma conversa ainda.
      </p>
    );
  }
  return (
    <div className="space-y-0.5">
      {items.map((c) => {
        const on = c.id === activeId;
        return (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            className={`group flex w-full items-start gap-2 rounded-md border px-2 py-2 text-left text-xs transition-colors ${
              on
                ? "border-border-strong bg-surface text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:bg-surface/60 hover:text-foreground"
            }`}
          >
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{c.title}</span>
              <span className="block text-[10px] text-muted-foreground">
                {new Date(c.updatedAt).toLocaleDateString("pt-BR")} · {c.messages.length} msgs
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 text-center">
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          <Bot className="h-6 w-6" />
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Olá, Bruno 👋 Como posso ajudar?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          IA especializada em Marketing Cooperativista — Sicoob Credibelo.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {AI_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.prompt)}
            className="flex flex-col items-start gap-1 rounded-xl border border-border bg-surface/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-md)]"
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="text-xs font-medium text-foreground">{t.label}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t.category}
            </span>
          </button>
        ))}
      </div>

      <PromptsLibrary onPick={onPick} />
    </div>
  );
}

function PromptsLibrary({ onPick }: { onPick: (prompt: string) => void }) {
  const state = useAiCenter();
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">Biblioteca de Prompts</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {state.prompts.map((p) => (
          <div
            key={p.id}
            className="group flex items-start gap-2 rounded-lg border border-border bg-background/40 p-3"
          >
            <button
              onClick={() => toggleFavoritePrompt(p.id)}
              className="mt-0.5 text-muted-foreground transition-colors hover:text-primary"
              title="Favoritar"
            >
              <Star
                className={`h-3.5 w-3.5 ${p.favorite ? "fill-primary text-primary" : ""}`}
              />
            </button>
            <button
              onClick={() => onPick(p.prompt)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="flex items-center gap-2 text-xs font-medium text-foreground">
                {p.title}
                <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                  {p.category}
                </span>
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{p.prompt}</p>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkPopover({
  conv,
  campaigns,
  projects,
}: {
  conv: AiConversation;
  campaigns: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const linked = !!(conv.campaignId || conv.projectId);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 gap-1.5 text-xs ${linked ? "border-primary/60 text-primary" : ""}`}
        >
          <Link2 className="h-3.5 w-3.5" />
          {linked ? "Vinculado" : "Vincular"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Campanha
          </p>
          <Select
            value={conv.campaignId ?? "none"}
            onValueChange={(v) =>
              linkConversation(conv.id, { campaignId: v === "none" ? undefined : v })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Nenhuma —</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Projeto
          </p>
          <Select
            value={conv.projectId ?? "none"}
            onValueChange={(v) =>
              linkConversation(conv.id, { projectId: v === "none" ? undefined : v })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Nenhum —</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
