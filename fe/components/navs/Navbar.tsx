"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Sun, Moon, Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import logo from '@/assets/logo.svg'
import { useSession } from "next-auth/react";

export default function Navbar() {
  const navItems = [
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contacts", href: "/contacts" },
  ];

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session, status} = useSession();
  console.log(session, status);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-0 w-full z-50 px-4"
    >
      <div className="mx-auto max-w-7xl bg-neutral-50/80 dark:bg-neutral-800/80 backdrop-blur-md shadow-lg rounded-3xl border border-neutral-200 dark:border-neutral-700 px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src={logo}
            alt="logo"
            width={30}
            height={30}
            className="rounded-full dark:text-white"
          />
          <Link href="/" className="text-lg font-bold text-neutral-900 dark:text-white">Dryink</Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <motion.ul layoutId="navItems" className="flex gap-6">
            {navItems.map((item, idx) => (
              <li key={item.name}>
                <Button
                  variant={"link"}
                  key={idx}
                  onClick={() => router.push(item.href)}
                  className="px-3 py-2 text-md w-full relative font-medium text-neutral-600 dark:text-neutral-300 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {item.name}
                </Button>
              </li>
            ))}
          </motion.ul>

          <div className="flex items-center gap-4">
            <Button
              onClick={toggleDarkMode}
              aria-label="Toggle Dark Mode"
              className="p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 focus:outline-none cursor-pointer  hover:bg-neutral-100"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-neutral-800 dark:text-white" /> : <Moon className="w-5 h-5 text-neutral-800 dark:text-white " />}
            </Button>

            <motion.div layoutId="signin" className="flex gap-2">
              {
                status === 'authenticated' ? <Button
                  onClick={() => router.push("/dashboard")}
                  variant={"outline"}
                  className="rounded-2xl text-neutral-800 dark:text-white cursor-pointer"
                >
                  Dashboard </Button> : 
                  <>
                    <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="rounded-2xl text-neutral-800 dark:text-white cursor-pointer"
              >
                Login
                    </Button>
                    <Button
                onClick={() => router.push("/signup")}
                variant="outline"
                className="rounded-2xl text-neutral-800 dark:text-white cursor-pointer"
              >
                Sign Up
                    </Button>
                  </>
                
              }
              { status === 'loading' && <Button
                variant="outline"
                className="rounded-2xl text-neutral-800 dark:text-white cursor-pointer"
              >Loading...</Button>}
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          {!isMobileMenuOpen && (
            <Button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md bg-neutral-200 dark:bg-neutral-700"
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
            className=" relative z-50 bg-white dark:bg-neutral-900 w-64 h-full p-6 space-y-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute cursor-pointer top-4 right-4 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 dark:bg-neutral-800 dark:text-white"
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="flex flex-col items-start gap-4 mt-10">
              {navItems.map((item, idx) => (
                <Link
                  key={idx}
                  href={item.href}
                  className="text-md font-medium text-neutral-800 dark:text-white hover:text-[#4a3294]"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Button
                onClick={toggleDarkMode}
                className="p-2 rounded cursor-pointer hover:bg-neutral-300  bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white flex items-center gap-2"
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
