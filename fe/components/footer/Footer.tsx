import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 text-sm text-gray-600 dark:text-gray-400">
        {/* Brand & Social */}
        <div className="space-y-4 col-span-1 md:col-span-1">
          <div className="flex items-center space-x-2">
            <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-md font-bold text-sm">
              <Image src="/logo.png" alt="logo" width={40} height={40} />
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Dryink
            </span>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            AI tools and APIs that grow with your ideas.
          </p>
          <div className="flex space-x-4 pt-2 text-gray-600 dark:text-gray-300">
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">
              <Instagram size={18} />
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">
              <Facebook size={18} />
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">
              <Twitter size={18} />
            </a>
            <a href="#" className="hover:text-gray-900 dark:hover:text-white">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Product
          </h4>
          <ul className="space-y-1">
            <li>
              <a href="#" className="hover:underline">
                Overview
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Pricing
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Marketplace
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Features
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Company
          </h4>
          <ul className="space-y-1">
            <li>
              <a href="#" className="hover:underline">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Team
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Blog
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Careers
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            Resources
          </h4>
          <ul className="space-y-1">
            <li>
              <a href="#" className="hover:underline">
                Help
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Sales
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Advertise
              </a>
            </li>
            <li>
              <a href="#" className="hover:underline">
                Privacy
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-neutral-700 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 dark:text-gray-500">
        <p>© {new Date().getFullYear()} Dryink. All rights reserved.</p>
        <div className="space-x-4 mt-2 md:mt-0">
          <a href="#" className="hover:underline">
            Terms and Conditions
          </a>
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
