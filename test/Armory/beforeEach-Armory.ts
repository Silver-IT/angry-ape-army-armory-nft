beforeEach(async function () {
  const ctx = this.test?.ctx;
  if (!ctx) return;

  const evolutionContractFactory = await this.evolutionContractFactory.deploy();
  this.evolutionContract = await evolutionContractFactory.deployed();

  const armoryContractFactory = await ctx.armoryContractFactory.deploy(
    ctx.signer.address,
    ctx.admin.address,
    ctx.owner.address, // Royalty Reciever
    ctx.evolutionContract.address,
    [ctx.user8.address, ctx.user9.address]
  );
  this.armoryContract = await armoryContractFactory.deployed();
});
