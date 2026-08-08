import { Link, useRouterState } from "@tanstack/react-router";

import companyLogo from "@/assets/company-logo.jpg.asset.json";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { navGroups } from "@/lib/navigation";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border [background-image:linear-gradient(180deg,color-mix(in_oklab,var(--color-primary)_6%,transparent),transparent_38%)]"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-border shadow-[var(--shadow-glow)]">
            <img
              src={companyLogo.url}
              alt="Logo Sicoob Credibelo"
              className="h-full w-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-sm font-semibold tracking-tight">
                Marketing Hub
              </span>
              <span className="truncate text-[11px] tracking-wide text-muted-foreground">
                Sicoob Credibelo
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1.5">
            {!collapsed && (
              <SidebarGroupLabel className="eyebrow px-2 text-[10px] text-muted-foreground/60">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="group/nav relative h-9 overflow-hidden rounded-lg text-[13px] font-medium text-sidebar-foreground/75 transition-all duration-300 [transition-timing-function:var(--ease-premium)] hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-primary/12 data-[active=true]:text-foreground data-[active=true]:shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--color-primary)_18%,transparent)]"
                      >
                        <Link to={item.to}>
                          <span
                            className={`absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-r bg-primary transition-all duration-300 [transition-timing-function:var(--ease-premium)] ${
                              active
                                ? "h-5 opacity-100 shadow-[0_0_10px_var(--color-primary)]"
                                : "h-0 opacity-0 group-hover/nav:h-3 group-hover/nav:opacity-60"
                            }`}
                          />
                          <item.icon
                            className={`h-4 w-4 shrink-0 transition-all duration-300 [transition-timing-function:var(--ease-premium)] group-hover/nav:scale-110 ${
                              active ? "text-primary" : ""
                            }`}
                            strokeWidth={1.75}
                          />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>


      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-xs font-semibold">
            SC
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[13px] font-medium">Comunicação</span>
              <span className="truncate text-[11px] text-muted-foreground">
                marketing@credibelo
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
