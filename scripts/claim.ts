import { ethers, upgrades } from "hardhat";

async function main() {
  const tokenAddress = "0x3558887f15b5b0074dC4167761DE14A6DFcb676e";
  const ownerAddress = "0x71e8fbE6c5a5E52054c08826D21A355bfe051efb";
  const managerAddress = "0xcA17F0660A0383843588E4aCB444A1B9D8aFC1C4";
  // get delpoyer wallet client
  const Claim = await ethers.getContractFactory("Claim");
  const claim = await upgrades.deployProxy(Claim, [tokenAddress, ownerAddress, managerAddress], {
    kind: "uups",
  });
  await claim.waitForDeployment();
  console.log(`Deployed claim to ${await claim.getAddress()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
