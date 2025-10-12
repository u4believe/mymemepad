'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from './input'
import { Search, TrendingUp, Clock, DollarSign } from 'lucide-react'

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
}

// Mock data for demonstration
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
    createdAt: '2024-01-15'
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
    createdAt: '2024-01-14'
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
    createdAt: '2024-01-13'
  }
]

export function TokenDiscovery() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredTokens, setFilteredTokens] = useState(mockTokens)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    const filtered = mockTokens.filter(token =>
      token.name.toLowerCase().includes(value.toLowerCase()) ||
      token.symbol.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredTokens(filtered)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Discover Meme Tokens</h2>
        <p className="text-muted-foreground">
          Explore trending meme tokens and find your next investment opportunity
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tokens by name or symbol..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Token List */}
      <div className="space-y-4">
        {filteredTokens.map((token) => (
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
        ))}
      </div>

      {filteredTokens.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tokens found matching your search.</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-primary">{mockTokens.length}</div>
          <div className="text-sm text-muted-foreground">Total Tokens</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-primary">
            ${mockTokens.reduce((acc, token) => acc + token.marketCap, 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Market Cap</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-primary">
            ${mockTokens.reduce((acc, token) => acc + token.volume24h, 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">24h Total Volume</div>
        </div>
      </div>
    </div>
  )
}