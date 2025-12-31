import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pipe Detection - Before/After",
  description: "Static web app to detect pipes in images and display before/after results",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
