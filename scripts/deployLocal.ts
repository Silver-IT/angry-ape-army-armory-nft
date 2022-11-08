import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import fs from "fs";
import hre, { ethers } from "hardhat";
import keccak256 from "keccak256";
import {
  CHFJMPFA1,
  AngryApeArmyArmoryCollection,
  AngryApeArmyArmoryRoyaltyReceiver,
} from "../typechain";
import { contractDeployment, keypress, writeContractData } from "./utils";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "localhost";
const date = new Date().toJSON().replace(/-|:|T|\..*/g, "");
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

const contractAdmin = {
  address: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0",
};

const aaaContract = {
  address: "0xCF26d81BCbafec9bcc5bAB1c484f1b32e4000b67",
};

//////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  const [contractDeployer, contractOwner, contractSigner] =
    await ethers.getSigners();
  await contractDeployer.getAddress().catch((e) => {
    console.log("\nERROR: Ledger needs to be unlocked\n");
    process.exit(1);
  });
  await contractDeployer.getChainId().catch((e) => {
    console.log("\nERROR: Open Etheruem app on the Ledger.\n");
    process.exit(1);
  });

  if (["hardhat", "localhost"].includes(network)) {
    const [testUser] = await ethers.getSigners();
    testUser.sendTransaction({
      to: await contractDeployer.getAddress(),
      value: ethers.utils.parseEther("200"),
    });
  }

  let initialBalance: BigNumber;
  let currentBalance: BigNumber;
  let rrContract: AngryApeArmyArmoryRoyaltyReceiver;
  let evolutionContract: CHFJMPFA1;
  let armoryContract: AngryApeArmyArmoryCollection;

  console.log("***************************");
  console.log("*   Contract Deployment   *");
  console.log("***************************");
  console.log("\n");

  // Confirm Settings
  {
    console.log("Settings");
    console.log("Network:", network, settingsNetwork == network);
    console.log(
      "Contract Owner Address:",
      contractOwner.address,
      ethers.utils.isAddress(contractOwner.address)
    );
    console.log("\n");

    writeContractData(dir, filename, {
      date,
      network,
      contractOwnerAddress: contractOwner.address,
    });

    await keypress();
  }

  // Confirm Deployer
  {
    initialBalance = await contractDeployer.getBalance();

    console.log("Deployment Wallet");
    console.log("Address:", await contractDeployer.getAddress());
    console.log("Chainid: ", await contractDeployer.getChainId());
    console.log("Balance:", ethers.utils.formatEther(initialBalance), "Ether");
    console.log("\n");

    writeContractData(dir, filename, {
      deployerAddress: await contractDeployer.getAddress(),
    });
  }

  // Royalty Receiver Deployment
  {
    rrContract = (await contractDeployment(
      contractDeployer,
      "AngryApeArmyArmoryRoyaltyReceiver",
      "Royalty Receiver"
    )) as AngryApeArmyArmoryRoyaltyReceiver;

    writeContractData(dir, filename, {
      royaltyReceiverAddress: rrContract.address,
    });
  }

  // AAA Evolution Collection Deployment
  {
    const args = [
      contractSigner.address,
      aaaContract.address,
      rrContract.address,
    ];
    evolutionContract = (await contractDeployment(
      contractDeployer,
      "CHFJMPFA1",
      "Evolution Collection",
      args
    )) as CHFJMPFA1;

    writeContractData(dir, filename, {
      evolutionAddress: evolutionContract.address,
    });
  }

  // AAA Armory Deployment
  {
    const args = [
      contractSigner.address,
      contractAdmin.address,
      rrContract.address,
      evolutionContract.address,
      [],
    ];
    armoryContract = (await contractDeployment(
      contractDeployer,
      "AngryApeArmyArmoryCollection",
      "Armory",
      args
    )) as AngryApeArmyArmoryCollection;

    writeContractData(dir, filename, {
      armoryAddress: armoryContract.address,
      armoryArgs: args,
    });
  }

  // Transfer ownership
  {
    let tx;
    console.log("Transfer Ownership to: " + contractOwner.address);

    tx = await armoryContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("Armory Contract owner tx hash:", tx.hash);
    await tx.wait();
  }

  // Deployment Costs
  {
    currentBalance = await contractDeployer.getBalance();
    console.log(
      "Deployment Cost:",
      ethers.utils.formatEther(initialBalance.sub(currentBalance)),
      "Ether"
    );
    console.log("\n");

    writeContractData(dir, filename, {
      deploymentCost: ethers.utils.formatEther(
        initialBalance.sub(currentBalance)
      ),
    });

    console.log("Completed Successfully");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
