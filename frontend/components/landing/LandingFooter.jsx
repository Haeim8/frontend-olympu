"use client";

import { MessageCircle } from "lucide-react";
import Image from "next/image";

export function LandingFooter() {
  return (
    <footer className="relative z-10 bg-white/5 dark:bg-gray-900/20 backdrop-blur-lg border-t border-white/10 dark:border-gray-700/20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Livar"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
              Livar
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            <a
              href="https://x.com/0xlivar"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-400 hover:text-lime-400 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://warpcast.com/livarhub"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-400 hover:text-lime-400 transition-colors"
            >
              <MessageCircle size={20} />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500">
            © 2025 Livar
          </div>
        </div>
      </div>
    </footer>
  );
}