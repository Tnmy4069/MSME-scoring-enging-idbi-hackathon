import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSME Financial Health Card | AI-Powered Credit Assessment",
  description: "AI-Powered Alternate Data Credit Assessment platform for MSME underwriting and financial health evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Segoe UI', 'Segoe UI Variable', system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
