import { Contract, BrowserProvider, formatEther, parseEther } from 'ethers'
import { intuitionTestnet } from '../config/web3'

// Contract addresses (deployed from previous step)
export const CONTRACT_ADDRESSES = {
  FACTORY: '0xD9E849B6d44946B0D0FAEafe34b92C79c68cCbeF',
  MIGRATOR: '0xb0795283433ABD4694294E3C8aC2421977333908',
  TRUST_TOKEN: '0x956578Eb413210231cCeDa522ee60C31a8d72F93',
}

// Contract ABIs
export const FACTORY_ABI = [
  // View functions
  'function getTokenCount() external view returns (uint256)',
  'function getTokensInRange(uint256 startIndex, uint256 endIndex) external view returns (address[] memory)',
  'function getBondingCurve(address tokenAddress) external view returns (address)',
  'function getToken(address bondingCurveAddress) external view returns (address)',
  'function isRegistered(address tokenAddress) external view returns (bool)',
  'function getStats() external view returns (uint256 tokenCount, address treasuryAddress, uint256 creationFee)',

  // Write functions
  'function createMemeToken(string calldata name, string calldata symbol, uint256 maxSupply) external returns (address tokenAddress, address bondingCurveAddress)',

  // Events
  'event TokenCreated(address indexed token, address indexed bondingCurve, address indexed creator, string name, string symbol, uint256 maxSupply)',
]

export const BONDING_CURVE_ABI = [
  // View functions
  'function getCurrentPrice() external view returns (uint256)',
  'function getCurrentMarketCap() external view returns (uint256)',
  'function shouldMigrate() external view returns (bool)',
  'function calculatePurchasePrice(uint256 tokenAmount) external view returns (uint256)',
  'function calculateSalePrice(uint256 tokenAmount) external view returns (uint256)',
  'function getStats() external view returns (uint256 tokensSold, uint256 trustReceived, uint256 trustReserve, uint256 currentPrice, uint256 marketCap)',

  // Write functions
  'function buyTokens(uint256 tokenAmount, uint256 minTrustRequired) external returns (uint256 trustRequired)',
  'function sellTokens(uint256 tokenAmount, uint256 minTrustRequired) external returns (uint256 trustReceived)',
  'function setTradingPaused(bool paused) external',
]

export const MIGRATOR_ABI = [
  // View functions
  'function isTokenMigrated(address tokenAddress) external view returns (bool)',
  'function getPair(address tokenAddress) external view returns (address)',

  // Write functions
  'function migrateToDEX(address tokenAddress, address bondingCurveAddress) external returns (address pairAddress, uint256 liquidity)',
]

export const ERC20_ABI = [
  // View functions
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',

  // Write functions
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
]

class ContractService {
  private provider: BrowserProvider | null = null

  async connectWallet(): Promise<string | null> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed')
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      this.provider = new BrowserProvider(window.ethereum)
      const signer = await this.provider.getSigner()
      return await signer.getAddress()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      return null
    }
  }

  async getProvider(): Promise<BrowserProvider> {
    if (!this.provider) {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }
      this.provider = new BrowserProvider(window.ethereum)
    }
    return this.provider
  }

  async getSigner() {
    const provider = await this.getProvider()
    return await provider.getSigner()
  }

  // Factory Contract Functions
  async createMemeToken(name: string, symbol: string, maxSupply: string) {
    const signer = await this.getSigner()
    const factoryContract = new Contract(CONTRACT_ADDRESSES.FACTORY, FACTORY_ABI, signer)

    const tx = await factoryContract.createMemeToken(name, symbol, maxSupply)
    return await tx.wait()
  }

  async getTokenCount() {
    const provider = await this.getProvider()
    const factoryContract = new Contract(CONTRACT_ADDRESSES.FACTORY, FACTORY_ABI, provider)
    return await factoryContract.getTokenCount()
  }

  async getTokensInRange(startIndex: number, endIndex: number) {
    const provider = await this.getProvider()
    const factoryContract = new Contract(CONTRACT_ADDRESSES.FACTORY, FACTORY_ABI, provider)
    return await factoryContract.getTokensInRange(startIndex, endIndex)
  }

  async getBondingCurve(tokenAddress: string) {
    const provider = await this.getProvider()
    const factoryContract = new Contract(CONTRACT_ADDRESSES.FACTORY, FACTORY_ABI, provider)
    return await factoryContract.getBondingCurve(tokenAddress)
  }

  // Bonding Curve Functions
  async buyTokens(bondingCurveAddress: string, tokenAmount: string, minTrustRequired: string) {
    const signer = await this.getSigner()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, signer)

    const tx = await bondingCurveContract.buyTokens(tokenAmount, minTrustRequired)
    return await tx.wait()
  }

  async sellTokens(bondingCurveAddress: string, tokenAmount: string, minTrustRequired: string) {
    const signer = await this.getSigner()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, signer)

    const tx = await bondingCurveContract.sellTokens(tokenAmount, minTrustRequired)
    return await tx.wait()
  }

  async getCurrentPrice(bondingCurveAddress: string) {
    const provider = await this.getProvider()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, provider)
    const price = await bondingCurveContract.getCurrentPrice()
    return formatEther(price)
  }

  async getCurrentMarketCap(bondingCurveAddress: string) {
    const provider = await this.getProvider()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, provider)
    const marketCap = await bondingCurveContract.getCurrentMarketCap()
    return formatEther(marketCap)
  }

  async shouldMigrate(bondingCurveAddress: string) {
    const provider = await this.getProvider()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, provider)
    return await bondingCurveContract.shouldMigrate()
  }

  async calculatePurchasePrice(bondingCurveAddress: string, tokenAmount: string) {
    const provider = await this.getProvider()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, provider)
    const price = await bondingCurveContract.calculatePurchasePrice(parseEther(tokenAmount))
    return formatEther(price)
  }

  async calculateSalePrice(bondingCurveAddress: string, tokenAmount: string) {
    const provider = await this.getProvider()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, provider)
    const price = await bondingCurveContract.calculateSalePrice(parseEther(tokenAmount))
    return formatEther(price)
  }

  async getBondingCurveStats(bondingCurveAddress: string) {
    const provider = await this.getProvider()
    const bondingCurveContract = new Contract(bondingCurveAddress, BONDING_CURVE_ABI, provider)
    const stats = await bondingCurveContract.getStats()
    return {
      tokensSold: formatEther(stats[0]),
      trustReceived: formatEther(stats[1]),
      trustReserve: formatEther(stats[2]),
      currentPrice: formatEther(stats[3]),
      marketCap: formatEther(stats[4]),
    }
  }

  // Token Functions
  async getTokenInfo(tokenAddress: string) {
    const provider = await this.getProvider()
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider)

    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.totalSupply(),
    ])

    return {
      name,
      symbol,
      decimals,
      totalSupply: formatEther(totalSupply),
      address: tokenAddress,
    }
  }

  async getTokenBalance(tokenAddress: string, userAddress: string) {
    const provider = await this.getProvider()
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider)
    const balance = await tokenContract.balanceOf(userAddress)
    return formatEther(balance)
  }

  async approveToken(tokenAddress: string, spenderAddress: string, amount: string) {
    const signer = await this.getSigner()
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer)

    const tx = await tokenContract.approve(spenderAddress, parseEther(amount))
    return await tx.wait()
  }

  // Migration Functions
  async migrateToDEX(tokenAddress: string, bondingCurveAddress: string) {
    const signer = await this.getSigner()
    const migratorContract = new Contract(CONTRACT_ADDRESSES.MIGRATOR, MIGRATOR_ABI, signer)

    const tx = await migratorContract.migrateToDEX(tokenAddress, bondingCurveAddress)
    return await tx.wait()
  }

  async isTokenMigrated(tokenAddress: string) {
    const provider = await this.getProvider()
    const migratorContract = new Contract(CONTRACT_ADDRESSES.MIGRATOR, MIGRATOR_ABI, provider)
    return await migratorContract.isTokenMigrated(tokenAddress)
  }

  async getPairAddress(tokenAddress: string) {
    const provider = await this.getProvider()
    const migratorContract = new Contract(CONTRACT_ADDRESSES.MIGRATOR, MIGRATOR_ABI, provider)
    return await migratorContract.getPair(tokenAddress)
  }
}

export const contractService = new ContractService()