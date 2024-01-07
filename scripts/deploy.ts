import { ethers, upgrades } from "hardhat";

async function main() {
  // get delpoyer wallet client
  const [deployer] = await ethers.getSigners();
  const Token = await ethers.getContractFactory("Token");
  const token = await upgrades.deployProxy(Token, [deployer.address, deployer.address, deployer.address], {
    kind: "uups",
    nonce: 0,
  });
  await token.waitForDeployment();
  console.log(`Deployed token to ${await token.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
