// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IMagaMarketplaceCore {
    function mint(string calldata tokenURI) external returns (uint256);
    function list(uint256 tokenId, uint256 price) external;
    function buy(uint256 tokenId) external payable;
}

/// @notice PoC-only seller contract. It mints the NFT to itself, so it must
/// implement IERC721Receiver. When it later receives the sale payment
/// inside buy()'s low-level call, it immediately tries to call buy() again
/// on the same token. This proves (or disproves) that ReentrancyGuard
/// actually protects buy() against reentrant re-entry via the payment hook.
contract ReentrantSeller is IERC721Receiver {
    IMagaMarketplaceCore public immutable marketplace;
    uint256 public tokenId;
    bool public attacking;

    constructor(address _marketplace) {
        marketplace = IMagaMarketplaceCore(_marketplace);
    }

    function setup(string calldata tokenURI, uint256 price) external returns (uint256) {
        tokenId = marketplace.mint(tokenURI);
        marketplace.list(tokenId, price);
        return tokenId;
    }

    function arm() external {
        attacking = true;
    }

    receive() external payable {
        if (attacking) {
            attacking = false; // guard's own revert should stop us anyway
            marketplace.buy{value: msg.value}(tokenId);
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
