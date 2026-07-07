import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSME Financial Health Card | AI/ML-Driven Credit Evaluation",
  description: "AI/ML-Driven MSME Financial Health Card aggregating alternate data (GST, UPI, EPFO, AA) for real-time multidimensional financial health scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Segoe UI', 'Segoe UI Variable', system-ui, -apple-system, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
