// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Test.sol";
import "../src/MemeToken.sol";
import "./MockToken.sol";

contract MemeTokenTest is Test {
    MemeToken public memeToken;
    MockToken public trustToken;

    address public owner = address(this);
    address public creator = address(0x123);
    address public user1 = address(0x456);
    address public user2 = address(0x789);

    string constant TOKEN_NAME = "Test Meme Token";
    string constant TOKEN_SYMBOL = "TMT";
    uint256 constant MAX_SUPPLY = 1_000_000_000; // 1B tokens (within valid range)

    function setUp() public {
        // Deploy mock TRUST token
        trustToken = new MockToken("TRUST Token", "TRUST", owner);

        // Deploy meme token
        memeToken = new MemeToken(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            MAX_SUPPLY,
            creator,
            owner
        );
    }

    function testDeployment() public {
        assertEq(memeToken.name(), TOKEN_NAME);
        assertEq(memeToken.symbol(), TOKEN_SYMBOL);
        assertEq(memeToken.decimals(), 18);
        assertEq(memeToken.maxSupply(), MAX_SUPPLY);
        assertEq(memeToken.creator(), creator);

        // Check creator allocation (0.1%)
        uint256 expectedAllocation = (MAX_SUPPLY * 100) / 100_000;
        assertEq(memeToken.creatorAllocation(), expectedAllocation);

        // Check allocation is locked in contract
        assertEq(memeToken.balanceOf(address(memeToken)), expectedAllocation);
    }

    function testCreatorAllocationClaim() public {
        // Initially cannot claim
        vm.prank(creator);
        vm.expectRevert("MemeToken: Lock period not expired");
        memeToken.claimCreatorAllocation();

        // Fast forward time by 366 days
        vm.warp(block.timestamp + 366 days);

        // Now can claim
        uint256 allocation = memeToken.creatorAllocation();
        vm.prank(creator);
        vm.expectEmit(true, true, false, true);
        emit MemeToken.CreatorAllocationUnlocked(creator, allocation);
        memeToken.claimCreatorAllocation();

        assertEq(memeToken.balanceOf(creator), allocation);
        assertTrue(memeToken.creatorAllocationClaimed());

        // Cannot claim twice
        vm.prank(creator);
        vm.expectRevert("MemeToken: Already claimed");
        memeToken.claimCreatorAllocation();
    }

    function testLockTimeCalculations() public {
        uint256 lockEndTime = memeToken.creatorLockEndTime();
        uint256 currentTime = block.timestamp;
        uint256 expectedRemaining = lockEndTime - currentTime;

        assertEq(memeToken.getCreatorLockTimeRemaining(), expectedRemaining);

        // After lock period
        vm.warp(block.timestamp + 366 days);
        assertEq(memeToken.getCreatorLockTimeRemaining(), 0);
        assertTrue(memeToken.canClaimCreatorAllocation());
    }

    function testAccessControl() public {
        // Only owner can set bonding curve
        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", user1));
        memeToken.setBondingCurve(user1);

        // Cannot set zero address
        vm.expectRevert("MemeToken: Invalid bonding curve address");
        memeToken.setBondingCurve(address(0));
    }

    function testInvalidDeploymentParameters() public {
        vm.expectRevert("MemeToken: Invalid max supply range");
        new MemeToken(TOKEN_NAME, TOKEN_SYMBOL, 500_000 * 1e18, creator, owner);

        vm.expectRevert("MemeToken: Invalid max supply range");
        new MemeToken(TOKEN_NAME, TOKEN_SYMBOL, 2_000_000_000 * 1e18, creator, owner);

        vm.expectRevert("MemeToken: Invalid creator address");
        new MemeToken(TOKEN_NAME, TOKEN_SYMBOL, MAX_SUPPLY, address(0), owner);

        vm.expectRevert(abi.encodeWithSignature("OwnableInvalidOwner(address)", address(0)));
        new MemeToken(TOKEN_NAME, TOKEN_SYMBOL, MAX_SUPPLY, creator, address(0));
    }

    function testBondingCurveIntegration() public {
        // Deploy bonding curve
        BondingCurve bondingCurve = new BondingCurve(
            address(memeToken),
            address(trustToken),
            MAX_SUPPLY,
            owner,
            owner
        );

        // Set bonding curve in token
        memeToken.setBondingCurve(address(bondingCurve));

        // Test minting from bonding curve (within available supply: 1B - 1M = 999M)
        uint256 mintAmount = 500 * 1e6; // 500 million tokens (within available supply)
        bondingCurve.mintToBondingCurve(user1, mintAmount);

        assertEq(memeToken.balanceOf(user1), mintAmount);

        // Test burning from bonding curve
        uint256 burnAmount = 500 * 1e6; // 500 million tokens
        vm.prank(address(bondingCurve));
        memeToken.burnFromBondingCurve(user1, burnAmount);

        assertEq(memeToken.balanceOf(user1), mintAmount - burnAmount);
    }
}

// Mock BondingCurve for testing
contract BondingCurve {
    address public memeToken;

    constructor(address _memeToken, address /*trustToken*/, uint256 /*maxSupply*/, address /*treasury*/, address /*owner*/) {
        memeToken = _memeToken;
    }

    function mintToBondingCurve(address to, uint256 amount) external {
        MemeToken(memeToken).mintToBondingCurve(to, amount);
    }

    function burnFromBondingCurve(address from, uint256 amount) external {
        MemeToken(memeToken).burnFromBondingCurve(from, amount);
    }
}