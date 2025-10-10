'use client'

import { useWallet } from '@/components/wallet-provider'
import { Button } from '@/components/button'
import Link from 'next/link'

export default function Home() {
  const { isConnected } = useWallet()

  if (!isConnected) {
    return (
      <div className="hero-section">
        <div className="hero-content">
          <div className="section-title">MY TRIBE MEME LAUNCHPAD</div>
          <h1 className="hero-title">
            Create. Trade. Migrate.<br />
            Your Meme Empire.
          </h1>
          <p className="subtitle">
            Launch your own meme tokens with bonding curve mechanics.
            Trade tokens as they grow, and migrate to DEX when ready.
            Join the tribe of meme creators and traders.
          </p>
          <div className="flex gap-4 flex-col sm:flex-row">
            <Button asChild className="btn-primary">
              <Link href="/create">
                🚀 Launch Your Token
              </Link>
            </Button>
            <Button asChild>
              <Link href="/explore">
                🔍 Explore Tokens
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hero-section">
      <div style={{ paddingTop: '100px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="glass-card mb-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Welcome to MyTribe Launchpad</h2>
            <p className="text-muted-foreground mb-6">
              Choose what you'd like to do with your meme tokens
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/create" className="glass-card hover:bg-white/10 transition-all duration-200">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-semibold mb-2">Create Token</h3>
                <p className="text-sm text-muted-foreground">
                  Launch your own meme token with automated bonding curve pricing
                </p>
              </div>
            </Link>

            <Link href="/explore" className="glass-card hover:bg-white/10 transition-all duration-200">
              <div className="text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">Explore Tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Discover trending meme tokens and view their statistics
                </p>
              </div>
            </Link>

            <Link href="/trade" className="glass-card hover:bg-white/10 transition-all duration-200">
              <div className="text-center">
                <div className="text-4xl mb-4">💱</div>
                <h3 className="text-xl font-semibold mb-2">Trade Tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Buy and sell tokens using the bonding curve mechanism
                </p>
              </div>
            </Link>
          </div>

          {/* Stats Section */}
          <div className="glass-card mt-8">
            <h3 className="text-xl font-semibold mb-4 text-center">Platform Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Total Tokens</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">0 ETH</div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Active Traders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-sm text-muted-foreground">Migrated Tokens</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
