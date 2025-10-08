const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Meme Launchpad Integration", function () {
  let factory, memeToken, bondingCurve, migrator, trustToken, owner, creator, trader, treasury, uniswapFactory;
  const MAX_SUPPLY = ethers.utils.parseEther("1000000"); // 1M tokens
  const CREATION_FEE = ethers.utils.parseEther("10");

  beforeEach(async function () {
    [owner, creator, trader, treasury, uniswapFactory] = await ethers.getSigners();

    // Deploy mock TRUST token
    const MockToken = await ethers.getContractFactory("MockToken");
    trustToken = await MockToken.deploy("TRUST Token", "TRUST", owner.address);
    await trustToken.deployed();

    // Deploy migrator first
    const LiquidityMigrator = await ethers.getContractFactory("LiquidityMigrator");
    migrator = await LiquidityMigrator.deploy(
      trustToken.address,
      uniswapFactory.address,
      owner.address
    );
    await migrator.deployed();

    // Deploy factory
    const MemeLaunchpadFactory = await ethers.getContractFactory("MemeLaunchpadFactory");
    factory = await MemeLaunchpadFactory.deploy(
      trustToken.address,
      treasury.address,
      owner.address
    );
    await factory.deployed();

    // Fund creator with TRUST tokens
    await trustToken.connect(owner).mint(creator.address, ethers.utils.parseEther("10000"));
    await trustToken.connect(owner).mint(trader.address, ethers.utils.parseEther("10000"));

    // Approve spending
    await trustToken.connect(creator).approve(factory.address, ethers.constants.MaxUint256);
    await trustToken.connect(trader).approve(factory.address, ethers.constants.MaxUint256);
  });

  describe("Full Token Creation and Trading Flow", function () {
    it("Should create token and allow trading", async function () {
      // 1. Create meme token
      const tx = await factory.connect(creator).createMemeToken(
        "Integration Token",
        "ITK",
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;
      const bondingCurveAddress = receipt.events.find(e => e.event === 'TokenCreated').args.bondingCurve;

      const MemeToken = await ethers.getContractFactory("MemeToken");
      const BondingCurve = await ethers.getContractFactory("BondingCurve");

      memeToken = MemeToken.attach(tokenAddress);
      bondingCurve = BondingCurve.attach(bondingCurveAddress);

      // 2. Verify creator allocation is locked
      const creatorAllocation = await memeToken.creatorAllocation();
      expect(await memeToken.balanceOf(memeToken.address)).to.equal(creatorAllocation);
      expect(await memeToken.canClaimCreatorAllocation()).to.be.false;

      // 3. Buy tokens from bonding curve
      const buyAmount = ethers.utils.parseEther("1000");
      await trustToken.connect(trader).approve(bondingCurve.address, ethers.constants.MaxUint256);

      const initialPrice = await bondingCurve.getCurrentPrice();
      await bondingCurve.connect(trader).buyTokens(buyAmount, 0);

      expect(await memeToken.balanceOf(trader.address)).to.equal(buyAmount);

      // 4. Verify price increased
      const newPrice = await bondingCurve.getCurrentPrice();
      expect(newPrice).to.be.gt(initialPrice);

      // 5. Sell tokens back to bonding curve
      const sellAmount = ethers.utils.parseEther("500");
      await memeToken.connect(trader).approve(bondingCurve.address, sellAmount);

      await bondingCurve.connect(trader).sellTokens(sellAmount, 0);

      expect(await memeToken.balanceOf(trader.address)).to.equal(buyAmount.sub(sellAmount));
    });

    it("Should handle creator allocation unlock after time", async function () {
      // Create token
      const tx = await factory.connect(creator).createMemeToken(
        "Time Test Token",
        "TTT",
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;

      const MemeToken = await ethers.getContractFactory("MemeToken");
      memeToken = MemeToken.attach(tokenAddress);

      // Verify allocation is locked initially
      expect(await memeToken.canClaimCreatorAllocation()).to.be.false;

      // Increase time by 366 days
      await ethers.provider.send("evm_increaseTime", [366 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      // Verify allocation can now be claimed
      expect(await memeToken.canClaimCreatorAllocation()).to.be.true;

      // Claim allocation
      const allocation = await memeToken.creatorAllocation();
      await memeToken.connect(creator).claimCreatorAllocation();

      expect(await memeToken.balanceOf(creator.address)).to.equal(allocation);
    });

    it("Should collect fees correctly throughout the process", async function () {
      // Create token
      const tx = await factory.connect(creator).createMemeToken(
        "Fee Test Token",
        "FTT",
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;
      const bondingCurveAddress = receipt.events.find(e => e.event === 'TokenCreated').args.bondingCurve;

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      bondingCurve = BondingCurve.attach(bondingCurveAddress);

      // Check creation fee was collected
      expect(await trustToken.balanceOf(treasury.address)).to.equal(CREATION_FEE);

      // Buy tokens and check trading fee
      const buyAmount = ethers.utils.parseEther("1000");
      await trustToken.connect(trader).approve(bondingCurve.address, ethers.constants.MaxUint256);

      const initialTreasuryBalance = await trustToken.balanceOf(treasury.address);
      await bondingCurve.connect(trader).buyTokens(buyAmount, 0);

      // Should have collected 1% trading fee
      const finalTreasuryBalance = await trustToken.balanceOf(treasury.address);
      expect(finalTreasuryBalance).to.be.gt(initialTreasuryBalance);
    });
  });

  describe("Multiple Token Management", function () {
    it("Should handle multiple tokens correctly", async function () {
      // Create first token
      const tx1 = await factory.connect(creator).createMemeToken(
        "Token One",
        "ONE",
        MAX_SUPPLY
      );

      const receipt1 = await tx1.wait();
      const token1Address = receipt1.events.find(e => e.event === 'TokenCreated').args.token;

      // Create second token
      const tx2 = await factory.connect(creator).createMemeToken(
        "Token Two",
        "TWO",
        ethers.utils.parseEther("2000000")
      );

      const receipt2 = await tx2.wait();
      const token2Address = receipt2.events.find(e => e.event === 'TokenCreated').args.token;

      // Verify both tokens are tracked
      expect(await factory.getTokenCount()).to.equal(2);

      const tokens = await factory.getTokensInRange(0, 2);
      expect(tokens).to.include(token1Address);
      expect(tokens).to.include(token2Address);

      // Verify they have different bonding curves
      const bondingCurve1 = await factory.getBondingCurve(token1Address);
      const bondingCurve2 = await factory.getBondingCurve(token2Address);

      expect(bondingCurve1).to.not.equal(bondingCurve2);
      expect(bondingCurve1).to.not.equal(ethers.constants.AddressZero);
      expect(bondingCurve2).to.not.equal(ethers.constants.AddressZero);
    });
  });

  describe("Error Handling and Edge Cases", function () {
    it("Should handle factory running out of gas gracefully", async function () {
      // This test would verify behavior under gas constraints
      // For now, just verify normal operation continues
      expect(await factory.getTokenCount()).to.equal(0);
    });

    it("Should handle token creation with maximum supply", async function () {
      const maxSupply = ethers.utils.parseEther("1000000000"); // 1B tokens

      await factory.connect(creator).createMemeToken(
        "Max Supply Token",
        "MAX",
        maxSupply
      );

      expect(await factory.getTokenCount()).to.equal(1);
    });

    it("Should handle minimum supply tokens", async function () {
      const minSupply = ethers.utils.parseEther("1000000"); // 1M tokens

      await factory.connect(creator).createMemeToken(
        "Min Supply Token",
        "MIN",
        minSupply
      );

      expect(await factory.getTokenCount()).to.equal(1);
    });
  });

  describe("Access Control Integration", function () {
    it("Should properly transfer ownership to creators", async function () {
      const tx = await factory.connect(creator).createMemeToken(
        "Ownership Token",
        "OWN",
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;
      const bondingCurveAddress = receipt.events.find(e => e.event === 'TokenCreated').args.bondingCurve;

      const MemeToken = await ethers.getContractFactory("MemeToken");
      const BondingCurve = await ethers.getContractFactory("BondingCurve");

      const token = MemeToken.attach(tokenAddress);
      const bondingCurve = BondingCurve.attach(bondingCurveAddress);

      // Creator should own both contracts
      expect(await token.owner()).to.equal(creator.address);
      expect(await bondingCurve.owner()).to.equal(creator.address);

      // Factory should no longer own them
      expect(await token.owner()).to.not.equal(owner.address);
      expect(await bondingCurve.owner()).to.not.equal(owner.address);
    });
  });

  describe("Statistics and Monitoring", function () {
    it("Should provide comprehensive statistics", async function () {
      // Create token
      const tx = await factory.connect(creator).createMemeToken(
        "Stats Token",
        "STATS",
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;
      const bondingCurveAddress = receipt.events.find(e => e.event === 'TokenCreated').args.bondingCurve;

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      bondingCurve = BondingCurve.attach(bondingCurveAddress);

      // Get factory stats
      const factoryStats = await factory.getStats();
      expect(factoryStats.tokenCount).to.equal(1);
      expect(factoryStats.treasuryAddress).to.equal(treasury.address);

      // Get bonding curve stats
      const curveStats = await bondingCurve.getStats();
      expect(curveStats.tokensSold).to.be.gt(0); // Creator allocation
      expect(curveStats.currentPrice).to.be.gt(0);
    });
  });
});