import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FAVICON, SITE_LOGO } from "@/lib/constants";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Meme Soundboard",
    template: "%s | Meme Soundboard",
  },
  description:
    "Instant meme soundboard with favorites, categories, keyboard shortcuts, and offline PWA support.",
  applicationName: "Meme Soundboard",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meme Soundboard",
  },
  icons: {
    icon: [{ url: FAVICON, type: "image/png", sizes: "512x512" }],
    shortcut: [{ url: FAVICON, type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "Meme Soundboard",
    description: "Press. Laugh. Repeat. Instant meme sounds on any device.",
    type: "website",
    images: [{ url: SITE_LOGO, alt: "Meme Soundboard" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark h-full`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
