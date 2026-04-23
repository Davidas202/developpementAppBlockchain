import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("FruitMarket upgrade V1 -> V2", function () {
  it("should preserve state and enable new V2 functionality", async function () {
    const [owner, seller] = await ethers.getSigners();

    const FruitMarketV1 = await ethers.getContractFactory("FruitMarketV1");
    const proxy = (await upgrades.deployProxy(FruitMarketV1, [], {
      initializer: "initialize",
      kind: "uups",
    })) as any;

    await proxy.waitForDeployment();

    await proxy
      .connect(seller)
      .addProduct("Apple", ethers.parseEther("0.01"), 10);

    const beforeUpgrade = await proxy.getProduct(1);
    expect(beforeUpgrade.name).to.equal("Apple");
    expect(beforeUpgrade.stock).to.equal(10n);

    const FruitMarketV2 = await ethers.getContractFactory("FruitMarketV2");
    const upgraded = (await upgrades.upgradeProxy(
      await proxy.getAddress(),
      FruitMarketV2
    )) as any;

    await upgraded.waitForDeployment();

    const afterUpgrade = await upgraded.getProduct(1);
    expect(afterUpgrade.name).to.equal("Apple");
    expect(afterUpgrade.stock).to.equal(10n);
    expect(afterUpgrade.seller).to.equal(seller.address);

    await upgraded.connect(seller).setProductCategory(1, "Bio");
    expect(await upgraded.getProductCategory(1)).to.equal("Bio");
    expect(await upgraded.version()).to.equal("v2");
  });
});