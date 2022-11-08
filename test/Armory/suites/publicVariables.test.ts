import { expect } from "chai";
import { BigNumber } from "ethers";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  it("should get mint limit equal to 2", async () => {
    expect(await ctx.armoryContract.MAX_MINT()).to.equal(BigNumber.from(2));
  });

  it("should get new token id equal to 9", async () => {
    expect(await ctx.armoryContract.newTokenId()).to.equal(BigNumber.from(9));
  });

  it("should get name", async () => {
    expect(await ctx.armoryContract.name()).to.equal(
      "Angry Ape Army Armory Collection"
    );
  });

  it("should get symbol", async () => {
    expect(await ctx.armoryContract.symbol()).to.equal("AAAARM");
  });

  it("should get token data", async () => {
    for (let i = 1; i < 3; i++) {
      const [maxSupply, price] = await ctx.armoryContract.tokenData(i);
      expect(maxSupply).to.be.eq(400);
      expect(price).to.be.eq(4);
    }

    for (let i = 3; i < 5; i++) {
      const [maxSupply, price] = await ctx.armoryContract.tokenData(i);
      expect(maxSupply).to.be.eq(400);
      expect(price).to.be.eq(2);
    }

    for (let i = 5; i < 9; i++) {
      const [maxSupply, price] = await ctx.armoryContract.tokenData(i);
      expect(maxSupply).to.be.eq(400);
      expect(price).to.be.eq(1);
    }
  });
}
