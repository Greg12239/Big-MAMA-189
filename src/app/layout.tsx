import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big Mama | Burgers n' Fries",
  description: "Big Mama Burgers n' Fries premium animated landing page.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-hero-motion="motion">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
