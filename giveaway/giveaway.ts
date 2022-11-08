import fs from "fs";
import { BigNumber, Contract, ethers } from "ethers";
import AngryApeArmyArmoryCollection from "../artifacts/contracts/AngryApeArmyArmoryCollection.sol/AngryApeArmyArmoryCollection.json";
import giveawayList from "./giveawayList.json";
import * as dotenv from "dotenv";

async function main() {
  const args: string[] = process.argv.slice(2);
  if (!args.includes("--network")) {
    console.log("Please specify network. Ex: --network localhost");
    return;
  }

  const config: any = {
    localhost: {
      rpcUrl: "http://127.0.0.1:8545",
      signerAddress:
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
      contractAddress: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    },
    rinkeby: {
      rpcUrl: process.env.RINKEBY_RPC_URL,
      signerAddress: "0x859010BaAD3E7f51A5EF1e43550056ea29542Fb0",
      contractAddress: "",
    },
    mainnet: {
      rpcUrl: process.env.MAINNET_RPC_URL,
      signerAddress: process.env.MAINNET_PRIVATE_KEY ?? "",
      contractAddress: "0x6f50B93B61259593634A3067adafD93F1b8D0abA",
    },
  };

  const network: string = args[1];
  const provider = new ethers.providers.JsonRpcProvider(config[network].rpcUrl);
  const signer = new ethers.Wallet(config[network].signerAddress, provider);
  const contract = new Contract(
    config[network].contractAddress,
    AngryApeArmyArmoryCollection.abi,
    provider
  );

  const giveawayListJson = giveawayList as Record<string, number[][]>;

  let len = 0;
  let walletAddressArray: string[] = [];
  let tokenIdArray: number[] = [];
  let quantityArray: number[] = [];
  let queue: {
    walletAddressArray: string[];
    tokenIdArray: number[];
    quantityArray: number[];
  }[] = [];
  for (const [walletAddress, tokenIdAndQuantityArray] of Object.entries(
    giveawayListJson
  )) {
    for (const element of tokenIdAndQuantityArray) {
      if (len < 60) {
        walletAddressArray.push(walletAddress);
        tokenIdArray.push(element[0]);
        quantityArray.push(element[1]);
        len++;
      } else {
        queue.push({ walletAddressArray, tokenIdArray, quantityArray });
        walletAddressArray = [walletAddress];
        tokenIdArray = [element[0]];
        quantityArray = [element[1]];
        len = 1;
      }
    }
  }
  queue.push({ walletAddressArray, tokenIdArray, quantityArray });
  // console.dir({ queue }, { depth: Infinity });

  let failedTransaction: any = [];
  for (let i = 0; i < queue.length; i++) {
    try {
      const tx = await contract
        .connect(signer)
        .giveaway(
          queue[i].walletAddressArray,
          queue[i].tokenIdArray,
          queue[i].quantityArray
        );

      const txWait = await tx.wait();
      let successQueue: any = {};
      for (const event of txWait.events) {
        if (event.event == "TransferSingle") {
          let to = event.args.to;
          if (successQueue[to] === undefined) {
            successQueue[to] = [];
          }
          successQueue[to].push([
            event.args.id.toString(),
            event.args.value.toString(),
          ]);
        }
      }

      fs.writeFileSync(
        `./successQueue-${i}.json`,
        JSON.stringify(successQueue, null, "  ")
      );

      for (const [walletAddress, giveawayTokenIDAndQuantity] of Object.entries(
        successQueue
      )) {
        console.log(
          "\x1b[32m%s\x1b[0m",
          JSON.stringify(
            {
              walletAddress,
              giveawayTokenIDAndQuantity,
            },
            null,
            "  "
          )
        );
      }
    } catch (e: any) {
      console.log(e);
      let reason: string;
      if (e.error) {
        reason = e.error.reason;
      } else {
        reason = e.reason;
      }

      failedTransaction.push({
        walletAddressArray: queue[i].walletAddressArray,
        tokenIdArray: queue[i].tokenIdArray,
        quantityArray: queue[i].quantityArray,
      });

      console.log(
        "\x1b[31m%s\x1b[0m",
        JSON.stringify(
          {
            walletAddressArray: queue[i].walletAddressArray,
            tokenIdArray: queue[i].tokenIdArray,
            quantityArray: queue[i].quantityArray,
            reason,
          },
          null,
          "  "
        )
      );
    }
  }

  fs.writeFileSync(
    "./failedTransaction.json",
    JSON.stringify(failedTransaction, null, "  ")
  );
}

main();
