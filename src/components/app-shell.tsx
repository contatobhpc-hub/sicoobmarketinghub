import { useEffect, useState, type ReactNode } from "react";
import { Search, Bell, Command } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "@/components/global-search";
import { ThemeToggle } from "@/components/theme-toggle";

import { useSettingsBridge } from "@/lib/settings";

export function AppShell({ children }: { children: ReactNode }) {
  useSettingsBridge();
  const [searchOpen, setSearchOpen] = useState(false);

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

  return (
    <SidebarProvider defaultOpen>
      <div
        className="flex min-h-screen w-full"
        style={{ backgroundImage: "var(--gradient-mesh)" }}
      >
        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/70 px-3 backdrop-blur-xl">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

            <div className="ml-2 hidden flex-1 md:flex">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="group flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-border bg-surface/60 px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                <Search className="h-4 w-4" />
                <span>Buscar campanhas, projetos, conteúdos…</span>
                <kbd className="ml-auto flex items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  <Command className="h-3 w-3" />K
                </kbd>
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
              </Button>
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
