import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Fraunces, Cairo } from "next/font/google";
import "./globals.css";
import { dirOf, localeFromPathname } from "@/lib/i18n";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "PregnaWell — Empowering Women on the Journey to Motherhood",
    template: "%s | PregnaWell",
  },
  description:
    "Compassionate, evidence-based programs and resources for fertility, pregnancy, and postpartum — guided by Maha Hommos and the PregnaWell team.",
  metadataBase: new URL("https://pregnawell.com"),
  openGraph: {
    title: "PregnaWell",
    description:
      "Compassionate, evidence-based programs and resources for fertility, pregnancy, and postpartum.",
    url: "https://pregnawell.com",
    siteName: "PregnaWell",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/en";
  const locale = localeFromPathname(pathname);
  const dir = dirOf(locale);
  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${fraunces.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--brand-cream)] text-[var(--brand-ink)]">
        {children}
      </body>
    </html>
  );
}
