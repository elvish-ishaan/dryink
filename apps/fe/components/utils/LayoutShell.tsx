"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navs/Navbar";
import Footer from "@/components/footer/Footer";
import { ReactNode } from "react";

export default function LayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideLayout = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/dashboard");

  return (
    <>
      {!hideLayout && <Navbar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}
