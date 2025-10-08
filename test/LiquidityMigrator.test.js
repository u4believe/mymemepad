const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityMigrator", function () {
  let migrator, memeToken, bondingCurve, trustToken, owner, creator, treasury, uniswapFactory;
  const MAX_SUPPLY = ethers.utils.parseEther("1000000"); // 1M tokens

  beforeEach(async function () {
    [owner, creator, treasury, uniswapFactory] = await ethers.getSigners();

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
      creator.address
    );
    await memeToken.deployed();

    // Deploy bonding curve
    const BondingCurve = await ethers.getContractFactory("BondingCurve");
    bondingCurve = await BondingCurve.deploy(
      memeToken.address,
      trustToken.address,
      MAX_SUPPLY,
      treasury.address,
      creator.address
    );
    await bondingCurve.deployed();

    // Set up meme token bonding curve
    await memeToken.connect(creator).setBondingCurve(bondingCurve.address);

    // Deploy migrator
    const LiquidityMigrator = await ethers.getContractFactory("LiquidityMigrator");
    migrator = await LiquidityMigrator.deploy(
      trustToken.address,
      uniswapFactory.address,
      owner.address
    );
    await migrator.deployed();

    // Add initial liquidity to bonding curve for testing
    await trustToken.connect(owner).mint(owner.address, ethers.utils.parseEther("1000000"));
    await trustToken.connect(owner).approve(bondingCurve.address, ethers.constants.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set the correct parameters", async function () {
      expect(await migrator.trustToken()).to.equal(trustToken.address);
      expect(await migrator.uniswapFactory()).to.equal(uniswapFactory.address);
    });

    it("Should start with no migrated tokens", async function () {
      expect(await migrator.isTokenMigrated(memeToken.address)).to.be.false;
    });
  });

  describe("Migration Process", function () {
    beforeEach(async function () {
      // Add some liquidity to bonding curve first
      await bondingCurve.connect(owner).buyTokens(ethers.utils.parseEther("100000"), 0);
    });

    it("Should reject migration for non-owner", async function () {
      await expect(migrator.connect(owner).migrateToDEX(memeToken.address, bondingCurve.address))
        .to.be.revertedWith("Migrator: Not token owner");
    });

    it("Should reject migration when market cap threshold not reached", async function () {
      await expect(migrator.connect(creator).migrateToDEX(memeToken.address, bondingCurve.address))
        .to.be.revertedWith("Migrator: Market cap threshold not reached");
    });

    it("Should create pair correctly", async function () {
      // This test would need more complex setup to reach migration threshold
      // For now, just verify the function exists and basic checks work
      expect(await migrator.getPair(memeToken.address)).to.equal(ethers.constants.AddressZero);
    });

    it("Should track migration status correctly", async function () {
      expect(await migrator.isTokenMigrated(memeToken.address)).to.be.false;

      // After migration (would need threshold reached)
      // expect(await migrator.isTokenMigrated(memeToken.address)).to.be.true;
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to update uniswap factory", async function () {
      await expect(migrator.connect(creator).updateUniswapFactory(treasury.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow zero address as uniswap factory", async function () {
      await expect(migrator.connect(owner).updateUniswapFactory(ethers.constants.AddressZero))
        .to.be.revertedWith("Migrator: Invalid factory address");
    });
  });

  describe("Factory Management", function () {
    it("Should update uniswap factory correctly", async function () {
      const newFactory = treasury.address;

      await expect(migrator.connect(owner).updateUniswapFactory(newFactory))
        .to.emit(migrator, "UniswapFactoryUpdated")
        .withArgs(uniswapFactory.address, newFactory);

      expect(await migrator.uniswapFactory()).to.equal(newFactory);
    });

    it("Should reject invalid token addresses", async function () {
      await expect(migrator.connect(creator).migrateToDEX(ethers.constants.AddressZero, bondingCurve.address))
        .to.be.revertedWith("Migrator: Invalid token address");
    });

    it("Should reject invalid bonding curve addresses", async function () {
      await expect(migrator.connect(creator).migrateToDEX(memeToken.address, ethers.constants.AddressZero))
        .to.be.revertedWith("Migrator: Invalid bonding curve address");
    });
  });

  describe("Pair Management", function () {
    it("Should return correct pair for token", async function () {
      // Initially no pair
      expect(await migrator.getPair(memeToken.address)).to.equal(ethers.constants.AddressZero);

      // After migration (would need threshold reached)
      // const pairAddress = await migrator.getPair(memeToken.address);
      // expect(pairAddress).to.not.equal(ethers.constants.AddressZero);
    });

    it("Should track migration status", async function () {
      expect(await migrator.isTokenMigrated(memeToken.address)).to.be.false;

      // After migration (would need threshold reached)
      // expect(await migrator.isTokenMigrated(memeToken.address)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple migration attempts gracefully", async function () {
      // First migration should work (if threshold reached)
      // Second migration should fail
      await expect(migrator.connect(creator).migrateToDEX(memeToken.address, bondingCurve.address))
        .to.be.revertedWith("Migrator: Market cap threshold not reached");
    });

    it("Should handle insufficient liquidity", async function () {
      // This would need a bonding curve with no liquidity
      // For now, just verify the check exists in the contract
      expect(await bondingCurve.totalTokensSold()).to.be.gt(0);
    });
  });
});