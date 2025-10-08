import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.alchemyapi.io/v2/your-api-key" // Optional forking for testing
      }
    },
    intuition: {
      url: "https://testnet.rpc.intuition.systems",
      chainId: 13579,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 20000000000 // 20 gwei
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || process.env.INTUITION_API_KEY,
    customChains: [
      {
        network: "intuition",
        chainId: 13579,
        urls: {
          apiURL: "https://intuition-testnet.explorer.caldera.xyz/api",
          browserURL: "https://intuition-testnet.explorer.caldera.xyz"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD"
  }
};