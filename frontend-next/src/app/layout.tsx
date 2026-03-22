import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "../contexts/Providers";
import MainLayout from "../components/layout/MainLayout";
import AuthGuard from "../components/layout/AuthGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit"
});

export const metadata: Metadata = {
  title: "Logistics OS - Next.js",
  description: "Next.js migration of Logistics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${outfit.variable}`}>
      <body suppressHydrationWarning>
        <Providers>
          <AuthGuard>
            <MainLayout>
              {children}
            </MainLayout>
          </AuthGuard>
        </Providers>
        <div id="datepicker-portal"></div>
      </body>
    </html>
  );
}
