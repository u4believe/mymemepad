'use client'

import { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureClient, API_URL_LOCAL } from '@0xintuition/graphql'
import { config } from '@/lib/web3'
import { WalletProvider } from './wallet-provider'
import { Toaster } from './toaster'

// Configure GraphQL client for local development
configureClient({
  apiUrl: API_URL_LOCAL,
})

// Create a client
const queryClient = new QueryClient()

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <WalletProvider>
          {children}
          <Toaster />
        </WalletProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
