import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { metadata as siteMetadata } from './metadata.js';
import ClientProviders from './ClientProviders';
import EnvironmentDebug from '@/components/debug/EnvironmentDebug';
import "@/app/globals.css";
import '@coinbase/onchainkit/styles.css';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = siteMetadata;

export default function RootLayout({ children }) {

  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <ClientProviders>
          {children}
          <EnvironmentDebug />
        </ClientProviders>
      </body>
    </html>
  );
}
