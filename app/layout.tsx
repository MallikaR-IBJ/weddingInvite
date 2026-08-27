import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "太朗 & 花子 — 結婚式のご招待",
  description: "2026年12月14日、太朗と花子の結婚式にご参加ください。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
