import Link from "next/link";
import { Button } from "@/components/ui/button";

function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <MountainIcon className="h-6 w-6" />
          <span className="sr-only">Acme Web3</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
            <div className="space-y-4 relative z-10">
              <div className="inline-block rounded-lg bg-[#1652F0] px-3 py-1 text-sm animate-pulse">
                Defi Crowdfunding 
              </div>
              <h1 className="text-3xl font-bold tracking-tighter md:text-4xl/tight animate-bounce">
                Support the future of the internet.
              </h1>
              <p className="max-w-[600px] text-[#1652F0] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Contribute to the development of cutting-edge Web3 technologies and be a part of the decentralized revolution.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  variant="outline"
                  className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium shadow-sm transition-colors hover:bg-[#1652F0] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  Connect Wallet
                </Button>
                <Button
                  variant="outline"
                  className="inline-flex h-10 items-center justify-center rounded-md px-8 text-sm font-medium shadow-sm transition-colors hover:bg-[#1652F0] hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  Create Account
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Acme Web3. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

// MountainIcon should stay the same
function MountainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round">
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

export default Home; // Export as default
