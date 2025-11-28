// smart-contracts/scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const MagaMarketplace = await hre.ethers.getContractFactory("MagaMarketplace");
  const marketplace = await MagaMarketplace.deploy();
  await marketplace.waitForDeployment();
  console.log("MagaMarketplace deployed to:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});