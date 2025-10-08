const { ethers } = require("hardhat");

async function main() {
  console.log("Verifying deployment on Intuition Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Verifying with account:", deployer.address);

  // Load deployment info
  let deploymentInfo;
  try {
    const fs = require("fs");
    deploymentInfo = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  } catch (error) {
    console.error("❌ deployment.json not found. Please run deploy.js first.");
    process.exit(1);
  }

  console.log("Deployment Info:");
  console.log("- Network:", deploymentInfo.network);
  console.log("- Chain ID:", deploymentInfo.chainId);
  console.log("- Deployer:", deploymentInfo.deployer);

  // Get contract addresses
  const factoryAddress = deploymentInfo.contracts.MemeLaunchpadFactory;
  const migratorAddress = deploymentInfo.contracts.LiquidityMigrator;
  const trustTokenAddress = deploymentInfo.contracts.TRUST_Token;

  console.log("\n📋 Contract Addresses:");
  console.log("Factory:", factoryAddress);
  console.log("Migrator:", migratorAddress);
  console.log("TRUST Token:", trustTokenAddress);

  // Verify Factory
  console.log("\n🔍 Verifying MemeLaunchpadFactory...");
  const MemeLaunchpadFactory = await ethers.getContractFactory("MemeLaunchpadFactory");
  const factory = MemeLaunchpadFactory.attach(factoryAddress);

  try {
    const factoryOwner = await factory.owner();
    const factoryTrustToken = await factory.trustToken();
    const factoryTreasury = await factory.treasury();
    const creationFee = await factory.CREATION_FEE();
    const tokenCount = await factory.getTokenCount();

    console.log("✅ Factory is operational:");
    console.log("  - Owner:", factoryOwner);
    console.log("  - TRUST Token:", factoryTrustToken);
    console.log("  - Treasury:", factoryTreasury);
    console.log("  - Creation Fee:", ethers.utils.formatEther(creationFee), "TRUST");
    console.log("  - Tokens Created:", tokenCount.toString());

    if (factoryOwner !== deployer.address) {
      console.warn("⚠️  Warning: Factory owner is not the deployer");
    }

  } catch (error) {
    console.error("❌ Factory verification failed:", error.message);
    return;
  }

  // Verify Migrator
  console.log("\n🔍 Verifying LiquidityMigrator...");
  const LiquidityMigrator = await ethers.getContractFactory("LiquidityMigrator");
  const migrator = LiquidityMigrator.attach(migratorAddress);

  try {
    const migratorOwner = await migrator.owner();
    const migratorTrustToken = await migrator.trustToken();
    const migratorFactory = await migrator.uniswapFactory();

    console.log("✅ Migrator is operational:");
    console.log("  - Owner:", migratorOwner);
    console.log("  - TRUST Token:", migratorTrustToken);
    console.log("  - Uniswap Factory:", migratorFactory);

    if (migratorOwner !== deployer.address) {
      console.warn("⚠️  Warning: Migrator owner is not the deployer");
    }

  } catch (error) {
    console.error("❌ Migrator verification failed:", error.message);
    return;
  }

  // Verify TRUST Token
  console.log("\n🔍 Verifying TRUST Token...");
  try {
    const trustToken = await ethers.getContractAt("IERC20", trustTokenAddress);
    const name = await trustToken.name();
    const symbol = await trustToken.symbol();
    const decimals = await trustToken.decimals();
    const deployerBalance = await trustToken.balanceOf(deployer.address);
    const totalSupply = await trustToken.totalSupply();

    console.log("✅ TRUST Token is operational:");
    console.log("  - Name:", name);
    console.log("  - Symbol:", symbol);
    console.log("  - Decimals:", decimals);
    console.log("  - Deployer Balance:", ethers.utils.formatEther(deployerBalance));
    console.log("  - Total Supply:", ethers.utils.formatEther(totalSupply));

  } catch (error) {
    console.error("❌ TRUST Token verification failed:", error.message);
    return;
  }

  // Check created tokens
  if (deploymentInfo.tokens && deploymentInfo.tokens.length > 0) {
    console.log("\n🔍 Verifying created tokens...");

    for (let i = 0; i < deploymentInfo.tokens.length; i++) {
      const tokenInfo = deploymentInfo.tokens[i];
      console.log(`\nToken ${i + 1}: ${tokenInfo.name} (${tokenInfo.symbol})`);

      try {
        const MemeToken = await ethers.getContractFactory("MemeToken");
        const BondingCurve = await ethers.getContractFactory("BondingCurve");

        const token = MemeToken.attach(tokenInfo.address);
        const bondingCurve = BondingCurve.attach(tokenInfo.bondingCurveAddress);

        const tokenName = await token.name();
        const tokenSymbol = await token.symbol();
        const maxSupply = await token.maxSupply();
        const creator = await token.creator();
        const currentPrice = await bondingCurve.getCurrentPrice();
        const totalTokensSold = await bondingCurve.totalTokensSold();

        console.log(`  ✅ Token ${i + 1} is operational:`);
        console.log("    - Name:", tokenName);
        console.log("    - Symbol:", tokenSymbol);
        console.log("    - Max Supply:", ethers.utils.formatEther(maxSupply));
        console.log("    - Creator:", creator);
        console.log("    - Current Price:", ethers.utils.formatEther(currentPrice), "TRUST");
        console.log("    - Total Sold:", ethers.utils.formatEther(totalTokensSold));

      } catch (error) {
        console.error(`❌ Token ${i + 1} verification failed:`, error.message);
      }
    }
  }

  // Network verification
  const network = await ethers.provider.getNetwork();
  console.log("\n🌐 Network Verification:");
  console.log("  - Current Chain ID:", network.chainId);
  console.log("  - Expected Chain ID:", deploymentInfo.chainId);

  if (network.chainId !== deploymentInfo.chainId) {
    console.error("❌ Network mismatch! Connected to wrong network.");
    return;
  }

  console.log("  ✅ Connected to correct network");

  // Gas price check
  const gasPrice = await ethers.provider.getGasPrice();
  console.log("  - Current Gas Price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei");

  // Block number check
  const currentBlock = await ethers.provider.getBlockNumber();
  console.log("  - Current Block:", currentBlock);
  console.log("  - Deployment Block:", deploymentInfo.blockNumber);

  console.log("\n🎉 All verifications completed successfully!");
  console.log("🚀 Your Meme Launchpad is ready to use!");

  console.log("\n🔗 Explorer: https://intuition-testnet.explorer.caldera.xyz/");

  if (deploymentInfo.tokens && deploymentInfo.tokens.length > 0) {
    console.log("\n📝 Quick Commands:");
    console.log(`   Deploy more tokens: node scripts/createToken.js "New Token" "NEW" 1000000`);
    console.log(`   Run tests: npx hardhat test`);
  } else {
    console.log("\n📝 Next Steps:");
    console.log(`   Create your first token: node scripts/createToken.js "My Token" "MTK" 1000000`);
    console.log(`   Run tests: npx hardhat test`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });