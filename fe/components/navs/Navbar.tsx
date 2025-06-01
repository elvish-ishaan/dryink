"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import logo from '@/assets/logo.svg'

const Navbar = () => {
  const navItems = [
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contacts", href: "/contacts" },
  ];
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  // Set initial mode on mount
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
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
        {/* Logo and nav items */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image
              src={logo}
              alt="logo"
              width={40}
              height={40}
              className="rounded-full dark:text-white"
            />
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
              Dryink
            </h1>
          </div>

          {/* Navigation Items */}
          <motion.ul layoutId="navItems" className="flex gap-6">
            {navItems.map((item, idx) => (
              <li key={item.name}>
                <Link
                  key={idx}
                  href={item.href}
                  className="px-3 py-2 text-md w-full relative font-medium text-neutral-600 dark:text-neutral-300 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Actions: Toggle + Auth Buttons */}
        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-md bg-neutral-50 dark:bg-neutral-800 focus:outline-none cursor-pointer"
          >
            {isDarkMode ? (
              <Moon className="w-5 h-5 text-neutral-800 dark:text-white" />
            ) : (
              <Sun className="w-5 h-5 text-neutral-800 dark:text-white" />
            )}
          </button>

          {/* Auth Buttons */}
          <motion.div layoutId="signin" className="flex gap-2">
            <Button
            onClick={ () => router.push("/login") }
              variant="outline"
              className="rounded-2xl text-neutral-800 dark:text-white cursor-pointer"
            >
              Login
            </Button>
            <Button
              onClick={ () => router.push("/signup") }
              variant="outline"
              className="rounded-2xl text-neutral-800 dark:text-white cursor-pointer"
            >
              Sign Up
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
