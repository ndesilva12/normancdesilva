import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eve Tools | Norman C. de Silva",
  description: "A curated collection of AI-powered tools for everyday productivity",
  keywords: ["tools", "AI", "productivity", "utilities", "Norman de Silva"],
  authors: [{ name: "Norman C. de Silva" }],
  creator: "Norman C. de Silva",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eve Tools",
  },
  openGraph: {
    type: "website",
    title: "Eve Tools | Norman C. de Silva",
    description: "A curated collection of AI-powered tools for everyday productivity",
    siteName: "Eve Tools",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background bg-grid">
          <div className="bg-radial min-h-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
