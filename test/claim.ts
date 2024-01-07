import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers, upgrades } from "hardhat";
import keccak256 from "keccak256";
import { MerkleTree } from "merkletreejs";

describe("Claim contract test", function () {
  let token: any;
  let claim: any;

  let owner: Signer;
  let user: Signer;
  let user2: Signer;
  let user3: Signer;
  let user4: Signer;
  let treasury: Signer;
  let ownerAddress: string;
  let userAddress: string;
  let user2Address: string;
  let user3Address: string;
  let user4Address: string;

  let treasuryAddress: string;

  let tokenAdress: string;
  let claimAddress: string;

  let now: number;

  let tree: any;
  let root: string;

  let hexProofs: {
    [key: string]: string[];
  } = {};

  before(async function () {
    [owner, user, user2, user3, user4, treasury] = await ethers.getSigners();
    ownerAddress = await owner.getAddress();
    userAddress = await user.getAddress();
    user2Address = await user2.getAddress();
    user3Address = await user3.getAddress();
    user4Address = await user4.getAddress();
    treasuryAddress = await treasury.getAddress();

    now = await time.latest();

    // Users in whitelist
    const whiteListed = [
      {
        user: userAddress,
        amount: ethers.parseEther("100"),
      },
      {
        user: user2Address,
        amount: ethers.parseEther("200"),
      },
      {
        user: user3Address,
        amount: ethers.parseEther("300"),
      },
    ];
    const leaves = whiteListed.map((x) => {
      return keccak256(ethers.solidityPacked(["address", "uint256"], [x.user, x.amount]));
    });

    tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    root = "0x" + tree.getRoot().toString("hex");

    whiteListed.forEach((x) => {
      hexProofs[x.user] = tree.getHexProof(keccak256(ethers.solidityPacked(["address", "uint256"], [x.user, x.amount])));
    });
  });

  describe("Deployments", async function () {
    it("Deploy Token", async function () {
      // Deploy Token
      const Token = await ethers.getContractFactory("Token");
      token = await upgrades.deployProxy(Token, [ownerAddress, treasuryAddress, treasuryAddress]);
      await token.waitForDeployment();

      tokenAdress = await token.getAddress();
    });

    it("Deploy Claim", async function () {
      // Deploy Claim
      const Claim = await ethers.getContractFactory("Claim");
      claim = await upgrades.deployProxy(Claim, [tokenAdress, ownerAddress, ownerAddress]);
      await claim.waitForDeployment();

      claimAddress = await claim.getAddress();
    });

    it("Claim before update", async function () {
      await expect(claim.connect(user).claim(userAddress, ethers.parseEther("100"), hexProofs[userAddress])).to.be.revertedWith(
        "MERKLE_ROOT_NOT_SET"
      );
    });

    // update claim
    it("Update claim", async function () {
      await token.approve(claimAddress, ethers.parseEther("1000"));
      await claim.updateClaim(root, ethers.parseEther("1000"));
      expect(await claim.merkleRoot()).to.equal(root);
    });

    // claim token
    it("Claim token", async function () {
      await claim.connect(user).claim(userAddress, ethers.parseEther("100"), hexProofs[userAddress]);
      expect(await token.balanceOf(userAddress)).to.equal(ethers.parseEther("100"));
      await expect(claim.connect(user).claim(userAddress, ethers.parseEther("100"), hexProofs[userAddress])).to.be.revertedWith("CLAIMED");
    });

    // claim token for others
    it("Claim token for others", async function () {
      await claim.claim(user2Address, ethers.parseEther("200"), hexProofs[user2Address]);
      expect(await token.balanceOf(user2Address)).to.equal(ethers.parseEther("200"));
      const claimed = await claim.claimed(user2Address);
      expect(claimed.claimed).to.equal(true);
    });

    // claim from non whitelisted users
    it("Claim from non whitelisted users", async function () {
      await expect(claim.connect(user4).claim(user4Address, ethers.parseEther("100"), hexProofs[user3Address])).to.be.revertedWith(
        "INVALID_MERKLE_PROOF"
      );
    });

    // disable claim
    it("Disable claim", async function () {
      await claim.disableClaim();
      await expect(claim.connect(user3).claim(user3Address, ethers.parseEther("100"), hexProofs[user3Address])).to.be.revertedWith(
        "MERKLE_ROOT_NOT_SET"
      );
    });

    // Withdraw token
    it("Withdraw token", async function () {
      await claim.withdrawFunds(treasuryAddress);
      expect(await token.balanceOf(treasuryAddress)).to.equal(ethers.parseEther("700"));
      await expect(claim.withdrawFunds(treasuryAddress)).to.be.revertedWith("NO_FUNDS");
    });
  });
});
