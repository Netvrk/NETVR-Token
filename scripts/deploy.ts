import { ethers, upgrades } from "hardhat";

async function main() {
  // get delpoyer wallet client
  const [deployer] = await ethers.getSigners();
  // await setNonce(deployer.address, 100);

  const ownerAddress = "0x71e8fbE6c5a5E52054c08826D21A355bfe051efb";
  const managerAddress = "0x71e8fbE6c5a5E52054c08826D21A355bfe051efb";
  const upgraderAddress = "0x71e8fbE6c5a5E52054c08826D21A355bfe051efb";

  const NetVRk = await ethers.getContractFactory("NetVRk");
  const token = await upgrades.deployProxy(NetVRk, [ownerAddress, managerAddress, upgraderAddress], {
    kind: "uups",
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
