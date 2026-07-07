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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-[var(--shadow-glow)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold tracking-tight">
                Marketing Hub
              </span>
              <span className="text-[11px] text-muted-foreground">Sicoob Credibelo</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActive(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="group/nav relative h-9 rounded-md text-[13px] font-medium text-sidebar-foreground/80 transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-foreground"
                      >
                        <Link to={item.to}>
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r bg-primary" />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                          <span>{item.title}</span>
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
