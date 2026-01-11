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
  title: 'Livar - onchain raises',
  description: 'decentralized financing of the future ',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Livar: Onchain Raises',
    description: 'decentralized financing of the future .',
    url: 'https://www.livarhub.xyz/app',
    siteName: 'Livar',
    images: [ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Livar: Onchain Raises',
    description: 'decentralized financing of the future .',
    images: [ogImage.url],
  },
};
