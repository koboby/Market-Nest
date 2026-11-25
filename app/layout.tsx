import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market Nest — Your store, your style",
  description:
    "Create a beautiful online store, customise every detail, and grow your business with Market Nest.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
