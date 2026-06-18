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
      <Script id="pendo-install" strategy="afterInteractive" dangerouslySetInnerHTML={{
        __html: `(function(apiKey){
    (function(p,e,n,d,o){var v,w,x,y,z;o=p[d]=p[d]||{};o._q=o._q||[];
    v=['initialize','identify','updateOptions','pageLoad','track','trackAgent'];for(w=0,x=v.length;w<x;++w)(function(m){
    o[m]=o[m]||function(){o._q[m===v[0]?'unshift':'push']([m].concat([].slice.call(arguments,0)));};})(v[w]);
    y=e.createElement(n);y.async=!0;y.src='https://cdn.pendo.io/agent/static/'+apiKey+'/pendo.js';
    z=e.getElementsByTagName(n)[0];z.parentNode.insertBefore(y,z);})(window,document,'script','pendo');
})('29055749-ad53-421d-98ce-188f30dccfd0');
(function(){
  var vid=localStorage.getItem('_vivid_vid');
  if(!vid){vid=([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,function(c){return(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16);});localStorage.setItem('_vivid_vid',vid);}
  var p=new URLSearchParams(window.location.search);
  var v={id:vid};
  if(p.get('utm_source'))v.utm_source=p.get('utm_source');
  if(p.get('utm_medium'))v.utm_medium=p.get('utm_medium');
  if(p.get('utm_campaign'))v.utm_campaign=p.get('utm_campaign');
  pendo.initialize({visitor:v});
})();`
      }} />
      <body className="min-h-screen font-sans antialiased">{children}</body>
      {novusSrc ? (
        <Script src={novusSrc} strategy="afterInteractive" />
      ) : null}
    </html>
  );
}
