import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL()),
  title: { default: "Rotary Club of Gayaza | Service Above Self in Gayaza, Uganda", template: "%s | Rotary Club of Gayaza" },
  description: "The Rotary Club of Gayaza (District 9213) — people of action serving Gayaza, Uganda through health outreach, youth leadership, road safety and fellowship. We meet Sundays at 5:00 PM at Eriot Recreation Centre.",
  applicationName: "Rotary Club of Gayaza",
  keywords: ["Rotary Club of Gayaza", "Rotary Gayaza", "Rotary Uganda", "District 9213", "Gayaza", "Wakiso", "Interact", "Rotaract", "community service Uganda"],
  openGraph: { type: "website", siteName: "Rotary Club of Gayaza", locale: "en_UG" },
  twitter: { card: "summary_large_image", site: "@Rcgayaza" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#17458F", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-UG" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
