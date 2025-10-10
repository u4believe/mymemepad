import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'

// Get project ID from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Define Intuition Testnet chain
const intuitionTestnet = {
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
} as const

export const config = createConfig({
  chains: [intuitionTestnet, mainnet, sepolia],
  transports: {
    [intuitionTestnet.id]: http(intuitionTestnet.rpcUrls.default.http[0]),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
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

// Contract ABIs
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
    "inputs": [],
    "name": "shouldMigrate",
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
    "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
    "name": "isTokenMigrated",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "tokenAddress", "type": "address"}],
    "name": "getPair",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
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