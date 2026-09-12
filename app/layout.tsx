import type { Metadata } from "next";
import { Jost, Playfair_Display, Public_Sans } from "next/font/google";
import { SoundUnlock } from "@/components/SoundUnlock";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-jost",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Casey",
  description: "Take the call. Trust nothing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jost.variable} ${publicSans.variable}`}
    >
      <body className="font-sans antialiased">
        <SoundUnlock />
        {children}
      </body>
    </html>
  );
}
