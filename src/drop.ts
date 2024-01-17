import { ethers } from "ethers";
import fs from "fs";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";
import path from "path";
import { CsvFile } from "./utils/csv-file";

async function getEOAWallets() {
  let out = path.join(__dirname, `../snapshot`);
  if (!fs.existsSync(out)) {
    fs.mkdirSync(out, { recursive: true });
  }
  out = path.join(out, `/snapshot.csv`);

  const csvFile = new CsvFile({
    path: out,
    headers: ["EOA", "address", "amount", "amountInWei"],
  });

  const wallets = await csvFile.read();
  const eoaWallets = wallets.filter((wallet: any) => wallet.EOA === "Yes");
  return eoaWallets;
}

async function main() {
  const eoaWallets = await getEOAWallets();
  let totalAmount = 0n;
  const leaves = eoaWallets.map((x: any) => {
    totalAmount = totalAmount + BigInt(x.amountInWei);
    return keccak256(ethers.solidityPacked(["address", "uint256"], [x.address, x.amountInWei]));
  });

  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = "0x" + tree.getRoot().toString("hex");

  const hexProofs: { [key: string]: string[] } = {};
  eoaWallets.forEach((x: any) => {
    hexProofs[x.address] = tree.getHexProof(keccak256(ethers.solidityPacked(["address", "uint256"], [x.address, x.amountInWei])));
  });

  console.log("root", root);
  console.log("hexProofs", hexProofs);
  console.log("totalAmount", totalAmount.toString());
}

main();
