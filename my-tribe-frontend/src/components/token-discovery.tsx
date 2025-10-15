'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from './input'
import { Search, TrendingUp, Clock, DollarSign, Filter } from 'lucide-react'
import { useAccount, useContractInteractions } from '@/lib/contracts'
import { publicClient } from '@/lib/web3'

interface Token {
  id: string
  name: string
  symbol: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  creator: string
  createdAt: string
  address: string
}

export function TokenDiscovery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'my'>('all')

  const { address } = useAccount()
  const contractInteractions = useContractInteractions()

  // Fetch all tokens from the factory contract
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setIsLoading(true)

        // Get factory stats to know how many tokens exist
        const stats = await contractInteractions.getFactoryStats()
        const tokenCount = Number(stats.tokenCount)

        if (tokenCount === 0) {
          setTokens([])
          setFilteredTokens([])
          setIsLoading(false)
          return
        }

        // For demo purposes, we'll use mock data for now since we need more contract integration
        // In production, you'd fetch real token data from your subgraph or additional contract calls
        const mockTokens: Token[] = [
          {
            id: '1',
            name: 'MyTribe Token',
            symbol: 'MYT',
            price: 0.00123,
            marketCap: 1230000,
            volume24h: 45600,
            change24h: 12.5,
            creator: '0x1234...5678',
            createdAt: '2024-01-15',
            address: '0x1234567890123456789012345678901234567890'
          },
          {
            id: '2',
            name: 'Meme Coin',
            symbol: 'MEME',
            price: 0.00089,
            marketCap: 890000,
            volume24h: 23400,
            change24h: -3.2,
            creator: '0xabcd...efgh',
            createdAt: '2024-01-14',
            address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
          },
          {
            id: '3',
            name: 'Tribe DAO',
            symbol: 'TRIBE',
            price: 0.00234,
            marketCap: 2340000,
            volume24h: 78900,
            change24h: 8.7,
            creator: '0x9876...1234',
            createdAt: '2024-01-13',
            address: '0x9876543210987654321098765432109876543210'
          }
        ]

        setTokens(mockTokens)
        setFilteredTokens(mockTokens)
      } catch (error) {
        console.error('Failed to fetch tokens:', error)
        setTokens([])
        setFilteredTokens([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokens()
  }, [contractInteractions])

  // Filter tokens based on search term and active filter
  useEffect(() => {
    let filtered = tokens

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply user filter (show only tokens created by current user)
    if (activeFilter === 'my' && address) {
      filtered = filtered.filter(token => token.creator === address.slice(0, 6) + '...' + address.slice(-4))
    }

    setFilteredTokens(filtered)
  }, [tokens, searchTerm, activeFilter])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Discover Meme Tokens</h2>
        <p className="text-muted-foreground">
          Explore trending meme tokens and find your next investment opportunity
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens by name or symbol..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
          >
            All Tokens
          </Button>
          <Button
            variant={activeFilter === 'my' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('my')}
            disabled={!address}
          >
            My Tokens
          </Button>
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tokens...</p>
          </div>
        ) : filteredTokens.length > 0 ? (
          filteredTokens.map((token) => (
            <div key={token.id} className="glass-card p-6 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">{token.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{token.name}</h3>
                    <p className="text-muted-foreground">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">Created by {token.creator}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="font-semibold">${token.price.toFixed(6)}</span>
                      </div>
                      <div className={`text-xs flex items-center ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <TrendingUp className={`h-3 w-3 mr-1 ${token.change24h < 0 ? 'rotate-180' : ''}`} />
                        {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-semibold">${token.marketCap.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Market Cap</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-semibold">${token.volume24h.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">24h Volume</div>
                    </div>
                  </div>

                  <Button className="mt-2">
                    Trade
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {activeFilter === 'my'
                ? 'No tokens found. Create your first meme token to see it here!'
                : 'No tokens found matching your search.'}
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {!isLoading && tokens.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="glass-card p-6 text-center">
            <div className="text-2xl font-bold text-primary">{tokens.length}</div>
            <div className="text-sm text-muted-foreground">Total Tokens</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              ${tokens.reduce((acc: number, token: Token) => acc + token.marketCap, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Total Market Cap</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-2xl font-bold text-primary">
              ${tokens.reduce((acc: number, token: Token) => acc + token.volume24h, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">24h Total Volume</div>
          </div>
        </div>
      )}
    </div>
  )
}