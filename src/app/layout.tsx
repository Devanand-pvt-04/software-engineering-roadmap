import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { SyncProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import { ContentProvider } from "@/lib/content";
import { getAccess } from "@/server/access";
import { clientContent } from "@/server/content";
import { NoAccess, SignInScreen, Splash } from "@/components/gate";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Zero to Deep", template: "%s · Zero to Deep" },
  description: "A 36-week software engineering plan with daily checklists, trackers and links. Invite only.",
};
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f5" },
    { media: "(prefers-color-scheme: dark)", color: "#111110" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ztd:theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full font-sans">
        <Suspense fallback={<Splash />}>
          <Gate>{children}</Gate>
        </Suspense>
      </body>
    </html>
  );
}

/** Decides, per request, whether this person gets the app and which slice of the plan they receive. */
async function Gate({ children }: { children: React.ReactNode }) {
  const a = await getAccess();
  if (a.status === "anon" || a.status === "relogin") return <SignInScreen relogin={a.status === "relogin"} />;
  if (a.status === "denied") return <NoAccess login={a.login} />;
  const content = clientContent({ role: a.role!, login: a.login, previewAs: a.previewAs, features: a.features });
  return (
    <ContentProvider value={content}>
      <SyncProvider>
        <Shell>{children}</Shell>
      </SyncProvider>
    </ContentProvider>
  );
}
