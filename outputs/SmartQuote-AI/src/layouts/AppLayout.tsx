import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { CustomCursor } from "@/components/shared/CustomCursor";
import { ProductTour } from "@/components/shared/ProductTour";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useWorkspacePreferences } from "@/hooks/use-workspace-preferences";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const { preferences } = useWorkspacePreferences();

  useEffect(() => {
    if (desktop) {
      setMobileOpen(false);
    }
  }, [desktop]);

  const sidebarOffset = collapsed ? "5rem" : "18rem";

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.documentElement.style.setProperty("--app-sidebar-offset", sidebarOffset);
    return () => {
      document.documentElement.style.removeProperty("--app-sidebar-offset");
    };
  }, [sidebarOffset]);

  const layoutStyle: CSSProperties & { "--app-sidebar-offset": string } = {
    "--app-sidebar-offset": sidebarOffset,
  };

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-hidden bg-background text-foreground",
        !preferences.animations && "motion-reduced"
      )}
      data-motion={preferences.animations ? "on" : "off"}
      style={layoutStyle}
    >
      <div className="pointer-events-none fixed inset-0 z-0 app-workspace-bg" />
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((current) => !current)}
        onClose={() => setMobileOpen(false)}
      />
      <div className="app-main-shell relative z-10 min-h-screen transition-[margin] duration-300 lg:ml-[var(--app-sidebar-offset)]">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
      <CustomCursor />
      <ProductTour />
    </div>
  );
}
