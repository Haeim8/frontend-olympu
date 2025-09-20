"use client";

import { useCallback } from 'react';
import { Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import {
  ConnectWallet,
  ConnectWalletText,
  WalletModal,
  useWalletContext,
} from '@coinbase/onchainkit/wallet';

const gradientClasses =
  'inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 shadow-lg hover:shadow-lime-500/25 transition-all duration-300';

const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function ConnectWalletButton({ className = '' }) {
  const { address, status } = useAccount();
  const walletContext = useWalletContext?.();

  const isConnected = status === 'connected' && Boolean(address);
  const isLoading = status === 'connecting' || status === 'reconnecting';

  const openModal = useCallback(() => {
    walletContext?.setIsSubComponentClosing?.(false);
    walletContext?.setIsSubComponentOpen?.(false);
    walletContext?.setIsConnectModalOpen?.(true);
  }, [walletContext]);

  const closeModal = useCallback(() => {
    walletContext?.setIsConnectModalOpen?.(false);
    walletContext?.handleClose?.();
  }, [walletContext]);

  if (!walletContext) {
    return (
      <ConnectWallet className={`${gradientClasses} ${className}`.trim()}>
        <ConnectWalletText>
          {isConnected ? truncateAddress(address) : 'Connecter'}
        </ConnectWalletText>
      </ConnectWallet>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={`${gradientClasses} ${className}`.trim()}
        disabled={isLoading}
      >
        <span className="inline-flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          <span>{isConnected ? truncateAddress(address) : 'Connecter'}</span>
        </span>
      </button>

      <WalletModal
        isOpen={Boolean(walletContext.isConnectModalOpen)}
        onClose={closeModal}
      />
    </>
  );
}

export default ConnectWalletButton;
