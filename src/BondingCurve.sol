// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MemeToken.sol";

/**
 * @title BondingCurve
 * @dev Handles bonding curve pricing and trading logic for meme tokens
 * @notice Implements the bonding curve formula and manages buy/sell operations
 */
contract BondingCurve is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 private constant PRECISION = 1e18;
    uint256 private constant FEE_PERCENTAGE = 1; // 1% fee
    uint256 private constant MIGRATION_THRESHOLD = 10_000_000 * PRECISION; // 10M $TRUST
    uint256 private constant SLOPE = 1533; // 0.000000001533 * PRECISION (scaled for precision)

    // State variables
    MemeToken public memeToken;
    IERC20 public trustToken; // $TRUST token

    uint256 public totalTokensSold;
    uint256 public totalTrustReceived;
    uint256 public reserveTrustBalance;
    uint256 public immutable startingPrice; // A in the formula

    bool public isActive = true;
    bool public migrationTriggered;

    // Treasury address for fees
    address public treasury;

    // Events
    event TokenBought(address indexed buyer, uint256 trustAmount, uint256 tokenAmount, uint256 price);
    event TokenSold(address indexed seller, uint256 trustAmount, uint256 tokenAmount, uint256 price);
    event MigrationTriggered(address indexed token, address dexPair, uint256 marketCap);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /**
     * @dev Constructor to initialize the bonding curve
     * @param memeToken_ Address of the meme token contract
     * @param trustToken_ Address of the $TRUST token
     * @param maxSupply Maximum supply of the meme token
     * @param treasury_ Address for collecting fees
     * @param owner_ Contract owner address
     */
    constructor(
        address memeToken_,
        address trustToken_,
        uint256 maxSupply,
        address treasury_,
        address owner_
    ) Ownable(owner_) {
        require(memeToken_ != address(0), "BondingCurve: Invalid meme token");
        require(trustToken_ != address(0), "BondingCurve: Invalid trust token");
        require(treasury_ != address(0), "BondingCurve: Invalid treasury");
        require(maxSupply >= 1_000_000 && maxSupply <= 1_000_000_000, "BondingCurve: Invalid max supply");

        memeToken = MemeToken(memeToken_);
        trustToken = IERC20(trustToken_);
        treasury = treasury_;

        // Calculate starting price A = 1 / (0.001 * MaxSupply)
        // Scale by PRECISION to maintain integer precision
        startingPrice = PRECISION / ((1e15 * maxSupply) / 1e18); // 0.001 * maxSupply scaled appropriately

        // Initial mint of creator allocation (0.1%) to this contract
        uint256 creatorAllocation = (maxSupply * 100) / 100_000; // 0.1% = 100/100000
        MemeToken(memeToken_).mintToBondingCurve(address(this), creatorAllocation);
        totalTokensSold += creatorAllocation;
    }

    /**
     * @dev Buy tokens from the bonding curve
     * @param tokenAmount Amount of tokens to buy
     * @param minTrustRequired Minimum $TRUST required (slippage protection)
     * @return trustRequired Actual $TRUST amount required
     */
    function buyTokens(
        uint256 tokenAmount,
        uint256 minTrustRequired
    ) external nonReentrant returns (uint256 trustRequired) {
        require(isActive, "BondingCurve: Trading disabled");
        require(tokenAmount > 0, "BondingCurve: Invalid token amount");
        require(!migrationTriggered, "BondingCurve: Migration triggered");

        // Check if this purchase would trigger migration
        uint256 currentPrice = getCurrentPrice();
        uint256 currentMarketCap = (currentPrice * memeToken.maxSupply()) / PRECISION;

        if (currentMarketCap >= MIGRATION_THRESHOLD) {
            migrationTriggered = true;
            emit MigrationTriggered(address(memeToken), address(0), currentMarketCap);
            return 0; // Return 0 to indicate migration triggered
        }

        // Calculate required $TRUST amount
        trustRequired = calculatePurchasePrice(tokenAmount);

        // Apply slippage protection
        require(trustRequired >= minTrustRequired, "BondingCurve: Slippage too high");

        // Apply 1% fee
        uint256 feeAmount = (trustRequired * FEE_PERCENTAGE) / 100;
        uint256 trustToCurve = trustRequired - feeAmount;

        // Transfer $TRUST from buyer
        trustToken.safeTransferFrom(msg.sender, address(this), trustRequired);

        // Send fee to treasury
        if (feeAmount > 0) {
            trustToken.safeTransfer(treasury, feeAmount);
        }

        // Update state
        totalTokensSold += tokenAmount;
        totalTrustReceived += trustRequired;
        reserveTrustBalance += trustToCurve;

        // Mint tokens to buyer
        memeToken.mintToBondingCurve(msg.sender, tokenAmount);

        emit TokenBought(msg.sender, trustRequired, tokenAmount, currentPrice);
    }

    /**
     * @dev Sell tokens back to the bonding curve
     * @param tokenAmount Amount of tokens to sell
     * @param minTrustRequired Minimum $TRUST to receive (slippage protection)
     * @return trustReceived Actual $TRUST amount received
     */
    function sellTokens(
        uint256 tokenAmount,
        uint256 minTrustRequired
    ) external nonReentrant returns (uint256 trustReceived) {
        require(isActive, "BondingCurve: Trading disabled");
        require(tokenAmount > 0, "BondingCurve: Invalid token amount");
        require(memeToken.balanceOf(msg.sender) >= tokenAmount, "BondingCurve: Insufficient balance");

        // Calculate $TRUST to return
        trustReceived = calculateSalePrice(tokenAmount);

        // Apply slippage protection
        require(trustReceived >= minTrustRequired, "BondingCurve: Slippage too high");

        // Apply 1% fee
        uint256 feeAmount = (trustReceived * FEE_PERCENTAGE) / 100;
        uint256 trustToSeller = trustReceived - feeAmount;

        // Check if we have enough $TRUST in reserve
        require(reserveTrustBalance >= trustToSeller, "BondingCurve: Insufficient liquidity");

        // Transfer tokens from seller
        memeToken.burnFromBondingCurve(msg.sender, tokenAmount);

        // Send $TRUST to seller
        trustToken.safeTransfer(msg.sender, trustToSeller);

        // Send fee to treasury
        if (feeAmount > 0) {
            trustToken.safeTransfer(treasury, feeAmount);
        }

        // Update state
        totalTokensSold -= tokenAmount;
        reserveTrustBalance -= trustToSeller;

        emit TokenSold(msg.sender, trustReceived, tokenAmount, getCurrentPrice());
    }

    /**
     * @dev Calculate the price for purchasing tokens
     * @param tokenAmount Amount of tokens to purchase
     * @return Total $TRUST required
     */
    function calculatePurchasePrice(uint256 tokenAmount) public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        uint256 newTokensSold = totalTokensSold + tokenAmount;

        // For small amounts, use average price
        if (tokenAmount <= PRECISION / currentPrice) {
            return (tokenAmount * currentPrice) / PRECISION;
        }

        // For larger amounts, calculate integral of the price curve
        return calculatePriceIntegral(totalTokensSold, newTokensSold);
    }

    /**
     * @dev Calculate the price for selling tokens
     * @param tokenAmount Amount of tokens to sell
     * @return Total $TRUST to return
     */
    function calculateSalePrice(uint256 tokenAmount) public view returns (uint256) {
        uint256 newTokensSold = totalTokensSold - tokenAmount;

        // For small amounts, use average price
        if (tokenAmount <= PRECISION / getCurrentPrice()) {
            uint256 currentPrice = getCurrentPrice();
            return (tokenAmount * currentPrice) / PRECISION;
        }

        // For larger amounts, calculate integral of the price curve
        return calculatePriceIntegral(newTokensSold, totalTokensSold);
    }

    /**
     * @dev Calculate the integral of the price curve between two points
     * @param fromTokens Total tokens sold at start
     * @param toTokens Total tokens sold at end
     * @return Total $TRUST value
     */
    function calculatePriceIntegral(
        uint256 fromTokens,
        uint256 toTokens
    ) public view returns (uint256) {
        // Using numerical integration (Simpson's rule or trapezoidal rule)
        // For simplicity, using trapezoidal rule with multiple segments

        uint256 steps = 100; // Number of integration steps
        uint256 totalValue = 0;

        uint256 stepSize = (toTokens - fromTokens) / steps;

        for (uint256 i = 0; i < steps; i++) {
            uint256 x1 = fromTokens + (i * stepSize);
            uint256 x2 = fromTokens + ((i + 1) * stepSize);

            uint256 price1 = getPriceAtSupply(x1);
            uint256 price2 = getPriceAtSupply(x2);

            // Trapezoidal rule: (x2 - x1) * (y1 + y2) / 2
            totalValue += (stepSize * (price1 + price2)) / 2;
        }

        return totalValue / PRECISION; // Scale back down
    }

    /**
     * @dev Get the current price per token in $TRUST
     * @return Current price scaled by PRECISION
     */
    function getCurrentPrice() public view returns (uint256) {
        return getPriceAtSupply(totalTokensSold);
    }

    /**
     * @dev Get the price at a specific supply level
     * @param supply Token supply level
     * @return Price scaled by PRECISION
     */
    function getPriceAtSupply(uint256 supply) public view returns (uint256) {
        if (supply == 0) {
            return startingPrice;
        }

        // Calculate purchasing power coefficient (Pc)
        // Pc ranges from 1000 → 1 as maxSupply increases from 1M → 1B
        uint256 maxSupply = memeToken.maxSupply();
        uint256 pc = PRECISION - ((supply * (PRECISION - 1)) / maxSupply);

        // Apply bonding curve formula: P = A * (Pc) + 0.000000001533 * S
        uint256 linearComponent = (startingPrice * pc) / PRECISION;
        uint256 curveComponent = (SLOPE * supply) / PRECISION;

        return linearComponent + curveComponent;
    }

    /**
     * @dev Get current market cap in $TRUST
     * @return Market cap scaled by PRECISION
     */
    function getCurrentMarketCap() public view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        return (currentPrice * memeToken.maxSupply()) / PRECISION;
    }

    /**
     * @dev Check if migration threshold is reached
     * @return True if market cap >= 10M $TRUST
     */
    function shouldMigrate() public view returns (bool) {
        return getCurrentMarketCap() >= MIGRATION_THRESHOLD;
    }

    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "BondingCurve: Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Emergency pause/unpause trading (only owner)
     * @param paused Whether to pause trading
     */
    function setTradingPaused(bool paused) external onlyOwner {
        isActive = !paused;
    }

    /**
     * @dev Get contract statistics
     * @return tokensSold Total tokens sold
     * @return trustReceived Total $TRUST received
     * @return trustReserve Current $TRUST reserve
     * @return currentPrice Current token price
     * @return marketCap Current market cap
     */
    function getStats() external view returns (
        uint256 tokensSold,
        uint256 trustReceived,
        uint256 trustReserve,
        uint256 currentPrice,
        uint256 marketCap
    ) {
        return (
            totalTokensSold,
            totalTrustReceived,
            reserveTrustBalance,
            getCurrentPrice(),
            getCurrentMarketCap()
        );
    }
}