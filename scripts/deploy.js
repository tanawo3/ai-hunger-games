const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying AI Hunger Games with account:", deployer.address);

  const AIHungerGames = await hre.ethers.getContractFactory("AIHungerGames");
  const game = await AIHungerGames.deploy();
  await game.waitForDeployment();

  const contractAddress = await game.getAddress();
  console.log("AI Hunger Games deployed to:", contractAddress);
  console.log("");
  console.log("IMPORTANT: Copy this address and paste it into:");
  console.log("  frontend/src/contract.js -> CONTRACT_ADDRESS");
  console.log("");
  console.log("Explorer:", `https://explorer.ritualfoundation.org/address/${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
