import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Twitter, MessageCircle } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function MountainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200 relative">
        {/* Background texture */}
        <div className="absolute inset-0 z-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100">
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke={darkMode ? "#ffffff" : "#000000"} strokeWidth="0.5"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <header className="px-4 lg:px-6 h-20 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 relative z-10">
          <Link href="#" className="flex items-center justify-center" prefetch={false}>
            <MountainIcon className="h-6 w-6" />
            <span className="sr-only">Acme Web3</span>
          </Link>
          <div className="flex items-center space-x-4">
            <ConnectButton />
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <Twitter size={20} />
              <span className="sr-only">Twitter</span>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span className="sr-only">Toggle dark mode</span>
            </Button>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              <MessageCircle size={20} />
              <span className="sr-only">Discord</span>
            </a>
          </div>
        </header>
        <main className="flex-1 relative z-10 flex items-center justify-center">
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
              <div className="text-center space-y-4">
                <div className="inline-block rounded-lg bg-[#1652F0] px-3 py-1 text-sm text-white animate-pulse">
                  Defi Crowdfunding 
                </div>
                <h1 className="text-3xl font-bold tracking-tighter md:text-4xl/tight animate-bounce">
                  Support the future of the internet.
                </h1>
                <p className="max-w-[600px] mx-auto text-[#1652F0] dark:text-[#4287f5] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Contribute to the development of cutting-edge Web3 technologies and be a part of the decentralized revolution.
                </p>
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium shadow-sm transition-colors hover:bg-[#1652F0] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center justify-center px-4 md:px-6 border-t border-gray-200 dark:border-gray-700 relative z-10">
          <p className="text-xs text-gray-600 dark:text-gray-400">&copy; 2024 Acme Web3. All rights reserved.</p>
          <nav className="sm:ml-4 flex gap-4 sm:gap-6">
            <Link href="#" className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4" prefetch={false}>
              Terms of Service
            </Link>
            <Link href="#" className="text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:underline underline-offset-4" prefetch={false}>
              Privacy
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}