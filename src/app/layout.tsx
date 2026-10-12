import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ogImagePath, site, siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  // Only set when the production domain is configured (see src/lib/site.ts).
  ...(siteUrl && { metadataBase: new URL(siteUrl), alternates: { canonical: "/" } }),
  title: site.title,
  description: site.description,
  keywords: site.keywords,
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_US",
    // Absolute URLs only exist with a configured domain; without one, no URL/image tags are emitted.
    ...(siteUrl && { url: "/", images: [{ url: ogImagePath, width: 1200, height: 630, alt: site.title }] }),
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
    ...(siteUrl && { images: [ogImagePath] }),
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-white font-sans text-nova-ink">{children}</body>
    </html>
  );
}
