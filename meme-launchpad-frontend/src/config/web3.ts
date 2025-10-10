import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors'

// Intuition Testnet Configuration
export const intuitionTestnet = {
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
      http: ['https://testnet.rpc.intuition.systems'],
    },
    public: {
      http: ['https://testnet.rpc.intuition.systems'],
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
  connectors: [
    injected(),
    walletConnect({ projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || 'demo' }),
    metaMask(),
    coinbaseWallet({
      appName: 'Meme Launchpad',
      appLogoUrl: 'https://example.com/logo.png',
    }),
  ],
  transports: {
    [intuitionTestnet.id]: http(intuitionTestnet.rpcUrls.default.http[0]),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}