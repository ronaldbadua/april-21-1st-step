"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/hourly-notes", label: "Hourly Notes" },
  { href: "/chat", label: "Chat Thread" },
  { href: "/scheduling", label: "Scheduling" },
  { href: "/process-path", label: "Process Path" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-full min-w-[260px] max-w-[280px] flex-col border-r border-slate-800/60 bg-[#0f172a] text-slate-100"
      aria-label="Primary"
    >
      <div className="border-b border-slate-700/80 px-6 py-7">
        <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-slate-400">
          ICQA WORKSPACE
        </p>
        <h1 className="mt-1 text-lg font-bold leading-tight text-white">Personalize Dashboard</h1>
        <p className="mt-2 text-sm leading-snug text-slate-400">
          Shared workspace for manager and associate collaboration.
        </p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {active ? (
                <span className="text-white/90" aria-hidden>
                  →
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-700/80 px-6 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Shared Workspace</p>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white"
            aria-hidden
          >
            IC
          </div>
          <div>
            <p className="text-sm font-semibold text-white">ICQA Team</p>
            <p className="text-xs text-slate-400">Manager &amp; Associate</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
