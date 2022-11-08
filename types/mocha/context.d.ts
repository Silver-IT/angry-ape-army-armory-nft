import { MockContractFactory } from "@defi-wonderland/smock";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MerkleTree } from "merkletreejs";
import {
  AngryApeArmyArmoryRoyaltyReceiver,
  AngryApeArmyArmoryCollection,
  AngryApeArmyArmoryCollection__factory,
  ERC721ABurnable,
} from "../../typechain";

declare module "mocha" {
  export interface Context {
    owner: SignerWithAddress;
    signer: SignerWithAddress;
    approved: SignerWithAddress;
    admin: SignerWithAddress;
    mod: SignerWithAddress;
    user1: SignerWithAddress;
    user2: SignerWithAddress;
    user3: SignerWithAddress;
    user4: SignerWithAddress;
    user5: SignerWithAddress;
    user6: SignerWithAddress;
    user7: SignerWithAddress;
    user8: SignerWithAddress;
    user9: SignerWithAddress;
    evoContract: ERC721ABurnable;
    rrContract: AngryApeArmyArmoryRoyaltyReceiver;
    armoryContractFactory: AngryApeArmyArmoryCollection__factory;
    armoryContract: AngryApeArmyArmoryCollection;
    mockArmoryContractFactory: MockContractFactory<AngryApeArmyArmoryCollection__factory>;
    allowList: string[];
    leavesLookup: Record<string, string>;
    merkleTree: MerkleTree;
    preAuthorizedAddresses: string[];
  }
}
