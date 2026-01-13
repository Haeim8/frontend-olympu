//frontend/app/page.js
'use client';

import Head from 'next/head';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import Home from '@/components/landing';
import AppInterface from '@/components/app-interface';

export default function Page() {
  const { address } = useAccount();
  const [showInterface, setShowInterface] = useState(false);



  return (
    <>
      <Head>
        <meta name="base:app_id" content="6965aa9863c956eb9fe7346c" />
      </Head>
      <div className="min-h-screen bg-background">
      {(showInterface || address) ? (
        <AppInterface />
      ) : (
        <Home
          onAccessInterface={() => setShowInterface(true)}
        />
      )}
      </div>
    </>
  );
}