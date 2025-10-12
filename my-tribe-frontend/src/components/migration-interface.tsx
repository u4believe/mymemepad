'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import { CONTRACT_ADDRESSES, BONDING_CURVE_ABI, LIQUIDITY_MIGRATOR_ABI, TRUST_TOKEN_ABI } from '../lib/web3'

export function MigrationInterface() {
  const { address, isConnected } = useAccount()
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'ready' | 'completed' | 'failed'>('pending')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Contract read hooks
  const { data: contractData, isLoading: contractsLoading, error: contractsError, refetch } = useReadContracts({
    contracts: [
      // Bonding curve data
      {
        address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_ABI,
        functionName: 'getStats',
      },
      {
        address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_ABI,
        functionName: 'getCurrentMarketCap',
      },
      {
        address: CONTRACT_ADDRESSES.BONDING_CURVE as `0x${string}`,
        abi: BONDING_CURVE_ABI,
        functionName: 'memeToken',
      },
      // Trust token data
      {
        address: CONTRACT_ADDRESSES.TRUST_TOKEN as `0x${string}`,
        abi: TRUST_TOKEN_ABI,
        functionName: 'symbol',
      },
      {
        address: CONTRACT_ADDRESSES.TRUST_TOKEN as `0x${string}`,
        abi: TRUST_TOKEN_ABI,
        functionName: 'decimals',
      },
    ],
  })

  // Migration status check
  const { data: migrationStatusData } = useReadContracts({
    contracts: contractData?.[2]?.result ? [
      {
        address: CONTRACT_ADDRESSES.LIQUIDITY_MIGRATOR as `0x${string}`,
        abi: LIQUIDITY_MIGRATOR_ABI,
        functionName: 'isTokenMigrated',
        args: [contractData[2].result as `0x${string}`],
      },
    ] : [],
  })

  // Process contract data
  const migrationData = contractData ? {
    tokenName: 'MyTribe Token', // TODO: Get from token contract
    tokenSymbol: contractData[3]?.result as string || 'MYT',
    currentMarketCap: Number(contractData[1]?.result || 0) / 1e18, // Convert from wei
    migrationThreshold: 10000000, // 10M as per contract
    tokensToMigrate: 1000000000, // TODO: Get from token contract
    estimatedLiquidity: Number(contractData[1]?.result || 0) / 1e18, // Convert from wei
    migrationReady: Number(contractData[1]?.result || 0) >= 10000000 * 1e18,
    bondingCurveAddress: CONTRACT_ADDRESSES.BONDING_CURVE,
    tokenAddress: contractData[2]?.result as `0x${string}`,
  } : null

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 10000)
    return () => clearInterval(interval)
  }, [refetch])

  // Update migration status based on contract data
  useEffect(() => {
    if (migrationStatusData?.[0]?.result) {
      setMigrationStatus('completed')
    } else if (migrationData?.migrationReady) {
      setMigrationStatus('ready')
    } else {
      setMigrationStatus('pending')
    }
  }, [migrationStatusData, migrationData])

  // Contract write hooks
  const { writeContract: writeLiquidityMigrator, data: migrationTxHash } = useWriteContract()
  const { isLoading: isMigrationPending, isSuccess: isMigrationSuccess } = useWaitForTransactionReceipt({
    hash: migrationTxHash,
  })

  const handleInitiateMigration = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    if (!migrationData?.migrationReady) {
      setError('Migration threshold not yet reached')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // This would typically involve calling a contract function to initiate migration
      // For now, we'll just set status to ready (this might be handled by the bonding curve contract)
      setMigrationStatus('ready')
    } catch (err) {
      console.error('Migration initiation failed:', err)
      setError(err instanceof Error ? err.message : 'Migration initiation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExecuteMigration = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first')
      return
    }

    if (!migrationData?.tokenAddress || !migrationData.bondingCurveAddress) {
      setError('Contract addresses not configured')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await writeLiquidityMigrator({
        address: CONTRACT_ADDRESSES.LIQUIDITY_MIGRATOR as `0x${string}`,
        abi: LIQUIDITY_MIGRATOR_ABI,
        functionName: 'migrateToDEX',
        args: [
          migrationData.tokenAddress,
          migrationData.bondingCurveAddress as `0x${string}`,
        ],
      })
    } catch (err) {
      console.error('Migration execution failed:', err)
      setError(err instanceof Error ? err.message : 'Migration execution failed')
      setIsLoading(false)
    }
  }

  // Update status when migration transaction completes
  useEffect(() => {
    if (isMigrationSuccess) {
      setMigrationStatus('completed')
      setIsLoading(false)
      setError(null)
      refetch() // Refresh contract data
    }
  }, [isMigrationSuccess, refetch])

  const progressPercentage = migrationData ? (migrationData.currentMarketCap / migrationData.migrationThreshold) * 100 : 0
  const isReadyForMigration = migrationData ? migrationData.currentMarketCap >= migrationData.migrationThreshold : false

  // Show loading state while contracts are loading
  if (contractsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Token Migration</h2>
          <p className="text-muted-foreground">
            Loading migration data...
          </p>
        </div>
        <div className="glass-card p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Fetching contract data...</p>
        </div>
      </div>
    )
  }

  // Show error state if contracts failed to load
  if (contractsError || !migrationData) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Token Migration</h2>
          <p className="text-muted-foreground">
            Migrate your meme token from bonding curve to DEX when market cap reaches $10M
          </p>
        </div>
        <div className="glass-card p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Migration Data</h3>
          <p className="text-muted-foreground mb-4">
            {contractsError?.message || 'Unable to load contract data. Please check your connection and try again.'}
          </p>
          <Button onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Token Migration</h2>
        <p className="text-muted-foreground">
          Migrate your meme token from bonding curve to DEX when market cap reaches $10M
        </p>
        {!isConnected && (
          <p className="text-sm text-yellow-400 mt-2">
            Please connect your wallet to interact with the migration
          </p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="glass-card p-4 border-red-500/20 bg-red-500/10">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-red-400">{error}</p>
            <Button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Migration Status */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold">{migrationData.tokenSymbol.slice(0, 2)}</span>
            </div>
            <div>
              <h3 className="text-2xl font-semibold">{migrationData.tokenName}</h3>
              <p className="text-muted-foreground">{migrationData.tokenSymbol}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold">
              ${migrationData.currentMarketCap.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Current Market Cap</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Migration Progress</span>
            <span>${migrationData.currentMarketCap.toLocaleString()} / ${migrationData.migrationThreshold.toLocaleString()}</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                isReadyForMigration ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="text-center mt-2">
            <span className={`text-sm font-medium ${isReadyForMigration ? 'text-green-400' : 'text-muted-foreground'}`}>
              {isReadyForMigration ? '🎉 Ready for Migration!' : `${progressPercentage.toFixed(1)}% Complete`}
            </span>
          </div>
        </div>

        {/* Migration Steps */}
        <div className="space-y-4">
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            migrationStatus === 'completed' ? 'bg-green-500/20' : 'bg-muted/30'
          }`}>
            {migrationStatus === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <div className="font-medium">Reach $10M Market Cap</div>
              <div className="text-sm text-muted-foreground">
                Current: ${migrationData.currentMarketCap.toLocaleString()} / $10,000,000
              </div>
            </div>
          </div>

          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            migrationStatus === 'ready' ? 'bg-blue-500/20' : 'bg-muted/30'
          }`}>
            {migrationStatus === 'ready' ? (
              <CheckCircle className="h-5 w-5 text-blue-400" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <div className="font-medium">Initiate Migration</div>
              <div className="text-sm text-muted-foreground">
                Lock bonding curve and prepare for DEX listing
              </div>
            </div>
          </div>

          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            migrationStatus === 'completed' ? 'bg-green-500/20' : 'bg-muted/30'
          }`}>
            {migrationStatus === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )}
            <div className="flex-1">
              <div className="font-medium">Complete Migration</div>
              <div className="text-sm text-muted-foreground">
                Deploy to DEX and unlock liquidity
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Migration Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tokens to Migrate:</span>
              <span className="font-medium">{migrationData.tokensToMigrate.toLocaleString()} {migrationData.tokenSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated Liquidity:</span>
              <span className="font-medium">${migrationData.estimatedLiquidity.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Migration Fee:</span>
              <span className="font-medium">0.5% of liquidity</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">DEX Listing:</span>
              <span className="font-medium">Uniswap V3</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Migration Benefits</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Reduced price volatility</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Lower trading fees (0.3% vs 1%)</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Access to larger liquidity pools</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span>Integration with DeFi protocols</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        {!isReadyForMigration ? (
          <div className="glass-card p-6 text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Migration Not Ready</h3>
            <p className="text-muted-foreground mb-4">
              Token needs to reach ${migrationData.migrationThreshold.toLocaleString()} market cap before migration
            </p>
            <div className="text-sm">
              Need ${(migrationData.migrationThreshold - migrationData.currentMarketCap).toLocaleString()} more in market cap
            </div>
          </div>
        ) : migrationStatus === 'pending' ? (
          <Button
            onClick={handleInitiateMigration}
            disabled={!isConnected || isLoading}
            className="px-8 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initiating...
              </>
            ) : (
              '🚀 Initiate Migration'
            )}
          </Button>
        ) : migrationStatus === 'ready' ? (
          <Button
            onClick={handleExecuteMigration}
            disabled={!isConnected || isLoading || isMigrationPending}
            className="px-8 py-3 text-lg bg-green-600 hover:bg-green-700"
          >
            {isMigrationPending || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Migrating...
              </>
            ) : (
              '✅ Complete Migration'
            )}
          </Button>
        ) : (
          <div className="glass-card p-6 text-center max-w-md">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Migration Completed!</h3>
            <p className="text-muted-foreground">
              Token has been successfully migrated to DEX
            </p>
            {migrationData.tokenAddress && (
              <p className="text-xs text-muted-foreground mt-2 break-all">
                Token: {migrationData.tokenAddress}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}