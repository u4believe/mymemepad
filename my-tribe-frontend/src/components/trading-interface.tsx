'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from './input'
import { useWallet } from './wallet-provider'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

export function TradingInterface() {
  const { isConnected, isCorrectNetwork, switchToIntuition } = useWallet()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock token data
  const token = {
    name: 'MyTribe Token',
    symbol: 'MYT',
    price: 0.00123,
    balance: 1000,
    maxSupply: 1000000000,
  }

  const handleTrade = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }

    if (!isCorrectNetwork) {
      alert('Please switch to Intuition Network to trade tokens')
      try {
        await switchToIntuition()
      } catch (error) {
        console.error('Failed to switch network:', error)
      }
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement trading logic
      console.log(`${activeTab}ing ${amount} ${token.symbol}`)
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`${activeTab} functionality will be implemented with smart contract integration`)
    } catch (error) {
      console.error('Error trading:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Trade {token.name}</h2>
        <p className="text-muted-foreground">
          Buy or sell {token.symbol} tokens using the bonding curve mechanism
        </p>
      </div>

      {/* Token Info */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">{token.symbol.slice(0, 2)}</span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{token.name}</h3>
              <p className="text-muted-foreground">{token.symbol}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${token.price.toFixed(6)}</div>
            <div className="text-sm text-muted-foreground">Current Price</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{token.balance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Your Balance</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{token.maxSupply.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Max Supply</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-400">+12.5%</div>
            <div className="text-xs text-muted-foreground">24h Change</div>
          </div>
          <div>
            <div className="text-lg font-semibold">$1.23M</div>
            <div className="text-xs text-muted-foreground">Market Cap</div>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy/Sell Toggle */}
        <div className="glass-card p-6">
          <div className="flex mb-6">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 py-3 px-4 rounded-l-lg font-medium flex items-center justify-center space-x-2 ${
                activeTab === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span>Buy</span>
            </button>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex-1 py-3 px-4 rounded-r-lg font-medium flex items-center justify-center space-x-2 ${
                activeTab === 'sell'
                  ? 'bg-red-600 text-white'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              <span>Sell</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount ({token.symbol})
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Price per token:</span>
                <span>${token.price.toFixed(8)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>Fee (1%):</span>
                <span>${(Number(amount) * token.price * 0.01).toFixed(8)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span>Total {activeTab === 'buy' ? 'Cost' : 'Receive'}: </span>
                <span>
                  ${activeTab === 'buy'
                    ? (Number(amount) * token.price * 1.01).toFixed(8)
                    : (Number(amount) * token.price * 0.99).toFixed(8)
                  }
                </span>
              </div>
            </div>

            <Button
              onClick={handleTrade}
              disabled={isLoading || !amount || Number(amount) <= 0 || !isConnected || !isCorrectNetwork}
              className={`w-full py-3 text-lg ${
                activeTab === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading
                ? `${activeTab === 'buy' ? 'Buying' : 'Selling'}...`
                : `${activeTab === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
              }
            </Button>

            {!isConnected && (
              <p className="text-sm text-muted-foreground text-center">
                Please connect your wallet to trade
              </p>
            )}

            {isConnected && !isCorrectNetwork && (
              <div className="text-center space-y-2">
                <p className="text-sm text-orange-600">
                  ⚠️ Please switch to Intuition Network to trade
                </p>
                <Button
                  onClick={switchToIntuition}
                  variant="outline"
                  size="sm"
                >
                  Switch to Intuition Network
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Price Chart Placeholder */}
        <div className="glass-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Price Chart</h3>
          </div>

          <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Real-time price chart</p>
              <p className="text-sm">Coming soon with live data</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm">
            <div>
              <div className="font-semibold">24h High</div>
              <div className="text-muted-foreground">$0.00145</div>
            </div>
            <div>
              <div className="font-semibold">24h Low</div>
              <div className="text-muted-foreground">$0.00112</div>
            </div>
            <div>
              <div className="font-semibold">24h Volume</div>
              <div className="text-muted-foreground">$45,600</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Info */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4">Trading Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Bonding Curve Mechanics</h4>
            <ul className="text-muted-foreground space-y-1">
              <li>• Price increases with each purchase</li>
              <li>• Price decreases with each sale</li>
              <li>• 1% fee on all transactions</li>
              <li>• Migration at $10M market cap</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Risk Warning</h4>
            <p className="text-muted-foreground">
              Meme tokens are highly volatile and speculative.
              Only invest what you can afford to lose.
              Smart contract interactions are irreversible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}