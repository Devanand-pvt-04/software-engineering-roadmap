import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { SyncProvider } from "@/lib/store";
import { Shell } from "@/components/shell";
import { ContentProvider } from "@/lib/content";
import { clientContent } from "@/server/content";
import { Splash } from "@/components/gate";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Zero to Deep", template: "%s · Zero to Deep" },
  description: "A 36-week software engineering plan with daily checklists, trackers and links.",
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

function Gate({ children }: { children: React.ReactNode }) {
  const content = clientContent();
  return (
    <ContentProvider value={content}>
      <SyncProvider>
        <Shell>{children}</Shell>
      </SyncProvider>
    </ContentProvider>
  );
}
