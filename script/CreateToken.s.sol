// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "forge-std/Script.sol";
import "forge-std/Vm.sol";
import "../src/MemeLaunchpadFactory.sol";
import "../src/MemeToken.sol";

contract CreateTokenScript is Script {
    function setUp() public {}

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Creating token with account:", deployer);

        // Load deployment info
        string memory deploymentPath = "deployment-foundry.json";
        try vm.readFile(deploymentPath) returns (string memory) {
            console.log("Using deployment info from:", deploymentPath);
        } catch {
            console.log("Error: deployment-foundry.json not found. Please run deployment first.");
            revert("Deployment file not found");
        }

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Get factory address from deployment file
        string memory jsonData = vm.readFile(deploymentPath);
        address factoryAddress = vm.parseJsonAddress(jsonData, ".contracts.MemeLaunchpadFactory");

        console.log("Using Factory at:", factoryAddress);

        // Get token parameters from environment or use defaults
        string memory name = "My Meme Token"; // Default
        try vm.envString("TOKEN_NAME") returns (string memory envName) {
            if (bytes(envName).length > 0) {
                name = envName;
            }
        } catch {}

        string memory symbol = "MMT"; // Default
        try vm.envString("TOKEN_SYMBOL") returns (string memory envSymbol) {
            if (bytes(envSymbol).length > 0) {
                symbol = envSymbol;
            }
        } catch {}

        uint256 maxSupply = 1_000_000 * 1e18; // Default 1M tokens
        try vm.envUint("MAX_SUPPLY") returns (uint256 envSupply) {
            maxSupply = envSupply;
        } catch {}

        console.log("Token parameters:");
        console.log("- Name:", name);
        console.log("- Symbol:", symbol);
        console.log("- Max Supply:", maxSupply / 1e18);

        // Attach to factory contract
        MemeLaunchpadFactory factory = MemeLaunchpadFactory(factoryAddress);

        // Get creation fee
        uint256 creationFee = factory.CREATION_FEE();
        console.log("Creation fee required:", creationFee / 1e18, "TRUST");

        // Get TRUST token address
        address trustTokenAddress = address(factory.trustToken());

        // Check and approve spending
        (bool success, bytes memory data) = trustTokenAddress.call(
            abi.encodeWithSignature("balanceOf(address)", deployer)
        );
        require(success, "Failed to get balance");
        uint256 balance = abi.decode(data, (uint256));

        require(balance >= creationFee, "Insufficient TRUST balance");

        // Approve factory to spend TRUST tokens
        (success,) = trustTokenAddress.call(
            abi.encodeWithSignature("approve(address,uint256)", factoryAddress, creationFee)
        );
        require(success, "Failed to approve spending");

        // Create the token
        console.log("Creating meme token...");
        vm.recordLogs();
        factory.createMemeToken(name, symbol, maxSupply);

        // Get event data from logs
        Vm.Log[] memory logs = vm.getRecordedLogs();
        Vm.Log memory tokenCreatedLog = logs[logs.length - 1];

        // Decode event data (TokenCreated event)
        (address tokenAddress, address bondingCurveAddress, address creatorAddr, string memory tokenName, string memory tokenSymbol, uint256 tokenMaxSupply) =
            abi.decode(tokenCreatedLog.data, (address, address, address, string, string, uint256));

        console.log("Token created successfully!");
        console.log("Token Address:", tokenAddress);
        console.log("Bonding Curve Address:", bondingCurveAddress);
        console.log("Creator Address:", creatorAddr);

        // Stop broadcasting
        vm.stopBroadcast();

        console.log("Token creation completed successfully!");
    }
}