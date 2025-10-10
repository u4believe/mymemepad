import React, { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import TokenCreation from './TokenCreation'
import TokenDiscovery from './TokenDiscovery'
import TradingInterface from './TradingInterface'
import MigrationInterface from './MigrationInterface'
import WalletConnect from './WalletConnect'

type TabType = 'create' | 'discover' | 'trade' | 'migrate'

const MemeLaunchpad: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('discover')
  const { address, isConnected } = useAccount()

  const tabs = [
    { id: 'discover' as TabType, label: 'Discover Tokens', icon: '🔍' },
    { id: 'create' as TabType, label: 'Create Token', icon: '🚀' },
    { id: 'trade' as TabType, label: 'Trade', icon: '💱' },
    { id: 'migrate' as TabType, label: 'Migrate', icon: '⬆️' },
  ]

  // Particles disabled for cleaner background

  if (!isConnected) {
    return (
      <div className="hero-section">

        {/* Modern Header */}
        <header className="modern-header">
          <div className="header-content">
            <div className="header-left">
              <input
                type="text"
                placeholder="Search Intuition"
                className="search-bar"
              />
            </div>
            <div className="header-right">
              <WalletConnect />
            </div>
          </div>
        </header>

        {/* Hero Content */}
        <div className="hero-content">
          <div className="section-title">DECENTRALIZED KNOWLEDGE NETWORK</div>
          <h1 className="hero-title">
            Your Knowledge.<br />
            Your Intuition.
          </h1>
          <p className="subtitle">
            Your Intuition grows with you. The more you contribute, explore,
            and invest, the more personalized, powerful, and rewarding your
            experience becomes.
          </p>
          <button className="btn-primary">
            🚀 Create Your Intuition
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="hero-section">

      {/* Modern Header */}
      <header className="modern-header">
        <div className="header-content">
          <div className="header-left">
            <input
              type="text"
              placeholder="Search Intuition"
              className="search-bar"
            />
          </div>
          <div className="header-right">
            <img
              src="/newtribe.jpg"
              alt="Tribe Logo"
              className="logo-image"
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                marginRight: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 0 20px rgba(255, 255, 255, 0.2)'
              }}
            />
            <span className="text-glow text-sm">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ paddingTop: '100px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="glass-card mb-8">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="glass-card">
            {activeTab === 'create' && <TokenCreation />}
            {activeTab === 'discover' && <TokenDiscovery />}
            {activeTab === 'trade' && <TradingInterface />}
            {activeTab === 'migrate' && <MigrationInterface />}
          </div>

          {/* Footer */}
          <footer className="mt-16 py-8 text-center">
            <p className="text-gray-400">
              Built on Intuition Testnet | Contract addresses available on{' '}
              <a
                href="https://intuition-testnet.explorer.caldera.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Explorer
              </a>
            </p>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default MemeLaunchpad