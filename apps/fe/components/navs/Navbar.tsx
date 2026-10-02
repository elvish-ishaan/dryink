"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Sun, Moon, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import logo from '@/assets/logo.svg'
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";

export default function Navbar() {
  const navItems = [
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contacts", href: "/contacts" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // On the landing page, let the hero image show through the navbar until the user scrolls
  const isOverHero = pathname === "/" && !isScrolled;

  const isDarkMode = mounted && resolvedTheme === "dark";
  const toggleDarkMode = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-0 left-0 z-50 w-full border-b transition-colors duration-300 ${
        isOverHero
          ? "border-transparent bg-transparent"
          : "border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4 md:px-[120px] md:py-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src={logo}
            alt="logo"
            width={28}
            height={28}
            className="rounded-full"
          />
          <Link
            href="/"
            className={`font-nav text-2xl font-semibold tracking-[-1.44px] text-neutral-900 ${isOverHero ? "" : "dark:text-white"}`}
          >
            Dryink
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <ul className="flex gap-6">
            {navItems.map((item) => (
              <li key={item.name}>
                <Button
                  variant="link"
                  onClick={() => router.push(item.href)}
                  className={`px-0 font-nav text-base font-medium tracking-[-0.2px] hover:text-neutral-900 ${
                    isOverHero ? "text-neutral-800" : "text-neutral-700 dark:text-neutral-300 dark:hover:text-white"
                  }`}
                >
                  {item.name}
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            <Button
              onClick={toggleDarkMode}
              aria-label="Toggle Dark Mode"
              className={`rounded-md bg-transparent p-2 ${
                isOverHero
                  ? "text-neutral-800 hover:bg-white/40"
                  : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <div className="flex gap-2">
              {status === "authenticated" ? (
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-[101px] rounded-full bg-black font-nav text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => router.push("/signup")}
                    variant="ghost"
                    className={`w-[82px] rounded-full font-nav text-neutral-900 ${
                      isOverHero ? "hover:bg-white/40" : "hover:bg-neutral-100 dark:text-white dark:hover:bg-neutral-800"
                    }`}
                  >
                    Sign Up
                  </Button>
                  <Button
                    onClick={() => router.push("/login")}
                    className="w-[101px] rounded-full bg-black font-nav text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                  >
                    Log In
                  </Button>
                </>
              )}
              {status === "loading" && (
                <Button variant="outline" className="rounded-full font-nav">
                  Loading...
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          {!isMobileMenuOpen && (
            <Button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md bg-neutral-100 dark:bg-neutral-800"
            >
              <Menu className="w-6 h-6 text-neutral-800 dark:text-white" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Sidebar */}
          <div
            className="relative z-50 bg-white dark:bg-neutral-900 w-64 h-full p-6 space-y-6 shadow-xl ml-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute cursor-pointer top-4 right-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="flex flex-col items-start gap-4 mt-10">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="font-nav text-md font-medium text-neutral-800 dark:text-white hover:text-[#4a3294]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Button
                onClick={toggleDarkMode}
                className="p-2 rounded cursor-pointer hover:bg-neutral-300 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white flex items-center gap-2"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button
                onClick={() => {
                  router.push("/login");
                  setIsMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full cursor-pointer"
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  router.push("/signup");
                  setIsMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full cursor-pointer"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.nav>
  );
};
