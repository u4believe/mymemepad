// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/MemeToken.sol";
import "../src/BondingCurve.sol";
import "./MockToken.sol";

contract BondingCurveTest is Test {
    BondingCurve public bondingCurve;
    MemeToken public memeToken;
    MockToken public trustToken;

    address public owner = address(this);
    address public creator = address(0x123);
    address public user1 = address(0x456);
    address public treasury = address(0x789);

    uint256 constant MAX_SUPPLY = 1_000_000 * 1e18; // 1M tokens
    uint256 constant PRECISION = 1e18;

    function setUp() public {
        // Deploy tokens
        trustToken = new MockToken("TRUST Token", "TRUST", owner);
        memeToken = new MemeToken(
            "Test Meme Token",
            "TMT",
            MAX_SUPPLY,
            creator,
            owner
        );

        // Deploy bonding curve
        bondingCurve = new BondingCurve(
            address(memeToken),
            address(trustToken),
            MAX_SUPPLY,
            treasury,
            owner
        );

        // Set up meme token bonding curve
        memeToken.setBondingCurve(address(bondingCurve));

        // Fund users with TRUST tokens
        trustToken.mint(user1, 10_000_000 * 1e18);

        // Approve bonding curve to spend TRUST tokens
        vm.prank(user1);
        trustToken.approve(address(bondingCurve), type(uint256).max);
    }

    function testDeployment() public {
        assertEq(address(bondingCurve.memeToken()), address(memeToken));
        assertEq(address(bondingCurve.trustToken()), address(trustToken));
        assertEq(bondingCurve.treasury(), treasury);
        assertTrue(bondingCurve.isActive());
    }

    function testPriceCalculation() public {
        uint256 initialPrice = bondingCurve.getCurrentPrice();
        uint256 startingPrice = bondingCurve.startingPrice();

        assertEq(initialPrice, startingPrice);

        // Price should increase after buying tokens
        uint256 buyAmount = 1000 * 1e18;
        vm.prank(user1);
        bondingCurve.buyTokens(buyAmount, 0);

        uint256 newPrice = bondingCurve.getCurrentPrice();
        assertGt(newPrice, initialPrice);
    }

    function testBuyTokens() public {
        uint256 buyAmount = 1000 * 1e18;
        uint256 initialPrice = bondingCurve.getCurrentPrice();

        // Calculate expected cost
        uint256 expectedCost = bondingCurve.calculatePurchasePrice(buyAmount);

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit BondingCurve.TokenBought(user1, expectedCost, buyAmount, initialPrice);
        bondingCurve.buyTokens(buyAmount, expectedCost);

        assertEq(memeToken.balanceOf(user1), buyAmount);
        assertGt(bondingCurve.totalTokensSold(), memeToken.creatorAllocation());
    }

    function testSellTokens() public {
        uint256 buyAmount = 1000 * 1e18;
        uint256 sellAmount = 500 * 1e18;

        // First buy tokens
        vm.prank(user1);
        bondingCurve.buyTokens(buyAmount, 0);

        // Approve bonding curve to spend meme tokens
        vm.prank(user1);
        memeToken.approve(address(bondingCurve), sellAmount);
        uint256 expectedReturn = bondingCurve.calculateSalePrice(sellAmount);

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit BondingCurve.TokenSold(user1, expectedReturn, sellAmount, bondingCurve.getCurrentPrice());
        bondingCurve.sellTokens(sellAmount, expectedReturn);

        assertEq(memeToken.balanceOf(user1), buyAmount - sellAmount);
    }

    function testFeeCollection() public {
        uint256 buyAmount = 1000 * 1e18;
        uint256 initialTreasuryBalance = trustToken.balanceOf(treasury);

        // Buy tokens (includes 1% fee)
        vm.prank(user1);
        bondingCurve.buyTokens(buyAmount, 0);

        uint256 finalTreasuryBalance = trustToken.balanceOf(treasury);
        assertGt(finalTreasuryBalance, initialTreasuryBalance);
    }

    function testSlippageProtection() public {
        uint256 buyAmount = 1000 * 1e18;

        // Set very high minimum requirement (should fail)
        uint256 tooHighMin = type(uint256).max;

        vm.prank(user1);
        vm.expectRevert("BondingCurve: Slippage too high");
        bondingCurve.buyTokens(buyAmount, tooHighMin);
    }

    function testMigrationDetection() public {
        // Initially should not be ready for migration
        assertFalse(bondingCurve.shouldMigrate());

        // Check current market cap is below threshold
        uint256 threshold = 10_000_000 * PRECISION; // 10M TRUST
        assertLt(bondingCurve.getCurrentMarketCap(), threshold);
    }

    function testAccessControl() public {
        // Only owner can update treasury
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        bondingCurve.updateTreasury(user1);

        // Only owner can pause trading
        vm.prank(user1);
        vm.expectRevert("Ownable: caller is not the owner");
        bondingCurve.setTradingPaused(true);

        // Cannot set zero address as treasury
        vm.expectRevert("BondingCurve: Invalid treasury address");
        bondingCurve.updateTreasury(address(0));
    }

    function testPauseTrading() public {
        // Owner can pause trading
        bondingCurve.setTradingPaused(true);
        assertFalse(bondingCurve.isActive());

        // Users cannot buy when paused
        uint256 buyAmount = 1000 * 1e18;
        vm.prank(user1);
        vm.expectRevert("BondingCurve: Trading disabled");
        bondingCurve.buyTokens(buyAmount, 0);

        // Owner can unpause
        bondingCurve.setTradingPaused(false);
        assertTrue(bondingCurve.isActive());
    }

    function testEdgeCases() public {
        // Cannot buy zero tokens
        vm.prank(user1);
        vm.expectRevert("BondingCurve: Invalid token amount");
        bondingCurve.buyTokens(0, 0);

        // Cannot sell zero tokens
        vm.prank(user1);
        vm.expectRevert("BondingCurve: Invalid token amount");
        bondingCurve.sellTokens(0, 0);

        // Cannot sell more than balance
        vm.prank(user1);
        vm.expectRevert("ERC20: transfer amount exceeds balance");
        bondingCurve.sellTokens(1000 * 1e18, 0);
    }

    function testPriceAtSpecificSupply() public {
        uint256 supply = 100_000 * 1e18; // 100k tokens
        uint256 price = bondingCurve.getPriceAtSupply(supply);

        assertGt(price, 0);
        assertGt(price, bondingCurve.startingPrice());
    }

    function testStatistics() public {
        uint256 buyAmount = 1000 * 1e18;

        vm.prank(user1);
        bondingCurve.buyTokens(buyAmount, 0);

        (uint256 tokensSold, uint256 trustReceived, uint256 trustReserve, uint256 currentPrice, uint256 marketCap) = bondingCurve.getStats();

        assertEq(tokensSold, buyAmount + memeToken.creatorAllocation());
        assertGt(trustReceived, 0);
        assertGt(currentPrice, bondingCurve.startingPrice());
        assertGt(marketCap, 0);
    }
}