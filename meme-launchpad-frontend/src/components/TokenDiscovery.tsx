import React, { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contractService } from '../utils/contracts'
import { TokenWithBondingCurve } from '../types'

type SortOption = 'marketCap' | 'price' | 'name' | 'newest'
type FilterOption = 'all' | 'bonding-curve' | 'migrated'

const TokenDiscovery: React.FC = () => {
  const [tokens, setTokens] = useState<TokenWithBondingCurve[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const tokensPerPage = 10

  // Fetch token count
  const { data: tokenCount } = useQuery({
    queryKey: ['tokenCount'],
    queryFn: () => contractService.getTokenCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Fetch tokens for current page
  const { data: tokenAddresses, isLoading } = useQuery<string[]>({
    queryKey: ['tokens', currentPage],
    queryFn: async () => {
      if (!tokenCount) return []
      const startIndex = currentPage * tokensPerPage
      const endIndex = Math.min(startIndex + tokensPerPage, Number(tokenCount))
      return await contractService.getTokensInRange(startIndex, endIndex)
    },
    enabled: !!tokenCount,
  })

  // Fetch detailed token information
  useEffect(() => {
    if (tokenAddresses && tokenAddresses.length > 0) {
      setLoading(true)
      const fetchTokenDetails = async () => {
        const tokenPromises = tokenAddresses.map(async (address) => {
          try {
            const [bondingCurveAddress, tokenInfo] = await Promise.all([
              contractService.getBondingCurve(address),
              contractService.getTokenInfo(address),
            ])

            if (bondingCurveAddress === '0x0000000000000000000000000000000000000000') {
              return null // Skip tokens without bonding curves
            }

            const [stats, isMigrated, pairAddress] = await Promise.all([
              contractService.getBondingCurveStats(bondingCurveAddress),
              contractService.isTokenMigrated(address),
              contractService.getPairAddress(address),
            ])

            return {
              token: tokenInfo,
              bondingCurveAddress,
              stats,
              isMigrated,
              pairAddress,
            } as TokenWithBondingCurve
          } catch (error) {
            console.error(`Error fetching token ${address}:`, error)
            return null
          }
        })

        const results = await Promise.all(tokenPromises)
        setTokens(results.filter((token): token is TokenWithBondingCurve => token !== null))
        setLoading(false)
      }

      fetchTokenDetails()
    } else {
      setTokens([])
      setLoading(false)
    }
  }, [tokenAddresses])

  // Filter and sort tokens
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens.filter(token => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesName = token.token.name.toLowerCase().includes(searchLower)
        const matchesSymbol = token.token.symbol.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesSymbol) return false
      }

      // Status filter
      if (filterBy === 'bonding-curve') return !token.isMigrated
      if (filterBy === 'migrated') return token.isMigrated
      return true
    })

    // Sort tokens
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'marketCap':
          return parseFloat(b.stats.marketCap) - parseFloat(a.stats.marketCap)
        case 'price':
          return parseFloat(b.stats.currentPrice) - parseFloat(a.stats.currentPrice)
        case 'name':
          return a.token.name.localeCompare(b.token.name)
        case 'newest':
        default:
          // For newest, we'll use the token address as a proxy (higher address = newer)
          return b.token.address.localeCompare(a.token.address)
      }
    })

    return filtered
  }, [tokens, searchTerm, sortBy, filterBy])

  const totalPages = Math.ceil(filteredAndSortedTokens.length / tokensPerPage)
  const paginatedTokens = filteredAndSortedTokens.slice(
    currentPage * tokensPerPage,
    (currentPage + 1) * tokensPerPage
  )

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(6)
  }

  const formatMarketCap = (marketCap: string) => {
    const cap = parseFloat(marketCap)
    if (cap >= 1e6) {
      return `$${(cap / 1e6).toFixed(2)}M`
    }
    return `$${cap.toFixed(2)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Discover Meme Tokens</h2>
        <p className="text-gray-400">
          Explore and trade tokens created on the Meme Launchpad
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Tokens</label>
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Filter</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Tokens</option>
              <option value="bonding-curve">Bonding Curve</option>
              <option value="migrated">Migrated to DEX</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="marketCap">Market Cap</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">
              Showing {paginatedTokens.length} of {filteredAndSortedTokens.length} tokens
              {searchTerm && (
                <span className="ml-2 text-purple-400">
                  for "{searchTerm}"
                </span>
              )}
            </span>
            {tokenCount && (
              <span className="text-gray-400">
                Total Created: <span className="text-purple-400 font-bold">{tokenCount.toString()}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Token Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedTokens.map((tokenData) => (
          <div
            key={tokenData.token.address}
            className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors duration-200"
          >
            {/* Token Header */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-white">{tokenData.token.name}</h3>
                <span className="text-sm text-gray-400">{tokenData.token.symbol}</span>
              </div>
              <p className="text-sm text-gray-400 font-mono">
                {tokenData.token.address.slice(0, 6)}...{tokenData.token.address.slice(-4)}
              </p>
            </div>

            {/* Token Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Price:</span>
                <span className="text-white font-medium">
                  ${formatPrice(tokenData.stats.currentPrice)} $TRUST
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap:</span>
                <span className="text-white font-medium">
                  {formatMarketCap(tokenData.stats.marketCap)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Tokens Sold:</span>
                <span className="text-white font-medium">
                  {parseFloat(tokenData.stats.tokensSold).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-medium ${
                  tokenData.isMigrated ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {tokenData.isMigrated ? '🟢 Migrated to DEX' : '🔵 Bonding Curve'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                View Details
              </button>

              {!tokenData.isMigrated && (
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                  Trade Token
                </button>
              )}

              {tokenData.isMigrated && tokenData.pairAddress && (
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                  View on DEX
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!isLoading && paginatedTokens.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm || filterBy !== 'all' ? 'No Tokens Match Filters' : 'No Tokens Found'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filterBy !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Be the first to create a meme token!'
            }
          </p>
          {(searchTerm || filterBy !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterBy('all')
                setCurrentPage(0)
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 mr-4"
            >
              Clear Filters
            </button>
          )}
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200">
            Create First Token
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && paginatedTokens.length > 0 && (
        <div className="flex justify-center space-x-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    currentPage === pageNum
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {pageNum + 1}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default TokenDiscovery