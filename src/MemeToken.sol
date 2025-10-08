// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MemeToken
 * @dev ERC20 token contract for meme coins with creator allocation locking mechanism
 * @notice Implements creator allocation (0.1% of total supply) locked for 365 days
 */
contract MemeToken is ERC20, Ownable, ReentrancyGuard {

    // Token metadata
    string private _name;
    string private _symbol;
    uint256 public immutable maxSupply;
    uint256 public immutable creatorAllocation;
    uint256 public immutable lockDuration;

    // Creator allocation tracking
    address public creator;
    uint256 public creatorLockEndTime;
    bool public creatorAllocationClaimed;

    // Bonding curve integration
    address public bondingCurve;

    // Events
    event CreatorAllocationLocked(address indexed creator, uint256 amount, uint256 unlockTime);
    event CreatorAllocationUnlocked(address indexed creator, uint256 amount);
    event BondingCurveSet(address indexed bondingCurve);

    /**
     * @dev Constructor to initialize the meme token
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param maxSupply_ Maximum token supply (must be between 1M and 1B)
     * @param creator_ Address of the token creator
     * @param owner_ Address that will own the contract (typically the factory)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        address creator_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        require(maxSupply_ >= 1_000_000 && maxSupply_ <= 1_000_000_000, "MemeToken: Invalid max supply range");
        require(creator_ != address(0), "MemeToken: Invalid creator address");
        require(owner_ != address(0), "MemeToken: Invalid owner address");

        _name = name_;
        _symbol = symbol_;
        maxSupply = maxSupply_;
        creator = creator_;

        // Calculate creator allocation (0.1% of total supply)
        creatorAllocation = (maxSupply_ * 100) / 100_000; // 0.1% = 100/100000

        // Set lock duration to 365 days
        lockDuration = 365 days;
        creatorLockEndTime = block.timestamp + lockDuration;

        // Mint creator allocation as locked tokens
        _mint(address(this), creatorAllocation);

        emit CreatorAllocationLocked(creator_, creatorAllocation, creatorLockEndTime);
    }

    /**
     * @dev Set the bonding curve contract address (can only be called by owner)
     * @param bondingCurve_ Address of the bonding curve contract
     */
    function setBondingCurve(address bondingCurve_) external onlyOwner {
        require(bondingCurve_ != address(0), "MemeToken: Invalid bonding curve address");
        bondingCurve = bondingCurve_;
        emit BondingCurveSet(bondingCurve_);
    }

    /**
     * @dev Claim creator allocation after lock period expires
     * @notice Can only be called by the creator after lock period
     */
    function claimCreatorAllocation() external nonReentrant {
        require(msg.sender == creator, "MemeToken: Only creator can claim");
        require(block.timestamp >= creatorLockEndTime, "MemeToken: Lock period not expired");
        require(!creatorAllocationClaimed, "MemeToken: Already claimed");

        creatorAllocationClaimed = true;
        _transfer(address(this), creator, creatorAllocation);

        emit CreatorAllocationUnlocked(creator, creatorAllocation);
    }

    /**
     * @dev Mint tokens to bonding curve (called by bonding curve contract)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mintToBondingCurve(address to, uint256 amount) external {
        require(msg.sender == bondingCurve, "MemeToken: Only bonding curve can mint");
        require(to != address(0), "MemeToken: Cannot mint to zero address");

        // Ensure we don't exceed max supply (reserve for creator allocation)
        uint256 availableSupply = maxSupply - creatorAllocation;
        uint256 currentSupply = totalSupply();

        require(currentSupply + amount <= availableSupply, "MemeToken: Would exceed max supply");

        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from bonding curve (called by bonding curve contract)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFromBondingCurve(address from, uint256 amount) external {
        require(msg.sender == bondingCurve, "MemeToken: Only bonding curve can burn");
        require(from != address(0), "MemeToken: Cannot burn from zero address");

        _burn(from, amount);
    }

    /**
     * @dev Get time remaining until creator allocation unlocks
     * @return Time remaining in seconds (0 if already unlocked)
     */
    function getCreatorLockTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= creatorLockEndTime) {
            return 0;
        }
        return creatorLockEndTime - block.timestamp;
    }

    /**
     * @dev Check if creator allocation can be claimed
     * @return True if allocation can be claimed
     */
    function canClaimCreatorAllocation() external view returns (bool) {
        return block.timestamp >= creatorLockEndTime && !creatorAllocationClaimed;
    }

    /**
     * @dev Override decimals to return 18 (standard for ERC20)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    /**
     * @dev Override name and symbol functions to use private variables
     */
    function name() public view override returns (string memory) {
        return _name;
    }

    function symbol() public view override returns (string memory) {
        return _symbol;
    }
}