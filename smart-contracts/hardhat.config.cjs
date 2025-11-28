// smart-contracts/hardhat.config.js

// 1. Load environment variables from .env file
require('dotenv').config(); 

// 2. Import Hardhat plugins (CommonJS syntax)
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      // These variables are now loaded from your .env file
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org", 
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};