// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MemeToken.sol";
import "./BondingCurve.sol";

/**
 * @title LiquidityMigrator
 * @dev Handles DEX migration for meme tokens when market cap threshold is reached
 * @notice Creates UniswapV2-style liquidity pools and migrates liquidity
 */
contract LiquidityMigrator is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // UniswapV2-style pair interface
    struct PairInfo {
        address token0;
        address token1;
        uint256 reserve0;
        uint256 reserve1;
    }

    // State variables
    IERC20 public immutable trustToken; // $TRUST token
    address public uniswapFactory; // UniswapV2 factory address

    // Migration tracking
    mapping(address => address) public tokenToPair;
    mapping(address => address) public pairToToken;
    mapping(address => bool) public isMigrated;

    // Events
    event LiquidityMigrated(
        address indexed token,
        address indexed pair,
        address indexed bondingCurve,
        uint256 tokenAmount,
        uint256 trustAmount,
        uint256 liquidity
    );
    event UniswapFactoryUpdated(address indexed oldFactory, address indexed newFactory);

    /**
     * @dev Constructor to initialize the migrator
     * @param trustToken_ Address of the $TRUST token
     * @param uniswapFactory_ Address of UniswapV2 factory
     * @param owner_ Contract owner address
     */
    constructor(
        address trustToken_,
        address uniswapFactory_,
        address owner_
    ) Ownable(owner_) {
        require(trustToken_ != address(0), "Migrator: Invalid trust token");
        require(uniswapFactory_ != address(0), "Migrator: Invalid uniswap factory");

        trustToken = IERC20(trustToken_);
        uniswapFactory = uniswapFactory_;
    }

    /**
     * @dev Migrate token from bonding curve to DEX
     * @param tokenAddress Address of the token to migrate
     * @param bondingCurveAddress Address of the bonding curve
     * @return pairAddress Address of the created liquidity pair
     * @return liquidity Amount of LP tokens received
     */
    function migrateToDEX(
        address tokenAddress,
        address bondingCurveAddress
    ) external nonReentrant returns (address pairAddress, uint256 liquidity) {
        require(tokenAddress != address(0), "Migrator: Invalid token address");
        require(bondingCurveAddress != address(0), "Migrator: Invalid bonding curve address");
        require(!isMigrated[tokenAddress], "Migrator: Already migrated");

        MemeToken token = MemeToken(tokenAddress);
        BondingCurve bondingCurve = BondingCurve(bondingCurveAddress);

        // Verify that the caller is the owner of both contracts
        require(token.owner() == msg.sender, "Migrator: Not token owner");
        require(bondingCurve.owner() == msg.sender, "Migrator: Not bonding curve owner");

        // Check migration threshold
        uint256 currentMarketCap = bondingCurve.getCurrentMarketCap();
        require(currentMarketCap >= 10_000_000 * 1e18, "Migrator: Market cap threshold not reached");

        // Get token and trust balances from bonding curve
        uint256 tokenBalance = token.balanceOf(bondingCurveAddress);
        uint256 trustBalance = trustToken.balanceOf(bondingCurveAddress);

        require(tokenBalance > 0 && trustBalance > 0, "Migrator: Insufficient liquidity");

        // Create liquidity pair if it doesn't exist
        pairAddress = _createPairIfNotExists(tokenAddress, address(trustToken));

        // Approve token transfers
        bondingCurve.memeToken().approve(pairAddress, tokenBalance);
        trustToken.approve(pairAddress, trustBalance);

        // Add liquidity to the pair
        liquidity = _addLiquidity(pairAddress, tokenBalance, trustBalance);

        // Mark as migrated
        tokenToPair[tokenAddress] = pairAddress;
        pairToToken[pairAddress] = tokenAddress;
        isMigrated[tokenAddress] = true;

        // Disable bonding curve trading
        bondingCurve.setTradingPaused(true);

        emit LiquidityMigrated(
            tokenAddress,
            pairAddress,
            bondingCurveAddress,
            tokenBalance,
            trustBalance,
            liquidity
        );
    }

    /**
     * @dev Create a UniswapV2 pair if it doesn't exist
     * @param tokenA First token address
     * @param tokenB Second token address
     * @return pairAddress Address of the pair
     */
    function _createPairIfNotExists(
        address tokenA,
        address tokenB
    ) internal returns (address pairAddress) {
        // Sort tokens to get deterministic pair address
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);

        // Check if pair already exists (simplified - in real implementation would check factory)
        // For this example, we'll assume pairs are created at deterministic addresses
        pairAddress = _calculatePairAddress(token0, token1);

        // If pair doesn't exist, create it
        (uint256 reserve0,,) = _getPairReserves(pairAddress);
        if (reserve0 == 0) {
            // In a real implementation, this would call IUniswapV2Factory.createPair()
            // For this example, we'll simulate pair creation
            _initializePair(pairAddress, token0, token1);
        }
    }

    /**
     * @dev Add liquidity to a pair (simplified UniswapV2 implementation)
     * @param pairAddress Pair address
     * @param tokenAmount Amount of tokens to add
     * @param trustAmount Amount of $TRUST to add
     * @return liquidity LP tokens received
     */
    function _addLiquidity(
        address pairAddress,
        uint256 tokenAmount,
        uint256 trustAmount
    ) internal returns (uint256 liquidity) {
        (uint256 reserve0, uint256 reserve1,) = _getPairReserves(pairAddress);

        if (reserve0 == 0 && reserve1 == 0) {
            // First liquidity provision - use geometric mean for initial liquidity
            liquidity = _sqrt(tokenAmount * trustAmount) - 1000; // Subtract minimum liquidity

            // Mint minimum liquidity to zero address to prevent infinite supply
            _mint(pairAddress, address(0), 1000);

            // Mint LP tokens to provider
            _mint(pairAddress, msg.sender, liquidity);

            // Update reserves
            _updatePairReserves(pairAddress, tokenAmount, trustAmount);
        } else {
            // Subsequent liquidity provision - use minimum of two ratios
            uint256 tokenRatio = (tokenAmount * reserve1) / reserve0;
            uint256 trustRatio = (trustAmount * reserve0) / reserve1;

            if (tokenRatio < trustRatio) {
                // Use token ratio
                liquidity = (tokenAmount * reserve1) / reserve0;
                trustAmount = trustRatio;
            } else {
                // Use trust ratio
                liquidity = (trustAmount * reserve0) / reserve1;
                tokenAmount = tokenRatio;
            }

            // Mint LP tokens to provider
            _mint(pairAddress, msg.sender, liquidity);

            // Update reserves
            _updatePairReserves(pairAddress, tokenAmount, trustAmount);
        }
    }

    /**
     * @dev Calculate pair address (simplified - in reality uses CREATE2)
     * @param token0 First token address
     * @param token1 Second token address
     * @return Predicted pair address
     */
    function _calculatePairAddress(
        address token0,
        address token1
    ) internal pure returns (address) {
        // Simplified pair address calculation
        // In reality, this would use CREATE2 deterministic deployment
        return address(uint160(uint256(keccak256(abi.encodePacked(token0, token1)))));
    }

    /**
     * @dev Initialize a new pair (simplified)
     * @param pairAddress Pair address
     * @param token0 First token
     * @param token1 Second token
     */
    function _initializePair(
        address pairAddress,
        address token0,
        address token1
    ) internal {
        // In a real implementation, this would deploy a UniswapV2Pair contract
        // For this example, we'll just set up the basic structure
        assembly {
            // Store token addresses in pair contract storage
            sstore(pairAddress, token0)
            sstore(add(pairAddress, 0x20), token1)
        }
    }

    /**
     * @dev Get pair reserves (simplified)
     * @param pairAddress Pair address
     * @return reserve0 Reserve of token0
     * @return reserve1 Reserve of token1
     * @return blockTimestampLast Last update timestamp
     */
    function _getPairReserves(
        address pairAddress
    ) internal view returns (uint256 reserve0, uint256 reserve1, uint32 blockTimestampLast) {
        assembly {
            reserve0 := sload(add(pairAddress, 0x40))
            reserve1 := sload(add(pairAddress, 0x60))
            blockTimestampLast := sload(add(pairAddress, 0x80))
        }
    }

    /**
     * @dev Update pair reserves (simplified)
     * @param pairAddress Pair address
     * @param reserve0 New reserve0
     * @param reserve1 New reserve1
     */
    function _updatePairReserves(
        address pairAddress,
        uint256 reserve0,
        uint256 reserve1
    ) internal {
        assembly {
            sstore(add(pairAddress, 0x40), reserve0)
            sstore(add(pairAddress, 0x60), reserve1)
            sstore(add(pairAddress, 0x80), timestamp())
        }
    }

    /**
     * @dev Mint LP tokens (simplified)
     * @param pairAddress Pair address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function _mint(
        address pairAddress,
        address to,
        uint256 amount
    ) internal {
        // In a real implementation, this would mint ERC20 LP tokens
        // For this example, we'll just emit an event
        emit LiquidityTokensMinted(pairAddress, to, amount);
    }

    /**
     * @dev Square root calculation (simplified)
     * @param x Input value
     * @return y Square root
     */
    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;

        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
     * @dev Check if a token is migrated
     * @param tokenAddress Token address
     * @return True if token is migrated to DEX
     */
    function isTokenMigrated(address tokenAddress) external view returns (bool) {
        return isMigrated[tokenAddress];
    }

    /**
     * @dev Get pair address for a token
     * @param tokenAddress Token address
     * @return Pair address if migrated, address(0) otherwise
     */
    function getPair(address tokenAddress) external view returns (address) {
        return tokenToPair[tokenAddress];
    }

    /**
     * @dev Update Uniswap factory address (only owner)
     * @param newFactory New factory address
     */
    function updateUniswapFactory(address newFactory) external onlyOwner {
        require(newFactory != address(0), "Migrator: Invalid factory address");
        address oldFactory = uniswapFactory;
        uniswapFactory = newFactory;
        emit UniswapFactoryUpdated(oldFactory, newFactory);
    }

    // Events for LP token minting (would be handled by actual LP token contract)
    event LiquidityTokensMinted(address indexed pair, address indexed to, uint256 amount);
}