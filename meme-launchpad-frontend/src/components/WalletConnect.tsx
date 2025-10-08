import React, { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected, walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors'

const WalletConnect: React.FC = () => {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  if (isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="hidden sm:inline">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <span className="sm:hidden">Connected</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
            <div className="p-3 border-b border-gray-700">
              <p className="text-sm text-gray-300">Connected as</p>
              <p className="text-xs text-gray-400 font-mono break-all">{address}</p>
            </div>
            <button
              onClick={() => {
                disconnect()
                setIsDropdownOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-medium text-white">Connect a wallet</h3>
          </div>

          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => {
                connect({ connector })
                setIsDropdownOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3"
            >
              <span>{connector.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default WalletConnect