"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';

const wrapperClasses =
  '[&>div>button]:bg-gradient-to-r [&>div>button]:from-lime-500 [&>div>button]:to-green-500 [&>div>button]:border-0 [&>div>button]:shadow-lg [&>div>button]:hover:shadow-lime-500/25 [&>div>button]:transition-all [&>div>button]:duration-300 [&>div>button]:hover:from-lime-600 [&>div>button]:hover:to-green-600 [&>div>button]:text-xs [&>div>button]:px-3 [&>div>button]:py-1 sm:[&>div>button]:text-sm sm:[&>div>button]:px-4 sm:[&>div>button]:py-2 [&>div>button]:truncate [&>div>button]:max-w-[140px] sm:[&>div>button]:max-w-none';

export default function ConnectWalletButton({ className = '' }) {
  return (
    <div className={`${wrapperClasses} ${className}`.trim()}>
      <ConnectButton />
    </div>
  );
}
