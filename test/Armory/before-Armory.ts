import { ethers } from "hardhat";
import { smock } from "@defi-wonderland/smock";
import { AngryApeArmyArmoryCollection__factory } from "../../typechain";

before(async function () {
  // Set wallet context
  const [
    owner,
    signer,
    approved,
    admin,
    mod,
    user1,
    user2,
    user3,
    user4,
    user5,
    user6,
    user7,
    user8,
    user9,
  ] = await ethers.getSigners();
  this.owner = owner;
  this.signer = signer;
  this.approved = approved;
  this.mod = mod;
  this.admin = admin;
  this.user1 = user1;
  this.user2 = user2;
  this.user3 = user3;
  this.user4 = user4;
  this.user5 = user5;
  this.user6 = user6;
  this.user7 = user7;
  this.user8 = user8;
  this.user9 = user9;

  // Evolution Contract Mock (ERC721A)
  this.evolutionContractFactory = await ethers.getContractFactory(
    "StandardERC721A",
    owner
  );

  // Armory Contract
  this.armoryContractFactory = await ethers.getContractFactory(
    "AngryApeArmyArmoryCollection",
    owner
  );

  // Set up mock test contract
  this.mockArmoryContractFactory =
    await smock.mock<AngryApeArmyArmoryCollection__factory>(
      "AngryApeArmyArmoryCollection",
      owner
    );
});
