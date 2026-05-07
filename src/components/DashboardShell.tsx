"use client";

import { useState, useEffect } from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  GitBranch,
  FlaskConical,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useT } from "./LocaleProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { DarkModeToggle } from "./DarkModeToggle";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/dashboard",   Icon: LayoutDashboard },
  { href: "/lancamento",  Icon: ClipboardList   },
  { href: "/fluxogramas", Icon: GitBranch       },
  { href: "/proteinas",   Icon: FlaskConical    },
] as const;

export function DashboardShell({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) setCollapsed(stored === "true");
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navLabels: Record<string, string> = {
    "/dashboard":   t.nav.dashboard,
    "/lancamento":  t.nav.launches,
    "/fluxogramas": t.nav.flowcharts,
    "/proteinas":   t.nav.proteins,
  };

  function NavItems({ closeMobile = false }: { closeMobile?: boolean }) {
    return (
      <>
        {NAV_LINKS.map(({ href, Icon }) => {
          const label = navLabels[href];
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed && !closeMobile ? label : undefined}
              onClick={() => closeMobile && setMobileOpen(false)}
              className={[
                "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                collapsed && !closeMobile ? "justify-center" : "",
                active
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
              ].join(" ")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(!collapsed || closeMobile) && <span>{label}</span>}
            </Link>
          );
        })}
      </>
    );
  }

  function SidebarFooter({ showLabels }: { showLabels: boolean }) {
    return (
      <div
        className={[
          "p-2 border-t border-gray-100 dark:border-gray-800 space-y-0.5",
          !showLabels ? "flex flex-col items-center gap-1" : "",
        ].join(" ")}
      >
        {showLabels ? (
          <div className="px-3 py-1 flex items-center gap-2">
            <LocaleSwitcher />
            <DarkModeToggle />
          </div>
        ) : (
          <div className="flex justify-center">
            <DarkModeToggle />
          </div>
        )}
        <button
          onClick={handleLogout}
          title={!showLabels ? t.nav.logout : undefined}
          className={[
            "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors w-full",
            "text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400",
            "hover:bg-red-50 dark:hover:bg-red-950/30",
            !showLabels ? "justify-center" : "",
          ].join(" ")}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {showLabels && <span>{t.nav.logout}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar — participates in flex layout */}
      <aside
        className={[
          "hidden lg:flex flex-col shrink-0",
          "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800",
          "transition-[width] duration-200 ease-in-out overflow-hidden",
          collapsed ? "w-14" : "w-56",
        ].join(" ")}
      >
        {/* Header */}
        <div
          className={[
            "flex items-center border-b border-gray-100 dark:border-gray-800 h-14 shrink-0",
            collapsed ? "justify-center px-2" : "justify-between px-4",
          ].join(" ")}
        >
          {!collapsed && (
            <div className="min-w-0 flex-1 pr-2">
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
                {t.nav.appName}
              </p>
              {userEmail && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{userEmail}</p>
              )}
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? "Expandir" : "Recolher"}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          <NavItems />
        </nav>

        <SidebarFooter showLabels={!collapsed} />
      </aside>

      {/* Mobile sidebar — fixed overlay */}
      <div
        className={[
          "fixed inset-y-0 left-0 z-40 flex lg:hidden",
          "transition-transform duration-200 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <aside className="flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
          {/* Header with close button */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 h-14 px-4 shrink-0">
            <div className="min-w-0 flex-1 pr-2">
              <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                {t.nav.appName}
              </p>
              {userEmail && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{userEmail}</p>
              )}
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 p-2 space-y-0.5">
            <NavItems closeMobile />
          </nav>

          <SidebarFooter showLabels />
        </aside>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-900 dark:text-white text-sm flex-1 truncate">
            {t.nav.appName}
          </span>
          <DarkModeToggle />
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>

        <footer className="shrink-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-center gap-2">
          <Image src="/logo-ms.png" alt="MS Serviços de TI" width={20} height={20} className="opacity-70 dark:opacity-50" />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} MS Serviços de TI. Todos os direitos reservados.
          </p>
        </footer>
      </div>
    </div>
  );
}
