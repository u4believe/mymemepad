import { CONTRACT_ADDRESSES, publicClient, createIntuitionWalletClient, intuitionSDK } from './web3'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'

// Contract ABIs
export const MEME_LAUNCHPAD_FACTORY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'maxSupply', type: 'uint256' },
      { name: 'creator', type: 'address' }
    ],
    name: 'createMemeToken',
    outputs: [{ name: '', type: 'address' }],
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
        args: [name, symbol, maxSupply, walletClient.account.address],
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
}

// React hooks for contract interactions
export const useContractInteractions = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  return {
    // Meme token operations
    createMemeToken: async (name: string, symbol: string, maxSupply: bigint) => {
      if (!walletClient) throw new Error('Wallet not connected')
      return ContractInteractions.createMemeToken(name, symbol, maxSupply, walletClient)
    },

    getMemeTokenInfo: (tokenAddress: string) =>
      ContractInteractions.getMemeTokenInfo(tokenAddress),

    getMemeTokenBalance: (tokenAddress: string) =>
      ContractInteractions.getMemeTokenBalance(tokenAddress, address!),

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

    // Utility
    isConnected: !!walletClient && !!address,
  }
}