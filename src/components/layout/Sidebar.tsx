"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Leaf,
  Building2,
  Wallet,
  PiggyBank,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/nur-garden", label: "Nur&Garden", icon: Leaf },
  { href: "/osco", label: "Osco Holding", icon: Building2 },
  { href: "/finance", label: "Moliya", icon: Wallet },
  { href: "/funds", label: "Jamg'armalar", icon: PiggyBank },
  { href: "/settings", label: "Sozlamalar", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-14 left-4 z-50 lg:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-zinc-800/80">
          <h1 className="text-lg font-bold text-white tracking-tight">
            MyBiznes
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Nurmuxammad konsoli</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} className={active ? "text-emerald-400" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800/80">
          <div className="px-3 py-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-zinc-800">
            <p className="text-xs text-zinc-500">Egasi</p>
            <p className="text-sm font-semibold text-white">Nurmuxammad</p>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && (
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
