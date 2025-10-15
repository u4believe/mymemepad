'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useWallet } from './wallet-provider'
import { useContractInteractions } from '@/lib/contracts'
import { ExternalLink, Copy, RefreshCw } from 'lucide-react'

interface UserToken {
  address: string
  name: string
  symbol: string
  maxSupply: bigint
  creator: string
  bondingCurveAddress: string
  currentPrice: bigint
  marketCap: bigint
  userBalance: bigint
}

export function PortfolioView() {
  const { address, isConnected, isCorrectNetwork, switchToIntuition } = useWallet()
  const contractInteractions = useContractInteractions()

  const [userTokens, setUserTokens] = useState<UserToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalValue, setTotalValue] = useState<bigint>(BigInt(0))

  // Fetch user's created tokens
  const fetchUserTokens = useCallback(async () => {
    if (!isConnected || !address || !isCorrectNetwork) return

    setIsLoading(true)
    try {
      // Get token addresses created by user
      const tokenAddresses = await contractInteractions.getTokensByCreator(address)

      if (tokenAddresses.length === 0) {
        setUserTokens([])
        setTotalValue(BigInt(0))
        return
      }

      // For each token, fetch detailed information
      const tokensWithDetails = await Promise.all(
        tokenAddresses.map(async (tokenAddr) => {
          try {
            // Get basic token info
            const tokenInfo = await contractInteractions.getMemeTokenInfo(tokenAddr)

            // Get user's balance in this token
            const userBalance = await contractInteractions.getMemeTokenBalance(tokenAddr, address)

            // Get bonding curve for this token
            const bondingCurveAddr = await contractInteractions.getBondingCurve(tokenAddr)

            // For now, use placeholder values for price and market cap
            // In a real implementation, you would fetch these from the bonding curve
            const currentPrice = BigInt(0) // TODO: Implement bonding curve price fetching
            const marketCap = BigInt(0) // TODO: Implement market cap calculation

            return {
              address: tokenAddr,
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              maxSupply: BigInt(tokenInfo.decimals || 18),
              creator: address,
              bondingCurveAddress: bondingCurveAddr as string,
              currentPrice,
              marketCap,
              userBalance
            } as UserToken
          } catch (error) {
            console.error(`Error fetching token ${tokenAddr}:`, error)
            return null
          }
        })
      )

      const validTokens = tokensWithDetails.filter((token): token is UserToken => token !== null)
      setUserTokens(validTokens)

      // Calculate total portfolio value
      const total = validTokens.reduce((acc, token) => acc + token.marketCap, BigInt(0))
      setTotalValue(total)

    } catch (error) {
      console.error('Error fetching user tokens:', error)
      setUserTokens([])
      setTotalValue(BigInt(0))
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address, isCorrectNetwork, contractInteractions])

  useEffect(() => {
    fetchUserTokens()
  }, [fetchUserTokens])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatPrice = (price: bigint) => {
    return `$${(Number(price) / 10 ** 18).toFixed(8)}`
  }

  const formatMarketCap = (marketCap: bigint) => {
    return `$${(Number(marketCap) / 10 ** 18).toLocaleString()}`
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">My Portfolio</h2>
        <p className="text-muted-foreground mb-6">Connect your wallet to view your created tokens</p>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="text-2xl font-bold mb-4">My Portfolio</h2>
        <p className="text-orange-600 mb-4">Please switch to Intuition Network to view your portfolio</p>
        <Button onClick={switchToIntuition} variant="outline">
          Switch to Intuition Network
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">My Portfolio</h2>
        <p className="text-muted-foreground">
          Manage and monitor your created meme tokens
        </p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-primary">{userTokens.length}</div>
          <div className="text-sm text-muted-foreground">Tokens Created</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-2xl font-bold text-primary">
            {formatMarketCap(totalValue)}
          </div>
          <div className="text-sm text-muted-foreground">Total Portfolio Value</div>
        </div>
        <div className="glass-card p-6 text-center">
          <Button
            onClick={fetchUserTokens}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your tokens...</p>
          </div>
        ) : userTokens.length > 0 ? (
          userTokens.map((token) => (
            <div key={token.address} className="glass-card p-6 hover:bg-white/10 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold">{token.symbol.slice(0, 2)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{token.name}</h3>
                    <p className="text-muted-foreground">{token.symbol}</p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatAddress(token.address)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(token.address)}
                        className="h-4 w-4 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-sm font-semibold">{formatPrice(token.currentPrice)}</div>
                      <div className="text-xs text-muted-foreground">Price</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-semibold">{formatMarketCap(token.marketCap)}</div>
                      <div className="text-xs text-muted-foreground">Market Cap</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-semibold">{(Number(token.userBalance) / 10 ** 18).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Your Balance</div>
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Trade
                    </Button>
                    <Button size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No tokens found. Create your first meme token to see it here!
            </p>
            <Button className="mt-4" asChild>
              <a href="/create">Create Your First Token</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}