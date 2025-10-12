'use client'

import Link from 'next/link'
import { Rocket, Wallet } from 'lucide-react'
import { Button } from './button'
import { useWallet } from './wallet-provider'

export function Header() {
  const { isConnected, address, connect } = useWallet()

  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2 rounded-lg bg-primary group-hover:scale-110 transition-transform duration-200">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground group-hover:scale-105 transition-transform duration-200">
            MyTribe
          </span>
        </Link>
        <nav className="header-nav">
          <Button asChild className="header-nav-button">
            <Link href="/explore" className="flex items-center gap-2">
              🔍 Explore
            </Link>
          </Button>
          <Button asChild className="header-nav-button">
            <Link href="/create" className="flex items-center gap-2">
              🚀 Create Token
            </Link>
          </Button>
          <Button asChild className="header-nav-button">
            <Link href="/trade" className="flex items-center gap-2">
              💱 Trade Tokens
            </Link>
          </Button>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {isConnected ? (
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                <span className="text-sm text-primary font-medium">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Wallet className="h-4 w-4 mr-2" />
                Connected
              </Button>
            </div>
          ) : (
            <Button onClick={connect} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}