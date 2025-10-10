import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { contractService } from '../utils/contracts'
import { TokenWithBondingCurve } from '../types'

const MigrationInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'migrate' | 'migrated'>('migrate')

  // Get all migrated tokens
  const { data: migratedTokens, isLoading: migratedLoading } = useQuery({
    queryKey: ['migratedTokens'],
    queryFn: async () => {
      try {
        const tokenCount = await contractService.getTokenCount()

        if (Number(tokenCount) === 0) {
          return []
        }

        // Get all token addresses (in batches to avoid overwhelming the RPC)
        const batchSize = 50
        const allTokens: any[] = []

        for (let i = 0; i < Number(tokenCount); i += batchSize) {
          const endIndex = Math.min(i + batchSize, Number(tokenCount))
          const tokenAddresses = await contractService.getTokensInRange(i, endIndex)

          // Process each token to check if it's migrated
          for (const tokenAddress of tokenAddresses) {
            try {
              const isMigrated = await contractService.isTokenMigrated(tokenAddress)

              if (isMigrated) {
                const [tokenInfo, pairAddress] = await Promise.all([
                  contractService.getTokenInfo(tokenAddress),
                  contractService.getPairAddress(tokenAddress),
                ])

                allTokens.push({
                  token: tokenInfo,
                  pairAddress,
                })
              }
            } catch (error) {
              console.error(`Error processing migrated token ${tokenAddress}:`, error)
              continue
            }
          }
        }

        return allTokens
      } catch (error) {
        console.error('Error fetching migrated tokens:', error)
        return []
      }
    },
    refetchInterval: 60000, // Refetch every minute
  })

  // Get all tokens that are ready for migration
  const { data: migratableTokens, isLoading } = useQuery({
    queryKey: ['migratableTokens'],
    queryFn: async () => {
      try {
        const tokenCount = await contractService.getTokenCount()

        if (Number(tokenCount) === 0) {
          return []
        }

        // Get all token addresses (in batches to avoid overwhelming the RPC)
        const batchSize = 50
        const allTokens: TokenWithBondingCurve[] = []

        for (let i = 0; i < Number(tokenCount); i += batchSize) {
          const endIndex = Math.min(i + batchSize, Number(tokenCount))
          const tokenAddresses = await contractService.getTokensInRange(i, endIndex)

          // Process each token to check if it's ready for migration
          for (const tokenAddress of tokenAddresses) {
            try {
              const [bondingCurveAddress, tokenInfo] = await Promise.all([
                contractService.getBondingCurve(tokenAddress),
                contractService.getTokenInfo(tokenAddress),
              ])

              if (bondingCurveAddress === '0x0000000000000000000000000000000000000000') {
                continue // Skip tokens without bonding curves
              }

              const [stats, isMigrated] = await Promise.all([
                contractService.getBondingCurveStats(bondingCurveAddress),
                contractService.isTokenMigrated(tokenAddress),
              ])

              // Check if token should migrate (market cap >= 10M TRUST and not already migrated)
              const marketCapValue = parseFloat(stats.marketCap)
              if (marketCapValue >= 10000000 && !isMigrated) {
                allTokens.push({
                  token: tokenInfo,
                  bondingCurveAddress,
                  stats,
                  isMigrated,
                })
              }
            } catch (error) {
              console.error(`Error processing token ${tokenAddress}:`, error)
              continue
            }
          }
        }

        return allTokens
      } catch (error) {
        console.error('Error fetching migratable tokens:', error)
        return []
      }
    },
    refetchInterval: 60000, // Refetch every minute
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
        <h2 className="text-3xl font-bold text-white mb-2">Token Migration & DEX</h2>
        <p className="text-gray-400">
          Migrate tokens that have reached the 10M $TRUST market cap threshold to DEX for permanent liquidity
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setActiveTab('migrate')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'migrate'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Ready to Migrate
          </button>
          <button
            onClick={() => setActiveTab('migrated')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
              activeTab === 'migrated'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Live on DEX
          </button>
        </div>
      </div>

      {/* Migration Tab Content */}
      {activeTab === 'migrate' && (
        <>
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
        </>
      )}

      {/* Migrated Tokens Tab Content */}
      {activeTab === 'migrated' && (
        <>
          {migratedLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : migratedTokens && migratedTokens.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {migratedTokens.map((tokenData) => (
                <div
                  key={tokenData.token.address}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-colors duration-200"
                >
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-xl font-bold text-white">
                        {tokenData.token.name}
                      </h3>
                      <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        DEX
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {tokenData.token.symbol}
                    </p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400 font-medium">
                        Live on DEX
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-400">Pair Address:</span>
                      <span className="text-white font-mono text-xs">
                        {tokenData.pairAddress?.slice(0, 6)}...{tokenData.pairAddress?.slice(-4)}
                      </span>
                    </div>

                    {/* DEX Trading Chart Placeholder */}
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">DEX Chart</span>
                        <span className="text-green-400 text-sm">📈</span>
                      </div>
                      <div className="h-20 bg-gray-800 rounded relative overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 100 20">
                          <path
                            d="M 0,15 Q 25,10 50,12 T 100,8"
                            stroke="#10b981"
                            strokeWidth="1.5"
                            fill="none"
                            opacity="0.8"
                          />
                          <circle cx="10" cy="14" r="1" fill="#10b981" opacity="0.9" />
                          <circle cx="50" cy="12" r="1" fill="#10b981" opacity="0.9" />
                          <circle cx="90" cy="10" r="1" fill="#10b981" opacity="0.9" />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Trading on DEX • Permanent Liquidity
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <a
                      href={`https://intuition-testnet.explorer.caldera.xyz/address/${tokenData.pairAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 text-center block"
                    >
                      View on Explorer
                    </a>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">
                      Trade on DEX
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏦</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Tokens on DEX Yet
              </h3>
              <p className="text-gray-400 mb-6">
                Tokens that reach 10M $TRUST market cap will appear here after migration.
              </p>

              <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="text-green-300 font-medium mb-2">DEX Benefits</h4>
                <div className="text-sm text-green-200 space-y-1">
                  <p>• Permanent liquidity pool</p>
                  <p>• Standard DEX trading interface</p>
                  <p>• LP token rewards for providers</p>
                  <p>• No bonding curve limitations</p>
                </div>
              </div>
            </div>
          )}
        </>
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