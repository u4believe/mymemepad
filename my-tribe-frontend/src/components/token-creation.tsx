'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from './button'
import { Input } from './input'
import { useToast } from '@/hooks/use-toast'
import { CONTRACT_ADDRESSES, MEME_LAUNCHPAD_FACTORY_ABI } from '@/lib/web3'

export function TokenCreation() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    maxSupply: '',
    description: '',
  })
  const [tokenImage, setTokenImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        })
        return
      }

      setTokenImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setTokenImage(null)
    setImagePreview(null)
  }

  // Contract write hook for token creation
  const { writeContract: createToken, data: hash, isPending, error: writeError } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({
    hash,
  })

  const handleCreateToken = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a token.",
        variant: "destructive",
      })
      return
    }

    if (!formData.name || !formData.symbol || !formData.maxSupply) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const maxSupply = parseInt(formData.maxSupply)
    if (maxSupply < 1000000 || maxSupply > 1000000000) {
      toast({
        title: "Invalid supply range",
        description: "Max supply must be between 1M and 1B tokens.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await createToken({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: MEME_LAUNCHPAD_FACTORY_ABI,
        functionName: 'createMemeToken',
        args: [formData.name, formData.symbol, BigInt(maxSupply)],
      })
    } catch (error) {
      console.error('Error creating token:', error)
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to create token. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Handle successful transaction
  if (isConfirmed) {
    toast({
      title: "Token created successfully! 🎉",
      description: `Your meme token "${formData.name}" has been deployed to the blockchain.`,
    })

    // Reset form
    setFormData({
      name: '',
      symbol: '',
      maxSupply: '',
      description: '',
    })
    setTokenImage(null)
    setImagePreview(null)
    setIsLoading(false)
  }

  // Handle transaction error
  if (confirmError) {
    toast({
      title: "Transaction failed",
      description: confirmError.message || "Failed to confirm transaction. Please try again.",
      variant: "destructive",
    })
    setIsLoading(false)
  }

  return (
    <div className="space-y-8 w-full max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-foreground">Create Your Meme Token</h2>
        <p className="text-lg text-muted-foreground">
          Launch your own meme token with automated bonding curve pricing and migration capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Token Image</label>
            <div className="space-y-3">
              {!imagePreview ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="token-image"
                  />
                  <label
                    htmlFor="token-image"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🖼️</div>
                      <div className="text-sm text-muted-foreground">Click to upload image</div>
                      <div className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Token preview"
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-destructive/90"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

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
              className="w-full h-32 px-3 py-2 bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe your meme token..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          </div>

          <div className="bg-card border border-border p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-primary text-sm">Token Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 0.1% creator allocation locked for 365 days</li>
              <li>• Automated bonding curve pricing</li>
              <li>• Migration to DEX at 10M market cap</li>
              <li>• 1% fee on all trades</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-6">
        <Button
          onClick={handleCreateToken}
          disabled={isLoading || isPending || !isConnected || !formData.name || !formData.symbol || !formData.maxSupply}
          className="px-8 py-3 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading || isPending
            ? 'Creating Token...'
            : isConfirming
            ? 'Confirming Transaction...'
            : !isConnected
            ? 'Connect Wallet to Create'
            : '🚀 Create Token'}
        </Button>
      </div>
    </div>
  )
}