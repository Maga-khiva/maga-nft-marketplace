import "dotenv/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

const rawPrivateKey = process.env.DEPLOYER_PRIVATE_KEY?.trim() || "";
const normalizedPrivateKey = rawPrivateKey && !rawPrivateKey.startsWith("0x")
  ? `0x${rawPrivateKey}`
  : rawPrivateKey;
const accounts = /^0x[0-9a-fA-F]{64}$/.test(normalizedPrivateKey) ? [normalizedPrivateKey] : [];

const config = defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: "0.8.24",
  paths: {
    artifacts: "./.hh3-artifacts",
    cache: "./.hh3-cache",
  },
  networks: {
    localhost: {
      type: "http",
      chainType: "l1",
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts,
    },
  },
});

export default config;
