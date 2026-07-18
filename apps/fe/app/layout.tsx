// app/layout.tsx (still server component)
import "./globals.css";
import { Inter, Schibsted_Grotesk, Noto_Sans, Fustat } from "next/font/google";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import LayoutShell from "@/components/utils/LayoutShell";
import AuthProvider from "./providers/AuthProvider";


const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});
const schibstedGrotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-schibsted-grotesk",
});
const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
});
const fustat = Fustat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fustat",
});

export const metadata: Metadata = {
  title: "Dryink",
  description:
    "Dryink turns a text prompt into a polished animated video — describe what you want to explain and get an AI-generated animation in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${schibstedGrotesk.variable} ${notoSans.variable} ${fustat.variable} ${inter.className}`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Toaster />
          <AuthProvider>
          <LayoutShell>
              {children}
              </LayoutShell>
            </AuthProvider>
        </ThemeProvider>
        
      </body>
    </html>
  );
}
