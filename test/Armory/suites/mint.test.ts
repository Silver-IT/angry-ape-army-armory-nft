import { expect } from "chai";
import { randomBytes } from "crypto";
import { BigNumber, Wallet } from "ethers";
import { ethers } from "hardhat";
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

    expect(
      (await ctx.evolutionContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(16);

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

  it("should do minting with a valid signature", async () => {
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

    expect(
      (await ctx.evolutionContract.balanceOf(ctx.user1.address)).toNumber()
    ).to.be.eq(0);
  });

  it("should fail to mint with an invalid signature", async () => {
    apiSignature = await signMintRequest(
      ctx.user1,
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
    ).to.revertedWith("SignatureFailed");
  });

  it("should fail to mint when minting with non owned evo tokens", async () => {
    await ctx.evolutionContract.safeMintTo(ctx.user2.address, evoMinted);

    evoTokenIds[0] = 20;
    apiSignature = await signMintRequest(
      ctx.signer,
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
    ).to.revertedWith("NotOwnerOfToken");
  });

  it("should fail to mint more tokens than MAX_MINT", async () => {
    quantities = [3, 3];
    evoTokenIds = Array(24)
      .fill(0)
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5);

    apiSignature = await signMintRequest(
      ctx.signer,
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
    ).to.revertedWith("WalletMintLimit");
  });

  it("should fail to mint zero tokens", async () => {
    quantities = [0, 3];
    evoTokenIds = Array(12)
      .fill(0)
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5);

    apiSignature = await signMintRequest(
      ctx.signer,
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
    ).to.revertedWith("MustMintMinimumOne");
  });

  it("should fail to mint with non enough evo tokens", async () => {
    quantities = [2, 2];
    evoTokenIds = Array(12)
      .fill(0)
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5);

    apiSignature = await signMintRequest(
      ctx.signer,
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
    ).to.revertedWith("NotEnoughEvoTokens");
  });

  it("should fail to mint non exist token", async () => {
    tokenIds = [9, 10];
    apiSignature = await signMintRequest(
      ctx.signer,
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
    ).to.revertedWith("NonExistTokenData(9)");
  });

  it("should mint only max supply with valid signature", async () => {
    // Init Mock
    const mockContract = await ctx.mockArmoryContractFactory.deploy(
      ctx.signer.address,
      ctx.admin.address,
      ctx.owner.address, // Royalty Reciever
      ctx.evolutionContract.address,
      [ctx.user8.address, ctx.user9.address]
    );
    await mockContract.deployed();

    await ctx.evolutionContract
      .connect(ctx.user1)
      .setApprovalForAll(mockContract.address, true);

    // Update max supply to something low
    await mockContract.setVariable("tokenData", {
      "1": { maxSupply: 3, price: 4 },
      "2": { maxSupply: 3, price: 4 },
    });

    // Start minting
    await mockContract.startMint();

    // Mint - user1
    await expect(
      mockContract
        .connect(ctx.user1)
        .mint(apiSignature, salt, tokenIds, quantities, evoTokenIds)
    ).to.emit(mockContract, "TransferBatch");

    expect(
      (await mockContract.balanceOf(ctx.user1.address, 1)).toNumber()
    ).to.be.eq(2);
    expect(
      (await mockContract.balanceOf(ctx.user1.address, 2)).toNumber()
    ).to.be.eq(2);

    // user2
    evoTokenIds = Array(evoMinted)
      .fill(0)
      .map((_, i) => i + 16)
      .sort(() => Math.random() - 0.5);

    await ctx.evolutionContract.safeMintTo(ctx.user2.address, evoMinted);
    await ctx.evolutionContract
      .connect(ctx.user2)
      .setApprovalForAll(mockContract.address, true);

    apiSignature = await signMintRequest(
      ctx.signer,
      ctx.user2.address,
      salt,
      ["uint256[]", "uint256[]", "uint256[]"],
      [tokenIds, quantities, evoTokenIds]
    );

    await expect(
      mockContract
        .connect(ctx.user2)
        .mint(apiSignature, salt, tokenIds, quantities, evoTokenIds)
    ).to.revertedWith("SoldOut");
  });
}
