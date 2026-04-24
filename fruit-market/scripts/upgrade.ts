import { ethers, upgrades } from "hardhat";

const PROXY_ADDRESS = "0x4B43C86364066Ed179E7973a4f6937a9A9470DAa";

async function main() {
  const FruitMarketV2 = await ethers.getContractFactory("FruitMarketV2");

  console.log("Upgrading proxy at:", PROXY_ADDRESS);

  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, FruitMarketV2);
  await upgraded.waitForDeployment();

  console.log("Proxy upgraded:", await upgraded.getAddress());

  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(PROXY_ADDRESS);
  console.log("Implementation V2:", implementationAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});