import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, DM_Mono, Inter } from "next/font/google";
import "./globals.css";
import HashSession from "./HashSession";

const serif = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-serif" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "After Hour",
  description: "A platform by founders, for founders.",
};

export const viewport: Viewport = { themeColor: "#F1ECE3", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${serif.variable} ${mono.variable} ${sans.variable}`}>
      <body>
        <HashSession />
        {children}
      </body>
    </html>
  );
}
