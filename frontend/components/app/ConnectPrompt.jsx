"use client";

import Image from 'next/image';
import ConnectWalletButton from '@/components/shared/ConnectWalletButton';

export default function ConnectPrompt() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6 py-10 gap-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-20 w-20">
          <Image
            src="/assets/miniapp-icon.png"
            alt="Livar logo"
            fill
            priority
            className="rounded-2xl shadow-lg"
          />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-semibold">Connect your wallet to continue</h1>
          <p className="text-sm text-gray-300">
            Livar uses your wallet to personalise campaigns, track premium access, and store encrypted documents.
          </p>
        </div>
      </div>
      <div className="bg-neutral-900/70 backdrop-blur rounded-2xl p-6 space-y-4 max-w-sm w-full border border-neutral-800">
        <p className="text-sm text-gray-200">
          Connectez-vous avec l’expérience Coinbase pour débloquer les campagnes premium, le stockage de documents et les analytics.
        </p>
        <div className="flex justify-center">
          <ConnectWalletButton />
        </div>
      </div>
    </div>
  );
}
