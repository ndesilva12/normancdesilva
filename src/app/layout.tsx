import type { Metadata, Viewport } from "next";
import { Sacramento } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

// Load Sacramento font for the logo
const sacramento = Sacramento({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sacramento",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Dashboard",
  description: "A curated collection of AI-powered tools for everyday productivity",
  keywords: ["tools", "AI", "productivity", "utilities", "dashboard"],
  authors: [{ name: "Norman C. de Silva" }],
  creator: "Norman C. de Silva",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/api/icon/32", sizes: "32x32", type: "image/png" },
      { url: "/api/icon/192", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/api/icon/180", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "The Dashboard",
  },
  openGraph: {
    type: "website",
    title: "The Dashboard",
    description: "A curated collection of AI-powered tools for everyday productivity",
    siteName: "The Dashboard",
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`bg-background ${sacramento.variable}`}>
      <body className="min-h-screen w-full bg-background font-sans antialiased">
        <Providers>
          <div className="relative min-h-screen w-full bg-grid">
            <div className="absolute inset-0 bg-radial pointer-events-none" />
            <div className="relative z-10 min-h-screen w-full">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
