import * as dotenv from "dotenv";
import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";
import {
  contractDeployment,
  etherscanVerification,
  keypress,
  writeContractData,
} from "./utils";
import {
  AngryApeArmyArmoryCollection,
  AngryApeArmyArmoryRoyaltyReceiver,
} from "../typechain";
import { LedgerSigner } from "@anders-t/ethers-ledger";

dotenv.config();

const network = hre.network.name;

// Settings //////////////////////////////////////////////////////////////

const settingsNetwork = "mainnet";

const contractOwner = {
  address: "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
};

const contractAdmin = {
  address: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0",
};

const contractSigner = {
  address: "0x4EfB67498393531bD60Dcc5b0c7056B59CfA3Ec4",
};

const evoContract = {
  address: "0x74F1716A9F452dD36d945368d806cD491290B240",
};

const heatherAdmin = { address: "0x3DB373465D18721a59014402953CefdF6E45B8BE" };

const connorAdmin = { address: "0x06364057aE641ce296D913DF99Ad4325952Dd396" };

const ollieAdmin = { address: "0xDF89E50b3217678c64d0b147D39B42988CC363c1" };

const date = new Date().toJSON().replace(/-|:|T|\..*/g, "");
const dir = `deployment/${network}`;
const filename = `deployment-${date}.json`;

/////////////////////////////////////////////////////////////////////////

async function main() {
  // Global(ish) vars
  // const [contractDeployer] = await ethers.getSigners();
  console.log("\nConnect your ledger and navigate to the ethereum app\n");
  const contractDeployer = new LedgerSigner(hre.ethers.provider);
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
  let rrContract: AngryApeArmyArmoryRoyaltyReceiver;
  let contract: AngryApeArmyArmoryCollection;

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
    console.log(
      "Contract Admin Address:",
      contractAdmin.address,
      ethers.utils.isAddress(contractAdmin.address)
    );
    console.log("Additional Admins:");
    console.log(
      "Heather Admin Address:",
      heatherAdmin.address,
      ethers.utils.isAddress(heatherAdmin.address)
    );
    console.log(
      "Connor Admin Address:",
      connorAdmin.address,
      ethers.utils.isAddress(connorAdmin.address)
    );
    console.log(
      "Ollie Admin Address:",
      ollieAdmin.address,
      ethers.utils.isAddress(ollieAdmin.address)
    );
    console.log("\n");

    writeContractData(dir, filename, {
      date,
      network,
      contractOwnerAddress: contractOwner.address,
      contractAdminAddress: contractAdmin.address,
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

    await keypress();
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

    // Verify on etherscan
    await etherscanVerification(rrContract.address);

    await keypress();
  }

  // Armory Contract Deployment
  {
    // address signer_
    // address admin_,
    // address royaltyReceiver_,
    // ERC721ABurnable evoContract_,
    // address[] _preAuthorized
    const args = [
      contractSigner.address,
      contractAdmin.address,
      rrContract.address,
      evoContract.address,
      [],
    ];
    contract = (await contractDeployment(
      contractDeployer,
      "AngryApeArmyArmoryCollection",
      "AngryApeArmyArmoryCollection",
      args
    )) as AngryApeArmyArmoryCollection;

    writeContractData(dir, filename, {
      ArmoryAddress: contract.address,
      ArmoryArguments: args,
    });

    // Verify on etherscan
    await etherscanVerification(
      contract.address,
      args,
      "contracts/AngryApeArmyArmoryCollection.sol:AngryApeArmyArmoryCollection"
    );

    await keypress();
  }

  // Add Admins
  {
    console.log("Add Massless admins");

    await keypress("Press any key to continue and ctrl-C to cancel");
    let tx = await contract
      .connect(contractDeployer)
      .setAdminPermission(heatherAdmin.address);
    console.log("heatherAdmin owner tx hash:", tx.hash);
    await tx.wait();

    writeContractData(dir, filename, {
      heatherAdmin: heatherAdmin.address,
    });

    tx = await contract
      .connect(contractDeployer)
      .setAdminPermission(connorAdmin.address);
    console.log("connorAdmin owner tx hash:", tx.hash);
    await tx.wait();

    writeContractData(dir, filename, {
      connorAdmin: connorAdmin.address,
    });

    tx = await contract
      .connect(contractDeployer)
      .setAdminPermission(connorAdmin.address);
    console.log("ollieAdmin owner tx hash:", tx.hash);
    await tx.wait();

    writeContractData(dir, filename, {
      ollieAdmin: ollieAdmin.address,
    });

    console.log("");
  }

  // Transfer ownership
  {
    console.log("Transfer Ownership to: " + contractOwner.address);

    await keypress("Press any key to continue and ctrl-C to cancel");
    const rrTx = await rrContract
      .connect(contractDeployer)
      .transferOwnership(contractOwner.address);
    console.log("Royalty Receiver owner tx hash:", rrTx.hash);
    await rrTx.wait();

    const tx = await contract
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
