"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSync } from "@/lib/store";
import { signInGitHub, signOutAction, stopPreview } from "@/app/actions";
import { useContent } from "@/lib/content";
import type { FeatureId } from "@/lib/features";

const NAV: { href: string; label: string; icon: string; match?: string; needs?: FeatureId; admin?: boolean }[] = [
  { href: "/", label: "Today", icon: "M3 10l7-6 7 6v7a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z" },
  { href: "/plan", label: "36-week map", icon: "M2 4l5-2 6 2 5-2v14l-5 2-6-2-5 2zM7 2v14M13 4v14" },
  { href: "/main/1", label: "Main track", match: "/main", needs: "track:main", icon: "M3 3h14v4H3zM3 9h14v4H3zM3 15h9v2H3z" },
  { href: "/java/1", label: "Java + DSA", match: "/java", needs: "track:java", icon: "M6 4L2 10l4 6M14 4l4 6-4 6M11 3L9 17" },
  { href: "/problems", label: "Problem tracker", needs: "problems", icon: "M4 10l4 4 8-9" },
  { href: "/journal", label: "Journal", needs: "journal", icon: "M5 2h10v16H5zM8 6h4M8 9h4M8 12h2" },
  { href: "/guide", label: "How it works", needs: "guide", icon: "M10 18a8 8 0 100-16 8 8 0 000 16zM10 14v.01M10 11a2 2 0 10-2-2" },
  { href: "/glossary", label: "Glossary", needs: "glossary", icon: "M4 3h9l3 3v11H4zM7 8h6M7 11h6M7 14h4" },
  { href: "/settings", label: "Settings", icon: "M10 13a3 3 0 100-6 3 3 0 000 6zM10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M3.6 16.4l2.1-2.1M14.3 5.7l2.1-2.1" },
  { href: "/admin", label: "Admin", admin: true, icon: "M10 2l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V5zM7 10l2 2 4-4" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function SyncBadge() {
  const { status, user, authEnabled } = useSync();
  if (!authEnabled) return <p className="px-3 text-xs text-muted">Progress saved in this browser</p>;
  if (!user)
    return (
      <form action={signInGitHub} className="px-3">
        <button className="btn w-full justify-center text-[13px]">
          <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
            <path d="M8 0a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 008 0z" />
          </svg>
          Sign in to sync
        </button>
        <p className="mt-1.5 text-center text-[11px] text-muted">Saved in this browser until you do</p>
      </form>
    );
  const dot = { local: "bg-muted", syncing: "bg-warn animate-pulse", synced: "bg-ok", error: "bg-danger" }[status];
  const text = { local: "Local", syncing: "Syncing…", synced: "Synced", error: "Sync failed, retrying on next change" }[status];
  return (
    <div className="flex items-center gap-2 px-3 text-xs text-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {user.image && <img src={user.image} alt="" className="size-6 rounded-full" />}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-fg">{user.name}</div>
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${dot}`} />
          {text}
        </div>
      </div>
      <form action={signOutAction}>
        <button className="hover:text-fg" title="Sign out">
          Sign out
        </button>
      </form>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const c = useContent();
  const isAdmin = c.role === "owner" || c.role === "admin";
  const journal = c.urlNoteSections.length > 0 || c.tracks.includes("java");
  const items = NAV.filter((n) => (n.admin ? isAdmin : (!n.needs || c.features.includes(n.needs)) && (n.href !== "/journal" || journal)));
  const active = (n: (typeof NAV)[number]) => (n.href === "/" ? path === "/" : path.startsWith(n.match ?? n.href));
  const nav = (
    <nav className="flex flex-col gap-0.5">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] ${active(n) ? "bg-panel-2 font-medium text-fg" : "text-muted hover:bg-panel-2 hover:text-fg"}`}
        >
          <Icon d={n.icon} />
          {n.label}
        </Link>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-panel px-3 py-5 lg:flex">
        <Link href="/" className="mb-6 px-3">
          <div className="text-[15px] font-bold tracking-tight">Zero to Deep</div>
          <div className="text-xs text-muted">36-week SE plan</div>
        </Link>
        {nav}
        <div className="mt-auto">
          <SyncBadge />
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-panel/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="font-bold tracking-tight">
          Zero to Deep
        </Link>
        <button className="btn px-3 py-1.5" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          {open ? "Close" : "Menu"}
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-[57px] z-10 border-b border-line bg-panel px-3 py-3 shadow-lg lg:hidden">
          {nav}
          <div className="mt-3 border-t border-line pt-3">
            <SyncBadge />
          </div>
        </div>
      )}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-10">
        {c.previewAs && (
          <div className="mx-auto mb-6 flex max-w-4xl flex-wrap items-center justify-between gap-2 rounded-xl border border-accent bg-accent-soft px-4 py-3 text-sm">
            <span>
              Previewing as <b>@{c.previewAs}</b>. You see exactly what they see; your own ticks are shown.
            </span>
            <form action={stopPreview}>
              <button className="btn">Exit preview</button>
            </form>
          </div>
        )}
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
