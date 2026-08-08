import { useEffect, useState, type ReactNode } from "react";
import { Search, Bell, Command, LogOut, User as UserIcon } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/global-search";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import { useSettingsBridge } from "@/lib/settings";
import { useAuth } from "@/hooks/use-auth";

export function AppShell({ children }: { children: ReactNode }) {
  useSettingsBridge();
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email ||
    "Usuário";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";

  return (
    <SidebarProvider defaultOpen>
      <div
        className="flex min-h-screen w-full"
        style={{ backgroundImage: "var(--gradient-mesh)" }}
      >
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/70 px-4 backdrop-blur-2xl [background-color:var(--glass-bg)]">
            <SidebarTrigger className="press text-muted-foreground transition-colors hover:text-foreground" />

            <div className="ml-2 hidden flex-1 md:flex">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="group press flex h-10 w-full max-w-md items-center gap-2.5 rounded-xl border border-border bg-surface/50 px-3.5 text-sm text-muted-foreground shadow-[var(--shadow-xs)] transition-all duration-300 [transition-timing-function:var(--ease-premium)] hover:border-primary/40 hover:bg-surface/80 hover:text-foreground hover:shadow-[var(--shadow-sm)]"
              >
                <Search className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span className="truncate">Buscar campanhas, projetos, conteúdos…</span>
                <kbd className="ml-auto flex shrink-0 items-center gap-0.5 rounded-md border border-border bg-surface-elevated px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted-foreground">
                  <Command className="h-3 w-3" />K
                </kbd>
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              <ThemeToggle />


              <Button
                variant="ghost"
                size="icon"
                className="press relative h-10 w-10 rounded-xl text-muted-foreground transition-colors hover:bg-surface/70 hover:text-foreground"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="press h-10 w-10 rounded-full ring-1 ring-border transition-all duration-300 [transition-timing-function:var(--ease-premium)] hover:ring-primary/50"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    <div className="text-sm font-medium">{displayName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/configuracoes">
                      <UserIcon className="h-4 w-4 mr-2" /> Minha conta
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      await signOut();
                      window.location.replace("/auth");
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[1440px] px-6 py-8">{children}</div>
          </main>
        </div>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </SidebarProvider>
  );
}
