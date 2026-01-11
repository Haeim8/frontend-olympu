const ogImage = {
  url: 'https://www.livarhub.xyz/og.png',
  width: 1200,
  height: 630,
  alt: 'Livar - Decentralized Finance',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'Livar - Financement Participatif DeFi',
  description: 'Plateforme décentralisée de financement participatif pour les startups Web3',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Livar: Onchain Raises',
    description: 'Back tokenized campaigns and track growth with transparent Base analytics.',
    url: 'https://www.livarhub.xyz/app',
    siteName: 'Livar',
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Livar: Onchain Raises',
    description: 'Back tokenized campaigns and track growth with transparent Base analytics.',
    images: [ogImage.url],
  },
};
