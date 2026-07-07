import { useState, type ReactNode } from "react";
import { Settings2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { settingsStore, useSettings } from "@/lib/settings";

/**
 * Reusable per-module management dialog.
 * Lets the user add/remove auxiliary lists (categorias, status, tags, templates)
 * that power dropdowns across the platform. Backed by settingsStore so changes
 * persist and reflect immediately everywhere.
 */
export type ExtraTab = { value: string; label: string; content: ReactNode };

export function ModuleManagementButton({
  module,
  label = "Gestão",
  extraTabs = [],
}: {
  module: string;
  label?: string;
  extraTabs?: ExtraTab[];
}) {
  const [open, setOpen] = useState(false);
  const s = useSettings();

  // Local inputs
  const [newCat, setNewCat] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newTpl, setNewTpl] = useState("");

  const addCategory = () => {
    const v = newCat.trim();
    if (!v) return;
    if (s.categories.some((c) => c.toLowerCase() === v.toLowerCase())) {
      toast.error("Categoria já existe");
      return;
    }
    settingsStore.patchSection("categories", [...s.categories, v]);
    settingsStore.addLog(`[${module}] Adicionou categoria`, v);
    toast.success(`Categoria "${v}" adicionada`);
    setNewCat("");
  };
  const removeCategory = (v: string) => {
    if (!window.confirm(`Remover categoria "${v}"?`)) return;
    settingsStore.patchSection(
      "categories",
      s.categories.filter((c) => c !== v),
    );
    settingsStore.addLog(`[${module}] Removeu categoria`, v);
    toast.success(`Categoria "${v}" removida`);
  };

  const addTag = () => {
    const v = newTag.trim();
    if (!v) return;
    if (s.tags.some((t) => t.label.toLowerCase() === v.toLowerCase())) {
      toast.error("Tag já existe");
      return;
    }
    settingsStore.patchSection("tags", [
      ...s.tags,
      { id: `tg-${Date.now().toString(36)}`, label: v, color: "#6366f1" },
    ]);
    settingsStore.addLog(`[${module}] Adicionou tag`, v);
    toast.success(`Tag "${v}" adicionada`);
    setNewTag("");
  };
  const removeTag = (id: string, label: string) => {
    if (!window.confirm(`Remover tag "${label}"?`)) return;
    settingsStore.patchSection("tags", s.tags.filter((t) => t.id !== id));
    settingsStore.addLog(`[${module}] Removeu tag`, label);
    toast.success(`Tag "${label}" removida`);
  };

  const addStatus = () => {
    const v = newStatus.trim();
    if (!v) return;
    if (s.statuses.some((st) => st.label.toLowerCase() === v.toLowerCase())) {
      toast.error("Status já existe");
      return;
    }
    settingsStore.patchSection("statuses", [
      ...s.statuses,
      { id: `st-${Date.now().toString(36)}`, label: v, color: "#94a3b8" },
    ]);
    settingsStore.addLog(`[${module}] Adicionou status`, v);
    toast.success(`Status "${v}" adicionado`);
    setNewStatus("");
  };
  const removeStatus = (id: string, label: string) => {
    if (!window.confirm(`Remover status "${label}"?`)) return;
    settingsStore.patchSection(
      "statuses",
      s.statuses.filter((st) => st.id !== id),
    );
    settingsStore.addLog(`[${module}] Removeu status`, label);
    toast.success(`Status "${label}" removido`);
  };

  const addTemplate = () => {
    const v = newTpl.trim();
    if (!v) return;
    settingsStore.patchSection("templates", [
      ...s.templates,
      { id: `tp-${Date.now().toString(36)}`, name: v, type: module },
    ]);
    settingsStore.addLog(`[${module}] Adicionou template`, v);
    toast.success(`Template "${v}" adicionado`);
    setNewTpl("");
  };
  const removeTemplate = (id: string, name: string) => {
    if (!window.confirm(`Remover template "${name}"?`)) return;
    settingsStore.patchSection(
      "templates",
      s.templates.filter((t) => t.id !== id),
    );
    settingsStore.addLog(`[${module}] Removeu template`, name);
    toast.success(`Template "${name}" removido`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Settings2 className="h-4 w-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestão do módulo</DialogTitle>
          <DialogDescription>
            Adicione ou remova categorias, status, tags e templates usados neste módulo. As
            alterações valem para toda a plataforma.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="categorias" className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="categorias" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nova categoria"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
              />
              <Button onClick={addCategory} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <ItemList
              items={s.categories.map((c) => ({ id: c, label: c }))}
              onRemove={(it) => removeCategory(it.id)}
              empty="Nenhuma categoria."
            />
          </TabsContent>

          <TabsContent value="status" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Novo status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStatus()}
              />
              <Button onClick={addStatus} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <ItemList
              items={s.statuses.map((st) => ({ id: st.id, label: st.label, color: st.color }))}
              onRemove={(it) => removeStatus(it.id, it.label)}
              empty="Nenhum status."
            />
          </TabsContent>

          <TabsContent value="tags" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nova tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Button onClick={addTag} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <ItemList
              items={s.tags.map((t) => ({ id: t.id, label: t.label, color: t.color }))}
              onRemove={(it) => removeTag(it.id, it.label)}
              empty="Nenhuma tag."
            />
          </TabsContent>

          <TabsContent value="templates" className="space-y-3 pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Novo template"
                value={newTpl}
                onChange={(e) => setNewTpl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTemplate()}
              />
              <Button onClick={addTemplate} size="sm" className="gap-1">
                <Plus className="h-4 w-4" /> Adicionar
              </Button>
            </div>
            <ItemList
              items={s.templates
                .filter((t) => t.type === module || t.type === "Todos")
                .map((t) => ({ id: t.id, label: t.name }))}
              onRemove={(it) => removeTemplate(it.id, it.label)}
              empty="Nenhum template deste módulo."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ItemList({
  items,
  onRemove,
  empty,
}: {
  items: { id: string; label: string; color?: string }[];
  onRemove: (item: { id: string; label: string }) => void;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{empty}</p>;
  }
  return (
    <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
      {items.map((it) => (
        <li key={it.id} className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            {it.color && (
              <span
                className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: it.color }}
              />
            )}
            <Badge variant="secondary" className="truncate">
              {it.label}
            </Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(it)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
