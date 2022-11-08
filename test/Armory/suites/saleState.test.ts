import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import keccak256 from "keccak256";

export default function suite() {
  const NOT_STARTED = 0;
  const ACTIVE = 1;
  const PAUSED = 2;
  const FINISHED = 3;

  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

  it("should end sale after mint", async () => {
    await expect(ctx.armoryContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );

    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );

    await expect(ctx.armoryContract.endMint()).to.emit(
      ctx.armoryContract,
      "MintEnds"
    );
  });

  it("end sale no longer allows change of sale state", async () => {
    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
    await expect(ctx.armoryContract.endMint()).to.emit(
      ctx.armoryContract,
      "MintEnds"
    );

    await expect(ctx.armoryContract.startMint()).to.be.revertedWith(
      "AllSalesFinished"
    );

    await expect(ctx.armoryContract.endMint()).to.be.revertedWith(
      "NoActiveSale"
    );
  });

  it("should set correct values for each sale state", async () => {
    expect(await ctx.armoryContract.getSaleType()).to.eql("None");

    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
    expect(await ctx.armoryContract.getSaleType()).to.be.eql("Mint");

    await expect(ctx.armoryContract.endMint()).to.emit(
      ctx.armoryContract,
      "MintEnds"
    );
    expect(await ctx.armoryContract.getSaleType()).to.be.eql("Finished");
    expect(await ctx.armoryContract.getSaleState()).to.be.eql(FINISHED);
  });

  it("pauses a sale state", async () => {
    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
    await expect(ctx.armoryContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.armoryContract.getSaleState()).to.be.eql(PAUSED);
  });

  it("unpauses a paused sale state", async () => {
    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
    await expect(ctx.armoryContract.pauseMint()).to.not.be.reverted;
    expect(await ctx.armoryContract.getSaleState()).to.be.eql(PAUSED);
    expect(await ctx.armoryContract.getSaleType()).to.be.eql("Mint");
    await expect(ctx.armoryContract.unpauseMint()).to.not.be.reverted;
    expect(await ctx.armoryContract.getSaleState()).to.be.eql(ACTIVE);
    expect(await ctx.armoryContract.getSaleType()).to.be.eql("Mint");
  });

  it("can not pause a paused sale state", async () => {
    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
    await expect(ctx.armoryContract.pauseMint()).to.not.be.reverted;
    await expect(ctx.armoryContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
  });

  it("can not unpause an active sale state", async () => {
    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
    await expect(ctx.armoryContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );
  });

  it("can not change pause state when no sale active", async () => {
    await expect(ctx.armoryContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
    await expect(ctx.armoryContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );

    await expect(ctx.armoryContract.startMint()).to.emit(
      ctx.armoryContract,
      "MintBegins"
    );
    await expect(ctx.armoryContract.endMint()).to.emit(
      ctx.armoryContract,
      "MintEnds"
    );

    await expect(ctx.armoryContract.pauseMint()).to.be.revertedWith(
      "NoActiveSale"
    );
    await expect(ctx.armoryContract.unpauseMint()).to.be.revertedWith(
      "NoPausedSale"
    );
  });

  describe("moderator permissions", async () => {
    beforeEach(async () => {
      expect(
        await ctx.armoryContract
          .connect(ctx.admin)
          .grantRole(MODERATOR_ROLE, ctx.mod.address)
      ).to.emit(ctx.armoryContract, "RoleGranted");
    });

    it("can start mint", async () => {
      await expect(ctx.armoryContract.connect(ctx.mod).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
    });

    it("fails to end minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.mod).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(
        ctx.armoryContract.connect(ctx.mod).endMint()
      ).to.be.revertedWith("NotAdminOrOwner");
    });

    it("can pause minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.mod).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(ctx.armoryContract.connect(ctx.mod).pauseMint()).to.not.be
        .reverted;
    });

    it("can unpause minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.mod).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(ctx.armoryContract.connect(ctx.mod).pauseMint()).to.not.be
        .reverted;
      await expect(ctx.armoryContract.connect(ctx.mod).unpauseMint()).to.not.be
        .reverted;
    });

    it("fails to start mint due to permissions", async () => {
      await expect(
        ctx.armoryContract.connect(ctx.user1).startMint()
      ).to.be.revertedWith("NotAdminOrModerator");
    });

    it("fails to end minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.mod).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(
        ctx.armoryContract.connect(ctx.user1).endMint()
      ).to.be.revertedWith("NotAdminOrOwner");
    });
  });

  describe("admin permissions", async () => {
    it("can start mint", async () => {
      await expect(ctx.armoryContract.connect(ctx.admin).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
    });

    it("can end minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.admin).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(ctx.armoryContract.connect(ctx.admin).endMint()).to.emit(
        ctx.armoryContract,
        "MintEnds"
      );
    });

    it("can pause minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.admin).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(ctx.armoryContract.connect(ctx.admin).pauseMint()).to.not.be
        .reverted;
    });

    it("can unpause minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.admin).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(ctx.armoryContract.connect(ctx.admin).pauseMint()).to.not.be
        .reverted;
      await expect(ctx.armoryContract.connect(ctx.admin).unpauseMint()).to.not
        .be.reverted;
    });

    it("fails to start mint due to permissions", async () => {
      await expect(
        ctx.armoryContract.connect(ctx.user1).startMint()
      ).to.be.revertedWith("NotAdminOrModerator");
    });

    it("fails to end minting", async () => {
      await expect(ctx.armoryContract.connect(ctx.admin).startMint()).to.emit(
        ctx.armoryContract,
        "MintBegins"
      );
      await expect(
        ctx.armoryContract.connect(ctx.user1).endMint()
      ).to.be.revertedWith("NotAdminOrOwner");
    });
  });
}
