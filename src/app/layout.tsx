import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, IBM_Plex_Mono, Bungee_Shade } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// CHARTMAKER's chart font — softer/humanist vs Courier, with true bold,
// italic and bold-italic cuts for emphasis rendering.
const plexMono = IBM_Plex_Mono({
  variable: "--font-chart-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Display font for the app title.
const bungeeShade = Bungee_Shade({
  variable: "--font-bungee-shade",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "CHARTMAKER — chord chart transposer",
  description:
    "Write lead sheets in Roman numeral syntax, transpose live between 12 keys, export print-ready PDFs.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${plexMono.variable} ${bungeeShade.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
