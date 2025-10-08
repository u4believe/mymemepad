// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./MemeToken.sol";
import "./BondingCurve.sol";

/**
 * @title MemeLaunchpadFactory
 * @dev Factory contract for deploying meme tokens with bonding curves
 * @notice Handles token creation, fee collection, and maintains token registry
 */
contract MemeLaunchpadFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant CREATION_FEE = 10 * 1e18; // 10 $TRUST

    // State variables
    IERC20 public immutable trustToken; // $TRUST token
    address public treasury;

    // Token registry
    address[] public allTokens;
    mapping(address => address) public tokenToBondingCurve;
    mapping(address => address) public bondingCurveToToken;
    mapping(address => bool) public isTokenRegistered;

    // Events
    event TokenCreated(
        address indexed token,
        address indexed bondingCurve,
        address indexed creator,
        string name,
        string symbol,
        uint256 maxSupply
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    /**
     * @dev Constructor to initialize the factory
     * @param trustToken_ Address of the $TRUST token
     * @param treasury_ Address for collecting fees and protocol treasury
     * @param owner_ Contract owner address
     */
    constructor(
        address trustToken_,
        address treasury_,
        address owner_
    ) Ownable(owner_) {
        require(trustToken_ != address(0), "Factory: Invalid trust token");
        require(treasury_ != address(0), "Factory: Invalid treasury");

        trustToken = IERC20(trustToken_);
        treasury = treasury_;
    }

    /**
     * @dev Create a new meme token with bonding curve
     * @param name Token name
     * @param symbol Token symbol
     * @param maxSupply Maximum token supply (1M to 1B)
     * @return tokenAddress Address of the created token
     * @return bondingCurveAddress Address of the created bonding curve
     */
    function createMemeToken(
        string calldata name,
        string calldata symbol,
        uint256 maxSupply
    ) external nonReentrant returns (address tokenAddress, address bondingCurveAddress) {
        require(bytes(name).length > 0, "Factory: Invalid token name");
        require(bytes(symbol).length > 0, "Factory: Invalid token symbol");
        require(maxSupply >= 1_000_000 && maxSupply <= 1_000_000_000, "Factory: Invalid max supply range");

        // Collect creation fee
        trustToken.safeTransferFrom(msg.sender, treasury, CREATION_FEE);

        // Deploy meme token
        MemeToken token = new MemeToken(
            name,
            symbol,
            maxSupply,
            msg.sender,
            address(this) // Factory owns the token initially
        );

        // Deploy bonding curve
        BondingCurve bondingCurve = new BondingCurve(
            address(token),
            address(trustToken),
            maxSupply,
            treasury,
            address(this) // Factory owns the bonding curve initially
        );

        // Set up relationships
        tokenAddress = address(token);
        bondingCurveAddress = address(bondingCurve);

        tokenToBondingCurve[tokenAddress] = bondingCurveAddress;
        bondingCurveToToken[bondingCurveAddress] = tokenAddress;
        isTokenRegistered[tokenAddress] = true;

        // Transfer ownership to creator
        token.transferOwnership(msg.sender);
        bondingCurve.transferOwnership(msg.sender);

        // Set bonding curve in token contract
        token.setBondingCurve(bondingCurveAddress);

        // Add to registry
        allTokens.push(tokenAddress);

        emit TokenCreated(
            tokenAddress,
            bondingCurveAddress,
            msg.sender,
            name,
            symbol,
            maxSupply
        );
    }

    /**
     * @dev Get total number of tokens created
     * @return Total token count
     */
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    /**
     * @dev Get tokens by index range
     * @param startIndex Start index (inclusive)
     * @param endIndex End index (exclusive)
     * @return tokens Array of token addresses
     */
    function getTokensInRange(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (address[] memory tokens) {
        require(startIndex <= endIndex && endIndex <= allTokens.length, "Factory: Invalid range");

        uint256 length = endIndex - startIndex;
        tokens = new address[](length);

        for (uint256 i = 0; i < length; i++) {
            tokens[i] = allTokens[startIndex + i];
        }
    }

    /**
     * @dev Get bonding curve for a token
     * @param tokenAddress Token address
     * @return Bonding curve address
     */
    function getBondingCurve(address tokenAddress) external view returns (address) {
        return tokenToBondingCurve[tokenAddress];
    }

    /**
     * @dev Get token for a bonding curve
     * @param bondingCurveAddress Bonding curve address
     * @return Token address
     */
    function getToken(address bondingCurveAddress) external view returns (address) {
        return bondingCurveToToken[bondingCurveAddress];
    }

    /**
     * @dev Check if a token is registered
     * @param tokenAddress Token address to check
     * @return True if token is registered
     */
    function isRegistered(address tokenAddress) external view returns (bool) {
        return isTokenRegistered[tokenAddress];
    }

    /**
     * @dev Update treasury address (only owner)
     * @param newTreasury New treasury address
     */
    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Factory: Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Emergency function to transfer stuck tokens (only owner)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Get factory statistics
     * @return tokenCount Total number of tokens created
     * @return treasuryAddress Current treasury address
     * @return creationFee Current creation fee
     */
    function getStats() external view returns (
        uint256 tokenCount,
        address treasuryAddress,
        uint256 creationFee
    ) {
        return (allTokens.length, treasury, CREATION_FEE);
    }
}