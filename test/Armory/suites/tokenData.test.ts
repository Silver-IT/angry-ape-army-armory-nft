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
    to = [ctx.user1.address];
    tokenIds = [9];
    quantities = [20];
  });

  it("should be able to set token data by admin", async () => {
    expect(await ctx.armoryContract.tokenData(8)).to.eql([400, 1]);

    await expect(ctx.armoryContract.setTokenData(8, 200, 2)).to.emit(
      ctx.armoryContract,
      "TokenDataSet"
    );

    expect(await ctx.armoryContract.tokenData(8)).to.eql([200, 2]);
  });

  it("should fail to set token data by non admin", async () => {
    await expect(
      ctx.armoryContract.connect(ctx.user1).setTokenData(8, 200, 2)
    ).to.be.revertedWith("NotAdminOrOwner()");
  });

  it("should set valid token data", async () => {
    await expect(ctx.armoryContract.setTokenData(8, 0, 2)).to.be.revertedWith(
      "MaxSupplyMustBeMinimumOne()"
    );

    await expect(ctx.armoryContract.setTokenData(8, 200, 0)).to.be.revertedWith(
      "PriceMustBeMinimumOne()"
    );
  });

  it("should be able to add new token data", async () => {
    await expect(
      ctx.armoryContract.giveaway(to, tokenIds, quantities)
    ).to.be.revertedWith("NonExistTokenData(9)");

    await expect(ctx.armoryContract.setTokenData(9, 200, 2)).to.emit(
      ctx.armoryContract,
      "TokenDataSet"
    );

    expect(await ctx.armoryContract.tokenData(9)).to.eql([200, 2]);
    expect(await ctx.armoryContract.newTokenId()).to.equal(BigNumber.from(10));

    await expect(ctx.armoryContract.giveaway(to, tokenIds, quantities)).to.emit(
      ctx.armoryContract,
      "TransferSingle"
    );
  });

  it("should use only newTokenId the contract returns for new token Id", async () => {
    expect(await ctx.armoryContract.newTokenId()).to.equal(BigNumber.from(9));

    await expect(
      ctx.armoryContract.setTokenData(40, 200, 2)
    ).to.be.revertedWith("InvalidTokenId(40)");

    await expect(ctx.armoryContract.setTokenData(9, 200, 2)).to.emit(
      ctx.armoryContract,
      "TokenDataSet"
    );

    expect(await ctx.armoryContract.tokenData(9)).to.eql([200, 2]);
    expect(await ctx.armoryContract.newTokenId()).to.equal(BigNumber.from(10));
  });
}
