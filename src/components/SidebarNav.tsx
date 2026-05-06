"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "./LocaleProvider";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function SidebarNav({ userEmail }: { userEmail: string | null }) {
  const t = useT();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard",   label: t.nav.dashboard },
    { href: "/lancamento",  label: t.nav.launches },
    { href: "/fluxogramas", label: t.nav.flowcharts },
    { href: "/proteinas",   label: t.nav.proteins },
  ];

  return (
    <>
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-bold text-gray-900 dark:text-white">{t.nav.appName}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{userEmail ?? t.nav.user}</p>
        </div>
        <LocaleSwitcher />
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-medium"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
