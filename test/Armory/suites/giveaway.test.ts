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
    quantities = [400, 400];
  });

  it("should giveaway 20 tokens", async () => {
    quantities = [20, 20];
    await expect(ctx.armoryContract.giveaway(to, tokenIds, quantities)).to.emit(
      ctx.armoryContract,
      "TransferSingle"
    );

    expect(
      (await ctx.armoryContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(20);
    expect(
      (await ctx.armoryContract.balanceOf(ctx.user2.address, 2)).toNumber()
    ).to.be.eq(20);
  });

  it("should giveaway all tokens", async () => {
    await expect(ctx.armoryContract.giveaway(to, tokenIds, quantities)).to.emit(
      ctx.armoryContract,
      "TransferSingle"
    );

    expect(
      (await ctx.armoryContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(400);
    expect(
      (await ctx.armoryContract.balanceOf(ctx.user2.address, 2)).toNumber()
    ).to.be.eq(400);
  });

  it("should fail to giveaway from non admin", async () => {
    await expect(
      ctx.armoryContract.connect(ctx.user1).giveaway(to, tokenIds, quantities)
    ).to.be.revertedWith("NotAdminOrOwner()");
  });

  it("should mint max supply", async () => {
    await expect(ctx.armoryContract.giveaway(to, tokenIds, quantities)).to.emit(
      ctx.armoryContract,
      "TransferSingle"
    );
    await expect(
      ctx.armoryContract.giveaway([ctx.user1.address], [1], [1])
    ).to.be.revertedWith("SoldOut");
  });

  it("should not giveaway more than max supply", async () => {
    await expect(
      ctx.armoryContract.giveaway([ctx.user1.address], [1], [400 + 1])
    ).to.be.revertedWith("SoldOut");

    await expect(
      ctx.armoryContract.giveaway(to, [1, 1], [200, 201])
    ).to.be.revertedWith("SoldOut");
  });

  it("should fail to mint non exist token", async () => {
    await expect(
      ctx.armoryContract.giveaway([ctx.user1.address], [9], [1])
    ).to.be.revertedWith("NonExistTokenData(9)");
  });

  it("should not mint because array lengths are different", async () => {
    await expect(
      ctx.armoryContract.giveaway(to, [1, 1], [200])
    ).to.be.revertedWith("ArrayLengthMismatch");
  });

  it("should not mint because arrays are empty", async () => {
    await expect(ctx.armoryContract.giveaway(to, [], [])).to.be.revertedWith(
      "BadArrayLength"
    );
  });

  it.skip("should giveaway tokens to airdrop list", async () => {
    to = [
      "0x1B025A01B9828e4EE6a8BbFA354fF5B6093ee331",
      "0x32D42F15e2f92D9c3A6D602E3f90F5b189363910",
      "0x444Dd5F2C4813031C0047128283b0895D5Db0D06",
      "0xFE72cC7CfDC090299E1FF451cf1B542E6d4155a4",
      "0x372F5344045eCcE94F596103D7c7EE6F6cf50d46",
      "0x372F5344045eCcE94F596103D7c7EE6F6cf50d46",
      "0x735E8dF37d96030F70c075a827E215a67058655f",
      "0x95B3F1401227191961b3e571F8c695701E51b1FD",
      "0x3595F629B43315C89A12ba47c6F129c64f657DA3",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x6ab71C2025442B694C8585aCe2fc06D877469D30",
      "0x0C8d78b49B604dcE335956776f1b868292C09b3F",
      "0x17DADa5eDbdB3959E6E60F5D372d56De327306e2",
      "0xe9cc528D356067918e6791dC529b4Fad4Be49b73",
      "0xaAe3f30A3A6A119dfd116Dc36aD3E6670B12CdCB",
      "0x59c35816d1fad4792d3ba3677acbfa29d4b49e91",
      "0x48E93C5234fa8EF01B8B2ee10ED9C5B50b3c4aA8",
      "0x62783a7595c638dece76a4ac95ed44c1522f51e5",
      "0x5f2B6648A7B62beA1B4bC31eDC318365FA7BB0FF",
    ];
    tokenIds = [
      3, 3, 3, 4, 3, 4, 3, 4, 3, 1, 2, 3, 4, 5, 6, 7, 8, 4, 5, 6, 5, 6, 6, 5, 5,
    ];
    quantities = [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 10, 10, 10, 10, 10, 10, 10, 10, 1, 1, 1, 1, 1,
      1, 1, 1,
    ];
    await expect(ctx.armoryContract.giveaway(to, tokenIds, quantities)).to.emit(
      ctx.armoryContract,
      "TransferSingle"
    );
  });
}
