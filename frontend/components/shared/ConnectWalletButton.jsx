"use client";

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTranslation } from '@/hooks/useLanguage';

const baseButtonClasses =
  'w-full inline-flex items-center justify-center gap-2 font-semibold text-white rounded-lg border-0 shadow-lg hover:shadow-lime-500/25 transition-all duration-300 from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 bg-gradient-to-r text-xs px-3 py-1 sm:text-sm sm:px-4 sm:py-2 truncate';

export default function ConnectWalletButton({ className = '' }) {
  const { t } = useTranslation();

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && chain;
        const hasUnsupportedChain = connected && chain?.unsupported;

        if (!connected) {
          return (
            <div
              className={`${className}`.trim()}
              {...(!ready && {
                'aria-hidden': true,
                style: {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              <button
                type="button"
                onClick={openConnectModal}
                className={`${baseButtonClasses}`}
              >
                <span>{t('wallet.connectButton', 'Connect wallet')}</span>
              </button>
            </div>
          );
        }

        const handleClick = hasUnsupportedChain ? openChainModal : openAccountModal;
        const label = hasUnsupportedChain
          ? t('switchNetwork', 'Switch network')
          : account.displayName;

        return (
          <div className={`${className}`.trim()}>
            <button
              type="button"
              onClick={handleClick}
              className={`${baseButtonClasses}`}
            >
              <span>{label}</span>
              {!hasUnsupportedChain && account?.displayBalance ? (
                <span className="text-white/80 text-xs">{account.displayBalance}</span>
              ) : null}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
