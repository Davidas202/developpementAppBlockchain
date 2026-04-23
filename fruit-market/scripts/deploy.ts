import { ethers, upgrades } from "hardhat";

async function main() {
  const FruitMarketV1 = await ethers.getContractFactory("FruitMarketV1");

  console.log("Deploying FruitMarketV1 proxy...");

  const proxy = await upgrades.deployProxy(FruitMarketV1, [], {
    initializer: "initialize",
    kind: "uups",
  });

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  console.log("Proxy deployed to:", proxyAddress);

  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("Implementation V1:", implementationAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});