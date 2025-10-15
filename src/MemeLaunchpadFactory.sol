// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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

    // Creator to tokens mapping
    mapping(address => address[]) public creatorTokens;
    mapping(address => mapping(address => bool)) public isCreatorToken;

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

        // Deploy contracts
        MemeToken token = new MemeToken(name, symbol, maxSupply, msg.sender, address(this));
        BondingCurve bondingCurve = new BondingCurve(address(token), address(trustToken), maxSupply, treasury, address(this));

        tokenAddress = address(token);
        bondingCurveAddress = address(bondingCurve);

        tokenToBondingCurve[tokenAddress] = bondingCurveAddress;
        bondingCurveToToken[bondingCurveAddress] = tokenAddress;
        isTokenRegistered[tokenAddress] = true;

        token.transferOwnership(msg.sender);
        bondingCurve.transferOwnership(msg.sender);
        token.setBondingCurve(bondingCurveAddress);

        allTokens.push(tokenAddress);
        creatorTokens[msg.sender].push(tokenAddress);
        isCreatorToken[msg.sender][tokenAddress] = true;

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


    function getBondingCurve(address tokenAddress) external view returns (address) {
        return tokenToBondingCurve[tokenAddress];
    }

    function getTokensByCreator(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }

    function getCreatorTokenCount(address creator) external view returns (uint256) {
        return creatorTokens[creator].length;
    }

    function updateTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Factory: Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    function getStats() external view returns (
        uint256 tokenCount,
        address treasuryAddress,
        uint256 creationFee
    ) {
        return (allTokens.length, treasury, CREATION_FEE);
    }
}