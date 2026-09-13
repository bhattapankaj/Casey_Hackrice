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
  description:
    "A voice-first investigation game. Take the call. Verify everything.",
  icons: {
    // Versioned so browsers drop the icon they cached before the felt plate.
    icon: [
      { url: "/favicon.ico?v=2", sizes: "16x16 32x32 48x48" },
      { url: "/favicon-16x16.png?v=2", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png?v=2", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png?v=2", sizes: "180x180" }],
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
      className={`${playfair.variable} ${jost.variable} ${publicSans.variable}`}
    >
      <body className="font-sans antialiased">
        <SoundUnlock />
        {children}
      </body>
    </html>
  );
}
