import React from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './config/web3'
import MemeLaunchpad from './components/MemeLaunchpad'
import './App.css'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <MemeLaunchpad />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
