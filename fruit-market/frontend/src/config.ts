export const CONTRACT_ADDRESS = import.meta.env.VITE_SEPOLIA_PROXY_ADDRESS as string;

export const SEPOLIA_CHAIN_ID = "0xaa36a7";

export const CONTRACT_ABI = [
  "function addProduct(string name, uint256 priceWei, uint256 stock) external",
  "function buyProduct(uint256 productId, uint256 quantity) external payable",
  "function updatePrice(uint256 productId, uint256 newPriceWei) external",
  "function updateStock(uint256 productId, uint256 newStock) external",
  "function deactivateProduct(uint256 productId) external",
  "function getProduct(uint256 productId) external view returns (tuple(uint256 id,string name,uint256 priceWei,uint256 stock,address seller,bool active))",
  "function getAllProducts() external view returns (tuple(uint256 id,string name,uint256 priceWei,uint256 stock,address seller,bool active)[])",
  "function getProductCount() external view returns (uint256)",
  "function setProductCategory(uint256 productId, string category) external",
  "function getProductCategory(uint256 productId) external view returns (string)",
  "function version() external pure returns (string)",
];
