import * as dotenv from "dotenv";

import { expect } from "chai";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AngryApeArmyArmoryRoyaltyReceiver,
  AngryApeArmyArmoryRoyaltyReceiver__factory,
  StandardERC20,
  StandardERC20__factory,
} from "../typechain";

import { MockContract, smock } from "@defi-wonderland/smock";
import { BigNumber } from "ethers";

dotenv.config();

let contract: AngryApeArmyArmoryRoyaltyReceiver;
let contractFactory: AngryApeArmyArmoryRoyaltyReceiver__factory;
let standardERC20: MockContract<StandardERC20>;
let owner: SignerWithAddress;
let signer: SignerWithAddress;
let approved: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;
let user4: SignerWithAddress;

describe("AngryApeArmyArmoryRoyaltyReceiver", function () {
  before(async () => {
    [owner, signer, approved, user1, user2, user3, user4] =
      await ethers.getSigners();

    // Set up contract
    contractFactory = await ethers.getContractFactory(
      "AngryApeArmyArmoryRoyaltyReceiver",
      owner
    );

    const StandardERC20Factory = await smock.mock<StandardERC20__factory>(
      "StandardERC20"
    );
    standardERC20 = await StandardERC20Factory.deploy();
    standardERC20.connect(approved).mint(ethers.utils.parseEther("100"));
  });

  beforeEach(async () => {
    contract = await contractFactory.deploy();
    await contract.deployed();
  });

  describe("When receiving ether", async () => {
    it("should allow contract to receive ether", async () => {
      const value = ethers.utils.parseEther("1");

      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;
    });
  });

  describe("When setting withdrawal addresses", async () => {
    it("should return the correct default withdrawal address when no withdrawal address has been set for AAA", async () => {
      expect(await contract.beneficiaries(0)).to.eql([
        "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
        BigNumber.from(7000),
      ]);
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Netvrk", async () => {
      expect(await contract.beneficiaries(1)).to.eql([
        "0x901FC05c4a4bC027a8979089D716b6793052Cc16",
        BigNumber.from(2000),
      ]);
    });

    it("should return the correct default withdrawal address when no withdrawal address has been set for Massless", async () => {
      expect(await contract.beneficiaries(2)).to.eql([
        "0xd196e0aFacA3679C27FC05ba8C9D3ABBCD353b5D",
        BigNumber.from(1000),
      ]);
    });

    it("should set the withdrawal addresses", async () => {
      await expect(
        contract.setBeneficiaries(
          [user1.address, user2.address, user3.address],
          [7000, 2000, 1000]
        )
      ).to.not.be.reverted;
    });

    it("should fail to set the withdrawal addresses because user is not owner", async () => {
      await expect(
        contract
          .connect(user1)
          .setBeneficiaries(
            [user1.address, user2.address, user3.address],
            [7000, 3000, 1000]
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("When withdrawing Ether Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(contract.withdrawEth()).to.be.revertedWith("ZeroBalance");
    });

    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(contract.withdrawEth()).to.be.not.be.reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const aaaInitialBalance = await user1.getBalance();
      const netvrkInitialBalance = await user2.getBalance();
      const masslessInitialBalance = await user3.getBalance();

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        owner.sendTransaction({
          to: contract.address,
          value,
        })
      ).to.not.be.reverted;

      await expect(
        contract.setBeneficiaries(
          [user1.address, user2.address, user3.address],
          [7000, 2000, 1000]
        )
      ).to.not.be.reverted;

      await expect(contract.withdrawEth()).to.be.not.be.reverted;

      expect(await user1.getBalance()).to.equal(
        aaaInitialBalance.add(value.mul(7000).div(10000)) // 70.00%
      );
      expect(await user2.getBalance()).to.equal(
        netvrkInitialBalance.add(value.mul(2000).div(10000)) // 20.00%
      );
      expect(await user3.getBalance()).to.equal(
        masslessInitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
    });
  });

  describe("When withdrawing ERC20 Funds", async () => {
    it("should fail to withdraw when balance is zero", async () => {
      await expect(
        contract.withdrawErc20(standardERC20.address)
      ).to.be.revertedWith("ZeroBalance");
    });

    it("should withdraw contract balance to the default withdrawal addresses.", async () => {
      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        standardERC20.connect(approved).transfer(contract.address, value)
      ).to.not.be.reverted;

      await expect(contract.withdrawErc20(standardERC20.address)).to.be.not.be
        .reverted;
    });

    it("should withdraw contract balance to the correct withdrawal addresses.", async () => {
      const aaaInitialBalance = await standardERC20.balanceOf(user1.address);
      const netvrkInitialBalance = await standardERC20.balanceOf(user2.address);
      const masslessInitialBalance = await standardERC20.balanceOf(
        user3.address
      );

      const value = ethers.utils.parseEther("3.14159265358979323");

      await expect(
        standardERC20.connect(approved).transfer(contract.address, value)
      ).to.not.be.reverted;

      await expect(
        contract.setBeneficiaries(
          [user1.address, user2.address, user3.address],
          [7000, 2000, 1000]
        )
      ).to.not.be.reverted;

      await expect(contract.withdrawErc20(standardERC20.address)).to.be.not.be
        .reverted;

      expect(await standardERC20.balanceOf(user1.address)).to.equal(
        aaaInitialBalance.add(value.mul(7000).div(10000)) // 70.00%
      );
      expect(await standardERC20.balanceOf(user2.address)).to.equal(
        netvrkInitialBalance.add(value.mul(2000).div(10000)) // 20.00%
      );
      expect(await standardERC20.balanceOf(user3.address)).to.equal(
        masslessInitialBalance.add(value.mul(1000).div(10000)) // 10.00%
      );
    });
  });
});
