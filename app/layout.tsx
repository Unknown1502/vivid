import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0a0810",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Vivid — interactive sales & onboarding explainers for SaaS",
    template: "%s — Vivid",
  },
  description:
    "Describe how your SaaS works in a sentence — pricing, onboarding, architecture, permissions — and Vivid builds a live, interactive explainer prospects and new hires can poke. Shareable as a link.",
  applicationName: "Vivid",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Vivid — make your product pokeable",
    description:
      "Turn complex SaaS pricing, onboarding, and architecture into interactive explainers people actually understand.",
    siteName: "Vivid",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Optional Novus client snippet (eligibility + the funnel story). Novus also
  // auto-instruments via its deploy integration; this slot is for the custom
  // events that lib/analytics.ts emits. Set NEXT_PUBLIC_NOVUS_SRC to enable.
  const novusSrc = process.env.NEXT_PUBLIC_NOVUS_SRC;
  return (
    <html lang="en" className={`dark ${display.variable} ${sans.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
      {novusSrc ? (
        <Script src={novusSrc} strategy="afterInteractive" />
      ) : null}
    </html>
  );
}
