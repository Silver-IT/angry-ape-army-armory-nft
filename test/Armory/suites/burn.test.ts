import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let to: Array<any>;
  let tokenIds: Array<number>;
  let quantities: Array<number>;

  beforeEach(async function () {
    to = [ctx.user1.address, ctx.user2.address];
    tokenIds = [1, 2];
    quantities = [4, 4];

    await expect(ctx.armoryContract.giveaway(to, tokenIds, quantities)).to.emit(
      ctx.armoryContract,
      "TransferSingle"
    );

    expect(
      (await ctx.armoryContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(4);
    expect(
      (await ctx.armoryContract.balanceOf(ctx.user2.address, 2)).toNumber()
    ).to.be.eq(4);
  });

  it("should burn a token", async () => {
    await expect(
      ctx.armoryContract.connect(ctx.user1).burn(ctx.user1.address, 1, 2)
    ).to.emit(ctx.armoryContract, "TransferSingle");

    expect(
      (await ctx.armoryContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(2);
  });

  it("should fail to burn a token because it's called by the wrong user", async () => {
    await expect(
      ctx.armoryContract.connect(ctx.user2).burn(ctx.user1.address, 1, 2)
    ).to.be.revertedWith("ERC1155: caller is not owner nor approved");
  });

  it("should burn a token because it's called by an approved user", async () => {
    await expect(
      ctx.armoryContract
        .connect(ctx.user1)
        .setApprovalForAll(ctx.approved.address, true)
    ).to.emit(ctx.armoryContract, "ApprovalForAll");

    await expect(
      ctx.armoryContract.connect(ctx.approved).burn(ctx.user1.address, 1, 2)
    ).to.emit(ctx.armoryContract, "TransferSingle");

    expect(
      (await ctx.armoryContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(2);

    expect((await ctx.armoryContract.totalSupply(1)).toNumber()).to.be.eq(2);
  });
}
