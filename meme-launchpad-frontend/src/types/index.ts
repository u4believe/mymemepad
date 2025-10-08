export interface TokenInfo {
  name: string
  symbol: string
  decimals: number
  totalSupply: string
  address: string
}

export interface BondingCurveStats {
  tokensSold: string
  trustReceived: string
  trustReserve: string
  currentPrice: string
  marketCap: string
}

export interface TokenWithBondingCurve {
  token: TokenInfo
  bondingCurveAddress: string
  stats: BondingCurveStats
  isMigrated: boolean
  pairAddress?: string
}

export interface CreateTokenForm {
  name: string
  symbol: string
  maxSupply: string
}

export interface TradeForm {
  tokenAmount: string
  minTrustRequired?: string
}