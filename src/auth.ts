import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

export const authEnabled = Boolean(
  process.env.AUTH_SECRET && process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: authEnabled ? [GitHub] : [],
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    jwt({ token, profile, account }) {
      if (account && profile) {
        // Stable provider-scoped user id (GitHub numeric id) for progress, plus the username for invites.
        token.uid = `${account.provider}:${String(profile.id ?? token.sub)}`;
        token.githubId = String(profile.id ?? "");
        token.login = (profile as { login?: string }).login;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; login?: string; githubId?: string };
        u.id = (token.uid as string) ?? token.sub;
        u.login = token.login as string | undefined;
        u.githubId = token.githubId as string | undefined;
      }
      return session;
    },
  },
});

export async function currentUserId(): Promise<string | null> {
  if (!authEnabled) return null;
  const s = await auth();
  return ((s?.user as { id?: string } | undefined)?.id as string | undefined) ?? null;
}
