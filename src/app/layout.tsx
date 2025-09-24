import type { Metadata } from "next";
import "./globals.css";
import { SITE_COPY } from "@/lib/site-copy";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: `${SITE_COPY.name} · ${SITE_COPY.tagLine}`,
  description: SITE_COPY.description,
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: `${SITE_COPY.name} · ${SITE_COPY.tagLine}`,
    description: SITE_COPY.description,
    type: "website",
    locale: "en_GB",
    images: [
      {
        url: "https://placehold.co/1200x630?text=HENRYS",
        width: 1200,
        height: 630,
        alt: `${SITE_COPY.name} open graph image`,
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">
            <SiteHeader session={session} />
            <main className="flex-1 bg-gradient-to-b from-background via-background to-muted/40">
              {children}
            </main>
            <footer className="border-t border-border/60 bg-background/80">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <span>© {new Date().getFullYear()} {SITE_COPY.name}. All rights reserved.</span>
                <div className="flex flex-wrap gap-3">
                  <a className="hover:text-foreground" href="/legal/privacy">
                    Privacy
                  </a>
                  <a className="hover:text-foreground" href="/legal/terms">
                    Terms
                  </a>
                  <a className="hover:text-foreground" href="/legal/code-of-conduct">
                    Code of conduct
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
