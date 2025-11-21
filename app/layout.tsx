import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HueShift - Color Parser & Replacement Tool",
  description: "Parse, visualize, and replace colors in your code instantly. Supports hex, RGB, HSL, and named colors with WCAG contrast checking.",
  keywords: ["color parser", "color replacement", "css colors", "accessibility", "wcag", "contrast checker", "color tool"],
  authors: [{ name: "Colin Rodrigues", url: "https://colinrodrigues.com" }],
  creator: "Colin Rodrigues",
  openGraph: {
    title: "HueShift - Color Parser & Replacement Tool",
    description: "Parse, visualize, and replace colors in your code instantly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HueShift - Color Parser & Replacement Tool",
    description: "Parse, visualize, and replace colors in your code instantly",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
