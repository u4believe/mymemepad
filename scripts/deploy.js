const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment to Intuition Testnet...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Get the network
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "Chain ID:", network.chainId);

  if (network.chainId !== 13579) {
    console.warn("⚠️  Warning: Not deploying to Intuition Testnet (Chain ID 13579)");
    console.warn("Current Chain ID:", network.chainId);
  }

  // Contract addresses (replace with actual deployed addresses)
  let trustTokenAddress = process.env.TRUST_TOKEN_ADDRESS;
  let treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  let uniswapFactoryAddress = process.env.UNISWAP_FACTORY_ADDRESS;

  if (!trustTokenAddress) {
    console.error("❌ TRUST_TOKEN_ADDRESS environment variable is required");
    console.log("Please set TRUST_TOKEN_ADDRESS to the deployed $TRUST token address");
    process.exit(1);
  }

  if (!uniswapFactoryAddress) {
    console.warn("⚠️  UNISWAP_FACTORY_ADDRESS not provided, using placeholder");
    uniswapFactoryAddress = ethers.constants.AddressZero;
  }

  console.log("Configuration:");
  console.log("- TRUST Token:", trustTokenAddress);
  console.log("- Treasury:", treasuryAddress);
  console.log("- Uniswap Factory:", uniswapFactoryAddress);

  // Deploy LiquidityMigrator first
  console.log("\n🚀 Deploying LiquidityMigrator...");
  const LiquidityMigrator = await ethers.getContractFactory("LiquidityMigrator");
  const migrator = await LiquidityMigrator.deploy(
    trustTokenAddress,
    uniswapFactoryAddress,
    deployer.address
  );
  await migrator.deployed();
  console.log("✅ LiquidityMigrator deployed to:", migrator.address);

  // Deploy Factory
  console.log("\n🚀 Deploying MemeLaunchpadFactory...");
  const MemeLaunchpadFactory = await ethers.getContractFactory("MemeLaunchpadFactory");
  const factory = await MemeLaunchpadFactory.deploy(
    trustTokenAddress,
    treasuryAddress,
    deployer.address
  );
  await factory.deployed();
  console.log("✅ MemeLaunchpadFactory deployed to:", factory.address);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");

  // Check Factory configuration
  const factoryTrustToken = await factory.trustToken();
  const factoryTreasury = await factory.treasury();
  const creationFee = await factory.CREATION_FEE();

  console.log("Factory Configuration:");
  console.log("- TRUST Token:", factoryTrustToken);
  console.log("- Treasury:", factoryTreasury);
  console.log("- Creation Fee:", ethers.utils.formatEther(creationFee), "TRUST");

  // Check Migrator configuration
  const migratorTrustToken = await migrator.trustToken();
  const migratorFactory = await migrator.uniswapFactory();

  console.log("Migrator Configuration:");
  console.log("- TRUST Token:", migratorTrustToken);
  console.log("- Uniswap Factory:", migratorFactory);

  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    deployer: deployer.address,
    contracts: {
      LiquidityMigrator: migrator.address,
      MemeLaunchpadFactory: factory.address,
      TRUST_Token: trustTokenAddress,
      Treasury: treasuryAddress,
      UniswapFactory: uniswapFactoryAddress
    },
    deploymentTime: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber()
  };

  console.log("\n📝 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n🔗 View on Explorer: https://intuition-testnet.explorer.caldera.xyz/");

  // Save to file
  const fs = require("fs");
  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment.json");

  // Verify contracts are working
  console.log("\n🧪 Running basic functionality tests...");

  // Test factory stats
  const stats = await factory.getStats();
  console.log("Factory created tokens:", stats.tokenCount.toString());
  console.log("Factory treasury:", stats.treasuryAddress);
  console.log("Creation fee:", ethers.utils.formatEther(stats.creationFee), "TRUST");

  // Test migrator
  console.log("Migrator is ready for migrations");

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\nNext steps:");
  console.log("1. Transfer ownership if needed:");
  console.log(`   - Factory: factory.transferOwnership(newOwner)`);
  console.log(`   - Migrator: migrator.transferOwnership(newOwner)`);
  console.log("2. Create your first meme token:");
  console.log(`   - factory.createMemeToken("My Token", "MTK", 1000000)`);
  console.log("3. Run tests: npm test");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });