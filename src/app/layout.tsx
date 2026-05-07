import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--brand-cream)] text-[var(--brand-ink)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </body>
    </html>
  );
}
