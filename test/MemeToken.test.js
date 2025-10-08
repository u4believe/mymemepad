const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemeToken", function () {
  let memeToken, owner, creator, user1, user2;
  const TOKEN_NAME = "Test Meme Token";
  const TOKEN_SYMBOL = "TMT";
  const MAX_SUPPLY = ethers.utils.parseEther("1000000"); // 1M tokens

  beforeEach(async function () {
    [owner, creator, user1, user2] = await ethers.getSigners();

    const MemeToken = await ethers.getContractFactory("MemeToken");
    memeToken = await MemeToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      MAX_SUPPLY,
      creator.address,
      owner.address
    );
    await memeToken.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct token metadata", async function () {
      expect(await memeToken.name()).to.equal(TOKEN_NAME);
      expect(await memeToken.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await memeToken.decimals()).to.equal(18);
    });

    it("Should set the correct max supply", async function () {
      expect(await memeToken.maxSupply()).to.equal(MAX_SUPPLY);
    });

    it("Should set the correct creator", async function () {
      expect(await memeToken.creator()).to.equal(creator.address);
    });

    it("Should calculate correct creator allocation (0.1%)", async function () {
      const expectedAllocation = MAX_SUPPLY.mul(100).div(100000); // 0.1% = 100/100000
      expect(await memeToken.creatorAllocation()).to.equal(expectedAllocation);
    });

    it("Should lock creator allocation in contract", async function () {
      const allocation = await memeToken.creatorAllocation();
      expect(await memeToken.balanceOf(memeToken.address)).to.equal(allocation);
    });

    it("Should set correct lock duration (365 days)", async function () {
      expect(await memeToken.lockDuration()).to.equal(365 * 24 * 60 * 60);
    });
  });

  describe("Creator Allocation Claim", function () {
    it("Should not allow claiming before lock period", async function () {
      await expect(memeToken.connect(creator).claimCreatorAllocation())
        .to.be.revertedWith("MemeToken: Lock period not expired");
    });

    it("Should allow claiming after lock period", async function () {
      // Increase time by 366 days
      await ethers.provider.send("evm_increaseTime", [366 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      const allocation = await memeToken.creatorAllocation();
      await expect(memeToken.connect(creator).claimCreatorAllocation())
        .to.emit(memeToken, "CreatorAllocationUnlocked")
        .withArgs(creator.address, allocation);

      expect(await memeToken.balanceOf(creator.address)).to.equal(allocation);
      expect(await memeToken.creatorAllocationClaimed()).to.be.true;
    });

    it("Should not allow claiming twice", async function () {
      // Increase time by 366 days
      await ethers.provider.send("evm_increaseTime", [366 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await memeToken.connect(creator).claimCreatorAllocation();

      await expect(memeToken.connect(creator).claimCreatorAllocation())
        .to.be.revertedWith("MemeToken: Already claimed");
    });

    it("Should only allow creator to claim", async function () {
      await ethers.provider.send("evm_increaseTime", [366 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      await expect(memeToken.connect(user1).claimCreatorAllocation())
        .to.be.revertedWith("MemeToken: Only creator can claim");
    });
  });

  describe("Bonding Curve Integration", function () {
    let bondingCurve;

    beforeEach(async function () {
      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      bondingCurve = await BondingCurve.deploy(
        memeToken.address,
        owner.address, // Mock TRUST token
        MAX_SUPPLY,
        owner.address, // Treasury
        owner.address
      );
      await bondingCurve.deployed();

      await memeToken.connect(owner).setBondingCurve(bondingCurve.address);
    });

    it("Should allow bonding curve to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");

      await expect(memeToken.connect(bondingCurve).mintToBondingCurve(user1.address, mintAmount))
        .to.emit(memeToken, "Transfer")
        .withArgs(ethers.constants.AddressZero, user1.address, mintAmount);

      expect(await memeToken.balanceOf(user1.address)).to.equal(mintAmount);
    });

    it("Should not allow others to mint tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");

      await expect(memeToken.connect(user1).mintToBondingCurve(user1.address, mintAmount))
        .to.be.revertedWith("MemeToken: Only bonding curve can mint");
    });

    it("Should allow bonding curve to burn tokens", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      const burnAmount = ethers.utils.parseEther("500");

      // First mint tokens
      await memeToken.connect(bondingCurve).mintToBondingCurve(user1.address, mintAmount);

      // Then burn tokens
      await expect(memeToken.connect(bondingCurve).burnFromBondingCurve(user1.address, burnAmount))
        .to.emit(memeToken, "Transfer")
        .withArgs(user1.address, ethers.constants.AddressZero, burnAmount);

      expect(await memeToken.balanceOf(user1.address)).to.equal(mintAmount.sub(burnAmount));
    });

    it("Should not allow others to burn tokens", async function () {
      await expect(memeToken.connect(user1).burnFromBondingCurve(user1.address, 1000))
        .to.be.revertedWith("MemeToken: Only bonding curve can burn");
    });
  });

  describe("Lock Time Remaining", function () {
    it("Should return correct time remaining initially", async function () {
      const lockEndTime = await memeToken.creatorLockEndTime();
      const currentTime = await ethers.provider.getBlock("latest").then(block => block.timestamp);
      const expectedRemaining = lockEndTime.sub(currentTime);

      expect(await memeToken.getCreatorLockTimeRemaining()).to.equal(expectedRemaining);
    });

    it("Should return 0 after lock period", async function () {
      await ethers.provider.send("evm_increaseTime", [366 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      expect(await memeToken.getCreatorLockTimeRemaining()).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to set bonding curve", async function () {
      await expect(memeToken.connect(user1).setBondingCurve(user1.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow zero address as bonding curve", async function () {
      await expect(memeToken.connect(owner).setBondingCurve(ethers.constants.AddressZero))
        .to.be.revertedWith("MemeToken: Invalid bonding curve address");
    });
  });

  describe("Edge Cases", function () {
    it("Should not deploy with invalid max supply (too low)", async function () {
      const MemeToken = await ethers.getContractFactory("MemeToken");

      await expect(MemeToken.deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        500000, // Below minimum 1M
        creator.address,
        owner.address
      )).to.be.revertedWith("MemeToken: Invalid max supply range");
    });

    it("Should not deploy with invalid max supply (too high)", async function () {
      const MemeToken = await ethers.getContractFactory("MemeToken");

      await expect(MemeToken.deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        ethers.utils.parseEther("2000000000"), // Above maximum 1B
        creator.address,
        owner.address
      )).to.be.revertedWith("MemeToken: Invalid max supply range");
    });

    it("Should not deploy with zero creator address", async function () {
      const MemeToken = await ethers.getContractFactory("MemeToken");

      await expect(MemeToken.deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY,
        ethers.constants.AddressZero,
        owner.address
      )).to.be.revertedWith("MemeToken: Invalid creator address");
    });

    it("Should not deploy with zero owner address", async function () {
      const MemeToken = await ethers.getContractFactory("MemeToken");

      await expect(MemeToken.deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY,
        creator.address,
        ethers.constants.AddressZero
      )).to.be.revertedWith("MemeToken: Invalid owner address");
    });
  });
});