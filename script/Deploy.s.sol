// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/MemeLaunchpadFactory.sol";
import "../src/LiquidityMigrator.sol";

// Simple ERC20 token for testing purposes
contract SimpleERC20 is ERC20 {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying with account:", deployer);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get deployment parameters from environment or use defaults
        address trustTokenAddress = vm.envOr("TRUST_TOKEN_ADDRESS", address(0));
        address treasuryAddress = vm.envOr("TREASURY_ADDRESS", deployer);
        address uniswapFactoryAddress = vm.envOr("UNISWAP_FACTORY_ADDRESS", address(0));

        // Deploy a simple TRUST token placeholder if not provided
        if (trustTokenAddress == address(0)) {
            console.log("Deploying placeholder TRUST token...");
            SimpleERC20 trustToken = new SimpleERC20(
                "TRUST Token",
                "TRUST",
                18,
                1000000 * 1e18 // 1M initial supply
            );
            trustTokenAddress = address(trustToken);

            // Mint some tokens to the deployer for testing
            trustToken.mint(deployer, 100000 * 1e18);
            console.log("TRUST token deployed to:", trustTokenAddress);
        }

        // Deploy a simple Uniswap Factory placeholder if not provided
        if (uniswapFactoryAddress == address(0)) {
            console.log("Deploying placeholder Uniswap Factory...");
            // For now, use deployer's address as a placeholder
            // In a real scenario, you'd deploy a proper UniswapV2Factory
            uniswapFactoryAddress = deployer;
            console.log("Using deployer address as Uniswap Factory placeholder:", uniswapFactoryAddress);
        }

        console.log("Deployment parameters:");
        console.log("- TRUST Token:", trustTokenAddress);
        console.log("- Treasury:", treasuryAddress);
        console.log("- Uniswap Factory:", uniswapFactoryAddress);

        // Deploy LiquidityMigrator first
        console.log("\nDeploying LiquidityMigrator...");
        LiquidityMigrator migrator = new LiquidityMigrator(
            trustTokenAddress,
            uniswapFactoryAddress,
            deployer
        );

        console.log("LiquidityMigrator deployed to:", address(migrator));

        // Deploy Factory
        console.log("\nDeploying MemeLaunchpadFactory...");
        MemeLaunchpadFactory factory = new MemeLaunchpadFactory(
            trustTokenAddress,
            treasuryAddress,
            deployer
        );

        console.log("MemeLaunchpadFactory deployed to:", address(factory));

        // Stop broadcasting
        vm.stopBroadcast();

        // Log deployment information
        console.log("\n=== Deployment Summary ===");
        console.log("Network:", block.chainid);
        console.log("Deployer:", deployer);
        console.log("LiquidityMigrator:", address(migrator));
        console.log("MemeLaunchpadFactory:", address(factory));
        console.log("Explorer: https://intuition-testnet.explorer.caldera.xyz/");

        // Verify deployment
        verifyDeployment(address(factory), address(migrator), trustTokenAddress);

        // Log deployment addresses for manual saving
        console.log("\n=== IMPORTANT: Save these addresses for your .env file ===");
        console.log("NEXT_PUBLIC_MEME_LAUNCHPAD_FACTORY_CONTRACT_ADDRESS=", address(factory));
        console.log("NEXT_PUBLIC_LIQUIDITY_MIGRATOR_CONTRACT_ADDRESS=", address(migrator));
        console.log("NEXT_PUBLIC_TRUST_TOKEN_ADDRESS=", trustTokenAddress);
        console.log("NEXT_PUBLIC_TREASURY_ADDRESS=", treasuryAddress);

        // Also save as separate contract addresses for easy copying
        console.log("\n=== Contract Addresses ===");
        console.log("MemeLaunchpadFactory:", address(factory));
        console.log("LiquidityMigrator:", address(migrator));
        console.log("TRUST_Token:", trustTokenAddress);
        console.log("Treasury:", treasuryAddress);

        console.log("\nDeployment completed successfully!");
    }

    function verifyDeployment(
        address factory,
        address migrator,
        address trustToken
    ) internal view {
        // Verify Factory
        MemeLaunchpadFactory factoryContract = MemeLaunchpadFactory(factory);
        require(address(factoryContract.trustToken()) == trustToken, "Factory TRUST token mismatch");
        console.log("Factory configuration verified");

        // Verify Migrator
        LiquidityMigrator migratorContract = LiquidityMigrator(migrator);
        require(address(migratorContract.trustToken()) == trustToken, "Migrator TRUST token mismatch");
        console.log("Migrator configuration verified");

        console.log("All contracts verified successfully");
    }
}