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
  other: {
    'base:app_id': '6965aa9863c956eb9fe7346c',
    // Farcaster Mini App Embed - NEW FORMAT (not fc:frame)
    'fc:miniapp': JSON.stringify({
      version: '1',
      imageUrl: 'https://www.livarhub.xyz/og.png',
      button: {
        title: 'Open Livar',
        action: {
          type: 'launch_miniapp',
          url: 'https://www.livarhub.xyz',
          name: 'Livar',
          splashImageUrl: 'https://www.livarhub.xyz/og.png',
          splashBackgroundColor: '#0a0a0a'
        }
      }
    }),
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

