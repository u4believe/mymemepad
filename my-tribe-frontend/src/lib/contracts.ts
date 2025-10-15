import { CONTRACT_ADDRESSES, publicClient, createIntuitionWalletClient, intuitionSDK } from './web3'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'

// Re-export wagmi hooks for convenience
export { useAccount, useWalletClient, usePublicClient }

// Contract ABIs
export const MEME_LAUNCHPAD_FACTORY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'maxSupply', type: 'uint256' }
    ],
    name: 'createMemeToken',
    outputs: [
      { name: 'tokenAddress', type: 'address' },
      { name: 'bondingCurveAddress', type: 'address' }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getStats',
    outputs: [
      { name: 'tokenCount', type: 'uint256' },
      { name: 'treasuryAddress', type: 'address' },
      { name: 'creationFee', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'getTokensByCreator',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'getCreatorTokenCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'creator', type: 'address' },
      { name: 'tokenAddress', type: 'address' }
    ],
    name: 'isTokenCreator',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'tokenAddress', type: 'address' }],
    name: 'getBondingCurve',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const MEME_TOKEN_ABI = [
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

// Enhanced contract interaction utilities
export class ContractInteractions {
  // Create a new meme token
  static async createMemeToken(
    name: string,
    symbol: string,
    maxSupply: bigint,
    walletClient: any
  ) {
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: MEME_LAUNCHPAD_FACTORY_ABI,
        functionName: 'createMemeToken',
        args: [name, symbol, maxSupply],
      })
      return hash
    } catch (error) {
      console.error('Failed to create meme token:', error)
      throw error
    }
  }

  // Get meme token information
  static async getMemeTokenInfo(tokenAddress: string) {
    try {
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: MEME_TOKEN_ABI,
          functionName: 'name',
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: MEME_TOKEN_ABI,
          functionName: 'symbol',
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: MEME_TOKEN_ABI,
          functionName: 'decimals',
        }),
      ])
      return { name, symbol, decimals: Number(decimals) }
    } catch (error) {
      console.error('Failed to get meme token info:', error)
      throw error
    }
  }

  // Get balance of a meme token
  static async getMemeTokenBalance(tokenAddress: string, account: string) {
    try {
      const balance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [account as `0x${string}`],
      })
      return balance
    } catch (error) {
      console.error('Failed to get meme token balance:', error)
      throw error
    }
  }

  // Get bonding curve for a token
  static async getBondingCurve(tokenAddress: string) {
    try {
      const bondingCurve = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: MEME_LAUNCHPAD_FACTORY_ABI,
        functionName: 'getBondingCurve',
        args: [tokenAddress as `0x${string}`],
      })
      return bondingCurve
    } catch (error) {
      console.error('Failed to get bonding curve:', error)
      throw error
    }
  }

  // Deposit TTRUST to MultiVault
  static async depositTrust(amount: bigint, walletClient: any) {
    return intuitionSDK.deposit(amount, walletClient)
  }

  // Withdraw TTRUST from MultiVault
  static async withdrawTrust(amount: bigint, walletClient: any) {
    return intuitionSDK.withdraw(amount, walletClient)
  }

  // Get TTRUST balance
  static async getTrustBalance(address: string) {
    return intuitionSDK.getTrustBalance(address)
  }

  // Get factory statistics
  static async getFactoryStats() {
    return intuitionSDK.getFactoryStats()
  }

  // Get tokens created by a specific user
  static async getTokensByCreator(creatorAddress: string) {
    try {
      const tokens = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: MEME_LAUNCHPAD_FACTORY_ABI,
        functionName: 'getTokensByCreator',
        args: [creatorAddress as `0x${string}`],
      })
      return tokens
    } catch (error) {
      console.error('Failed to get tokens by creator:', error)
      throw error
    }
  }

  // Get token count for a creator
  static async getCreatorTokenCount(creatorAddress: string) {
    try {
      const count = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: MEME_LAUNCHPAD_FACTORY_ABI,
        functionName: 'getCreatorTokenCount',
        args: [creatorAddress as `0x${string}`],
      })
      return Number(count)
    } catch (error) {
      console.error('Failed to get creator token count:', error)
      throw error
    }
  }

  // Check if user is creator of a token
  static async isTokenCreator(creatorAddress: string, tokenAddress: string) {
    try {
      const isCreator = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: MEME_LAUNCHPAD_FACTORY_ABI,
        functionName: 'isTokenCreator',
        args: [creatorAddress as `0x${string}`, tokenAddress as `0x${string}`],
      })
      return isCreator
    } catch (error) {
      console.error('Failed to check if address is token creator:', error)
      throw error
    }
  }
}

// React hooks for contract interactions
export const useContractInteractions = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  return {
    // Balance checking
    checkTrustBalance: async () => {
      if (!address) throw new Error('No address available')
      return ContractInteractions.getTrustBalance(address)
    },

    // Check if user can create token (has enough balance)
    canCreateToken: async () => {
      if (!address) return false

      try {
        const balance = await ContractInteractions.getTrustBalance(address)
        const requiredBalance = BigInt(10 * 10 ** 18) // 10 TTRUST (assuming 18 decimals)
        return balance >= requiredBalance
      } catch (error) {
        console.error('Error checking token creation eligibility:', error)
        return false
      }
    },

    // Meme token operations
    createMemeToken: async (name: string, symbol: string, maxSupply: bigint) => {
      if (!walletClient) throw new Error('Wallet not connected')
      if (!address) throw new Error('No address available')

      // Validate network - only allow Intuition network
      const chainId = await walletClient.getChainId()
      if (chainId !== 13579) { // Intuition Testnet chain ID
        throw new Error('Please switch to Intuition Network to create tokens')
      }

      // Check if user has enough TTRUST balance
      const balance = await ContractInteractions.getTrustBalance(address)
      const requiredBalance = BigInt(10 * 10 ** 18) // 10 TTRUST (assuming 18 decimals)

      if (balance < requiredBalance) {
        throw new Error(`Insufficient TTRUST balance. Required: 10 TTRUST, Available: ${Number(balance) / 10 ** 18} TTRUST`)
      }

      return ContractInteractions.createMemeToken(name, symbol, maxSupply, walletClient)
    },

    getMemeTokenInfo: (tokenAddress: string) =>
      ContractInteractions.getMemeTokenInfo(tokenAddress),

    getMemeTokenBalance: (tokenAddress: string, userAddress: string) =>
      ContractInteractions.getMemeTokenBalance(tokenAddress, userAddress),

    getBondingCurve: (tokenAddress: string) =>
      ContractInteractions.getBondingCurve(tokenAddress),

    // Trust token operations
    depositTrust: async (amount: bigint) => {
      if (!walletClient) throw new Error('Wallet not connected')
      return ContractInteractions.depositTrust(amount, walletClient)
    },

    withdrawTrust: async (amount: bigint) => {
      if (!walletClient) throw new Error('Wallet not connected')
      return ContractInteractions.withdrawTrust(amount, walletClient)
    },

    getTrustBalance: () =>
      ContractInteractions.getTrustBalance(address!),

    // Factory operations
    getFactoryStats: () =>
      ContractInteractions.getFactoryStats(),

    getTokensByCreator: (creatorAddress: string) =>
      ContractInteractions.getTokensByCreator(creatorAddress),

    getCreatorTokenCount: (creatorAddress: string) =>
      ContractInteractions.getCreatorTokenCount(creatorAddress),

    isTokenCreator: (creatorAddress: string, tokenAddress: string) =>
      ContractInteractions.isTokenCreator(creatorAddress, tokenAddress),

    // Utility
    isConnected: !!walletClient && !!address,
  }
}