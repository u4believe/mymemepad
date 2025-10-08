import React, { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected, walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors'
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">Meme Launchpad</h1>
          <p className="text-gray-300 mb-8">Connect your wallet to start creating and trading meme tokens</p>
          <WalletConnect />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black bg-opacity-50 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Meme Launchpad</h1>
              <div className="hidden md:flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-purple-800'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <WalletConnect />
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden flex space-x-1 pb-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-purple-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'create' && <TokenCreation />}
        {activeTab === 'discover' && <TokenDiscovery />}
        {activeTab === 'trade' && <TradingInterface />}
        {activeTab === 'migrate' && <MigrationInterface />}
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 backdrop-blur-md border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-400">
            <p>Built on Intuition Testnet | Contract addresses available on{' '}
              <a
                href="https://intuition-testnet.explorer.caldera.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                Explorer
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default MemeLaunchpad