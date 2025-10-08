const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MemeLaunchpadFactory", function () {
  let factory, trustToken, owner, creator, user1, treasury;
  const CREATION_FEE = ethers.utils.parseEther("10"); // 10 TRUST

  beforeEach(async function () {
    [owner, creator, user1, treasury] = await ethers.getSigners();

    // Deploy mock TRUST token
    const MockToken = await ethers.getContractFactory("MockToken");
    trustToken = await MockToken.deploy("TRUST Token", "TRUST", owner.address);
    await trustToken.deployed();

    // Deploy factory
    const MemeLaunchpadFactory = await ethers.getContractFactory("MemeLaunchpadFactory");
    factory = await MemeLaunchpadFactory.deploy(
      trustToken.address,
      treasury.address,
      owner.address
    );
    await factory.deployed();

    // Mint TRUST tokens to creator for testing
    await trustToken.connect(owner).mint(creator.address, ethers.utils.parseEther("1000"));

    // Approve factory to spend TRUST tokens
    await trustToken.connect(creator).approve(factory.address, ethers.constants.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set the correct parameters", async function () {
      expect(await factory.trustToken()).to.equal(trustToken.address);
      expect(await factory.treasury()).to.equal(treasury.address);
      expect(await factory.CREATION_FEE()).to.equal(CREATION_FEE);
    });

    it("Should have zero tokens initially", async function () {
      expect(await factory.getTokenCount()).to.equal(0);
    });
  });

  describe("Token Creation", function () {
    const TOKEN_NAME = "Test Meme Token";
    const TOKEN_SYMBOL = "TMT";
    const MAX_SUPPLY = ethers.utils.parseEther("1000000"); // 1M tokens

    it("Should create meme token successfully", async function () {
      const tx = await factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenCreatedEvent = receipt.events?.find(e => e.event === 'TokenCreated');

      expect(tokenCreatedEvent).to.not.be.undefined;
      expect(tokenCreatedEvent.args.name).to.equal(TOKEN_NAME);
      expect(tokenCreatedEvent.args.symbol).to.equal(TOKEN_SYMBOL);
      expect(tokenCreatedEvent.args.maxSupply).to.equal(MAX_SUPPLY);
      expect(tokenCreatedEvent.args.creator).to.equal(creator.address);

      const tokenAddress = tokenCreatedEvent.args.token;
      const bondingCurveAddress = tokenCreatedEvent.args.bondingCurve;

      expect(await factory.getTokenCount()).to.equal(1);
      expect(await factory.isRegistered(tokenAddress)).to.be.true;
      expect(await factory.getBondingCurve(tokenAddress)).to.equal(bondingCurveAddress);
      expect(await factory.getToken(bondingCurveAddress)).to.equal(tokenAddress);
    });

    it("Should collect creation fee correctly", async function () {
      const initialTreasuryBalance = await trustToken.balanceOf(treasury.address);

      await factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY
      );

      expect(await trustToken.balanceOf(treasury.address)).to.equal(initialTreasuryBalance.add(CREATION_FEE));
    });

    it("Should set up creator allocation correctly", async function () {
      const tx = await factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;

      const MemeToken = await ethers.getContractFactory("MemeToken");
      const token = MemeToken.attach(tokenAddress);

      const expectedAllocation = MAX_SUPPLY.mul(100).div(100000); // 0.1%
      expect(await token.creatorAllocation()).to.equal(expectedAllocation);
      expect(await token.creator()).to.equal(creator.address);
    });

    it("Should deploy bonding curve correctly", async function () {
      const tx = await factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const bondingCurveAddress = receipt.events.find(e => e.event === 'TokenCreated').args.bondingCurve;

      const BondingCurve = await ethers.getContractFactory("BondingCurve");
      const bondingCurve = BondingCurve.attach(bondingCurveAddress);

      expect(await bondingCurve.memeToken()).to.equal(tokenAddress);
      expect(await bondingCurve.trustToken()).to.equal(trustToken.address);
      expect(await bondingCurve.treasury()).to.equal(treasury.address);
    });

    it("Should transfer ownership to creator", async function () {
      const tx = await factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY
      );

      const receipt = await tx.wait();
      const tokenAddress = receipt.events.find(e => e.event === 'TokenCreated').args.token;
      const bondingCurveAddress = receipt.events.find(e => e.event === 'TokenCreated').args.bondingCurve;

      const MemeToken = await ethers.getContractFactory("MemeToken");
      const BondingCurve = await ethers.getContractFactory("BondingCurve");

      const token = MemeToken.attach(tokenAddress);
      const bondingCurve = BondingCurve.attach(bondingCurveAddress);

      expect(await token.owner()).to.equal(creator.address);
      expect(await bondingCurve.owner()).to.equal(creator.address);
    });

    it("Should reject creation with insufficient fee approval", async function () {
      // Create user without sufficient balance
      const poorUser = user1;

      await expect(factory.connect(poorUser).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY
      )).to.be.revertedWith("ERC20: insufficient allowance");
    });

    it("Should reject creation with insufficient balance", async function () {
      // Create user without sufficient balance
      const poorUser = user1;
      await trustToken.connect(owner).mint(poorUser.address, ethers.utils.parseEther("1")); // Less than 10 TRUST

      await trustToken.connect(poorUser).approve(factory.address, ethers.constants.MaxUint256);

      await expect(factory.connect(poorUser).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        MAX_SUPPLY
      )).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Should reject creation with empty name", async function () {
      await expect(factory.connect(creator).createMemeToken(
        "",
        TOKEN_SYMBOL,
        MAX_SUPPLY
      )).to.be.revertedWith("Factory: Invalid token name");
    });

    it("Should reject creation with empty symbol", async function () {
      await expect(factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        "",
        MAX_SUPPLY
      )).to.be.revertedWith("Factory: Invalid token symbol");
    });

    it("Should reject creation with invalid max supply (too low)", async function () {
      await expect(factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        500000 // Below 1M
      )).to.be.revertedWith("Factory: Invalid max supply range");
    });

    it("Should reject creation with invalid max supply (too high)", async function () {
      await expect(factory.connect(creator).createMemeToken(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        ethers.utils.parseEther("2000000000") // Above 1B
      )).to.be.revertedWith("Factory: Invalid max supply range");
    });
  });

  describe("Token Registry", function () {
    beforeEach(async function () {
      await factory.connect(creator).createMemeToken(
        "Token1",
        "TK1",
        ethers.utils.parseEther("1000000")
      );
    });

    it("Should track multiple tokens correctly", async function () {
      await factory.connect(creator).createMemeToken(
        "Token2",
        "TK2",
        ethers.utils.parseEther("2000000")
      );

      expect(await factory.getTokenCount()).to.equal(2);

      const tokens = await factory.getTokensInRange(0, 2);
      expect(tokens.length).to.equal(2);
    });

    it("Should handle range queries correctly", async function () {
      await factory.connect(creator).createMemeToken(
        "Token2",
        "TK2",
        ethers.utils.parseEther("2000000")
      );

      const firstToken = await factory.getTokensInRange(0, 1);
      expect(firstToken.length).to.equal(1);

      const secondToken = await factory.getTokensInRange(1, 2);
      expect(secondToken.length).to.equal(1);
    });

    it("Should reject invalid range queries", async function () {
      await expect(factory.getTokensInRange(1, 0))
        .to.be.revertedWith("Factory: Invalid range");

      await expect(factory.getTokensInRange(0, 10))
        .to.be.revertedWith("Factory: Invalid range");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to update treasury", async function () {
      await expect(factory.connect(creator).updateTreasury(user1.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to withdraw tokens", async function () {
      await expect(factory.connect(creator).emergencyWithdraw(trustToken.address, 1000))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow zero address as treasury", async function () {
      await expect(factory.connect(owner).updateTreasury(ethers.constants.AddressZero))
        .to.be.revertedWith("Factory: Invalid treasury address");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to withdraw stuck tokens", async function () {
      // Send some tokens to factory
      await trustToken.connect(owner).transfer(factory.address, ethers.utils.parseEther("100"));

      const initialOwnerBalance = await trustToken.balanceOf(owner.address);

      await factory.connect(owner).emergencyWithdraw(trustToken.address, ethers.utils.parseEther("100"));

      expect(await trustToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });
  });

  describe("Statistics", function () {
    it("Should return correct statistics", async function () {
      await factory.connect(creator).createMemeToken(
        "Test Token",
        "TT",
        ethers.utils.parseEther("1000000")
      );

      const stats = await factory.getStats();
      expect(stats.tokenCount).to.equal(1);
      expect(stats.treasuryAddress).to.equal(treasury.address);
      expect(stats.creationFee).to.equal(CREATION_FEE);
    });
  });
});