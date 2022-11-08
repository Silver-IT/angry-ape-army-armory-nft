import * as dotenv from "dotenv";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { OKJILMPC3 } from "../typechain";
import { contractDeployment, keypress, writeContractData } from "./utils";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "rinkeby";

const contractOwner = {
  address: "0xb4636EA255a1c51fDD4F3aFd0218D68565Df89D6", // Ollie's account
};

const contractAdmin = {
  address: "0x83C0eEAC8cac66eed91eC8F111785B0091b2CeD6", // Sam's account
};

const contractSigner = {
  address: "0x4EfB67498393531bD60Dcc5b0c7056B59CfA3Ec4", // Heather's account
};

const evolutionContract = {
  address: "0xA1f3bAca3B49D92A3D76Ab4B80bf29B70D2E5F1A",
};

const date = new Date().toJSON().replace(/-|:|T|\..*/g, "");
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

//////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  const [contractDeployer] = await ethers.getSigners();
  await contractDeployer.getAddress().catch((e) => {
    console.log("\nERROR: Ledger needs to be unlocked\n");
    process.exit(1);
  });
  await contractDeployer.getChainId().catch((e) => {
    console.log("\nERROR: Open Etheruem app on the Ledger.\n");
    process.exit(1);
  });

  let initialBalance: BigNumber;
  let currentBalance: BigNumber;
  // let rrContract: RoyaltyReceiver;
  // let evolutionContract: CHFJMPFA1;
  let armoryContract: OKJILMPC3;

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

  // // Royalty Receiver Deployment
  // {
  //   rrContract = (await contractDeployment(
  //     contractDeployer,
  //     "AngryApeArmyArmoryRoyaltyReceiver",
  //     "Royalty Receiver"
  //   )) as AngryApeArmyArmoryRoyaltyReceiver;

  //   writeContractData(dir, filename, {
  //     royaltyReceiverAddress: rrContract.address,
  //   });
  // }

  // // AAA Evolution Collection Deployment
  // {
  //   const args = [
  //     contractSigner.address,
  //     aaaContract.address,
  //     contractOwner.address,
  //   ];
  //   evolutionContract = (await contractDeployment(
  //     contractDeployer,
  //     "CHFJMPFA1",
  //     "Evolution Collection",
  //     args
  //   )) as CHFJMPFA1;

  //   writeContractData(dir, filename, {
  //     evolutionAddress: evolutionContract.address,
  //   });
  // }

  // AAA Armory Deployment
  {
    const args = [
      contractSigner.address,
      contractAdmin.address,
      contractOwner.address,
      evolutionContract.address,
      [],
    ];
    armoryContract = (await contractDeployment(
      contractDeployer,
      "OKJILMPC3",
      "Armory",
      args
    )) as OKJILMPC3;

    writeContractData(dir, filename, {
      armoryAddress: armoryContract.address,
      armoryArgs: args,
    });
  }

  // Transfer ownership
  {
    let tx;
    console.log("Transfer Ownership to: " + contractOwner.address);

    // // await keypress("Press any key to continue and ctrl-C to cancel");
    // tx = await rrContract
    //   .connect(contractDeployer)
    //   .transferOwnership(contractOwner.address);
    // console.log("Royalty Receiver owner tx hash:", tx.hash);
    // await tx.wait();

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
