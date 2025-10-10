'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance } from 'wagmi'
import { createWeb3Modal } from '@web3modal/wagmi'
import { config } from '@/lib/web3'

// Create Web3Modal instance
const modal = createWeb3Modal({
  wagmiConfig: config,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  enableAnalytics: true,
  enableOnramp: true,
})

type WalletState = {
  isConnected: boolean
  address: string | undefined
  balance: number
  connect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletState | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({
    address: address,
  })

  const handleConnect = () => {
    modal.open()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const value = {
    isConnected: !!isConnected,
    address,
    balance: balance ? Number(balance.formatted) : 0,
    connect: handleConnect,
    disconnect: handleDisconnect,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}