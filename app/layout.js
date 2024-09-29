import RainbowKitAndWagmiProvider from "./RainbowKitAndWagmiProvider"
import "@/app/globals.css"
import { Inter as FontSans } from "next/font/google" 
import { cn } from "@/lib/utils"
import { UserProvider } from "@/components/shared/UserContext"; // Importer UserProvider

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})
export const metadata = {
  title: "CryptoComfort",
  description: "Crowdfunding pour projets Web3",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <UserProvider>
          <RainbowKitAndWagmiProvider> 
            { children } 
          </RainbowKitAndWagmiProvider>
        </UserProvider>
      </body>
    </html>
  );
}
