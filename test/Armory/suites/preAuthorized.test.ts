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

  it("should burn a token because it's called by a pre authorized user", async () => {
    await expect(
      ctx.armoryContract.connect(ctx.user7).burn(ctx.user1.address, 1, 2)
    ).to.be.reverted;

    await expect(
      ctx.armoryContract.connect(ctx.user8).burn(ctx.user1.address, 1, 2)
    ).to.emit(ctx.armoryContract, "TransferSingle");

    expect((await ctx.armoryContract.totalSupply(1)).toNumber()).to.be.eq(2);

    await expect(
      ctx.armoryContract.connect(ctx.user9).burn(ctx.user2.address, 2, 1)
    ).to.emit(ctx.armoryContract, "TransferSingle");

    expect((await ctx.armoryContract.totalSupply(2)).toNumber()).to.be.eq(3);
  });
}
