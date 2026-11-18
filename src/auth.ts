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
      // Keep a stable provider-scoped user id (GitHub numeric id).
      if (account && profile) token.uid = `${account.provider}:${String(profile.id ?? token.sub)}`;
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = (token.uid as string) ?? token.sub;
      return session;
    },
  },
});

export async function currentUserId(): Promise<string | null> {
  if (!authEnabled) return null;
  const s = await auth();
  return ((s?.user as { id?: string } | undefined)?.id as string | undefined) ?? null;
}
