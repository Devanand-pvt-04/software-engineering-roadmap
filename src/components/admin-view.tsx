"use client";

import { useState, useTransition } from "react";
import { FEATURES, resolveFeatures, type FeatureId, type FeatureMap } from "@/lib/features";
import { TRACK_LABEL, type Track } from "@/lib/roadmap";
import { deleteProfileAction, inviteMember, removeMember, saveProfileAction, startPreview, updateMember, type Result } from "@/app/admin/actions";
import { SectionTitle } from "./ui";

interface Profile {
  id: string;
  name: string;
  features: FeatureMap;
}
export interface MemberRow {
  login: string;
  displayLogin: string;
  githubId: string | null;
  name: string | null;
  image: string | null;
  profileId: string;
  overrides: FeatureMap;
  role: "member" | "admin";
  status: "active" | "revoked";
  note: string;
  invitedAt: string;
  lastSeenAt: string | null;
  progress: { passed: Record<string, number>; lastActive: string | null; solved: number } | null;
}

function ago(iso: string | null) {
  if (!iso) return "never";
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400 * 2) return `${Math.round(s / 3600)} h ago`;
  return `${Math.round(s / 86400)} days ago`;
}

/** Runs a server action and keeps its message or error for display. */
function useAction() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<Result>, onOk?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        setMsg(r.message ? { ok: true, text: r.message } : null);
        onOk?.();
      } else setMsg({ ok: false, text: r.error });
    });
  const note = msg && <p className={`mt-2 text-sm ${msg.ok ? "text-ok" : "text-danger"}`}>{msg.text}</p>;
  return { pending, run, note };
}

export function AdminView({ me, owners, dbReady, profiles, members }: { me: string; owners: string[]; dbReady: boolean; profiles: Profile[]; members: MemberRow[] }) {
  const active = members.filter((m) => m.status === "active").length;
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-muted">
          Invite people by GitHub username and choose what each of them can see. Anything switched off is gone for them: no menu item, no page, and its content never
          reaches their browser.
        </p>
      </header>

      {!dbReady && (
        <section className="card border-warn bg-warn-soft p-5 text-[15px]">Members are stored in the database, which isn&apos;t configured on this deployment.</section>
      )}

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Members" value={members.length} />
        <Stat label="Active" value={active} />
        <Stat label="Profiles" value={profiles.length} />
      </section>

      <Invite profiles={profiles} disabled={!dbReady} />

      <section className="space-y-3">
        <SectionTitle hint={owners.length ? `Owner: ${owners.map((o) => "@" + o).join(", ")}${me && !owners.includes(me) ? ` · you: @${me}` : ""}` : undefined}>
          Members
        </SectionTitle>
        {members.length === 0 && <p className="card p-5 text-sm text-muted">No one yet. Invite someone above.</p>}
        {members.map((m) => (
          <MemberCard key={m.login} m={m} profiles={profiles} />
        ))}
      </section>

      <Profiles profiles={profiles} members={members} disabled={!dbReady} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function Invite({ profiles, disabled }: { profiles: Profile[]; disabled: boolean }) {
  const [login, setLogin] = useState("");
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [admin, setAdmin] = useState(false);
  const [note, setNote] = useState("");
  const { pending, run, note: feedback } = useAction();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => inviteMember({ login, profileId, role: admin ? "admin" : "member", note }), () => {
      setLogin("");
      setNote("");
    });
  };
  return (
    <section className="card p-5">
      <SectionTitle>Invite someone</SectionTitle>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="input min-w-0 flex-1" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="GitHub username, e.g. octocat" aria-label="GitHub username" required />
          <select className="input shrink-0 sm:!w-56" value={profileId} onChange={(e) => setProfileId(e.target.value)} aria-label="Profile">
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for yourself (optional), e.g. college friend" aria-label="Note" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-[var(--accent)]" checked={admin} onChange={(e) => setAdmin(e.target.checked)} />
            Make them an admin too (full access, can manage members)
          </label>
          <button className="btn btn-primary" disabled={disabled || pending || !login.trim()}>
            {pending ? "Inviting…" : "Invite"}
          </button>
        </div>
      </form>
      {feedback}
      <p className="mt-3 text-xs text-muted">They open the app&apos;s link and sign in with GitHub. Nobody else can get in.</p>
    </section>
  );
}

function FeatureSummary({ features }: { features: FeatureId[] }) {
  const tracks = (["main", "java"] as Track[]).filter((t) => features.includes(`track:${t}`));
  const tools = FEATURES.filter((f) => f.group !== "Tracks" && features.includes(f.id)).map((f) => f.label);
  return (
    <div className="flex flex-wrap gap-1.5">
      {tracks.length === 0 && <span className="chip !border-danger !text-danger">No track</span>}
      {tracks.map((t) => (
        <span key={t} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${t === "main" ? "bg-main-soft text-main" : "bg-java-soft text-java"}`}>
          {TRACK_LABEL[t]}
        </span>
      ))}
      {tools.map((t) => (
        <span key={t} className="chip">
          {t}
        </span>
      ))}
    </div>
  );
}

function MemberCard({ m, profiles }: { m: MemberRow; profiles: Profile[] }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { pending, run, note } = useAction();
  const profile = profiles.find((p) => p.id === m.profileId);
  const effective = m.role === "admin" ? FEATURES.map((f) => f.id) : resolveFeatures(profile?.features ?? {}, m.overrides);
  const overrides = Object.keys(m.overrides).length;
  const revoked = m.status === "revoked";
  const img = m.image || `https://github.com/${m.displayLogin}.png?size=64`;

  return (
    <article className={`card p-4 ${revoked ? "opacity-70" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="" className="size-10 shrink-0 rounded-full bg-panel-2" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <a href={`https://github.com/${m.displayLogin}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-accent">
                @{m.displayLogin}
              </a>
              {m.name && <span className="text-sm text-muted">{m.name}</span>}
              {m.role === "admin" && <span className="chip !border-accent !text-accent">Admin</span>}
              {revoked && <span className="chip !border-danger !text-danger">Access revoked</span>}
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {m.lastSeenAt ? `Last opened the app ${ago(m.lastSeenAt)}` : "Hasn't signed in yet"}
              {m.progress && (
                <>
                  {" · "}
                  {effective.includes("track:main") && `Main ${m.progress.passed.main}/36`}
                  {effective.includes("track:main") && effective.includes("track:java") && ", "}
                  {effective.includes("track:java") && `Java ${m.progress.passed.java}/36`} weeks passed
                  {effective.includes("problems") && ` · ${m.progress.solved} problems`}
                  {m.progress.lastActive && ` · last ticked ${ago(m.progress.lastActive)}`}
                </>
              )}
              {m.note && <span className="italic"> · {m.note}</span>}
            </div>
            <div className="mt-2">
              <FeatureSummary features={effective} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <select
            className="input !w-auto !py-1.5 text-sm"
            value={m.role === "admin" ? "__admin" : m.profileId}
            onChange={(e) => run(() => (e.target.value === "__admin" ? updateMember(m.login, { role: "admin" }) : updateMember(m.login, { role: "member", profileId: e.target.value })))}
            aria-label={`Profile for ${m.displayLogin}`}
            disabled={pending}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="__admin">Admin (everything)</option>
          </select>
          {m.role !== "admin" && (
            <button className="btn !py-1.5 text-sm" onClick={() => setOpen(!open)} aria-expanded={open}>
              Features{overrides ? ` (${overrides} custom)` : ""}
            </button>
          )}
          {m.role !== "admin" && !revoked && (
            <form action={startPreview.bind(null, m.login)}>
              <button className="btn !py-1.5 text-sm">Preview</button>
            </form>
          )}
        </div>
      </div>

      {open && m.role !== "admin" && (
        <Overrides
          base={profile?.features ?? {}}
          overrides={m.overrides}
          profileName={profile?.name ?? "profile"}
          pending={pending}
          onChange={(o) => run(() => updateMember(m.login, { overrides: o }))}
        />
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3 text-sm">
        <button className="text-muted hover:text-fg" disabled={pending} onClick={() => run(() => updateMember(m.login, { status: revoked ? "active" : "revoked" }))}>
          {revoked ? "Restore access" : "Revoke access"}
        </button>
        {!confirm ? (
          <button className="text-muted hover:text-danger" onClick={() => setConfirm(true)}>
            Remove…
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-2">
            Remove @{m.displayLogin} from the list? Their saved progress stays in the database.
            <button className="btn !border-danger !py-1 !text-danger" disabled={pending} onClick={() => run(() => removeMember(m.login))}>
              Remove
            </button>
            <button className="btn !py-1" onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </span>
        )}
      </div>
      {note}
    </article>
  );
}

/** Per-person switches on top of the profile: follow the profile, force on, or force off. */
function Overrides({ base, overrides, profileName, pending, onChange }: { base: FeatureMap; overrides: FeatureMap; profileName: string; pending: boolean; onChange: (o: FeatureMap) => void }) {
  const fromProfile = resolveFeatures(base);
  const set = (id: FeatureId, v: boolean | undefined) => {
    const o = { ...overrides };
    if (v === undefined) delete o[id];
    else o[id] = v;
    onChange(o);
  };
  return (
    <div className="mt-3 rounded-lg bg-panel-2 p-3">
      <p className="mb-2 text-xs text-muted">Changes here apply only to this person. &quot;{profileName}&quot; follows the profile.</p>
      <div className="divide-y divide-line">
        {FEATURES.map((f) => {
          const o = overrides[f.id];
          const opts: { v: boolean | undefined; label: string }[] = [
            { v: undefined, label: `${profileName} (${fromProfile.includes(f.id) ? "on" : "off"})` },
            { v: true, label: "On" },
            { v: false, label: "Off" },
          ];
          return (
            <div key={f.id} className="flex flex-col gap-1.5 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-medium">{f.label}</div>
                <div className="text-xs text-muted">{f.description}</div>
              </div>
              <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={f.label}>
                {opts.map((x) => (
                  <button
                    key={String(x.v)}
                    role="radio"
                    aria-checked={o === x.v}
                    disabled={pending}
                    onClick={() => set(f.id, x.v)}
                    className={`rounded-md border px-2 py-1 text-xs ${o === x.v ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:text-fg"}`}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Profiles({ profiles, members, disabled }: { profiles: Profile[]; members: MemberRow[]; disabled: boolean }) {
  const [adding, setAdding] = useState(false);
  return (
    <section className="space-y-3">
      <SectionTitle hint="Editing a profile changes it for everyone on it">Profiles</SectionTitle>
      {profiles.map((p) => (
        <ProfileCard key={p.id} p={p} count={members.filter((m) => m.profileId === p.id && m.role !== "admin").length} disabled={disabled} />
      ))}
      {adding ? (
        <ProfileCard p={{ id: "", name: "", features: {} }} count={0} disabled={disabled} onDone={() => setAdding(false)} />
      ) : (
        <button className="btn" onClick={() => setAdding(true)} disabled={disabled}>
          New profile
        </button>
      )}
    </section>
  );
}

function ProfileCard({ p, count, disabled, onDone }: { p: Profile; count: number; disabled: boolean; onDone?: () => void }) {
  const isNew = !p.id;
  const [name, setName] = useState(p.name);
  const [features, setFeatures] = useState<FeatureMap>(() => Object.fromEntries(resolveFeatures(p.features).map((f) => [f, true])) as FeatureMap);
  const { pending, run, note } = useAction();
  const full: FeatureMap = Object.fromEntries(FEATURES.map((f) => [f.id, !!features[f.id]]));
  const dirty = isNew || name !== p.name || FEATURES.some((f) => !!features[f.id] !== resolveFeatures(p.features).includes(f.id));
  const groups = ["Tracks", "Tools", "Reference"] as const;
  return (
    <article className="card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="input max-w-xs !py-1.5 font-semibold" value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name, e.g. Java + DSA only" aria-label="Profile name" />
        {!isNew && <span className="text-xs text-muted">{count === 1 ? "1 member" : `${count} members`}</span>}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g}>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted">{g}</div>
            {FEATURES.filter((f) => f.group === g).map((f) => (
              <label key={f.id} className="flex items-start gap-2 py-1 text-sm" title={f.description}>
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-[var(--accent)]"
                  checked={!!features[f.id]}
                  onChange={(e) => setFeatures({ ...features, [f.id]: e.target.checked })}
                />
                <span>
                  {f.label}
                  {f.requires && !features[f.requires] && features[f.id] && <span className="block text-xs text-warn">Needs {FEATURES.find((x) => x.id === f.requires)?.label}</span>}
                </span>
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-primary !py-1.5" disabled={disabled || pending || !dirty || !name.trim()} onClick={() => run(() => saveProfileAction({ id: p.id || undefined, name, features: full }), onDone)}>
          {isNew ? "Create profile" : "Save"}
        </button>
        {isNew ? (
          <button className="btn !py-1.5" onClick={onDone}>
            Cancel
          </button>
        ) : (
          <button className="btn !py-1.5" disabled={disabled || pending} onClick={() => run(() => deleteProfileAction(p.id))}>
            Delete
          </button>
        )}
      </div>
      {note}
    </article>
  );
}
