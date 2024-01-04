import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig } from "hardhat/config";

import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY_1 !== undefined ? [process.env.PRIVATE_KEY_1] : [],
    },
    bsc: {
      url: process.env.BSC_URL || "",
      accounts: process.env.PRIVATE_KEY_1 !== undefined ? [process.env.PRIVATE_KEY_1] : [],
    },
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "",
  },
};

export default config;
