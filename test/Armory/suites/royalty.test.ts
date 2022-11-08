import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should set the royalty receiver by owner and admin", async () => {
    await expect(ctx.armoryContract.setRoyaltyReceiver(ctx.owner.address)).to
      .not.be.reverted;

    await expect(
      ctx.armoryContract.connect(ctx.mod).setRoyaltyReceiver(ctx.owner.address)
    ).to.be.revertedWith("NotAdminOrOwner");
  });

  it("should set the royalty basis points", async () => {
    await expect(ctx.armoryContract.setRoyaltyBasisPoints(500)).to.not.be
      .reverted;
  });
}
