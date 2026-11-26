"use client";

import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSync } from "@/lib/store";
import { usePlan } from "@/lib/use-plan";
import { currentWeek } from "@/lib/sessions";
import { AliasMigrate } from "./alias-migrate";
import { signInGitHub, signOutAction } from "@/app/actions";

type NavItem = { href: string; label: string; short?: string; icon: string; match?: string };

const I = {
  today: "M3 10l7-6 7 6v7a1 1 0 01-1 1h-4v-5H8v5H4a1 1 0 01-1-1z",
  plan: "M2 4l5-2 6 2 5-2v14l-5 2-6-2-5 2zM7 2v14M13 4v14",
  main: "M3 3h14v4H3zM3 9h14v4H3zM3 15h9v2H3z",
  java: "M6 4L2 10l4 6M14 4l4 6-4 6M11 3L9 17",
  review: "M4 4h12v9H4zM7 16h6M10 13v3M7 8l2 2 4-4",
  problems: "M4 10l4 4 8-9",
  journal: "M5 2h10v16H5zM8 6h4M8 9h4M8 12h2",
  guide: "M10 18a8 8 0 100-16 8 8 0 000 16zM10 14v.01M10 11a2 2 0 10-2-2",
  glossary: "M4 3h9l3 3v11H4zM7 8h6M7 11h6M7 14h4",
  settings: "M10 13a3 3 0 100-6 3 3 0 000 6zM10 1v3M10 16v3M1 10h3M16 10h3M3.6 3.6l2.1 2.1M14.3 14.3l2.1 2.1M3.6 16.4l2.1-2.1M14.3 5.7l2.1-2.1",
  search: "M9 15a6 6 0 100-12 6 6 0 000 12zM13.5 13.5L18 18",
  more: "M4 10h.01M10 10h.01M16 10h.01",
};

/** Where you study: the plan, today, and the two tracks (each opens on your current week). */
function useNav(): { primary: NavItem[]; practice: NavItem[]; more: NavItem[] } {
  const live = usePlan();
  const wk = (t: "main" | "java") => (live ? currentWeek(live.plan, t) : 1);
  return {
    primary: [
      { href: "/", label: "Today", icon: I.today },
      { href: "/plan", label: "Big picture", short: "Plan", icon: I.plan },
      { href: `/main/${wk("main")}`, label: "Main track", short: "Main", match: "/main", icon: I.main },
      { href: `/java/${wk("java")}`, label: "Java + DSA", short: "Java", match: "/java", icon: I.java },
    ],
    practice: [
      { href: "/review", label: "Review", icon: I.review },
      { href: "/problems", label: "Problems", icon: I.problems },
      { href: "/journal", label: "Journal", icon: I.journal },
    ],
    more: [
      { href: "/guide", label: "How it works", icon: I.guide },
      { href: "/glossary", label: "Glossary", icon: I.glossary },
      { href: "/settings", label: "Settings", icon: I.settings },
    ],
  };
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth={d === I.more ? 3 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  const router = useRouter();
  const { primary, practice, more } = useNav();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  const active = (n: NavItem) => (n.href === "/" ? path === "/" : path.startsWith(n.match ?? n.href));
  const link = (n: NavItem, small = false) => (
    <Link
      key={n.label}
      href={n.href}
      onClick={() => setOpen(false)}
      aria-current={active(n) ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 ${small ? "py-1.5 text-[13px]" : "py-2 text-[14px]"} ${active(n) ? "bg-panel-2 font-medium text-fg" : "text-muted hover:bg-panel-2 hover:text-fg"}`}
    >
      <Icon d={n.icon} />
      {n.label}
    </Link>
  );
  const group = (label: string, items: NavItem[], small = false) => (
    <div className="mt-5">
      <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">{label}</div>
      <nav className="flex flex-col gap-0.5">{items.map((n) => link(n, small))}</nav>
    </div>
  );
  const searchBtn = (
    <Link href="/search" className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 text-[13px] text-muted hover:border-muted hover:text-fg">
      <Icon d={I.search} />
      <span className="flex-1">Search</span>
      <kbd className="rounded border border-line px-1.5 font-sans text-[11px]">/</kbd>
    </Link>
  );
  const moreActive = [...practice, ...more].some(active) || path.startsWith("/search");
  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col overflow-y-auto border-r border-line bg-panel px-3 py-5 lg:flex">
        <Link href="/" className="mb-4 px-3">
          <div className="text-[15px] font-bold tracking-tight">{APP_NAME}</div>
          <div className="text-xs text-muted">{APP_TAGLINE}</div>
        </Link>
        {searchBtn}
        <nav className="mt-4 flex flex-col gap-0.5">{primary.map((n) => link(n))}</nav>
        {group("Practice", practice, true)}
        {group("More", more, true)}
        <div className="mt-auto pt-5">
          <SyncBadge />
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-panel/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/" className="font-bold tracking-tight">
          {APP_NAME}
        </Link>
        <Link href="/search" aria-label="Search" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-panel-2 hover:text-fg">
          <Icon d={I.search} />
        </Link>
      </header>
      {open && (
        <>
          <button className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-2xl border-t border-line bg-panel px-3 pb-[calc(env(safe-area-inset-bottom)+5rem)] pt-2 shadow-2xl lg:hidden">
            <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" aria-hidden />
            <div className="grid grid-cols-2 gap-x-2">
              <div>{group("Practice", practice)}</div>
              <div>{group("More", more)}</div>
            </div>
            <div className="mt-4 border-t border-line pt-3">
              <SyncBadge />
            </div>
          </div>
        </>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Main">
        {primary.map((n) => (
          <Link key={n.label} href={n.href} onClick={() => setOpen(false)} aria-current={active(n) ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active(n) && !open ? "font-semibold text-accent" : "text-muted"}`}>
            <Icon d={n.icon} />
            {n.short ?? n.label}
          </Link>
        ))}
        <button onClick={() => setOpen(!open)} aria-expanded={open} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${open || moreActive ? "font-semibold text-accent" : "text-muted"}`}>
          <Icon d={I.more} />
          More
        </button>
      </nav>
      <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 lg:py-10">
        <AliasMigrate />
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
