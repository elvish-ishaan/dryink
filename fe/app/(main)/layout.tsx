// app/(main)/layout.tsx
import Navbar from "@/components/navs/Navbar";
import Footer from "@/components/footer/Footer";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
