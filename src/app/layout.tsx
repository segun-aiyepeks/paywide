import type { Metadata } from "next";
import { Space_Grotesk, Montserrat } from "next/font/google";
import "./globals.css";
import { AppShell } from "../components/AppShell";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WayPay — Institutional Cross-Border Remittance via Blaaiz RaaS",
  description:
    "Zero-float, transparent cross-border money transfer from NGN to USD, GBP, EUR, and CAD. Powered by the Blaaiz Remittance-as-a-Service API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${montserrat.variable}`}>
      <body className="font-body antialiased selection:bg-primary selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
