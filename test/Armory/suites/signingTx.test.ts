import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber, Contract, ethers } from "ethers";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  let salt: string;
  let apiSignature: string;
  let tokenIds: Array<number>;
  let quantities: Array<number>;
  let evoTokenIds: Array<number>;

  const evoMinted = 16;

  beforeEach(async function () {
    salt = "0x" + randomBytes(32).toString("hex");
    tokenIds = [1, 2];
    quantities = [2, 2];
    evoTokenIds = Array(evoMinted)
      .fill(0)
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5);

    await ctx.evolutionContract.safeMintTo(ctx.user1.address, evoMinted);
    await ctx.evolutionContract
      .connect(ctx.user1)
      .setApprovalForAll(ctx.armoryContract.address, true);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user1.address,
      salt,
      ["uint256[]", "uint256[]", "uint256[]"],
      [tokenIds, quantities, evoTokenIds]
    );

    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
  });

  it("should fail to set signer address because user is not owner", async () => {
    await expect(
      ctx.armoryContract.connect(ctx.user1).setSignerAddress(ctx.user1.address)
    ).to.be.revertedWith("NotAdminOrModerator");
  });

  it("should set the signer address", async () => {
    await expect(ctx.armoryContract.setSignerAddress(ctx.user1.address)).to.not
      .be.reverted;
  });

  it("should set the signer address and fail as actual signer is not the same", async () => {
    await expect(ctx.armoryContract.setSignerAddress(ctx.owner.address)).to.not
      .be.reverted;

    // Mint
    await expect(
      ctx.armoryContract
        .connect(ctx.user1)
        .mint(apiSignature, salt, tokenIds, quantities, evoTokenIds)
    ).to.revertedWith("SignatureFailed");
  });

  it("should set signer address and mint successfully", async () => {
    await expect(ctx.armoryContract.setSignerAddress(ctx.owner.address)).to.not
      .be.reverted;

    apiSignature = await signMintRequest(
      ctx.owner,
      ctx.user1.address,
      salt,
      ["uint256[]", "uint256[]", "uint256[]"],
      [tokenIds, quantities, evoTokenIds]
    );

    // Mint
    await expect(
      ctx.armoryContract
        .connect(ctx.user1)
        .mint(apiSignature, salt, tokenIds, quantities, evoTokenIds)
    ).to.emit(ctx.armoryContract, "TransferBatch");

    expect(
      (await ctx.armoryContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(2);

    expect(
      (await ctx.armoryContract.balanceOf(ctx.user1.address, 2)).toNumber()
    ).to.be.eq(2);
  });
}
