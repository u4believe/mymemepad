import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { contractService } from '../utils/contracts'
import { TradeForm } from '../types'

interface TradingInterfaceProps {
  tokenAddress?: string
  bondingCurveAddress?: string
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({
  tokenAddress,
  bondingCurveAddress
}) => {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [buyForm, setBuyForm] = useState<TradeForm>({ tokenAmount: '' })
  const [sellForm, setSellForm] = useState<TradeForm>({ tokenAmount: '' })

  // Get current price
  const { data: currentPrice, isLoading: priceLoading } = useQuery({
    queryKey: ['currentPrice', bondingCurveAddress],
    queryFn: () => contractService.getCurrentPrice(bondingCurveAddress!),
    enabled: !!bondingCurveAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  })

  // Get token info
  const { data: tokenInfo } = useQuery({
    queryKey: ['tokenInfo', tokenAddress],
    queryFn: () => contractService.getTokenInfo(tokenAddress!),
    enabled: !!tokenAddress,
  })

  // Get market cap
  const { data: marketCap } = useQuery({
    queryKey: ['marketCap', bondingCurveAddress],
    queryFn: () => contractService.getCurrentMarketCap(bondingCurveAddress!),
    enabled: !!bondingCurveAddress,
    refetchInterval: 10000,
  })

  // Get migration status
  const { data: shouldMigrateBool } = useQuery({
    queryKey: ['shouldMigrate', bondingCurveAddress],
    queryFn: () => contractService.shouldMigrate(bondingCurveAddress!),
    enabled: !!bondingCurveAddress,
    refetchInterval: 10000,
  })

  const buyMutation = useMutation({
    mutationFn: async (data: TradeForm) => {
      if (!bondingCurveAddress) throw new Error('No bonding curve address')
      const minTrustRequired = '0' // For simplicity, we'll use 0 for now
      return await contractService.buyTokens(
        bondingCurveAddress,
        data.tokenAmount,
        minTrustRequired
      )
    },
    onSuccess: () => {
      setBuyForm({ tokenAmount: '' })
      alert('Purchase successful!')
    },
    onError: (error) => {
      console.error('Error buying tokens:', error)
      alert('Failed to buy tokens. Please try again.')
    },
  })

  const sellMutation = useMutation({
    mutationFn: async (data: TradeForm) => {
      if (!bondingCurveAddress) throw new Error('No bonding curve address')
      const minTrustRequired = '0' // For simplicity, we'll use 0 for now
      return await contractService.sellTokens(
        bondingCurveAddress,
        data.tokenAmount,
        minTrustRequired
      )
    },
    onSuccess: () => {
      setSellForm({ tokenAmount: '' })
      alert('Sale successful!')
    },
    onError: (error) => {
      console.error('Error selling tokens:', error)
      alert('Failed to sell tokens. Please try again.')
    },
  })

  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyForm.tokenAmount || parseFloat(buyForm.tokenAmount) <= 0) {
      alert('Please enter a valid token amount')
      return
    }
    buyMutation.mutate(buyForm)
  }

  const handleSellSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellForm.tokenAmount || parseFloat(sellForm.tokenAmount) <= 0) {
      alert('Please enter a valid token amount')
      return
    }
    sellMutation.mutate(sellForm)
  }

  const calculateBuyPrice = async () => {
    if (!buyForm.tokenAmount || !bondingCurveAddress) return '0'
    try {
      return await contractService.calculatePurchasePrice(bondingCurveAddress, buyForm.tokenAmount)
    } catch (error) {
      return '0'
    }
  }

  const calculateSellPrice = async () => {
    if (!sellForm.tokenAmount || !bondingCurveAddress) return '0'
    try {
      return await contractService.calculateSalePrice(bondingCurveAddress, sellForm.tokenAmount)
    } catch (error) {
      return '0'
    }
  }

  if (!tokenAddress || !bondingCurveAddress) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Please select a token to start trading</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Token Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {tokenInfo?.name} ({tokenInfo?.symbol})
            </h2>
            <p className="text-gray-400 text-sm font-mono">
              {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Current Price</p>
            <p className="text-2xl font-bold text-green-400">
              {priceLoading ? '...' : `$${currentPrice || '0'} $TRUST`}
            </p>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Market Cap</p>
            <p className="text-lg font-semibold text-white">
              ${marketCap ? parseFloat(marketCap).toLocaleString() : '0'}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Migration Status</p>
            <p className={`text-lg font-semibold ${shouldMigrateBool ? 'text-green-400' : 'text-blue-400'}`}>
              {shouldMigrateBool ? 'Ready for DEX' : 'Bonding Curve'}
            </p>
          </div>
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Your Balance</p>
            <p className="text-lg font-semibold text-white">-</p>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy Tab */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Buy Tokens
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'sell'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              Sell Tokens
            </button>
          </div>

          {activeTab === 'buy' ? (
            <form onSubmit={handleBuySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={buyForm.tokenAmount}
                  onChange={(e) => setBuyForm({ tokenAmount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Estimated Cost:</span>
                  <span className="text-white font-medium">
                    {buyForm.tokenAmount ? `${buyForm.tokenAmount} ${tokenInfo?.symbol}` : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">$TRUST Required:</span>
                  <span className="text-green-400 font-medium">-</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={buyMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {buyMutation.isPending ? 'Buying...' : `Buy ${tokenInfo?.symbol}`}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSellSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={sellForm.tokenAmount}
                  onChange={(e) => setSellForm({ tokenAmount: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">You will receive:</span>
                  <span className="text-white font-medium">
                    {sellForm.tokenAmount ? `${sellForm.tokenAmount} ${tokenInfo?.symbol}` : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">$TRUST to Receive:</span>
                  <span className="text-red-400 font-medium">-</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={sellMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {sellMutation.isPending ? 'Selling...' : `Sell ${tokenInfo?.symbol}`}
              </button>
            </form>
          )}
        </div>

        {/* Price Chart / Info */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Price Information</h3>

          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Price:</span>
              <span className="text-white font-medium">
                ${currentPrice || '0'} $TRUST
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Market Cap:</span>
              <span className="text-white font-medium">
                ${marketCap ? parseFloat(marketCap).toLocaleString() : '0'}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Migration Threshold:</span>
              <span className="text-white font-medium">$10M $TRUST</span>
            </div>

            {shouldMigrateBool && (
              <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-green-400">🚀</div>
                  <div>
                    <p className="text-green-300 font-medium">Ready for Migration!</p>
                    <p className="text-green-200 text-sm">
                      This token has reached the market cap threshold and can be migrated to DEX.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-blue-400">ℹ️</div>
                <div>
                  <p className="text-blue-300 font-medium">Bonding Curve</p>
                  <p className="text-blue-200 text-sm">
                    Token price increases as more tokens are purchased and decreases when tokens are sold.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TradingInterface