import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ishanthika & Nirmal — Wedding Invitation",
  description: "Join Ishanthika and Nirmal as they celebrate their wedding on August 03, 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
