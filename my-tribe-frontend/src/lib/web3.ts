import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import {
  getMultiVaultAddressFromChainId,
  intuitionTestnet as intuitionChain,
} from '@0xintuition/protocol'
import {
  createPublicClient,
  createWalletClient,
  http as httpClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

// Get project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Get the MultiVault address for Intuition Testnet
export const MULTI_VAULT_ADDRESS = getMultiVaultAddressFromChainId(intuitionChain.id)

// Define Intuition Testnet chain (already available from SDK)
const intuitionTestnet = {
  id: intuitionChain.id,
  name: intuitionChain.name,
  network: 'intuition-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'TTRUST',
    symbol: 'TTRUST',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_NETWORK_URL || 'https://testnet.rpc.intuition.systems'],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_NETWORK_URL || 'https://testnet.rpc.intuition.systems'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Intuition Explorer',
      url: 'https://intuition-testnet.explorer.caldera.xyz/',
    },
  },
  testnet: true,
} as const

export const config = createConfig({
  chains: [intuitionTestnet], // Only Intuition network allowed
  transports: {
    [intuitionTestnet.id]: http(intuitionTestnet.rpcUrls.default.http[0]),
  },
})

// Contract addresses from environment variables
export const CONTRACT_ADDRESSES = {
  MEME_LAUNCHPAD_FACTORY: process.env.NEXT_PUBLIC_MEME_LAUNCHPAD_FACTORY_CONTRACT_ADDRESS || '',
  BONDING_CURVE: process.env.NEXT_PUBLIC_BONDING_CURVE_CONTRACT_ADDRESS || '',
  LIQUIDITY_MIGRATOR: process.env.NEXT_PUBLIC_LIQUIDITY_MIGRATOR_CONTRACT_ADDRESS || '',
  TREASURY: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || '',
  TRUST_TOKEN: process.env.NEXT_PUBLIC_TRUST_TOKEN_ADDRESS || '',
} as const

// Intuition SDK Client Setup
export const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: httpClient(intuitionTestnet.rpcUrls.default.http[0]),
})

// Create wallet client (for transactions)
export const createIntuitionWalletClient = (privateKey: `0x${string}`) => {
  const account = privateKeyToAccount(privateKey)
  return createWalletClient({
    chain: intuitionTestnet,
    transport: httpClient(intuitionTestnet.rpcUrls.default.http[0]),
    account: account,
  })
}

// Contract ABIs
export const MEME_LAUNCHPAD_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "trustToken_", "type": "address"},
      {"internalType": "address", "name": "treasury_", "type": "address"},
      {"internalType": "address", "name": "owner_", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "CREATION_FEE",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "allTokens",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "bondingCurveToToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "symbol", "type": "string"},
      {"internalType": "uint256", "name": "maxSupply", "type": "uint256"}
    ],
    "name": "createMemeToken",
    "outputs": [
      {"internalType": "address", "name": "tokenAddress", "type": "address"},
      {"internalType": "address", "name": "bondingCurveAddress", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "name": "creatorTokens",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
    "name": "getBondingCurve",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "creator", "type": "address"}],
    "name": "getCreatorTokenCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStats",
    "outputs": [
      {"internalType": "uint256", "name": "tokenCount", "type": "uint256"},
      {"internalType": "address", "name": "treasuryAddress", "type": "address"},
      {"internalType": "uint256", "name": "creationFee", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokenCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "creator", "type": "address"}],
    "name": "getTokensByCreator",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "name": "isCreatorToken",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isTokenRegistered",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "tokenToBondingCurve",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "trustToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newTreasury", "type": "address"}],
    "name": "updateTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export const MEME_TOKEN_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name_", "type": "string"},
      {"internalType": "string", "name": "symbol_", "type": "string"},
      {"internalType": "uint256", "name": "maxSupply_", "type": "uint256"},
      {"internalType": "address", "name": "creator_", "type": "address"},
      {"internalType": "address", "name": "owner_", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bondingCurve",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "burnFromBondingCurve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "canClaimCreatorAllocation",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimCreatorAllocation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creatorAllocation",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creatorAllocationClaimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creatorLockEndTime",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCreatorLockTimeRemaining",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lockDuration",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "mintToBondingCurve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "bondingCurve_", "type": "address"}],
    "name": "setBondingCurve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "from", "type": "address"},
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "value", "type": "uint256"}
    ],
    "name": "transferFrom",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export const BONDING_CURVE_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "memeToken_", "type": "address"},
      {"internalType": "address", "name": "trustToken_", "type": "address"},
      {"internalType": "uint256", "name": "maxSupply", "type": "uint256"},
      {"internalType": "address", "name": "treasury_", "type": "address"},
      {"internalType": "address", "name": "owner_", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minTrustRequired", "type": "uint256"}
    ],
    "name": "buyTokens",
    "outputs": [{"internalType": "uint256", "name": "trustRequired", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "fromTokens", "type": "uint256"},
      {"internalType": "uint256", "name": "toTokens", "type": "uint256"}
    ],
    "name": "calculatePriceIntegral",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
    "name": "calculatePurchasePrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenAmount", "type": "uint256"}],
    "name": "calculateSalePrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentMarketCap",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "supply", "type": "uint256"}],
    "name": "getPriceAtSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getStats",
    "outputs": [
      {"internalType": "uint256", "name": "tokensSold", "type": "uint256"},
      {"internalType": "uint256", "name": "trustReceived", "type": "uint256"},
      {"internalType": "uint256", "name": "trustReserve", "type": "uint256"},
      {"internalType": "uint256", "name": "currentPrice", "type": "uint256"},
      {"internalType": "uint256", "name": "marketCap", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "initializeTotalTokensSold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isActive",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "memeToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "migrationTriggered",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reserveTrustBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "tokenAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minTrustRequired", "type": "uint256"}
    ],
    "name": "sellTokens",
    "outputs": [{"internalType": "uint256", "name": "trustReceived", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "bool", "name": "paused", "type": "bool"}],
    "name": "setTradingPaused",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "shouldMigrate",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startingPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalTokensSold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalTrustReceived",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "trustToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newTreasury", "type": "address"}],
    "name": "updateTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export const LIQUIDITY_MIGRATOR_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "trustToken_", "type": "address"},
      {"internalType": "address", "name": "uniswapFactory_", "type": "address"},
      {"internalType": "address", "name": "owner_", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
    "name": "getPair",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isMigrated",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
    "name": "isTokenMigrated",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "tokenAddress", "type": "address"},
      {"internalType": "address", "name": "bondingCurveAddress", "type": "address"}
    ],
    "name": "migrateToDEX",
    "outputs": [
      {"internalType": "address", "name": "pairAddress", "type": "address"},
      {"internalType": "uint256", "name": "liquidity", "type": "uint256"}
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "pairToToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "tokenToPair",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "trustToken",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "uniswapFactory",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newFactory", "type": "address"}],
    "name": "updateUniswapFactory",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export const TRUST_TOKEN_ABI = [
  {
    "inputs": [],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Intuition SDK Utility Functions
export class IntuitionSDK {
  private publicClient: any
  private walletClient: any

  constructor(publicClient: any, walletClient?: any) {
    this.publicClient = publicClient
    this.walletClient = walletClient
  }

  // Deposit TTRUST tokens to MultiVault
  async deposit(amount: bigint, walletClient: any) {
    try {
      const hash = await walletClient.writeContract({
        address: MULTI_VAULT_ADDRESS,
        abi: [
          {
            inputs: [
              { name: 'amount', type: 'uint256' },
              { name: 'recipient', type: 'address' }
            ],
            name: 'deposit',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'payable',
            type: 'function'
          }
        ],
        functionName: 'deposit',
        args: [amount, walletClient.account.address],
        value: amount,
      })
      return hash
    } catch (error) {
      console.error('Deposit failed:', error)
      throw error
    }
  }

  // Withdraw TTRUST tokens from MultiVault
  async withdraw(amount: bigint, walletClient: any) {
    try {
      const hash = await walletClient.writeContract({
        address: MULTI_VAULT_ADDRESS,
        abi: [
          {
            inputs: [{ name: 'amount', type: 'uint256' }],
            name: 'withdraw',
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'nonpayable',
            type: 'function'
          }
        ],
        functionName: 'withdraw',
        args: [amount],
      })
      return hash
    } catch (error) {
      console.error('Withdrawal failed:', error)
      throw error
    }
  }

  // Get TTRUST balance
  async getTrustBalance(address: string) {
    try {
      const balance = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.TRUST_TOKEN as `0x${string}`,
        abi: TRUST_TOKEN_ABI,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      })
      return balance
    } catch (error) {
      console.error('Failed to get balance:', error)
      throw error
    }
  }

  // Create a new meme token using the factory
  async createMemeToken(
    name: string,
    symbol: string,
    maxSupply: bigint,
    walletClient: any
  ) {
    try {
      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: [
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
          }
        ],
        functionName: 'createMemeToken',
        args: [name, symbol, maxSupply],
      })
      return hash
    } catch (error) {
      console.error('Failed to create meme token:', error)
      throw error
    }
  }

  // Get factory statistics
  async getFactoryStats() {
    try {
      const factory = await this.publicClient.readContract({
        address: CONTRACT_ADDRESSES.MEME_LAUNCHPAD_FACTORY as `0x${string}`,
        abi: [
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
        ],
        functionName: 'getStats',
      })
      return factory
    } catch (error) {
      console.error('Failed to get factory stats:', error)
      throw error
    }
  }
}

// Create default SDK instance
export const intuitionSDK = new IntuitionSDK(publicClient)

// Export the intuition testnet for use in other components
export { intuitionTestnet }

// Chain configuration
export const SUPPORTED_CHAINS = [
  {
    id: 13579,
    name: 'Intuition Testnet',
    network: 'intuition-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'TTRUST',
      symbol: 'TTRUST',
    },
    rpcUrls: {
      default: {
        http: [process.env.NEXT_PUBLIC_NETWORK_URL || 'https://testnet.rpc.intuition.systems'],
      },
      public: {
        http: [process.env.NEXT_PUBLIC_NETWORK_URL || 'https://testnet.rpc.intuition.systems'],
      },
    },
    blockExplorers: {
      default: {
        name: 'Intuition Explorer',
        url: 'https://intuition-testnet.explorer.caldera.xyz/',
      },
    },
    testnet: true,
  },
]