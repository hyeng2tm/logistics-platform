import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "../contexts/Providers";
import MainLayout from "../components/layout/MainLayout";
import AuthGuard from "../components/layout/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="ko">
      <body className={inter.className} suppressHydrationWarning>
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
