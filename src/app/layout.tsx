import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TourSafe";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Travel Smart. Stay Safe.`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "AI-powered tourist safety monitoring and emergency response — realtime SOS, geo-fencing, digital identity, and a police command center.",
  applicationName: APP_NAME,
  keywords: ["tourist safety", "SOS", "emergency", "AI", "geo-fencing", "travel"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F8F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1115" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
