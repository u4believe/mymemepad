import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { contractService } from '../utils/contracts'
import { CreateTokenForm } from '../types'

const TokenCreation: React.FC = () => {
  const [form, setForm] = useState<CreateTokenForm>({
    name: '',
    symbol: '',
    maxSupply: '',
  })

  const queryClient = useQueryClient()

  const createTokenMutation = useMutation({
    mutationFn: async (data: CreateTokenForm) => {
      return await contractService.createMemeToken(
        data.name,
        data.symbol,
        data.maxSupply
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] })
      setForm({ name: '', symbol: '', maxSupply: '' })
      alert('Token created successfully!')
    },
    onError: (error) => {
      console.error('Error creating token:', error)
      alert('Failed to create token. Please try again.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.symbol || !form.maxSupply) {
      alert('Please fill in all fields')
      return
    }

    // Validate max supply range (1M to 1B)
    const supply = parseInt(form.maxSupply)
    if (supply < 1_000_000 || supply > 1_000_000_000) {
      alert('Max supply must be between 1,000,000 and 1,000,000,000')
      return
    }

    createTokenMutation.mutate(form)
  }

  const handleInputChange = (field: keyof CreateTokenForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-2">Create Meme Token</h2>
        <p className="text-gray-400 mb-8">
          Launch your own meme token with a bonding curve pricing mechanism
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Token Name
            </label>
            <input
              type="text"
              id="name"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Pepe Token"
              required
            />
          </div>

          {/* Token Symbol */}
          <div>
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-300 mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              id="symbol"
              value={form.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., PEPE"
              maxLength={10}
              required
            />
          </div>

          {/* Max Supply */}
          <div>
            <label htmlFor="maxSupply" className="block text-sm font-medium text-gray-300 mb-2">
              Max Supply
            </label>
            <input
              type="number"
              id="maxSupply"
              value={form.maxSupply}
              onChange={(e) => handleInputChange('maxSupply', e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="1000000"
              min="1000000"
              max="1000000000"
              required
            />
            <p className="text-sm text-gray-400 mt-1">
              Supply must be between 1,000,000 and 1,000,000,000 tokens
            </p>
          </div>

          {/* Creation Fee Notice */}
          <div className="bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-purple-400">ℹ️</div>
              <div>
                <h4 className="text-sm font-medium text-purple-300">Creation Fee</h4>
                <p className="text-sm text-purple-200">
                  Creating a token requires 10 $TRUST tokens as a creation fee.
                  Make sure your wallet has sufficient $TRUST balance.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={createTokenMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            {createTokenMutation.isPending ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Token...</span>
              </div>
            ) : (
              '🚀 Create Meme Token'
            )}
          </button>
        </form>

        {/* Token Preview */}
        {form.name && form.symbol && (
          <div className="mt-8 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Token Preview</h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-400">Name:</span> {form.name}</p>
              <p><span className="text-gray-400">Symbol:</span> {form.symbol}</p>
              <p><span className="text-gray-400">Max Supply:</span> {form.maxSupply ? parseInt(form.maxSupply).toLocaleString() : '0'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TokenCreation