// smart-contracts/scripts/deploy.js
import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const marketplace = await ethers.deployContract("MagaMarketplace");
  await marketplace.waitForDeployment();
  console.log("MagaMarketplace deployed to:", marketplace.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
