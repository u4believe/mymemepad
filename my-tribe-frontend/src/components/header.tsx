'use client'

import Link from 'next/link'
import { Rocket, Wallet } from 'lucide-react'
import { Button } from './button'
import { useWallet } from './wallet-provider'

export function Header() {
  const { isConnected, address, connect } = useWallet()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg sm:inline-block">
            MyTribe
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Button asChild>
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Explore
            </Link>
          </Button>
          <Button asChild>
            <Link href="/create" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Create Token
            </Link>
          </Button>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <Button>
                <Wallet className="h-4 w-4 mr-2" />
                Connected
              </Button>
            </div>
          ) : (
            <Button onClick={connect}>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}