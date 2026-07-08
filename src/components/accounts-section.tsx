import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

type AppRole = "admin" | "gestor" | "analista" | "visualizador";
const ROLES: AppRole[] = ["admin", "gestor", "analista", "visualizador"];

type Row = {
  id: string;
  full_name: string | null;
  role: AppRole | null;
};

export function ContasSection() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    setLoading(true);
    const { data: session } = await supabase.auth.getUser();
    const uid = session.user?.id;
    if (!uid) { setLoading(false); return; }
    // Admin check
    const { data: adminCheck } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
    setIsAdmin(!!adminCheck);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map<string, AppRole>();
    (roles ?? []).forEach((r) => roleMap.set(r.user_id, r.role as AppRole));
    setRows(
      (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        role: roleMap.get(p.id) ?? null,
      })),
    );
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(userId: string, role: AppRole) {
    // Replace role: delete existing, insert new (one role per user in this app)
    const del = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (del.error) return toast.error(del.error.message);
    const ins = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (ins.error) return toast.error(ins.error.message);
    toast.success("Papel atualizado");
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Contas de acesso</h3>
          <p className="text-xs text-muted-foreground">
            Usuários autenticados no Lovable Cloud. {isAdmin ? "Você é administrador e pode alterar papéis." : "Somente administradores podem alterar papéis."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Recarregar
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-3 py-2">Nome</th>
              <th className="text-left px-3 py-2">ID</th>
              <th className="text-left px-3 py-2">Papel</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-3 py-2">{r.full_name || "—"}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground">{r.id.slice(0, 8)}…</td>
                <td className="px-3 py-2">
                  {isAdmin ? (
                    <Select value={r.role ?? undefined} onValueChange={(v) => changeRole(r.id, v as AppRole)}>
                      <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Definir papel" /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{r.role ?? "—"}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Novos cadastros feitos na tela de login recebem o papel <strong>analista</strong> automaticamente
        (o primeiro cadastro do sistema vira <strong>admin</strong>).
      </p>
    </div>
  );
}
