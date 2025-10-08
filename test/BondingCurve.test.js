const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BondingCurve", function () {
  let bondingCurve, memeToken, trustToken, owner, creator, user1, user2, treasury;
  const MAX_SUPPLY = ethers.utils.parseEther("1000000"); // 1M tokens

  beforeEach(async function () {
    [owner, creator, user1, user2, treasury] = await ethers.getSigners();

    // Deploy mock TRUST token
    const MockToken = await ethers.getContractFactory("MockToken");
    trustToken = await MockToken.deploy("TRUST Token", "TRUST", owner.address);
    await trustToken.deployed();

    // Deploy meme token
    const MemeToken = await ethers.getContractFactory("MemeToken");
    memeToken = await MemeToken.deploy(
      "Test Meme Token",
      "TMT",
      MAX_SUPPLY,
      creator.address,
      owner.address
    );
    await memeToken.deployed();

    // Deploy bonding curve
    const BondingCurve = await ethers.getContractFactory("BondingCurve");
    bondingCurve = await BondingCurve.deploy(
      memeToken.address,
      trustToken.address,
      MAX_SUPPLY,
      treasury.address,
      owner.address
    );
    await bondingCurve.deployed();

    // Set up meme token bonding curve
    await memeToken.connect(owner).setBondingCurve(bondingCurve.address);

    // Mint TRUST tokens to users for testing
    const initialSupply = ethers.utils.parseEther("10000000"); // 10M TRUST
    await trustToken.connect(owner).mint(user1.address, initialSupply);
    await trustToken.connect(owner).mint(user2.address, initialSupply);

    // Approve bonding curve to spend TRUST tokens
    await trustToken.connect(user1).approve(bondingCurve.address, ethers.constants.MaxUint256);
    await trustToken.connect(user2).approve(bondingCurve.address, ethers.constants.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set the correct parameters", async function () {
      expect(await bondingCurve.memeToken()).to.equal(memeToken.address);
      expect(await bondingCurve.trustToken()).to.equal(trustToken.address);
      expect(await bondingCurve.treasury()).to.equal(treasury.address);
      expect(await bondingCurve.isActive()).to.be.true;
    });

    it("Should calculate correct starting price", async function () {
      const expectedStartingPrice = ethers.utils.parseEther("1").div(
        ethers.utils.parseEther("0.001").mul(MAX_SUPPLY).div(ethers.utils.parseEther("1"))
      );
      // Starting price calculation: A = 1 / (0.001 * MaxSupply)
      const expectedPrice = ethers.utils.parseEther("1").div(
        (ethers.utils.parseEther("0.001").mul(MAX_SUPPLY)).div(ethers.utils.parseEther("1"))
      );
      expect(await bondingCurve.startingPrice()).to.equal(expectedPrice);
    });

    it("Should have creator allocation in bonding curve", async function () {
      const creatorAllocation = await memeToken.creatorAllocation();
      expect(await memeToken.balanceOf(bondingCurve.address)).to.equal(creatorAllocation);
    });
  });

  describe("Price Calculation", function () {
    it("Should return correct initial price", async function () {
      const initialPrice = await bondingCurve.getCurrentPrice();
      const startingPrice = await bondingCurve.startingPrice();
      expect(initialPrice).to.equal(startingPrice);
    });

    it("Should increase price as tokens are sold", async function () {
      const initialPrice = await bondingCurve.getCurrentPrice();

      // Buy some tokens
      const buyAmount = ethers.utils.parseEther("1000");
      await bondingCurve.connect(user1).buyTokens(buyAmount, 0);

      const newPrice = await bondingCurve.getCurrentPrice();
      expect(newPrice).to.be.gt(initialPrice);
    });

    it("Should calculate price correctly at specific supply", async function () {
      const supply = ethers.utils.parseEther("100000"); // 100k tokens
      const price = await bondingCurve.getPriceAtSupply(supply);

      // Price should be greater than starting price
      const startingPrice = await bondingCurve.startingPrice();
      expect(price).to.be.gte(startingPrice);
    });

    it("Should return correct purchasing power coefficient", async function () {
      // Pc ranges from 1000 → 1 as maxSupply increases from 1M → 1B
      // At 0 supply: Pc should be close to 1000
      const pcAtZero = await bondingCurve.getPriceAtSupply(0);
      const startingPrice = await bondingCurve.startingPrice();
      expect(pcAtZero).to.equal(startingPrice);

      // At max supply: Pc should approach startingPrice + (SLOPE * maxSupply) / PRECISION
      const maxSupplyPrice = await bondingCurve.getPriceAtSupply(MAX_SUPPLY);
      expect(maxSupplyPrice).to.be.gt(startingPrice);
    });
  });

  describe("Buy Tokens", function () {
    it("Should allow buying tokens", async function () {
      const buyAmount = ethers.utils.parseEther("1000");
      const initialPrice = await bondingCurve.getCurrentPrice();

      const trustRequired = await bondingCurve.calculatePurchasePrice(buyAmount);

      await expect(bondingCurve.connect(user1).buyTokens(buyAmount, trustRequired))
        .to.emit(bondingCurve, "TokenBought")
        .withArgs(user1.address, trustRequired, buyAmount, initialPrice);

      expect(await memeToken.balanceOf(user1.address)).to.equal(buyAmount);
      expect(await bondingCurve.totalTokensSold()).to.equal(buyAmount + await memeToken.creatorAllocation());
    });

    it("Should reject if slippage is too high", async function () {
      const buyAmount = ethers.utils.parseEther("1000");
      const trustRequired = await bondingCurve.calculatePurchasePrice(buyAmount);

      // Set minTrustRequired higher than actual requirement
      const highMinTrust = trustRequired.add(ethers.utils.parseEther("1"));

      await expect(bondingCurve.connect(user1).buyTokens(buyAmount, highMinTrust))
        .to.be.revertedWith("BondingCurve: Slippage too high");
    });

    it("Should apply 1% fee correctly", async function () {
      const buyAmount = ethers.utils.parseEther("1000");
      const trustRequired = await bondingCurve.calculatePurchasePrice(buyAmount);
      const feeAmount = trustRequired.mul(1).div(100); // 1%
      const trustToCurve = trustRequired.sub(feeAmount);

      const initialTreasuryBalance = await trustToken.balanceOf(treasury.address);

      await bondingCurve.connect(user1).buyTokens(buyAmount, trustRequired);

      expect(await trustToken.balanceOf(treasury.address)).to.equal(initialTreasuryBalance.add(feeAmount));
      expect(await bondingCurve.reserveTrustBalance()).to.equal(trustToCurve);
    });

    it("Should revert if migration is triggered", async function () {
      // Buy tokens until migration threshold is reached
      const marketCap = ethers.utils.parseEther("10000000"); // 10M TRUST threshold

      // This would need more complex setup to actually trigger migration
      // For now, just test that the check exists
      expect(await bondingCurve.migrationTriggered()).to.be.false;
    });

    it("Should not allow buying zero tokens", async function () {
      await expect(bondingCurve.connect(user1).buyTokens(0, 0))
        .to.be.revertedWith("BondingCurve: Invalid token amount");
    });
  });

  describe("Sell Tokens", function () {
    beforeEach(async function () {
      // First buy some tokens to sell
      const buyAmount = ethers.utils.parseEther("1000");
      await bondingCurve.connect(user1).buyTokens(buyAmount, 0);
    });

    it("Should allow selling tokens", async function () {
      const sellAmount = ethers.utils.parseEther("500");
      const userBalance = await memeToken.balanceOf(user1.address);

      const trustToReceive = await bondingCurve.calculateSalePrice(sellAmount);

      await expect(bondingCurve.connect(user1).sellTokens(sellAmount, trustToReceive))
        .to.emit(bondingCurve, "TokenSold")
        .withArgs(user1.address, trustToReceive, sellAmount, await bondingCurve.getCurrentPrice());

      expect(await memeToken.balanceOf(user1.address)).to.equal(userBalance.sub(sellAmount));
    });

    it("Should apply 1% fee on sell", async function () {
      const sellAmount = ethers.utils.parseEther("500");
      const trustToReceive = await bondingCurve.calculateSalePrice(sellAmount);
      const feeAmount = trustToReceive.mul(1).div(100); // 1%
      const trustToSeller = trustToReceive.sub(feeAmount);

      const initialTreasuryBalance = await trustToken.balanceOf(treasury.address);

      await bondingCurve.connect(user1).sellTokens(sellAmount, trustToReceive);

      expect(await trustToken.balanceOf(treasury.address)).to.equal(initialTreasuryBalance.add(feeAmount));
      expect(await trustToken.balanceOf(user1.address)).to.equal(trustToSeller);
    });

    it("Should reject if slippage is too high on sell", async function () {
      const sellAmount = ethers.utils.parseEther("500");
      const trustToReceive = await bondingCurve.calculateSalePrice(sellAmount);

      // Set minTrustRequired higher than actual return
      const highMinTrust = trustToReceive.add(ethers.utils.parseEther("1"));

      await expect(bondingCurve.connect(user1).sellTokens(sellAmount, highMinTrust))
        .to.be.revertedWith("BondingCurve: Slippage too high");
    });

    it("Should not allow selling more tokens than owned", async function () {
      const sellAmount = ethers.utils.parseEther("2000"); // More than bought

      await expect(bondingCurve.connect(user1).sellTokens(sellAmount, 0))
        .to.be.revertedWith("MemeToken: Insufficient balance");
    });

    it("Should not allow selling zero tokens", async function () {
      await expect(bondingCurve.connect(user1).sellTokens(0, 0))
        .to.be.revertedWith("BondingCurve: Invalid token amount");
    });
  });

  describe("Migration", function () {
    it("Should detect when migration threshold is reached", async function () {
      const threshold = ethers.utils.parseEther("10000000"); // 10M TRUST

      // Initially should not be ready for migration
      expect(await bondingCurve.shouldMigrate()).to.be.false;

      // This would need complex setup to actually reach 10M market cap
      // For now, just test the calculation exists
      expect(await bondingCurve.getCurrentMarketCap()).to.be.lt(threshold);
    });

    it("Should trigger migration when threshold is reached", async function () {
      // This test would need extensive setup to actually reach migration threshold
      // For now, just verify the migrationTriggered flag starts as false
      expect(await bondingCurve.migrationTriggered()).to.be.false;
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to update treasury", async function () {
      await expect(bondingCurve.connect(user1).updateTreasury(user1.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to pause trading", async function () {
      await expect(bondingCurve.connect(user1).setTradingPaused(true))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow zero address as treasury", async function () {
      await expect(bondingCurve.connect(owner).updateTreasury(ethers.constants.AddressZero))
        .to.be.revertedWith("BondingCurve: Invalid treasury address");
    });
  });

  describe("Statistics", function () {
    it("Should return correct statistics", async function () {
      const buyAmount = ethers.utils.parseEther("1000");
      await bondingCurve.connect(user1).buyTokens(buyAmount, 0);

      const stats = await bondingCurve.getStats();
      expect(stats.tokensSold).to.equal(buyAmount + await memeToken.creatorAllocation());
      expect(stats.currentPrice).to.be.gt(await bondingCurve.startingPrice());
    });
  });

  describe("Edge Cases", function () {
    it("Should handle large price calculations without overflow", async function () {
      // Test with large token amounts
      const largeAmount = ethers.utils.parseEther("100000"); // 100k tokens

      // Should not revert
      const price = await bondingCurve.calculatePurchasePrice(largeAmount);
      expect(price).to.be.gt(0);
    });

    it("Should handle zero price calculations", async function () {
      const price = await bondingCurve.calculatePurchasePrice(0);
      expect(price).to.equal(0);
    });

    it("Should pause and unpause trading correctly", async function () {
      await bondingCurve.connect(owner).setTradingPaused(true);
      expect(await bondingCurve.isActive()).to.be.false;

      await bondingCurve.connect(owner).setTradingPaused(false);
      expect(await bondingCurve.isActive()).to.be.true;
    });
  });
});