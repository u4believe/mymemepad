'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { intuitionTestnet } from '@/lib/web3'

// Extend Window interface for ethereum provider
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on?: (event: string, handler: (...args: any[]) => void) => void
      removeListener?: (event: string, handler: (...args: any[]) => void) => void
    }
  }
}

type WalletState = {
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  isCorrectNetwork: boolean
  connect: () => void
  disconnect: () => void
  switchToIntuition: () => Promise<void>
}

const WalletContext = createContext<WalletState | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)

  const isCorrectNetwork = chainId === intuitionTestnet.id

  const handleConnect = async () => {
    try {
      // Use the first available connector (usually MetaMask)
      if (connectors.length > 0) {
        await connect({ connector: connectors[0] })
        // After connection, switch to Intuition network
        setTimeout(() => {
          switchToIntuitionNetwork()
        }, 1000) // Small delay to ensure wallet is connected first
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const switchToIntuitionNetwork = async () => {
    if (!isConnected) return

    setIsSwitchingNetwork(true)
    try {
      await switchChain({ chainId: intuitionTestnet.id })
    } catch (error) {
      console.error('Failed to switch to Intuition network:', error)
      // If switch fails, try to add the network manually
      await addIntuitionNetwork()
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const addIntuitionNetwork = async () => {
    if (typeof window !== 'undefined' && !window.ethereum) return

    try {
      await window.ethereum!.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${intuitionTestnet.id.toString(16)}`,
          chainName: intuitionTestnet.name,
          nativeCurrency: intuitionTestnet.nativeCurrency,
          rpcUrls: intuitionTestnet.rpcUrls.default.http,
          blockExplorerUrls: [intuitionTestnet.blockExplorers.default.url],
        }],
      })
      // After adding network, try switching again
      await switchChain({ chainId: intuitionTestnet.id })
    } catch (error) {
      console.error('Failed to add Intuition network:', error)
    }
  }

  const switchToIntuition = async () => {
    await switchToIntuitionNetwork()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const value = {
    isConnected: !!isConnected,
    address,
    chainId,
    isCorrectNetwork,
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchToIntuition,
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