import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { contractService } from '../utils/contracts'
import { TokenWithBondingCurve } from '../types'

const MigrationInterface: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState<TokenWithBondingCurve | null>(null)

  // Get all tokens that are ready for migration
  const { data: migratableTokens, isLoading } = useQuery({
    queryKey: ['migratableTokens'],
    queryFn: async () => {
      // This would need to be implemented to fetch tokens that should migrate
      // For now, return empty array
      return []
    },
  })

  const migrateMutation = useMutation({
    mutationFn: async (tokenData: TokenWithBondingCurve) => {
      return await contractService.migrateToDEX(
        tokenData.token.address,
        tokenData.bondingCurveAddress
      )
    },
    onSuccess: () => {
      alert('Migration successful!')
      setSelectedToken(null)
    },
    onError: (error) => {
      console.error('Error migrating token:', error)
      alert('Failed to migrate token. Please try again.')
    },
  })

  const handleMigrate = (tokenData: TokenWithBondingCurve) => {
    migrateMutation.mutate(tokenData)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Token Migration</h2>
        <p className="text-gray-400">
          Migrate tokens that have reached the 10M $TRUST market cap threshold to DEX
        </p>
      </div>

      {migratableTokens && migratableTokens.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {migratableTokens.map((tokenData) => (
            <div
              key={tokenData.token.address}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors duration-200"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  {tokenData.token.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {tokenData.token.symbol}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Market Cap:</span>
                  <span className="text-green-400 font-medium">
                    ${parseFloat(tokenData.stats.marketCap).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-medium">
                    ${parseFloat(tokenData.stats.currentPrice).toFixed(6)}
                  </span>
                </div>

                <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-3">
                  <p className="text-green-300 text-sm font-medium">
                    ✅ Ready for Migration
                  </p>
                  <p className="text-green-200 text-xs">
                    This token has reached the 10M $TRUST threshold
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleMigrate(tokenData)}
                disabled={migrateMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {migrateMutation.isPending ? 'Migrating...' : '🚀 Migrate to DEX'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Tokens Ready for Migration
          </h3>
          <p className="text-gray-400 mb-6">
            Tokens need to reach 10M $TRUST market cap to be eligible for DEX migration.
          </p>

          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-6 max-w-md mx-auto">
            <h4 className="text-blue-300 font-medium mb-2">Migration Process</h4>
            <div className="text-sm text-blue-200 space-y-1">
              <p>1. Create a meme token</p>
              <p>2. Buy tokens to increase price</p>
              <p>3. Reach 10M $TRUST market cap</p>
              <p>4. Migrate to DEX for liquidity</p>
            </div>
          </div>
        </div>
      )}

      {/* Migration Information */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">About Token Migration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-green-400 font-medium mb-2">Benefits of Migration</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Permanent liquidity on DEX</li>
              <li>• No more price bonding curve</li>
              <li>• Token becomes tradeable</li>
              <li>• LP tokens for liquidity providers</li>
            </ul>
          </div>

          <div>
            <h4 className="text-blue-400 font-medium mb-2">Migration Requirements</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 10M $TRUST market cap minimum</li>
              <li>• Token creator must initiate</li>
              <li>• All bonding curve liquidity migrates</li>
              <li>• Trading paused after migration</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MigrationInterface