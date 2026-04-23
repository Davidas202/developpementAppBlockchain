// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

contract FruitMarketV1 is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    struct Product {
        uint256 id;
        string name;
        uint256 priceWei;
        uint256 stock;
        address seller;
        bool active;
    }

    uint256 public nextProductId;
    mapping(uint256 => Product) internal products;

    error InvalidProduct();
    error InvalidName();
    error InvalidPrice();
    error InvalidStock();
    error InvalidQuantity();
    error Unauthorized();
    error ProductInactive();
    error InsufficientStock();
    error IncorrectPayment();
    error TransferFailed();

    event ProductAdded(
        uint256 indexed productId,
        address indexed seller,
        string name,
        uint256 priceWei,
        uint256 stock
    );

    event ProductPriceUpdated(
        uint256 indexed productId,
        uint256 oldPriceWei,
        uint256 newPriceWei
    );

    event ProductStockUpdated(
        uint256 indexed productId,
        uint256 oldStock,
        uint256 newStock
    );

    event ProductDeactivated(uint256 indexed productId);

    event ProductPurchased(
        uint256 indexed productId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPaid
    );

    modifier productMustExist(uint256 productId) {
        if (!_exists(productId)) revert InvalidProduct();
        _;
    }

    modifier onlyProductSellerOrOwner(uint256 productId) {
        if (msg.sender != products[productId].seller && msg.sender != owner()) {
            revert Unauthorized();
        }
        _;
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        nextProductId = 1;
    }

    function addProduct(
        string memory name,
        uint256 priceWei,
        uint256 stock
    ) external {
        if (bytes(name).length == 0) revert InvalidName();
        if (priceWei == 0) revert InvalidPrice();
        if (stock == 0) revert InvalidStock();

        uint256 productId = nextProductId;

        products[productId] = Product({
            id: productId,
            name: name,
            priceWei: priceWei,
            stock: stock,
            seller: msg.sender,
            active: true
        });

        nextProductId++;

        emit ProductAdded(productId, msg.sender, name, priceWei, stock);
    }

    function updatePrice(
        uint256 productId,
        uint256 newPriceWei
    )
        external
        productMustExist(productId)
        onlyProductSellerOrOwner(productId)
    {
        if (newPriceWei == 0) revert InvalidPrice();

        Product storage product = products[productId];
        uint256 oldPrice = product.priceWei;
        product.priceWei = newPriceWei;

        emit ProductPriceUpdated(productId, oldPrice, newPriceWei);
    }

    function updateStock(
        uint256 productId,
        uint256 newStock
    )
        external
        productMustExist(productId)
        onlyProductSellerOrOwner(productId)
    {
        Product storage product = products[productId];
        uint256 oldStock = product.stock;
        product.stock = newStock;

        if (newStock == 0) {
            product.active = false;
        }

        emit ProductStockUpdated(productId, oldStock, newStock);
    }

    function deactivateProduct(
        uint256 productId
    )
        external
        productMustExist(productId)
        onlyProductSellerOrOwner(productId)
    {
        products[productId].active = false;
        emit ProductDeactivated(productId);
    }

    function buyProduct(
        uint256 productId,
        uint256 quantity
    ) external payable nonReentrant productMustExist(productId) {
        if (quantity == 0) revert InvalidQuantity();

        Product storage product = products[productId];

        if (!product.active) revert ProductInactive();
        if (product.stock < quantity) revert InsufficientStock();

        uint256 totalPrice = product.priceWei * quantity;
        if (msg.value != totalPrice) revert IncorrectPayment();

        product.stock -= quantity;
        if (product.stock == 0) {
            product.active = false;
        }

        emit ProductPurchased(productId, msg.sender, quantity, totalPrice);

        (bool success, ) = payable(product.seller).call{value: totalPrice}("");
        if (!success) revert TransferFailed();
    }

    function getProduct(
        uint256 productId
    ) external view productMustExist(productId) returns (Product memory) {
        return products[productId];
    }

    function getAllProducts() external view returns (Product[] memory) {
        uint256 count = nextProductId - 1;
        Product[] memory allProducts = new Product[](count);

        for (uint256 i = 1; i <= count; i++) {
            allProducts[i - 1] = products[i];
        }

        return allProducts;
    }

    function getProductCount() external view returns (uint256) {
        return nextProductId - 1;
    }

    function _exists(uint256 productId) internal view returns (bool) {
        return productId > 0 && productId < nextProductId;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}