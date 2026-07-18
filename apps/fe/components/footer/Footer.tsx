import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import Image from "next/image";
import logo from '@/assets/logo.svg'

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 px-6 md:px-[120px] py-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 font-body text-sm text-[#505050] dark:text-neutral-400">
        {/* Brand & Social */}
        <div className="space-y-4 col-span-1 md:col-span-1">
          <div className="flex items-center gap-2">
            <Image src={logo} alt="logo" width={28} height={28} className="rounded-full" />
            <span className="font-nav text-2xl font-semibold tracking-[-1.44px] text-neutral-900 dark:text-white">
              Dryink
            </span>
          </div>
          <p className="text-[#505050] dark:text-neutral-400">
            Turn a text prompt into a polished animated video.
          </p>
          <div className="flex space-x-4 pt-2 text-neutral-500 dark:text-neutral-400">
            <a href="#" className="hover:text-[#4a3294] transition-colors">
              <Instagram size={18} />
            </a>
            <a href="#" className="hover:text-[#4a3294] transition-colors">
              <Facebook size={18} />
            </a>
            <a href="#" className="hover:text-[#4a3294] transition-colors">
              <Twitter size={18} />
            </a>
            <a href="#" className="hover:text-[#4a3294] transition-colors">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-nav text-xs font-semibold uppercase tracking-wide text-neutral-900 dark:text-white mb-3">
            Product
          </h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Overview
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Pricing
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Marketplace
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Features
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-nav text-xs font-semibold uppercase tracking-wide text-neutral-900 dark:text-white mb-3">
            Company
          </h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Team
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Blog
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Careers
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-nav text-xs font-semibold uppercase tracking-wide text-neutral-900 dark:text-white mb-3">
            Resources
          </h4>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Help
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Sales
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Advertise
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Privacy
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row justify-between items-center font-body text-xs text-neutral-400 dark:text-neutral-500">
        <p>© {new Date().getFullYear()} Dryink. All rights reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0 font-nav">
          <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Terms and Conditions
          </a>
          <a href="#" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
