import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MSME Financial Health Card | AI/ML-Driven Credit Evaluation",
  description: "AI/ML-Driven MSME Financial Health Card aggregating alternate data (GST, UPI, EPFO, AA) for real-time multidimensional financial health scoring.",
  keywords: [
    "MSME Financial Health Card",
    "Credit Scoring",
    "Alternate Data Underwriting",
    "GST Analysis",
    "UPI Credit Evaluation",
    "Account Aggregator Credit Assessment",
    "New-to-Credit Financing",
    "IDBI Bank MSME Loan",
    "ULI OCEN Integration",
    "Real-time Credit Score"
  ],
  authors: [{ name: "IDBI Bank Credit Underwriting Development Team" }],
  creator: "IDBI Bank",
  publisher: "IDBI Bank",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://idbi-msme-healthcard.in",
    title: "MSME Financial Health Card | IDBI Bank Real-Time Credit Evaluation",
    description: "Evaluate NTC/NTB credit invisible enterprises in real-time. Aggregates GST, UPI, EPFO, and Bank Statements to compute a multidimensional financial health score.",
    siteName: "IDBI MSME Financial Health Card Assessment Engine",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "IDBI Bank MSME Financial Health Card Social Preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "MSME Financial Health Card | IDBI Bank Credit Assessment",
    description: "Real-time AI/ML-driven multidimensional financial health card aggregating alternate data for credit-invisible MSMEs.",
    creator: "@idbibank",
    images: ["/twitter-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "IDBI Bank MSME Financial Health Card Assessment Engine",
    "operatingSystem": "All",
    "applicationCategory": "FinanceApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "An AI/ML-driven MSME Credit Assessment framework aggregating alternate data (GST, UPI, EPFO, Banking) to calculate a multidimensional Financial Health Score."
  };

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "'Segoe UI', 'Segoe UI Variable', system-ui, -apple-system, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
