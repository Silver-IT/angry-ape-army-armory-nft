import { expect } from "chai";
import { BigNumber } from "ethers";
import { randomBytes } from "crypto";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import signMintRequest from "../../utils/signMintRequest";

export default function suite() {
  let ctx: Mocha.Context;
  before(function () {
    const context = this.test?.ctx;
    if (context) ctx = context;
  });

  const MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
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

  it("should set the baseURI", async () => {
    await expect(
      ctx.armoryContract.setURI("https://armory-api-hxs7r5kyjq-uc.a.run.app/")
    ).to.emit(ctx.armoryContract, "URIUpdated");
  });

  it("should fail to set the baseURI because trailing slash is not set", async () => {
    await expect(
      ctx.armoryContract.setURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu"
      )
    ).to.be.revertedWith("NoTrailingSlash");
  });

  it("should retrieve empty default uri and contractURI", async () => {
    // Mint
    await expect(
      ctx.armoryContract
        .connect(ctx.user1)
        .mint(apiSignature, salt, tokenIds, quantities, evoTokenIds)
    ).to.emit(ctx.armoryContract, "TransferBatch");

    expect(await ctx.armoryContract.connect(ctx.user2).uri(0)).to.equal(
      `https://massless-ipfs-public-gateway.mypinata.cloud/ipfs/token/{id}.json`
    );

    expect(await ctx.armoryContract.connect(ctx.user2).contractURI()).to.equal(
      `https://massless-ipfs-public-gateway.mypinata.cloud/ipfs/contract.json`
    );
  });

  it("should retrieve correct updated uri and contractURI", async () => {
    await expect(
      ctx.armoryContract.setURI(
        "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/"
      )
    ).to.emit(ctx.armoryContract, "URIUpdated");

    // Mint
    await expect(
      ctx.armoryContract
        .connect(ctx.user1)
        .mint(apiSignature, salt, tokenIds, quantities, evoTokenIds)
    ).to.emit(ctx.armoryContract, "TransferBatch");

    expect(await ctx.armoryContract.connect(ctx.user2).uri(0)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/{id}.json`
    );

    expect(await ctx.armoryContract.connect(ctx.user2).uri(1)).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/token/{id}.json`
    );

    expect(await ctx.armoryContract.connect(ctx.user2).contractURI()).to.equal(
      `ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/contract.json`
    );
  });

  describe("admin permissions", async () => {
    it("only owner, admin and moderators can update baseURL", async () => {
      expect(
        await ctx.armoryContract
          .connect(ctx.admin)
          .grantRole(MODERATOR_ROLE, ctx.mod.address)
      ).to.emit(ctx.armoryContract, "RoleGranted");

      await expect(
        ctx.armoryContract
          .connect(ctx.owner)
          .setURI("https://armory-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.armoryContract, "URIUpdated");

      await expect(
        ctx.armoryContract
          .connect(ctx.admin)
          .setURI("https://armory-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.armoryContract, "URIUpdated");

      await expect(
        ctx.armoryContract
          .connect(ctx.mod)
          .setURI("https://armory-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.emit(ctx.armoryContract, "URIUpdated");

      await expect(
        ctx.armoryContract
          .connect(ctx.user1)
          .setURI("https://armory-api-hxs7r5kyjq-uc.a.run.app/")
      ).to.be.revertedWith("NotAdminOrModerator");
    });
  });
}
