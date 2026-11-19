import { signInGitHub, signOutAction } from "@/app/actions";

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="card w-full max-w-sm p-6 text-center">
        <div className="text-lg font-bold tracking-tight">Zero to Deep</div>
        <div className="mb-5 text-xs text-muted">A 36-week software engineering plan</div>
        {children}
      </div>
    </main>
  );
}

const GH = (
  <svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden>
    <path d="M8 0a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.65-.89-3.65-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 008 0z" />
  </svg>
);

export function Splash() {
  return <div className="min-h-screen" aria-busy="true" />;
}

export function SignInScreen({ relogin }: { relogin?: boolean }) {
  return (
    <Frame>
      <p className="mb-5 text-[15px] leading-relaxed text-muted">
        {relogin ? "Please sign in again. The app now uses your GitHub username to check your invite." : "This app is invite only. Sign in with the GitHub account you were invited with."}
      </p>
      <form action={relogin ? signOutAction : signInGitHub}>
        <button className="btn btn-primary w-full justify-center">
          {GH}
          {relogin ? "Sign out, then sign in again" : "Sign in with GitHub"}
        </button>
      </form>
    </Frame>
  );
}

export function NoAccess({ login }: { login: string | null }) {
  return (
    <Frame>
      <p className="mb-5 text-[15px] leading-relaxed text-muted">
        You&apos;re signed in as <b className="text-fg">@{login}</b>, but this account hasn&apos;t been invited. Ask the person who shared the link to invite your GitHub
        username.
      </p>
      <form action={signOutAction}>
        <button className="btn w-full justify-center">Sign out</button>
      </form>
    </Frame>
  );
}
