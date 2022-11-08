import { expect } from "chai";
import keccak256 from "keccak256";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const DEFAULT_ADMIN_ROLE =
    "0x0000000000000000000000000000000000000000000000000000000000000000";
  const MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

  it("should transfer ownership", async () => {
    await expect(
      ctx.armoryContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.armoryContract, "OwnershipTransferred");
    expect(
      await ctx.armoryContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.approved.address)
    ).to.eq(true);
    expect(
      await ctx.armoryContract.hasRole(DEFAULT_ADMIN_ROLE, ctx.admin.address)
    ).to.eq(true);
  });

  it("should grant DEFAULT_ADMIN_ROLE after ownership transfer", async () => {
    await expect(
      ctx.armoryContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.armoryContract, "OwnershipTransferred");

    expect(
      await ctx.armoryContract
        .connect(ctx.approved)
        .grantRole(DEFAULT_ADMIN_ROLE, ctx.user1.address)
    ).to.emit(ctx.armoryContract, "RoleGranted");

    await expect(ctx.armoryContract.connect(ctx.user1).startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );

    expect(
      await ctx.armoryContract
        .connect(ctx.approved)
        .revokeRole(DEFAULT_ADMIN_ROLE, ctx.user1.address)
    ).to.emit(ctx.armoryContract, "RoleRevoked");

    await expect(
      ctx.armoryContract.connect(ctx.user1).startMint()
    ).to.be.revertedWith("NotAdminOrModerator");
  });

  it("should grant MODERATOR_ROLE after ownership transfer", async () => {
    await expect(
      ctx.armoryContract.transferOwnership(ctx.approved.address)
    ).to.emit(ctx.armoryContract, "OwnershipTransferred");

    expect(
      await ctx.armoryContract
        .connect(ctx.approved)
        .grantRole(MODERATOR_ROLE, ctx.user1.address)
    ).to.emit(ctx.armoryContract, "RoleGranted");

    await expect(ctx.armoryContract.connect(ctx.user1).startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );

    expect(
      await ctx.armoryContract
        .connect(ctx.approved)
        .revokeRole(MODERATOR_ROLE, ctx.user1.address)
    ).to.emit(ctx.armoryContract, "RoleRevoked");

    await expect(
      ctx.armoryContract.connect(ctx.user1).startMint()
    ).to.be.revertedWith("NotAdminOrModerator");
  });
}
