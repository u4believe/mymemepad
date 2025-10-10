import React, { useState, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { Contract, formatEther } from 'ethers'
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
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [buyForm, setBuyForm] = useState<TradeForm>({ tokenAmount: '' })
  const [sellForm, setSellForm] = useState<TradeForm>({ tokenAmount: '' })
  const [buyPrice, setBuyPrice] = useState<string>('0')
  const [sellPrice, setSellPrice] = useState<string>('0')

  // Calculate prices in real-time
  useEffect(() => {
    const updateBuyPrice = async () => {
      if (buyForm.tokenAmount && parseFloat(buyForm.tokenAmount) > 0 && bondingCurveAddress) {
        try {
          const price = await contractService.calculatePurchasePrice(bondingCurveAddress, buyForm.tokenAmount)
          setBuyPrice(price)
        } catch (error) {
          console.error('Error calculating buy price:', error)
          setBuyPrice('0')
        }
      } else {
        setBuyPrice('0')
      }
    }
    updateBuyPrice()
  }, [buyForm.tokenAmount, bondingCurveAddress])

  useEffect(() => {
    const updateSellPrice = async () => {
      if (sellForm.tokenAmount && parseFloat(sellForm.tokenAmount) > 0 && bondingCurveAddress) {
        try {
          const price = await contractService.calculateSalePrice(bondingCurveAddress, sellForm.tokenAmount)
          setSellPrice(price)
        } catch (error) {
          console.error('Error calculating sell price:', error)
          setSellPrice('0')
        }
      } else {
        setSellPrice('0')
      }
    }
    updateSellPrice()
  }, [sellForm.tokenAmount, bondingCurveAddress])

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

  // Check if current user is the creator
  const { data: isCreator } = useQuery({
    queryKey: ['isCreator', tokenAddress, address],
    queryFn: async () => {
      if (!tokenAddress || !address) return false
      const tokenContract = new Contract(tokenAddress, [
        'function creator() external view returns (address)',
      ], await contractService.getProvider())
      const creatorAddress = await tokenContract.creator()
      return creatorAddress.toLowerCase() === address.toLowerCase()
    },
    enabled: !!tokenAddress && !!address,
  })

  // Get creator allocation info
  const { data: creatorAllocationInfo } = useQuery({
    queryKey: ['creatorAllocation', tokenAddress],
    queryFn: async () => {
      if (!tokenAddress) return null
      const tokenContract = new Contract(tokenAddress, [
        'function creatorAllocation() external view returns (uint256)',
        'function creatorAllocationClaimed() external view returns (bool)',
        'function canClaimCreatorAllocation() external view returns (bool)',
        'function getCreatorLockTimeRemaining() external view returns (uint256)',
      ], await contractService.getProvider())

      const [allocation, claimed, canClaim, timeRemaining] = await Promise.all([
        tokenContract.creatorAllocation(),
        tokenContract.creatorAllocationClaimed(),
        tokenContract.canClaimCreatorAllocation(),
        tokenContract.getCreatorLockTimeRemaining(),
      ])

      return {
        allocation: formatEther(allocation),
        claimed,
        canClaim,
        timeRemaining: Number(timeRemaining),
      }
    },
    enabled: !!tokenAddress && !!isCreator,
    refetchInterval: 30000, // Check every 30 seconds
  })

  const buyMutation = useMutation({
    mutationFn: async (data: TradeForm) => {
      if (!bondingCurveAddress) throw new Error('No bonding curve address')

      // Calculate expected price with 1% slippage protection
      const expectedPrice = await contractService.calculatePurchasePrice(bondingCurveAddress, data.tokenAmount)
      const minTrustRequired = (parseFloat(expectedPrice) * 0.99).toString() // 1% slippage

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

      // Calculate expected price with 1% slippage protection
      const expectedPrice = await contractService.calculateSalePrice(bondingCurveAddress, data.tokenAmount)
      const minTrustRequired = (parseFloat(expectedPrice) * 0.99).toString() // 1% slippage

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

  const claimAllocationMutation = useMutation({
    mutationFn: async () => {
      if (!tokenAddress) throw new Error('No token address')
      return await contractService.claimCreatorAllocation(tokenAddress)
    },
    onSuccess: () => {
      alert('Creator allocation claimed successfully!')
      // Refresh the creator allocation info
      window.location.reload()
    },
    onError: (error) => {
      console.error('Error claiming allocation:', error)
      alert('Failed to claim creator allocation. Please try again.')
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
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {tokenInfo?.name} ({tokenInfo?.symbol})
                </h2>
                <p className="text-gray-400 text-sm font-mono">
                  {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                </p>
              </div>
              {isCreator && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  👑 Creator
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Current Price</p>
            <p className="text-2xl font-bold text-green-400">
              {priceLoading ? '...' : `$${currentPrice || '0'} $TRUST`}
            </p>
          </div>
        </div>

        {/* Creator Allocation Info */}
        {isCreator && creatorAllocationInfo && (
          <div className="mt-4 p-4 bg-purple-900 bg-opacity-30 border border-purple-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-purple-300 font-medium">Your Creator Allocation</h4>
                <p className="text-purple-200 text-sm">
                  {creatorAllocationInfo.allocation} {tokenInfo?.symbol} tokens
                  {!creatorAllocationInfo.claimed && (
                    <span className="ml-2 text-purple-400">
                      • Locked for {Math.ceil(creatorAllocationInfo.timeRemaining / (24 * 3600))} days
                    </span>
                  )}
                </p>
              </div>
              {!creatorAllocationInfo.claimed && creatorAllocationInfo.canClaim && (
                <button
                  onClick={() => claimAllocationMutation.mutate()}
                  disabled={claimAllocationMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {claimAllocationMutation.isPending ? 'Claiming...' : 'Claim Tokens'}
                </button>
              )}
              {creatorAllocationInfo.claimed && (
                <div className="text-green-400 font-medium">✅ Claimed</div>
              )}
            </div>
          </div>
        )}

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
                  <span className="text-gray-400">Token Amount:</span>
                  <span className="text-white font-medium">
                    {buyForm.tokenAmount ? `${parseFloat(buyForm.tokenAmount).toLocaleString()} ${tokenInfo?.symbol}` : '0'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">$TRUST Required:</span>
                  <span className="text-green-400 font-medium">
                    {buyPrice !== '0' ? `${parseFloat(buyPrice).toFixed(6)} $TRUST` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Slippage Protection:</span>
                  <span className="text-gray-400">1% (min. {(buyPrice !== '0' ? (parseFloat(buyPrice) * 0.99).toFixed(6) : '0')} $TRUST)</span>
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
                  <span className="text-gray-400">Token Amount:</span>
                  <span className="text-white font-medium">
                    {sellForm.tokenAmount ? `${parseFloat(sellForm.tokenAmount).toLocaleString()} ${tokenInfo?.symbol}` : '0'}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">$TRUST to Receive:</span>
                  <span className="text-red-400 font-medium">
                    {sellPrice !== '0' ? `${parseFloat(sellPrice).toFixed(6)} $TRUST` : '-'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Slippage Protection:</span>
                  <span className="text-gray-400">1% (min. {(sellPrice !== '0' ? (parseFloat(sellPrice) * 0.99).toFixed(6) : '0')} $TRUST)</span>
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
          <h3 className="text-xl font-bold text-white mb-4">Price Chart & Information</h3>

          {/* Simple Price Chart Visualization */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Price Trend</span>
              <span className="text-green-400 text-sm">
                {currentPrice ? `$${parseFloat(currentPrice).toFixed(8)} $TRUST` : 'Loading...'}
              </span>
            </div>
            <div className="h-32 bg-gray-700 rounded-lg p-3 flex items-end space-x-1">
              {/* Simulated price bars - in a real app, this would be based on historical data */}
              {[0.6, 0.7, 0.5, 0.8, 0.9, 1.0, 0.95, 0.85, 0.9, 0.8, 0.75, 0.9, 1.0, 0.95, 0.9].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-sm opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${height * 100}%` }}
                  title={`Price point ${index + 1}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Time</span>
              <span>Current: {currentPrice ? parseFloat(currentPrice).toFixed(8) : '0'} $TRUST</span>
            </div>
          </div>

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
              <div className="flex items-start space-x-3">
                <div className="text-blue-400">📈</div>
                <div>
                  <p className="text-blue-300 font-medium mb-2">Bonding Curve Mechanics</p>
                  <p className="text-blue-200 text-sm mb-3">
                    Token price increases as more tokens are purchased and decreases when tokens are sold.
                  </p>

                  {/* Simple bonding curve visualization */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-blue-300 mb-1">
                      <span>Supply →</span>
                      <span>Price ($TRUST) →</span>
                    </div>
                    <div className="h-16 bg-gray-800 rounded relative overflow-hidden">
                      {/* Curve visualization */}
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <path
                          d="M 0,35 Q 25,20 50,15 T 100,10"
                          stroke="#60a5fa"
                          strokeWidth="2"
                          fill="none"
                          opacity="0.8"
                        />
                        <circle cx="10" cy="30" r="1.5" fill="#60a5fa" opacity="0.9" />
                        <circle cx="50" cy="15" r="1.5" fill="#60a5fa" opacity="0.9" />
                        <circle cx="90" cy="12" r="1.5" fill="#60a5fa" opacity="0.9" />
                      </svg>
                    </div>
                    <p className="text-xs text-blue-400 mt-1">
                      Starting Price: {currentPrice ? parseFloat(currentPrice).toFixed(8) : '0'} $TRUST
                    </p>
                  </div>
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