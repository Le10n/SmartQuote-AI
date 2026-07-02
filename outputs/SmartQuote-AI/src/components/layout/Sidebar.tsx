import { BarChart3, Boxes, FileText, LayoutDashboard, Settings, Sparkles, Users, ChevronLeft, ChevronRight, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Clients", href: "/clients", icon: Users },
  { title: "Quotes", href: "/quotes", icon: FileText },
  { title: "Products", href: "/products", icon: Boxes },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function Sidebar({ collapsed, mobileOpen, onToggle, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        data-tour="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border/80 bg-background/88 shadow-2xl shadow-black/[0.04] backdrop-blur-xl transition-all duration-300 lg:translate-x-0",
          collapsed && "lg:w-20",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-[image:var(--accent-gradient)] text-primary-foreground shadow-sm transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              onClick={onToggle}
            >
              <Sparkles className="size-4" />
            </button>
            <div className={cn("min-w-0 transition-opacity", collapsed && "hidden lg:opacity-0")}>
              <p className="truncate text-sm font-semibold">SmartQuote AI</p>
              <p className="truncate text-xs text-muted-foreground">Revenue workspace</p>
            </div>
          </div>
          <Button title="Close sidebar" variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="size-4" />
          </Button>
          <Button
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            variant="ghost"
            size="icon"
            className={cn("hidden rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border/70 hover:bg-secondary/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:inline-flex", collapsed && "lg:hidden")}
            onClick={onToggle}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                title={item.title}
                data-tour={"nav-" + item.title.toLowerCase()}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary/80 hover:text-foreground hover:shadow-sm",
                    isActive && "bg-primary text-primary-foreground shadow-[0_16px_36px_var(--accent-ring)] before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-primary-foreground/80 hover:bg-primary hover:text-primary-foreground",
                    collapsed && "lg:justify-center lg:px-0"
                  )
                }
              >
                <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className={cn("truncate", collapsed && "lg:hidden")}>{item.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border/70 p-3">
          <div className={cn("overflow-hidden rounded-lg border border-border/80 bg-card/75 p-3 shadow-sm backdrop-blur", collapsed && "hidden lg:block lg:p-2")}>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className={cn("text-xs font-medium", collapsed && "lg:hidden")}>AI pricing engine live</span>
            </div>
            <p className={cn("mt-2 text-xs leading-5 text-muted-foreground", collapsed && "lg:hidden")}>SmartQuote AI Portfolio Edition. Demo Version for demonstration purposes only.</p>
            <p className={cn("mt-3 text-[11px] font-medium text-foreground", collapsed && "lg:hidden")}>Built by Leon Sošić</p>
          </div>
        </div>
      </aside>
    </>
  );
}
