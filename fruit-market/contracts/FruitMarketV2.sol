// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./FruitMarketV1.sol";

contract FruitMarketV2 is FruitMarketV1 {
    mapping(uint256 => string) private productCategories;

    event ProductCategorySet(uint256 indexed productId, string category);

    function setProductCategory(uint256 productId, string memory category)
        external
        productMustExist(productId)
        onlyProductSellerOrOwner(productId)
    {
        productCategories[productId] = category;
        emit ProductCategorySet(productId, category);
    }

    function getProductCategory(uint256 productId)
        external
        view
        productMustExist(productId)
        returns (string memory)
    {
        return productCategories[productId];
    }

    function version() external pure returns (string memory) {
        return "v2";
    }
}