const { ethers } = require("hardhat");

async function main() {
  console.log("Creating a new meme token...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Creating token with account:", deployer.address);

  // Load deployment info
  let deploymentInfo;
  try {
    const fs = require("fs");
    deploymentInfo = JSON.parse(fs.readFileSync("deployment.json", "utf8"));
  } catch (error) {
    console.error("❌ deployment.json not found. Please run deploy.js first.");
    process.exit(1);
  }

  // Get contract addresses
  const factoryAddress = deploymentInfo.contracts.MemeLaunchpadFactory;
  const trustTokenAddress = deploymentInfo.contracts.TRUST_Token;

  if (!factoryAddress) {
    console.error("❌ Factory address not found in deployment.json");
    process.exit(1);
  }

  console.log("Using Factory at:", factoryAddress);

  // Get token parameters from command line or environment
  const name = process.env.TOKEN_NAME || process.argv[2] || "My Meme Token";
  const symbol = process.env.TOKEN_SYMBOL || process.argv[3] || "MMT";
  const maxSupply = process.env.MAX_SUPPLY ?
    ethers.utils.parseEther(process.env.MAX_SUPPLY) :
    ethers.utils.parseEther(process.argv[4] || "1000000");

  console.log("Token parameters:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Max Supply:", ethers.utils.formatEther(maxSupply), "tokens");

  // Attach to factory contract
  const MemeLaunchpadFactory = await ethers.getContractFactory("MemeLaunchpadFactory");
  const factory = MemeLaunchpadFactory.attach(factoryAddress);

  // Check if creator has enough TRUST tokens for creation fee
  const creationFee = await factory.CREATION_FEE();
  console.log("Creation fee required:", ethers.utils.formatEther(creationFee), "TRUST");

  // Get TRUST token contract to check balance
  const trustToken = await ethers.getContractAt("IERC20", trustTokenAddress);
  const balance = await trustToken.balanceOf(deployer.address);

  if (balance.lt(creationFee)) {
    console.error("❌ Insufficient TRUST balance for creation fee");
    console.log("Required:", ethers.utils.formatEther(creationFee));
    console.log("Available:", ethers.utils.formatEther(balance));
    process.exit(1);
  }

  // Approve factory to spend TRUST tokens
  console.log("Approving factory to spend TRUST tokens...");
  await trustToken.approve(factory.address, creationFee);

  // Create the token
  console.log("Creating meme token...");
  const tx = await factory.createMemeToken(name, symbol, maxSupply);

  console.log("Transaction hash:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Token created successfully!");

  // Extract token and bonding curve addresses from events
  const tokenCreatedEvent = receipt.events?.find(e => e.event === 'TokenCreated');

  if (!tokenCreatedEvent) {
    console.error("❌ TokenCreated event not found");
    process.exit(1);
  }

  const tokenAddress = tokenCreatedEvent.args.token;
  const bondingCurveAddress = tokenCreatedEvent.args.bondingCurve;
  const creator = tokenCreatedEvent.args.creator;

  console.log("\n📋 Token Creation Details:");
  console.log("Token Address:", tokenAddress);
  console.log("Bonding Curve Address:", bondingCurveAddress);
  console.log("Creator Address:", creator);
  console.log("Token Name:", name);
  console.log("Token Symbol:", symbol);
  console.log("Max Supply:", ethers.utils.formatEther(maxSupply));

  console.log("\n🔗 View Token on Explorer: https://intuition-testnet.explorer.caldera.xyz/address/" + tokenAddress);
  console.log("🔗 View Bonding Curve on Explorer: https://intuition-testnet.explorer.caldera.xyz/address/" + bondingCurveAddress);

  // Get token and bonding curve contracts for additional info
  const MemeToken = await ethers.getContractFactory("MemeToken");
  const BondingCurve = await ethers.getContractFactory("BondingCurve");

  const token = MemeToken.attach(tokenAddress);
  const bondingCurve = BondingCurve.attach(bondingCurveAddress);

  // Check creator allocation
  const creatorAllocation = await token.creatorAllocation();
  console.log("Creator Allocation:", ethers.utils.formatEther(creatorAllocation), "tokens (0.1%)");

  // Check initial price
  const initialPrice = await bondingCurve.getCurrentPrice();
  console.log("Initial Token Price:", ethers.utils.formatEther(initialPrice), "TRUST");

  // Update deployment.json with new token info
  if (!deploymentInfo.tokens) {
    deploymentInfo.tokens = [];
  }

  deploymentInfo.tokens.push({
    name: name,
    symbol: symbol,
    address: tokenAddress,
    bondingCurveAddress: bondingCurveAddress,
    maxSupply: maxSupply.toString(),
    creator: creator,
    createdAt: new Date().toISOString(),
    blockNumber: receipt.blockNumber
  });

  const fs = require("fs");
  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Updated deployment.json with new token information");
  console.log("\n🎉 Token creation completed!");
  console.log("\nNext steps:");
  console.log("1. Start trading: Use the bonding curve at", bondingCurveAddress);
  console.log("2. Check token info: View at", tokenAddress);
  console.log("3. Create more tokens or run tests");

  return {
    tokenAddress,
    bondingCurveAddress,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Token creation failed:", error);
    process.exit(1);
  });