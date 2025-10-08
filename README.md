# 🚀 Meme Launchpad Smart Contract System

A comprehensive DeFi platform for creating and trading meme tokens with bonding curve mechanics on the Intuition Testnet. Built with production-grade Solidity contracts, extensive testing, and deployment automation.

## 🌟 Features

### ✅ Complete Token Lifecycle Management
- **Factory Pattern**: Deploy new meme tokens with customizable parameters
- **Bonding Curve Pricing**: Dynamic price calculation based on supply and demand
- **Creator Incentives**: 0.1% allocation locked for 365 days
- **DEX Migration**: Automatic migration to UniswapV2-style pools at 10M $TRUST market cap

### ✅ Advanced Trading Mechanics
- **Buy/Sell Operations**: Full bonding curve trading with price appreciation
- **Fee Structure**: 1% slippage fee on all transactions
- **Slippage Protection**: Prevent front-running with minimum price requirements
- **Real-time Pricing**: Live price updates based on mathematical bonding curve formula

### ✅ Production-Ready Security
- **Reentrancy Protection**: All trading functions protected with ReentrancyGuard
- **Access Control**: Proper ownership and permission management
- **Input Validation**: Comprehensive parameter validation
- **Gas Optimization**: Efficient contract design with minimal storage reads

## 🏗️ Architecture

### Contract Structure

```
┌─────────────────────────────────────────────────────────┐
│                 MemeLaunchpadFactory                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              MemeToken (ERC20)                 │    │
│  │  • ERC20 functionality                         │    │
│  │  • Creator allocation (0.1%)                   │    │
│  │  • 365-day lock period                         │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │              BondingCurve                      │    │
│  │  • Price calculation: P = A×Pc + 0.000000001533×S│    │
│  │  • Buy/sell mechanics                          │    │
│  │  • Migration trigger at 10M $TRUST            │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │             LiquidityMigrator                  │    │
│  │  • UniswapV2-style pair creation              │    │
│  │  • Automatic liquidity provision              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Bonding Curve Formula

**Price Calculation:**
```
A = 1 / (0.001 × MaxSupply)
P = A × Pc + 0.000000001533 × S

Where:
- P = price per token in $TRUST
- A = starting price coefficient
- Pc = purchasing power coefficient (1000 → 1 as supply grows)
- S = total tokens sold via curve
- MaxSupply = maximum token supply (1M - 1B tokens)
```

**Market Cap Calculation:**
```
MarketCap = P × MaxSupply
Migration triggers when MarketCap ≥ 10,000,000 $TRUST
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** or **yarn**
- **Foundry** (for Solidity compilation)
- **MetaMask** or other Web3 wallet
- **$TRUST tokens** for deployment and testing

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd my-tribe-meme
npm install
```

2. **Install Foundry (if not already installed):**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

3. **Install OpenZeppelin contracts:**
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your settings
```

### Environment Configuration

Create a `.env` file (see `.env.example` for complete template):

```bash
# Private Key for Deployment
PRIVATE_KEY=your_private_key_here

# Network Configuration
NETWORK_URL=https://testnet.rpc.intuition.systems
CHAIN_ID=13579

# Contract Addresses (deploy these first)
TRUST_TOKEN_ADDRESS=0x... # Deployed $TRUST token address
TREASURY_ADDRESS=0x... # Your treasury address

# Optional: Uniswap Factory (deploy if not exists)
UNISWAP_FACTORY_ADDRESS=0x...

# Optional: API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 🚢 Deployment

### 1. Deploy Core Contracts

```bash
# Deploy factory and migrator to Intuition Testnet
npx hardhat run scripts/deploy.js --network intuition
```

This will deploy:
- **LiquidityMigrator**: Handles DEX migration
- **MemeLaunchpadFactory**: Main factory contract

### 2. Verify Deployment

```bash
# Verify all contracts are working correctly
npx hardhat run scripts/verify.js --network intuition
```

### 3. Create Your First Token

```bash
# Create a meme token
TOKEN_NAME="My Awesome Token"
TOKEN_SYMBOL="MAT"
MAX_SUPPLY="1000000"

npx hardhat run scripts/createToken.js --network intuition
```

Or use environment variables:

```bash
export TOKEN_NAME="My Awesome Token"
export TOKEN_SYMBOL="MAT"
export MAX_SUPPLY="1000000"

npx hardhat run scripts/createToken.js --network intuition
```

### Option 2: Foundry Deployment (Recommended for Solidity users)

#### 1. Deploy Core Contracts

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export TRUST_TOKEN_ADDRESS=0x... # Deployed $TRUST token
export TREASURY_ADDRESS=your_treasury_address

# Deploy using Foundry
forge script \
  --rpc-url https://testnet.rpc.intuition.systems \
  --private-key $PRIVATE_KEY \
  --chain 13579 \
  --broadcast \
  script/Deploy.s.sol:DeployScript
```

#### 2. Create Tokens with Foundry

```bash
# Set token parameters
export TOKEN_NAME="My Foundry Token"
export TOKEN_SYMBOL="MFT"
export MAX_SUPPLY=1000000000000000000000000

# Create token using Foundry script
forge script \
  --rpc-url https://testnet.rpc.intuition.systems \
  --private-key $PRIVATE_KEY \
  --chain 13579 \
  --broadcast \
  script/CreateToken.s.sol:CreateTokenScript
```

## 🧪 Testing

### Run Full Test Suite

#### Hardhat Tests (JavaScript)

```bash
# Run all tests
npm test

# Or with Hardhat
npx hardhat test

# Run specific test file
npx hardhat test test/MemeToken.test.js

# Run with gas reporting
npx hardhat test --network hardhat
```

#### Foundry Tests (Solidity)

```bash
# Run all Foundry tests
forge test

# Run specific test file
forge test --match-contract MemeTokenTest

# Run tests with verbosity
forge test -vvv

# Run tests on specific network
forge test --fork-url https://testnet.rpc.intuition.systems

# Run tests with gas reporting
forge test --gas-report
```

### Test Coverage

The test suite includes:

- **Unit Tests**: Individual contract functionality
- **Integration Tests**: Full system workflows
- **Edge Cases**: Error conditions and boundary values
- **Gas Optimization**: Efficient contract execution

### Test Files

- `test/MemeToken.test.js` - ERC20 token with creator allocation
- `test/BondingCurve.test.js` - Price calculation and trading
- `test/MemeLaunchpadFactory.test.js` - Token creation and registry
- `test/LiquidityMigrator.test.js` - DEX migration functionality
- `test/integration.test.js` - End-to-end workflows

## 💡 Usage Examples

### Creating a Meme Token

```javascript
// 1. Approve factory to spend $TRUST tokens (10 $TRUST fee)
await trustToken.approve(factory.address, ethers.utils.parseEther("10"));

// 2. Create token
const tx = await factory.createMemeToken(
  "My Meme Token",
  "MMT",
  ethers.utils.parseEther("1000000") // 1M max supply
);

// 3. Get deployed addresses
const receipt = await tx.wait();
const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;
const bondingCurveAddress = receipt.events.find(e => e.event === 'TokenCreated').args.bondingCurve;
```

### Buying Tokens

```javascript
// 1. Approve bonding curve to spend $TRUST
await trustToken.approve(bondingCurve.address, ethers.constants.MaxUint256);

// 2. Calculate price and buy
const buyAmount = ethers.utils.parseEther("1000");
const expectedPrice = await bondingCurve.calculatePurchasePrice(buyAmount);

// 3. Buy with slippage protection
await bondingCurve.buyTokens(buyAmount, expectedPrice.mul(95).div(100)); // 5% slippage tolerance
```

### Selling Tokens

```javascript
// 1. Approve bonding curve to spend tokens
await memeToken.approve(bondingCurve.address, sellAmount);

// 2. Calculate return and sell
const sellAmount = ethers.utils.parseEther("500");
const expectedReturn = await bondingCurve.calculateSalePrice(sellAmount);

// 3. Sell with slippage protection
await bondingCurve.sellTokens(sellAmount, expectedReturn.mul(95).div(100)); // 5% slippage tolerance
```

### Claiming Creator Allocation

```javascript
// After 365 days, creator can claim their allocation
await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
await ethers.provider.send("evm_mine");

await memeToken.connect(creator).claimCreatorAllocation();
```

## 🔧 Contract Addresses & Configuration

### Intuition Testnet (Chain ID: 13579)

After deployment, addresses will be saved to `deployment.json`:

```json
{
  "network": "intuition",
  "chainId": 13579,
  "contracts": {
    "MemeLaunchpadFactory": "0x...",
    "LiquidityMigrator": "0x...",
    "TRUST_Token": "0x...",
    "Treasury": "0x..."
  },
  "tokens": [
    {
      "name": "My Token",
      "symbol": "MTK",
      "address": "0x...",
      "bondingCurveAddress": "0x...",
      "maxSupply": "1000000000000000000000000"
    }
  ]
}
```

## 📊 Economics & Parameters

### Token Creation
- **Fee**: 10 $TRUST tokens
- **Supply Range**: 1,000,000 - 1,000,000,000 tokens
- **Creator Allocation**: 0.1% of total supply
- **Lock Period**: 365 days

### Trading Fees
- **Buy/Sell Fee**: 1% of transaction value
- **Fee Destination**: Protocol treasury
- **Slippage Protection**: Configurable minimum price

### Migration Threshold
- **Market Cap**: ≥ 10,000,000 $TRUST
- **Migration Type**: UniswapV2-style automated market maker
- **Liquidity**: All remaining bonding curve liquidity

## 🛠️ Development

### Project Structure

```
├── src/                    # Solidity contracts
│   ├── MemeToken.sol       # ERC20 token implementation
│   ├── BondingCurve.sol    # Price calculation & trading
│   ├── MemeLaunchpadFactory.sol # Factory contract
│   └── LiquidityMigrator.sol    # DEX migration
├── test/                   # Test files
│   ├── MemeToken.test.js
│   ├── BondingCurve.test.js
│   ├── MemeLaunchpadFactory.test.js
│   ├── LiquidityMigrator.test.js
│   ├── integration.test.js
│   ├── MemeToken.t.sol     # Foundry tests
│   ├── BondingCurve.t.sol  # Foundry tests
│   └── MockToken.sol       # Test helper
├── script/                 # Foundry deployment scripts
│   ├── Deploy.s.sol       # Foundry deployment
│   └── CreateToken.s.sol  # Foundry token creation
├── scripts/                # Hardhat deployment scripts
│   ├── deploy.js          # Main deployment
│   ├── createToken.js     # Token creation
│   └── verify.js          # Deployment verification
├── lib/                   # Dependencies
├── .env.example           # Environment variables template
├── foundry.toml           # Foundry configuration
└── hardhat.config.mjs     # Hardhat configuration
```

### Building Contracts

```bash
# Compile with Foundry
forge build

# Or compile with Hardhat
npx hardhat compile
```

### Development Commands

#### Hardhat Development

```bash
# Run tests
npm test

# Check test coverage
npx hardhat coverage

# Deploy locally
npx hardhat run scripts/deploy.js --network localhost

# Start local node
npx hardhat node

# Console/REPL
npx hardhat console --network intuition
```

#### Foundry Development

```bash
# Build contracts
forge build

# Run Foundry tests
forge test

# Deploy locally
forge script script/Deploy.s.sol:DeployScript --fork-url http://localhost:8545 --broadcast

# Deploy to Intuition Testnet
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url https://testnet.rpc.intuition.systems \
  --chain 13579 \
  --broadcast \
  --verify

# Foundry console/REPL
forge script script/Deploy.s.sol:DeployScript --rpc-url https://testnet.rpc.intuition.systems

# Gas snapshot
forge snapshot

# Format code
forge fmt

# Lint code
forge fmt --check
```

## 🔒 Security Considerations

### Audited Contract Features
- **ReentrancyGuard**: All state-changing functions protected
- **Access Control**: Proper ownership and permissions
- **Input Validation**: Comprehensive parameter checks
- **Overflow Protection**: SafeMath for all calculations
- **Gas Limits**: Optimized for reasonable gas costs

### Security Best Practices
- **Time Locks**: Creator allocation locked for 365 days
- **Slippage Protection**: Prevents sandwich attacks
- **Emergency Controls**: Owner can pause trading if needed
- **Gradual Migration**: Smooth transition from bonding curve to DEX

## 🚨 Risk Factors

### Smart Contract Risks
- **Price Volatility**: Bonding curve can experience rapid price changes
- **Liquidity Risks**: Low liquidity tokens may have high slippage
- **Migration Risks**: DEX migration may result in impermanent loss

### Operational Risks
- **Oracle Dependence**: No external price oracles used
- **Network Risks**: Depends on Intuition Testnet stability
- **Gas Price Fluctuations**: High gas may affect trading economics

## 📞 Support & Documentation

### Key Resources
- **Contract ABI**: Generated after compilation in `artifacts/`
- **Test Coverage**: Run tests for detailed functionality
- **Deployment Logs**: Check `deployment.json` for addresses
- **Network Explorer**: Use [Intuition Testnet Explorer](https://intuition-testnet.explorer.caldera.xyz/) for transactions

### Getting Help
1. **Run Tests**: `npm test` for functionality verification
2. **Check Logs**: Review console output for error messages
3. **Verify Deployment**: Use `scripts/verify.js` for troubleshooting
4. **Network Status**: Check Intuition Testnet status

## 🔄 Migration Guide

### From Bonding Curve to DEX

When market cap reaches 10M $TRUST:

1. **Automatic Detection**: Bonding curve detects threshold
2. **Liquidity Migration**: All remaining liquidity moves to DEX
3. **Trading Pause**: Bonding curve trading disabled
4. **LP Token Distribution**: Liquidity providers receive LP tokens
5. **AMM Trading**: Token trades on UniswapV2-style pool

### Post-Migration
- **Price Discovery**: Market-determined pricing
- **Liquidity Provision**: Standard AMM mechanics
- **Yield Farming**: LP tokens can be staked (if supported)
- **Token Utility**: Full DeFi composability

## 🎯 Roadmap

### Phase 1: Core Launch ✅
- [x] Factory contract deployment
- [x] Bonding curve implementation
- [x] Creator allocation system
- [x] Basic trading mechanics

### Phase 2: Advanced Features 🚧
- [ ] Multi-token pools
- [ ] Advanced order types
- [ ] Governance integration
- [ ] Cross-chain bridges

### Phase 3: Ecosystem Growth 📈
- [ ] Frontend integration
- [ ] Mobile app development
- [ ] Marketing campaigns
- [ ] Partnership integrations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow Solidity style guide (NatSpec comments)
- Ensure gas optimization for contract changes

---

**Built with ❤️ for the Intuition Testnet ecosystem**

Ready to launch the next viral meme token? 🚀
