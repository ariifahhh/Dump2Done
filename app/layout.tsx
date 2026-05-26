import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Dump2Done",
  description: "Dump it. Plan it. Done.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Dump2Done" }
};

export const viewport: Viewport = {
  themeColor: "#dff7c7",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script id="pwa-register">
          {`if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));`}
        </Script>
      </body>
    </html>
  );
}
