'use client'

import { useWallet } from '@/components/wallet-provider'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const { isConnected, address } = useWallet()

  // Debug logging
  console.log('Wallet connection status:', { isConnected, address })

  if (!isConnected) {
    return (
      <div className="hero-section w-full">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="hero-content text-center">
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
            <div className="flex gap-6 flex-col sm:flex-row justify-center items-center mt-8">
              <Button asChild className="btn-primary px-8 py-4 text-lg">
                <Link href="/create">
                  🚀 Launch Your Token
                </Link>
              </Button>
              <Button asChild className="px-8 py-4 text-lg">
                <Link href="/explore">
                  🔍 Explore Tokens
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Connected wallet view - Clean Network Dashboard
  return (
    <div className="w-full">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pt-8">

        {/* Featured Event Section */}
        <div className="featured-event mb-8">
          <h2 className="text-3xl font-bold mb-2 text-white">INTUITION NETWORK is live</h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Join the network. Explore decentralized applications and connect with developers.
          </p>
          <Button className="px-8 py-3 text-lg">
            Explore Network
          </Button>
        </div>

        {/* Projects Bonding Section */}
        <div className="mb-8">
          <div className="section-header">
            <div className="flex items-center gap-3">
              <div className="section-icon">B</div>
              <div>
                <h3 className="text-xl font-semibold gradient-text">Projects Bonding</h3>
                <p className="text-sm text-muted-foreground">Applications ready for mainnet deployment</p>
              </div>
            </div>
            <Button variant="outline" className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10">
              Launch Ready
            </Button>
          </div>

          {/* Token Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[
              { name: 'IntuitionCore', symbol: 'CORE', progress: 68, marketCap: '12.5k', change: 0.157893, image: '🔷' },
              { name: 'NetworkNode', symbol: 'NODE', progress: 45, marketCap: '8.3k', change: -0.023451, image: '🔗' },
              { name: 'DevProtocol', symbol: 'DEVP', progress: 32, marketCap: '5.9k', change: 0.089123, image: '⚛️' },
              { name: 'BlockSync', symbol: 'SYNC', progress: 78, marketCap: '15.2k', change: 0.234567, image: '🔄' },
              { name: 'ChainLink', symbol: 'LINK', progress: 56, marketCap: '9.8k', change: 0.045678, image: '🌐' }
            ].map((token, index) => (
              <div key={index} className="token-card">
                <div className="text-center">
                  <div className="text-3xl mb-3">{token.image}</div>
                  <h4 className="font-semibold text-sm mb-1">{token.name}</h4>
                  <p className="text-xs text-cyan-400 mb-3">{token.symbol}</p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">{token.progress}% to bonding</span>
                      <span className="text-xs text-cyan-400">{100 - token.progress}% left</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${token.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-sm font-semibold mb-2">${token.marketCap} market cap</div>

                  <div className={`text-xs flex items-center justify-center gap-1 ${
                    token.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    <span>{token.change >= 0 ? '↗' : '↘'}</span>
                    <span>{Math.abs(token.change).toFixed(8)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Projects Section */}
        <div className="mb-8">
          <div className="section-header">
            <div className="flex items-center gap-3">
              <div className="section-icon">🆕</div>
              <div>
                <h3 className="text-xl font-semibold gradient-text">Latest Projects</h3>
                <p className="text-sm text-muted-foreground">Recently deployed applications and tools</p>
              </div>
            </div>
            <Button variant="outline" className="text-cyan-400 border-cyan-400 hover:bg-cyan-400/10">
              View All
            </Button>
          </div>

          {/* Newest Project Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[
              { name: 'DevStudio', symbol: 'DEV', change: 0.186350798, image: '💻' },
              { name: 'ChainBuilder', symbol: 'CHAIN', change: 0.16351492, image: '🔨' },
              { name: 'Web3Tools', symbol: 'WEB3', change: 0.22633507, image: '🛠️' },
              { name: 'NodeRunner', symbol: 'NODE', change: 0.353790093, image: '🏃' },
              { name: 'SmartContract', symbol: 'SC', change: 0.098765432, image: '📄' }
            ].map((token, index) => (
              <div key={index} className="token-card p-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">{token.image}</div>
                  <h4 className="font-medium text-sm mb-1">{token.name}</h4>
                  <p className="text-xs text-cyan-400 mb-2">{token.symbol}</p>
                  <div className={`text-sm font-semibold ${token.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {token.change >= 0 ? '+' : ''}{token.change.toFixed(8)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}