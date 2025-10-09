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
          className="btn-primary flex items-center space-x-2"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '0.75rem 1.5rem',
            color: 'white',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="hidden sm:inline text-glow">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <span className="sm:hidden text-glow">Connected</span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 glass-card z-50" style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px'
          }}>
            <div className="p-3 border-b border-gray-600" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <p className="text-sm text-gray-300">Connected as</p>
              <p className="text-xs text-gray-400 font-mono break-all">{address}</p>
            </div>
            <button
              onClick={() => {
                disconnect()
                setIsDropdownOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
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
        className="btn-primary"
        disabled={isPending}
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-card z-50">
          <div className="p-3 border-b border-gray-600" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-sm font-medium text-white">Connect a wallet</h3>
          </div>

          {connectors.map((connector) => (
            <button
              key={connector.id}
              onClick={() => {
                connect({ connector })
                setIsDropdownOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center space-x-3"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
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