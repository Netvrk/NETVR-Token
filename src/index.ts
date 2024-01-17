#!/usr/bin/env node

import { Command } from "commander";
import figlet from "figlet";
import { createSnapshot } from "./snap";

async function main(): Promise<void> {
  const program = new Command();

  console.log(figlet.textSync("Netvrk Token Snapshot"));

  const snap = program.command("snap");

  snap.command("snap", "Take snapshot of the token").action(takeSnapshot);

  await program.parseAsync(process.argv);
}

async function takeSnapshot() {
  const snapshot = {
    block: 18848622,
  };

  await createSnapshot(snapshot);
}

main();
