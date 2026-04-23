import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("FruitMarketV1", function () {
  async function deployFruitMarketV1() {
    const [owner, seller, buyer, other] = await ethers.getSigners();

    const FruitMarketV1 = await ethers.getContractFactory("FruitMarketV1");
    const fruitMarket = (await upgrades.deployProxy(FruitMarketV1, [], {
      initializer: "initialize",
      kind: "uups",
    })) as any;

    await fruitMarket.waitForDeployment();

    return { fruitMarket, owner, seller, buyer, other };
  }

  it("should add a product correctly", async function () {
    const { fruitMarket, seller } = await deployFruitMarketV1();

    await fruitMarket
      .connect(seller)
      .addProduct("Apple", ethers.parseEther("0.01"), 10);

    const product = await fruitMarket.getProduct(1);

    expect(product.id).to.equal(1n);
    expect(product.name).to.equal("Apple");
    expect(product.priceWei).to.equal(ethers.parseEther("0.01"));
    expect(product.stock).to.equal(10n);
    expect(product.seller).to.equal(seller.address);
    expect(product.active).to.equal(true);
  });

  it("should allow a buyer to buy a product", async function () {
    const { fruitMarket, seller, buyer } = await deployFruitMarketV1();

    await fruitMarket
      .connect(seller)
      .addProduct("Banana", ethers.parseEther("0.02"), 10);

    await expect(
      fruitMarket
        .connect(buyer)
        .buyProduct(1, 2, { value: ethers.parseEther("0.04") })
    )
      .to.emit(fruitMarket, "ProductPurchased")
      .withArgs(1, buyer.address, 2, ethers.parseEther("0.04"));
  });

  it("should update stock after purchase", async function () {
    const { fruitMarket, seller, buyer } = await deployFruitMarketV1();

    await fruitMarket
      .connect(seller)
      .addProduct("Orange", ethers.parseEther("0.03"), 8);

    await fruitMarket
      .connect(buyer)
      .buyProduct(1, 3, { value: ethers.parseEther("0.09") });

    const product = await fruitMarket.getProduct(1);
    expect(product.stock).to.equal(5n);
    expect(product.active).to.equal(true);
  });

  it("should revert when funds are insufficient", async function () {
    const { fruitMarket, seller, buyer } = await deployFruitMarketV1();

    await fruitMarket
      .connect(seller)
      .addProduct("Pear", ethers.parseEther("0.01"), 5);

    await expect(
      fruitMarket
        .connect(buyer)
        .buyProduct(1, 2, { value: ethers.parseEther("0.01") })
    ).to.be.revertedWithCustomError(fruitMarket, "IncorrectPayment");
  });

  it("should prevent unauthorized price updates", async function () {
    const { fruitMarket, seller, other } = await deployFruitMarketV1();

    await fruitMarket
      .connect(seller)
      .addProduct("Mango", ethers.parseEther("0.05"), 6);

    await expect(
      fruitMarket.connect(other).updatePrice(1, ethers.parseEther("0.06"))
    ).to.be.revertedWithCustomError(fruitMarket, "Unauthorized");
  });

  it("should deploy the contract with a valid address", async function () {
    const { fruitMarket } = await deployFruitMarketV1();

    expect(await fruitMarket.getAddress()).to.properAddress;
 });
});