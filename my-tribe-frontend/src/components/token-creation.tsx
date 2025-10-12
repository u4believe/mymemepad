'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from './input'
import { useContractInteractions } from '../lib/contracts'
import { useAccount, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'

export function TokenCreation() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const contractInteractions = useContractInteractions()

  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    maxSupply: '',
    description: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string>('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCreateToken = async () => {
    if (!isConnected || !walletClient) {
      alert('Please connect your wallet first')
      return
    }

    setIsLoading(true)
    try {
      const maxSupply = BigInt(formData.maxSupply)

      // Validate max supply range (1M to 1B)
      if (maxSupply < BigInt(1_000_000) || maxSupply > BigInt(1_000_000_000)) {
        throw new Error('Max supply must be between 1M and 1B tokens')
      }

      console.log('Creating token:', formData)

      // Create the meme token using the factory
      const hash = await contractInteractions.createMemeToken(
        formData.name,
        formData.symbol,
        maxSupply
      )

      setTxHash(hash)
      console.log('Token created successfully! Transaction hash:', hash)

      // Reset form
      setFormData({
        name: '',
        symbol: '',
        maxSupply: '',
        description: '',
      })

      alert(`Token created successfully! Transaction hash: ${hash}`)
    } catch (error: any) {
      console.error('Error creating token:', error)
      alert(`Error: ${error.message || 'Failed to create token'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Create Your Meme Token</h2>
        <p className="text-muted-foreground">
          Launch your own meme token with automated bonding curve pricing and migration capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token Name</label>
            <Input
              placeholder="e.g. My Awesome Token"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Token Symbol</label>
            <Input
              placeholder="e.g. MAT"
              value={formData.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value)}
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Max Supply</label>
            <Input
              type="number"
              placeholder="1000000000"
              value={formData.maxSupply}
              onChange={(e) => handleInputChange('maxSupply', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be between 1M and 1B tokens
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              className="w-full h-24 px-3 py-2 bg-background/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe your meme token..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Token Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 0.1% creator allocation locked for 365 days</li>
              <li>• Automated bonding curve pricing</li>
              <li>• Migration to DEX at 10M market cap</li>
              <li>• 1% fee on all trades</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center pt-6 space-y-4">
        <Button
          onClick={handleCreateToken}
          disabled={isLoading || !isConnected || !formData.name || !formData.symbol || !formData.maxSupply}
          className="px-8 py-3 text-lg"
        >
          {isLoading ? 'Creating Token...' : '🚀 Create Token'}
        </Button>

        {!isConnected && (
          <p className="text-sm text-muted-foreground text-center">
            Please connect your wallet to create a token
          </p>
        )}

        {txHash && (
          <div className="text-center">
            <p className="text-sm text-green-600 mb-2">Token created successfully!</p>
            <a
              href={`https://intuition-testnet.explorer.caldera.xyz/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View transaction on explorer
            </a>
          </div>
        )}
      </div>
    </div>
  )
}